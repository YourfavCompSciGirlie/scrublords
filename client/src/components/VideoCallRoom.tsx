import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  VideoIcon, 
  VideoOffIcon, 
  MicIcon, 
  MicOffIcon, 
  PhoneOffIcon, 
  UserIcon,
  AlertCircleIcon 
} from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useAuth } from "@/hooks/useAuth";

interface VideoCall {
  id: string;
  title: string;
  initiatorId: string;
  participantId: string;
  roomId: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  purpose: 'consultation' | 'mentorship' | 'meeting' | 'training';
  scheduledAt: string;
}

interface VideoCallRoomProps {
  videoCall: VideoCall;
  isOpen: boolean;
  onClose: () => void;
  onEndCall: () => void;
}

export default function VideoCallRoom({ videoCall, isOpen, onClose, onEndCall }: VideoCallRoomProps) {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState('00:00');
  
  const isInitiator = videoCall.initiatorId === user?.id;
  
  const {
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
  } = useWebRTC({
    callId: videoCall.id,
    isInitiator,
    onCallEnd: onEndCall
  });

  // Join call when modal opens
  useEffect(() => {
    if (isOpen && videoCall.status === 'active') {
      joinCall();
      setCallStartTime(new Date());
    }
  }, [isOpen, videoCall.status, joinCall]);

  // Update call duration timer
  useEffect(() => {
    if (!callStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime]);

  const handleMuteToggle = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  const handleVideoToggle = () => {
    const videoOff = toggleVideo();
    setIsVideoOff(videoOff);
  };

  const handleEndCall = () => {
    leaveCall();
    onClose(); // Close the video room first
    onEndCall(); // This opens the End Call modal with duration/notes form
  };

  const getPurposeBadge = (purpose: VideoCall['purpose']) => {
    const colors: Record<VideoCall['purpose'], string> = {
      consultation: 'bg-blue-100 text-blue-800',
      mentorship: 'bg-green-100 text-green-800',
      meeting: 'bg-purple-100 text-purple-800',
      training: 'bg-orange-100 text-orange-800'
    };
    
    return <Badge className={colors[purpose]}>{purpose}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <VideoIcon className="h-5 w-5" />
                  {videoCall.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4 mt-2">
                  <span>Duration: {callDuration}</span>
                  {getPurposeBadge(videoCall.purpose)}
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? "Connected" : "Connecting..."}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Video Content */}
          <div className="flex-1 p-6 bg-black relative">
            {error && (
              <Card className="absolute top-4 left-4 right-4 z-10 bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircleIcon className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main video area - Remote video */}
            <div className="h-full w-full bg-gray-900 rounded-lg relative overflow-hidden">
              {remoteUserId ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  data-testid="remote-video"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <UserIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Waiting for other participant...</p>
                    <p className="text-sm opacity-75">
                      {isInitiator ? "Share this call link with the participant" : "The host will start the call soon"}
                    </p>
                  </div>
                </div>
              )}

              {/* Local video - Picture in picture */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  data-testid="local-video"
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOffIcon className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>

              {/* Call status indicator */}
              {isCallActive && remoteUserId && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500 text-white">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    Live
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Control bar */}
          <div className="p-6 border-t bg-white">
            <div className="flex justify-center items-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                onClick={handleMuteToggle}
                data-testid="button-toggle-mute"
                className="w-14 h-14 rounded-full"
              >
                {isMuted ? <MicOffIcon className="h-6 w-6" /> : <MicIcon className="h-6 w-6" />}
              </Button>

              <Button
                variant={isVideoOff ? "destructive" : "outline"}
                size="lg"
                onClick={handleVideoToggle}
                data-testid="button-toggle-video"
                className="w-14 h-14 rounded-full"
              >
                {isVideoOff ? <VideoOffIcon className="h-6 w-6" /> : <VideoIcon className="h-6 w-6" />}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndCall}
                data-testid="button-end-call"
                className="w-16 h-14 rounded-full"
              >
                <PhoneOffIcon className="h-6 w-6" />
              </Button>
            </div>

            <div className="text-center mt-4 text-sm text-muted-foreground">
              <p>Click the microphone or camera buttons to mute/unmute</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}