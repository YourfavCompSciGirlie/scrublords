import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<"doctor" | "nurse" | "admin" | "resident">(),
  fullName: text("full_name").notNull(),
  qualifications: text("qualifications"),
  location: text("location"),
  availability: jsonb("availability").$type<{ remote: boolean; inPerson: boolean }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const opportunities = pgTable("opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().$type<"job" | "practical" | "mentorship" | "volunteer">(),
  location: text("location"),
  isRemote: boolean("is_remote").default(false),
  requirements: text("requirements"),
  postedById: varchar("posted_by_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityId: varchar("opportunity_id").references(() => opportunities.id),
  userId: varchar("user_id").references(() => users.id),
  status: text("status").notNull().$type<"pending" | "accepted" | "rejected">().default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: text("patient_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender").$type<"male" | "female" | "other">(),
  contactNumber: text("contact_number"),
  medicalHistory: text("medical_history"),
  currentCondition: text("current_condition"),
  assignedDoctorId: varchar("assigned_doctor_id").references(() => users.id),
  priority: text("priority").$type<"routine" | "urgent" | "emergency">().default("routine"),
  lastVisit: timestamp("last_visit"),
  status: text("status").notNull().default("active"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id),
  receiverId: varchar("receiver_id").references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const videoCalls = pgTable("video_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  initiatorId: varchar("initiator_id").references(() => users.id),
  participantId: varchar("participant_id").references(() => users.id),
  roomId: text("room_id").notNull().unique(),
  status: text("status").notNull().$type<"scheduled" | "active" | "ended" | "cancelled">().default("scheduled"),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // in minutes
  purpose: text("purpose").$type<"consultation" | "mentorship" | "meeting" | "training">().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow()
});

// Resident-specific tables
export const learningModules = pgTable("learning_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull().$type<"video" | "text" | "interactive" | "case-study" | "quiz" | "audio">(),
  difficulty: text("difficulty").notNull().$type<"beginner" | "intermediate" | "advanced">(),
  duration: integer("duration").notNull(), // minutes
  rating: integer("rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  author: text("author").notNull(),
  isRequired: boolean("is_required").default(false),
  prerequisites: text("prerequisites").array().default(sql`'{}'::text[]`),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  content: text("content"), // JSON or text content
  publishedDate: timestamp("published_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const caseStudies = pgTable("case_studies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  specialty: text("specialty").notNull(),
  difficulty: text("difficulty").notNull().$type<"beginner" | "intermediate" | "advanced">(),
  patientAge: integer("patient_age").notNull(),
  symptoms: text("symptoms").array().notNull(),
  diagnosis: text("diagnosis").notNull(),
  learningObjectives: text("learning_objectives").array().notNull(),
  estimatedTime: integer("estimated_time").notNull(), // minutes
  rating: integer("rating").default(0),
  authorName: text("author_name").notNull(),
  content: text("content"), // JSON case study content
  publishedDate: timestamp("published_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const learningPaths = pgTable("learning_paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull().$type<"beginner" | "intermediate" | "advanced">(),
  estimatedHours: integer("estimated_hours").notNull(),
  moduleIds: text("module_ids").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow()
});

export const rotations = pgTable("rotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  department: text("department").notNull(),
  specialty: text("specialty").notNull(),
  supervisor: text("supervisor").notNull(),
  supervisorId: varchar("supervisor_id").references(() => users.id),
  hospitalName: text("hospital_name").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  duration: integer("duration").notNull(), // weeks
  status: text("status").notNull().$type<"available" | "full" | "cancelled">().default("available"),
  description: text("description").notNull(),
  requirements: text("requirements").array().default(sql`'{}'::text[]`),
  maxResidents: integer("max_residents").notNull(),
  currentResidents: integer("current_residents").default(0),
  applicationDeadline: timestamp("application_deadline").notNull(),
  isElective: boolean("is_elective").default(false),
  credits: integer("credits").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const rotationApplications = pgTable("rotation_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rotationId: varchar("rotation_id").references(() => rotations.id),
  residentId: varchar("resident_id").references(() => users.id),
  status: text("status").notNull().$type<"pending" | "accepted" | "rejected">().default("pending"),
  statement: text("statement").notNull(),
  applicationDate: timestamp("application_date").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const mentorships = pgTable("mentorships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").references(() => users.id),
  residentId: varchar("resident_id").references(() => users.id),
  status: text("status").notNull().$type<"active" | "paused" | "completed">().default("active"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  meetingCount: integer("meeting_count").default(0),
  nextMeeting: timestamp("next_meeting"),
  goals: text("goals").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow()
});

export const mentorshipRequests = pgTable("mentorship_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorId: varchar("mentor_id").references(() => users.id),
  residentId: varchar("resident_id").references(() => users.id),
  status: text("status").notNull().$type<"pending" | "accepted" | "rejected">().default("pending"),
  message: text("message").notNull(),
  expectedDuration: text("expected_duration").notNull(),
  goals: text("goals").array().default(sql`'{}'::text[]`),
  requestDate: timestamp("request_date").defaultNow(),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const residentProgress = pgTable("resident_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: varchar("resident_id").references(() => users.id),
  moduleId: varchar("module_id").references(() => learningModules.id),
  caseStudyId: varchar("case_study_id").references(() => caseStudies.id),
  pathId: varchar("path_id").references(() => learningPaths.id),
  progress: integer("progress").default(0), // percentage
  isCompleted: boolean("is_completed").default(false),
  lastAccessed: timestamp("last_accessed"),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent").default(0), // minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  opportunities: many(opportunities),
  matches: many(matches),
  patients: many(patients),
  auditLogs: many(auditLogs),
  initiatedCalls: many(videoCalls, { relationName: "initiator" }),
  participatedCalls: many(videoCalls, { relationName: "participant" })
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  postedBy: one(users, {
    fields: [opportunities.postedById],
    references: [users.id]
  }),
  matches: many(matches)
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [matches.opportunityId],
    references: [opportunities.id]
  }),
  user: one(users, {
    fields: [matches.userId],
    references: [users.id]
  })
}));

export const patientsRelations = relations(patients, ({ one }) => ({
  assignedDoctor: one(users, {
    fields: [patients.assignedDoctorId],
    references: [users.id]
  }),
  createdBy: one(users, {
    fields: [patients.createdById],
    references: [users.id]
  })
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender"
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver"
  })
}));

