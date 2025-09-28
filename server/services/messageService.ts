import { storage } from '../storage';
import { InsertMessage, Message } from '@shared/schema';

export class MessageService {
  async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const message = await storage.createMessage({
      senderId,
      receiverId,
      content
    });

    // Log message sent
    await storage.createAuditLog({
      userId: senderId,
      action: 'message_sent',
      resourceType: 'message',
      resourceId: message.id,
      details: { receiverId }
    });

    return message;
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return await storage.getConversation(userId1, userId2);
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return await storage.getUserMessages(userId);
  }

  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    const result = await storage.markMessageAsRead(messageId);
    
    if (result) {
      // Log message read
      await storage.createAuditLog({
        userId,
        action: 'message_read',
        resourceType: 'message',
        resourceId: messageId
      });
    }

    return result;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await storage.getUnreadMessageCount(userId);
  }
}

export const messageService = new MessageService();
