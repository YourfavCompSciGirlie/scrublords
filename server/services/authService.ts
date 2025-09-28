import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { InsertUser, User } from '@shared/schema';

export class AuthService {
  private jwtSecret: string;
  private saltRounds = 12;

  constructor() {
    this.jwtSecret = process.env.SESSION_SECRET || 'your-secret-key';
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async register(userData: InsertUser): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword
    });

    // Generate token
    const token = this.generateToken(user);

    // Log registration
    await storage.createAuditLog({
      userId: user.id,
      action: 'user_registered',
      resourceType: 'user',
      resourceId: user.id
    });

    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    // Log login
    await storage.createAuditLog({
      userId: user.id,
      action: 'user_login',
      resourceType: 'user',
      resourceId: user.id
    });

    return { user, token };
  }

  async getCurrentUser(token: string): Promise<User> {
    const decoded = this.verifyToken(token);
    const user = await storage.getUser(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

export const authService = new AuthService();