export const videoCallsRelations = relations(videoCalls, ({ one }) => ({
  initiator: one(users, {
    fields: [videoCalls.initiatorId],
    references: [users.id],
    relationName: "initiator"
  }),
  participant: one(users, {
    fields: [videoCalls.participantId],
    references: [users.id],
    relationName: "participant"
  })
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  })
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
  createdAt: true
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true
});

export const insertVideoCallSchema = createInsertSchema(videoCalls).omit({
  id: true,
  roomId: true,
  createdAt: true,
  startedAt: true,
  endedAt: true,
  duration: true
});

// Resident insert schemas
export const insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
  createdAt: true,
  publishedDate: true
});

export const insertCaseStudySchema = createInsertSchema(caseStudies).omit({
  id: true,
  createdAt: true,
  publishedDate: true
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true
});

export const insertRotationSchema = createInsertSchema(rotations).omit({
  id: true,
  createdAt: true
});

export const insertRotationApplicationSchema = createInsertSchema(rotationApplications).omit({
  id: true,
  createdAt: true,
  applicationDate: true
});

export const insertMentorshipSchema = createInsertSchema(mentorships).omit({
  id: true,
  createdAt: true,
  startDate: true
});

export const insertMentorshipRequestSchema = createInsertSchema(mentorshipRequests).omit({
  id: true,
  createdAt: true,
  requestDate: true
});

export const insertResidentProgressSchema = createInsertSchema(residentProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type VideoCall = typeof videoCalls.$inferSelect;
export type InsertVideoCall = z.infer<typeof insertVideoCallSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Resident types
export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type CaseStudy = typeof caseStudies.$inferSelect;
export type InsertCaseStudy = z.infer<typeof insertCaseStudySchema>;
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type Rotation = typeof rotations.$inferSelect;
export type InsertRotation = z.infer<typeof insertRotationSchema>;
export type RotationApplication = typeof rotationApplications.$inferSelect;
export type InsertRotationApplication = z.infer<typeof insertRotationApplicationSchema>;
export type Mentorship = typeof mentorships.$inferSelect;
export type InsertMentorship = z.infer<typeof insertMentorshipSchema>;
export type MentorshipRequest = typeof mentorshipRequests.$inferSelect;
export type InsertMentorshipRequest = z.infer<typeof insertMentorshipRequestSchema>;
export type ResidentProgress = typeof residentProgress.$inferSelect;
export type InsertResidentProgress = z.infer<typeof insertResidentProgressSchema>;
