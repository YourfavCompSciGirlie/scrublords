import { storage } from '../storage';
import { InsertUser, User } from '@shared/schema';

export class UserService {
  async updateProfile(userId: string, profileData: Partial<InsertUser>): Promise<User> {
    const user = await storage.updateUser(userId, profileData);
    if (!user) {
      throw new Error('User not found');
    }

    // Log profile update
    await storage.createAuditLog({
      userId,
      action: 'profile_updated',
      resourceType: 'user',
      resourceId: userId,
      details: profileData
    });

    return user;
  }

  async getUserProfile(userId: string): Promise<User> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async searchUsers(query: string, role?: string): Promise<User[]> {
    if (role) {
      return await storage.getUsersByRole(role);
    }
    return await storage.getUsers();
  }

  async getDoctors(): Promise<User[]> {
    return await storage.getUsersByRole('doctor');
  }

  async getNurses(): Promise<User[]> {
    return await storage.getUsersByRole('nurse');
  }
}

export const userService = new UserService();
