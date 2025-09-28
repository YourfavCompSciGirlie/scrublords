import { 
  users, 
  opportunities, 
  patients, 
  messages, 
  matches, 
  auditLogs,
  videoCalls,
  learningModules,
  caseStudies,
  learningPaths,
  rotations,
  rotationApplications,
  mentorships,
  mentorshipRequests,
  residentProgress,
  type User, 
  type InsertUser,
  type Opportunity,
  type InsertOpportunity,
  type Patient,
  type InsertPatient,
  type Message,
  type InsertMessage,
  type Match,
  type InsertMatch,
  type VideoCall,
  type InsertVideoCall,
  type AuditLog,
  type LearningModule,
  type InsertLearningModule,
  type CaseStudy,
  type InsertCaseStudy,
  type LearningPath,
  type InsertLearningPath,
  type Rotation,
  type InsertRotation,
  type RotationApplication,
  type InsertRotationApplication,
  type Mentorship,
  type InsertMentorship,
  type MentorshipRequest,
  type InsertMentorshipRequest,
  type ResidentProgress,
  type InsertResidentProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc, asc, and } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Opportunity methods
  createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity>;
  getOpportunities(limit?: number, offset?: number): Promise<Opportunity[]>;
  getOpportunity(id: string): Promise<Opportunity | undefined>;
  searchOpportunities(query: string): Promise<Opportunity[]>;
  getOpportunitiesByType(type: string): Promise<Opportunity[]>;
  
  // Patient methods
  createPatient(insertPatient: InsertPatient): Promise<Patient>;
  getPatients(limit?: number, offset?: number): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  updatePatient(id: string, patientData: Partial<InsertPatient>): Promise<Patient | undefined>;
  searchPatients(query: string): Promise<Patient[]>;
  getPatientsByDoctor(doctorId: string): Promise<Patient[]>;
  
  // Message methods
  createMessage(insertMessage: InsertMessage): Promise<Message>;
  getUserMessages(userId: string): Promise<Message[]>;
  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<boolean>;
  getUnreadMessageCount(userId: string): Promise<number>;
  
  // Match methods
  createMatch(insertMatch: InsertMatch): Promise<Match>;
  getMatchesByUser(userId: string): Promise<Match[]>;
  updateMatchStatus(matchId: string, status: string): Promise<Match | undefined>;
  
  // Video call methods
  createVideoCall(insertVideoCall: InsertVideoCall): Promise<VideoCall>;
  getVideoCall(id: string): Promise<VideoCall | undefined>;
  getUserVideoCalls(userId: string): Promise<VideoCall[]>;
  updateVideoCallStatus(id: string, status: string): Promise<VideoCall | undefined>;
  startVideoCall(id: string): Promise<VideoCall | undefined>;
  endVideoCall(id: string, duration: number, notes?: string): Promise<VideoCall | undefined>;
  
  // Audit log methods
  createAuditLog(auditLog: Partial<AuditLog>): Promise<AuditLog>;
  
  // Learning module methods
  getLearningModules(): Promise<LearningModule[]>;
  getLearningModule(id: string): Promise<LearningModule | undefined>;
  createLearningModule(insertModule: InsertLearningModule): Promise<LearningModule>;
  getLearningModulesByCategory(category: string): Promise<LearningModule[]>;
  
  // Case study methods
  getCaseStudies(): Promise<CaseStudy[]>;
  getCaseStudy(id: string): Promise<CaseStudy | undefined>;
  createCaseStudy(insertCaseStudy: InsertCaseStudy): Promise<CaseStudy>;
  getCaseStudiesBySpecialty(specialty: string): Promise<CaseStudy[]>;
  
  // Learning path methods
  getLearningPaths(): Promise<LearningPath[]>;
  getLearningPath(id: string): Promise<LearningPath | undefined>;
  createLearningPath(insertPath: InsertLearningPath): Promise<LearningPath>;
  
  // Rotation methods
  getRotations(): Promise<Rotation[]>;
  getAvailableRotations(): Promise<Rotation[]>;
  getRotation(id: string): Promise<Rotation | undefined>;
  createRotation(insertRotation: InsertRotation): Promise<Rotation>;
  applyForRotation(insertApplication: InsertRotationApplication): Promise<RotationApplication>;
  getRotationApplicationsByResident(residentId: string): Promise<RotationApplication[]>;
  
  // Mentorship methods
  getAvailableMentors(): Promise<User[]>;
  requestMentorship(insertRequest: InsertMentorshipRequest): Promise<MentorshipRequest>;
  getMentorshipRequestsByResident(residentId: string): Promise<MentorshipRequest[]>;
  getMentorshipRequestsByMentor(mentorId: string): Promise<MentorshipRequest[]>;
  updateMentorshipRequestStatus(requestId: string, status: string): Promise<MentorshipRequest | undefined>;
  createMentorship(insertMentorship: InsertMentorship): Promise<Mentorship>;
  getActiveMentorshipsByResident(residentId: string): Promise<Mentorship[]>;
  
  // Progress tracking methods
  getResidentProgress(residentId: string): Promise<ResidentProgress[]>;
  updateProgress(insertProgress: InsertResidentProgress): Promise<ResidentProgress>;
  getModuleProgress(residentId: string, moduleId: string): Promise<ResidentProgress | undefined>;
  
  // Stats methods
  getStats(): Promise<any>;
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values([insertUser as any]).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData as any).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  // Opportunity methods
  async createOpportunity(insertOpportunity: InsertOpportunity): Promise<Opportunity> {
    const [opportunity] = await db.insert(opportunities).values([insertOpportunity as any]).returning();
    return opportunity;
  }

  async getOpportunities(limit: number = 50, offset: number = 0): Promise<Opportunity[]> {
    return await db.select().from(opportunities).limit(limit).offset(offset).orderBy(desc(opportunities.createdAt));
  }

  async getOpportunity(id: string): Promise<Opportunity | undefined> {
    const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, id));
    return opportunity || undefined;
  }

  async searchOpportunities(query: string): Promise<Opportunity[]> {
    return await db.select().from(opportunities).where(
      or(
        like(opportunities.title, `%${query}%`),
        like(opportunities.description, `%${query}%`)
      )
    );
  }

  async getOpportunitiesByType(type: string): Promise<Opportunity[]> {
    return await db.select().from(opportunities).where(eq(opportunities.type, type as any));
  }

  // Patient methods
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values([insertPatient as any]).returning();
    return patient;
  }

  async getPatients(limit: number = 50, offset: number = 0): Promise<Patient[]> {
    return await db.select().from(patients).limit(limit).offset(offset).orderBy(desc(patients.createdAt));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async updatePatient(id: string, patientData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [patient] = await db.update(patients).set(patientData as any).where(eq(patients.id, id)).returning();
    return patient || undefined;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return await db.select().from(patients).where(
      or(
        like(patients.fullName, `%${query}%`),
        like(patients.patientId, `%${query}%`)
      )
    );
  }

  async getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.assignedDoctorId, doctorId));
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      )
    ).orderBy(desc(messages.createdAt));
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        eq(messages.senderId, userId1) && eq(messages.receiverId, userId2),
        eq(messages.senderId, userId2) && eq(messages.receiverId, userId1)
      )
    ).orderBy(asc(messages.createdAt));
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      await db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId));
      return true;
    } catch (error) {
      return false;
    }
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db.select().from(messages).where(
      eq(messages.receiverId, userId) && eq(messages.isRead, false)
    );
    return result.length;
  }

  // Match methods
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values([insertMatch as any]).returning();
    return match;
  }

  async getMatchesByUser(userId: string): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.userId, userId));
  }

  async updateMatchStatus(matchId: string, status: string): Promise<Match | undefined> {
    const [match] = await db.update(matches).set({ status: status as any }).where(eq(matches.id, matchId)).returning();
    return match || undefined;
  }

  // Video call methods
  async createVideoCall(insertVideoCall: InsertVideoCall): Promise<VideoCall> {
    const roomId = crypto.randomUUID();
    const videoCallData = {
      ...insertVideoCall,
      roomId
    };
    const [videoCall] = await db.insert(videoCalls).values([videoCallData as any]).returning();
    return videoCall;
  }

  async getVideoCall(id: string): Promise<VideoCall | undefined> {
    const [videoCall] = await db.select().from(videoCalls).where(eq(videoCalls.id, id));
    return videoCall || undefined;
  }

  async getUserVideoCalls(userId: string): Promise<VideoCall[]> {
    return await db.select().from(videoCalls)
      .where(or(eq(videoCalls.initiatorId, userId), eq(videoCalls.participantId, userId)))
      .orderBy(desc(videoCalls.scheduledAt));
  }

  async updateVideoCallStatus(id: string, status: string): Promise<VideoCall | undefined> {
    const [videoCall] = await db.update(videoCalls)
      .set({ status: status as any })
      .where(eq(videoCalls.id, id))
      .returning();
    return videoCall || undefined;
  }

  async startVideoCall(id: string): Promise<VideoCall | undefined> {
    const [videoCall] = await db.update(videoCalls)
      .set({ 
        status: 'active' as any,
        startedAt: new Date()
      })
      .where(eq(videoCalls.id, id))
      .returning();
    return videoCall || undefined;
  }

  async endVideoCall(id: string, duration: number, notes?: string): Promise<VideoCall | undefined> {
    const [videoCall] = await db.update(videoCalls)
      .set({ 
        status: 'ended' as any,
        endedAt: new Date(),
        duration,
        notes
      })
      .where(eq(videoCalls.id, id))
      .returning();
    return videoCall || undefined;
  }

  // Audit log methods
  async createAuditLog(auditLog: Partial<AuditLog>): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(auditLog as any).returning();
    return log;
  }

  // Learning module methods
  async getLearningModules(): Promise<LearningModule[]> {
    return await db.select().from(learningModules).orderBy(desc(learningModules.publishedDate));
  }

  async getLearningModule(id: string): Promise<LearningModule | undefined> {
    const [module] = await db.select().from(learningModules).where(eq(learningModules.id, id));
    return module || undefined;
  }

  async createLearningModule(insertModule: InsertLearningModule): Promise<LearningModule> {
    const [module] = await db.insert(learningModules).values([insertModule as any]).returning();
    return module;
  }

  async getLearningModulesByCategory(category: string): Promise<LearningModule[]> {
    return await db.select().from(learningModules).where(eq(learningModules.category, category));
  }

  // Case study methods
  async getCaseStudies(): Promise<CaseStudy[]> {
    return await db.select().from(caseStudies).orderBy(desc(caseStudies.publishedDate));
  }

  async getCaseStudy(id: string): Promise<CaseStudy | undefined> {
    const [caseStudy] = await db.select().from(caseStudies).where(eq(caseStudies.id, id));
    return caseStudy || undefined;
  }

  async createCaseStudy(insertCaseStudy: InsertCaseStudy): Promise<CaseStudy> {
    const [caseStudy] = await db.insert(caseStudies).values([insertCaseStudy as any]).returning();
    return caseStudy;
  }

  async getCaseStudiesBySpecialty(specialty: string): Promise<CaseStudy[]> {
    return await db.select().from(caseStudies).where(eq(caseStudies.specialty, specialty));
  }

  // Learning path methods
  async getLearningPaths(): Promise<LearningPath[]> {
    return await db.select().from(learningPaths).orderBy(desc(learningPaths.createdAt));
  }

  async getLearningPath(id: string): Promise<LearningPath | undefined> {
    const [path] = await db.select().from(learningPaths).where(eq(learningPaths.id, id));
    return path || undefined;
  }

  async createLearningPath(insertPath: InsertLearningPath): Promise<LearningPath> {
    const [path] = await db.insert(learningPaths).values([insertPath as any]).returning();
    return path;
  }

  // Rotation methods
  async getRotations(): Promise<Rotation[]> {
    return await db.select().from(rotations).orderBy(desc(rotations.createdAt));
  }

  async getAvailableRotations(): Promise<Rotation[]> {
    const now = new Date();
    return await db.select().from(rotations).where(
      eq(rotations.status, 'available')
      // Note: Additional filtering for capacity and deadline would require more complex SQL
      // For now, we'll implement basic status filtering and rely on application validation
    ).orderBy(asc(rotations.startDate));
  }

  async getRotation(id: string): Promise<Rotation | undefined> {
    const [rotation] = await db.select().from(rotations).where(eq(rotations.id, id));
    return rotation || undefined;
  }

  async createRotation(insertRotation: InsertRotation): Promise<Rotation> {
    const [rotation] = await db.insert(rotations).values([insertRotation as any]).returning();
    return rotation;
  }

  async applyForRotation(insertApplication: InsertRotationApplication): Promise<RotationApplication> {
    const [application] = await db.insert(rotationApplications).values([insertApplication as any]).returning();
    return application;
  }

  async getRotationApplicationsByResident(residentId: string): Promise<RotationApplication[]> {
    return await db.select().from(rotationApplications).where(eq(rotationApplications.residentId, residentId)).orderBy(desc(rotationApplications.applicationDate));
  }

  // Mentorship methods
  async getAvailableMentors(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'doctor'));
  }

  async requestMentorship(insertRequest: InsertMentorshipRequest): Promise<MentorshipRequest> {
    const [request] = await db.insert(mentorshipRequests).values([insertRequest as any]).returning();
    return request;
  }

  async getMentorshipRequestsByResident(residentId: string): Promise<MentorshipRequest[]> {
    return await db.select().from(mentorshipRequests).where(eq(mentorshipRequests.residentId, residentId)).orderBy(desc(mentorshipRequests.requestDate));
  }

  async getMentorshipRequestsByMentor(mentorId: string): Promise<MentorshipRequest[]> {
    return await db.select().from(mentorshipRequests).where(eq(mentorshipRequests.mentorId, mentorId)).orderBy(desc(mentorshipRequests.requestDate));
  }

  async updateMentorshipRequestStatus(requestId: string, status: string): Promise<MentorshipRequest | undefined> {
    const [request] = await db.update(mentorshipRequests).set({ status: status as any }).where(eq(mentorshipRequests.id, requestId)).returning();
    return request || undefined;
  }

  async createMentorship(insertMentorship: InsertMentorship): Promise<Mentorship> {
    const [mentorship] = await db.insert(mentorships).values([insertMentorship as any]).returning();
    return mentorship;
  }

  async getActiveMentorshipsByResident(residentId: string): Promise<Mentorship[]> {
    return await db.select().from(mentorships).where(and(eq(mentorships.residentId, residentId), eq(mentorships.status, 'active')));
  }

  // Progress tracking methods
  async getResidentProgress(residentId: string): Promise<ResidentProgress[]> {
    return await db.select().from(residentProgress).where(eq(residentProgress.residentId, residentId));
  }

  async updateProgress(insertProgress: InsertResidentProgress): Promise<ResidentProgress> {
    // Set completion based on progress percentage
    const progress = insertProgress.progress ?? 0;
    const isCompleted = progress >= 100 ? true : insertProgress.isCompleted;
    
    const progressData = {
      ...insertProgress,
      progress,
      isCompleted,
      lastAccessed: new Date(),
      updatedAt: new Date()
    };

    // Check if progress already exists
    let existingProgress: ResidentProgress | undefined;
    
    if (insertProgress.moduleId) {
      existingProgress = await this.getModuleProgress(insertProgress.residentId, insertProgress.moduleId);
    } else if (insertProgress.caseStudyId) {
      const [existing] = await db.select().from(residentProgress)
        .where(and(eq(residentProgress.residentId, insertProgress.residentId), eq(residentProgress.caseStudyId, insertProgress.caseStudyId)));
      existingProgress = existing;
    } else if (insertProgress.pathId) {
      const [existing] = await db.select().from(residentProgress)
        .where(and(eq(residentProgress.residentId, insertProgress.residentId), eq(residentProgress.pathId, insertProgress.pathId)));
      existingProgress = existing;
    }

    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db.update(residentProgress)
        .set({
          progress: progressData.progress,
          isCompleted: progressData.isCompleted,
          lastAccessed: progressData.lastAccessed,
          timeSpent: progressData.timeSpent,
          updatedAt: progressData.updatedAt
        })
        .where(eq(residentProgress.id, existingProgress.id))
        .returning();
      
      return updatedProgress;
    } else {
      // Insert new progress
      const [progressRecord] = await db.insert(residentProgress)
        .values([progressData as any])
        .returning();
      return progressRecord;
    }
  }

  async getModuleProgress(residentId: string, moduleId: string): Promise<ResidentProgress | undefined> {
    const [progress] = await db.select().from(residentProgress)
      .where(and(eq(residentProgress.residentId, residentId), eq(residentProgress.moduleId, moduleId)));
    return progress || undefined;
  }

  // Stats methods
  async getStats(): Promise<any> {
    const totalUsers = await db.select().from(users);
    const totalOpportunities = await db.select().from(opportunities);
    const totalPatients = await db.select().from(patients);
    const totalMatches = await db.select().from(matches);
    const activeConversations = await db.select().from(messages);
    
    return {
      totalUsers: totalUsers.length,
      totalOpportunities: totalOpportunities.length,
      totalPatients: totalPatients.length,
      totalMatches: totalMatches.length,
      activeConversations: Math.floor(activeConversations.length / 2) // Rough estimate
    };
  }
}

export const storage = new DatabaseStorage();