import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseWebRTCOptions {
  callId: string;
  isInitiator: boolean;
  onCallEnd?: () => void;
}

interface SignalingMessage {
  type: string;
  data?: any;
  fromUserId?: string;
  userId?: string;
}

export function useWebRTC({ callId, isInitiator, onCallEnd }: UseWebRTCOptions) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ICE servers configuration (using free STUN servers)
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection({ iceServers });
    
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          callId,
          userId: user?.id,
          data: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsCallActive(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsCallActive(false);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [callId, user?.id]);

  const startLocalVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      localStreamRef.current = stream;
      
      // Add tracks to peer connection
      const pc = initializePeerConnection();
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      return stream;
    } catch (err) {
      setError('Failed to access camera/microphone');
      console.error('Error accessing media devices:', err);
      return null;
    }
  }, [initializePeerConnection]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem('auth_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:5000';
    const ws = new WebSocket(`${protocol}//${host}/video-signaling?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      
      // Join the call room
      ws.send(JSON.stringify({
        type: 'join',
        callId,
        userId: user?.id
      }));
    };

    ws.onmessage = async (event) => {
      const message: SignalingMessage = JSON.parse(event.data);
      await handleSignalingMessage(message);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection failed');
    };

    wsRef.current = ws;
  }, [callId, user?.id]);

  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    switch (message.type) {
      case 'joined':
        console.log('Successfully joined call');
        break;

      case 'user-joined':
        if (message.userId && message.userId !== user?.id) {
          setRemoteUserId(message.userId);
          // If we're the initiator, create and send offer
          if (isInitiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            wsRef.current?.send(JSON.stringify({
              type: 'offer',
              callId,
              userId: user?.id,
              data: offer
            }));
          }
        }
        break;

      case 'offer':
        if (message.fromUserId !== user?.id) {
          await pc.setRemoteDescription(new RTCSessionDescription(message.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          wsRef.current?.send(JSON.stringify({
            type: 'answer',
            callId,
            userId: user?.id,
            data: answer
          }));
        }
        break;

      case 'answer':
        if (message.fromUserId !== user?.id) {
          await pc.setRemoteDescription(new RTCSessionDescription(message.data));
        }
        break;

      case 'ice-candidate':
        if (message.fromUserId !== user?.id) {
          await pc.addIceCandidate(new RTCIceCandidate(message.data));
        }
        break;

      case 'user-left':
        if (message.userId !== user?.id) {
          setRemoteUserId(null);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        }
        break;

      case 'error':
        setError(message.data || 'An error occurred');
        break;
    }
  }, [callId, user?.id, isInitiator]);

  const joinCall = useCallback(async () => {
    await startLocalVideo();
    connectWebSocket();
  }, [startLocalVideo, connectWebSocket]);

  const leaveCall = useCallback(() => {
    // Stop local video tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Send leave message and close WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave',
        callId,
        userId: user?.id
      }));
      wsRef.current.close();
    }

    setIsConnected(false);
    setIsCallActive(false);
    setRemoteUserId(null);
    setError(null);

    onCallEnd?.();
  }, [callId, user?.id, onCallEnd]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup media streams, don't trigger onCallEnd on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'leave',
          callId,
          userId: user?.id
        }));
        wsRef.current.close();
      }

      setIsConnected(false);
      setIsCallActive(false);
      setRemoteUserId(null);
      setError(null);
    };
  }, [callId, user?.id]);

  return {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isCallActive,
    remoteUserId,
    error,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo
  };
}