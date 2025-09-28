import { storage } from "../storage";
import { VideoCall, InsertVideoCall } from "@shared/schema";

export class VideoCallService {
  async createVideoCall(initiatorId: string, participantId: string, title: string, purpose: 'consultation' | 'mentorship' | 'meeting' | 'training', scheduledAt?: Date): Promise<VideoCall> {
    const videoCallData: InsertVideoCall = {
      title,
      initiatorId,
      participantId,
      purpose,
      scheduledAt: scheduledAt || new Date(),
      status: 'scheduled'
    };

    return await storage.createVideoCall(videoCallData);
  }

  async getUserVideoCalls(userId: string): Promise<VideoCall[]> {
    return await storage.getUserVideoCalls(userId);
  }

  async getVideoCall(id: string): Promise<VideoCall | undefined> {
    return await storage.getVideoCall(id);
  }

  async startCall(id: string, userId: string): Promise<VideoCall | undefined> {
    const videoCall = await storage.getVideoCall(id);
    if (!videoCall) {
      throw new Error('Video call not found');
    }

    // Only initiator or participant can start the call
    if (videoCall.initiatorId !== userId && videoCall.participantId !== userId) {
      throw new Error('Unauthorized to start this call');
    }

    if (videoCall.status !== 'scheduled') {
      throw new Error('Call is not in scheduled status');
    }

    return await storage.startVideoCall(id);
  }

  async endCall(id: string, userId: string, duration: number, notes?: string): Promise<VideoCall | undefined> {
    const videoCall = await storage.getVideoCall(id);
    if (!videoCall) {
      throw new Error('Video call not found');
    }

    // Only initiator or participant can end the call
    if (videoCall.initiatorId !== userId && videoCall.participantId !== userId) {
      throw new Error('Unauthorized to end this call');
    }

    if (videoCall.status !== 'active') {
      throw new Error('Call is not active');
    }

    return await storage.endVideoCall(id, duration, notes);
  }

  async cancelCall(id: string, userId: string): Promise<VideoCall | undefined> {
    const videoCall = await storage.getVideoCall(id);
    if (!videoCall) {
      throw new Error('Video call not found');
    }

    // Only initiator can cancel the call
    if (videoCall.initiatorId !== userId) {
      throw new Error('Only the initiator can cancel the call');
    }

    if (videoCall.status !== 'scheduled') {
      throw new Error('Only scheduled calls can be cancelled');
    }

    return await storage.updateVideoCallStatus(id, 'cancelled');
  }
}

export const videoCallService = new VideoCallService();