import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { authService } from './services/authService';
import { userService } from './services/userService';
import { opportunityService } from './services/opportunityService';
import { patientService } from './services/patientService';
import { messageService } from './services/messageService';
import { videoCallService } from './services/videoCallService';
import { WebRTCSignalingService, webrtcSignalingService } from './services/webrtcSignalingService';
import { storage } from './storage';

// Rate limiting
const createAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many registration attempts, please try again later.'
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required(),
  role: Joi.string().valid('doctor', 'nurse', 'admin', 'resident').required(),
  fullName: Joi.string().min(2).max(100).required(),
  qualifications: Joi.string().max(500).optional(),
  location: Joi.string().max(100).optional(),
  availability: Joi.object({
    remote: Joi.boolean(),
    inPerson: Joi.boolean()
  }).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const opportunitySchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(1000).required(),
  type: Joi.string().valid('job', 'practical', 'mentorship', 'volunteer').required(),
  location: Joi.string().max(100).optional(),
  isRemote: Joi.boolean().default(false),
  requirements: Joi.string().max(500).optional()
});

const patientSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  contactNumber: Joi.string().pattern(/^\+?[0-9\s\-\(\)]+$/).optional(),
  medicalHistory: Joi.string().max(2000).optional(),
  currentCondition: Joi.string().max(1000).optional(),
  assignedDoctorId: Joi.string().uuid().optional(),
  priority: Joi.string().valid('routine', 'urgent', 'emergency').default('routine')
});

const messageSchema = Joi.object({
  receiverId: Joi.string().uuid().required(),
  content: Joi.string().min(1).max(1000).required()
});

const videoCallSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  participantId: Joi.string().uuid().required(),
  purpose: Joi.string().valid('consultation', 'mentorship', 'meeting', 'training').required(),
  scheduledAt: Joi.date().optional()
});

const endCallSchema = Joi.object({
  duration: Joi.number().min(1).required(),
  notes: Joi.string().max(1000).optional()
});

// Resident validation schemas
const rotationApplicationSchema = Joi.object({
  rotationId: Joi.string().uuid().required(),
  statement: Joi.string().min(50).max(2000).required()
});

const mentorshipRequestSchema = Joi.object({
  message: Joi.string().min(20).max(1000).required(),
  expectedDuration: Joi.string().required(),
  goals: Joi.array().items(Joi.string()).min(1).required()
});

const progressUpdateSchema = Joi.object({
  moduleId: Joi.string().uuid().optional(),
  caseStudyId: Joi.string().uuid().optional(),
  pathId: Joi.string().uuid().optional(),
  progress: Joi.number().min(0).max(100).required(),
  isCompleted: Joi.boolean().default(false),
  timeSpent: Joi.number().min(0).default(0)
}).xor('moduleId', 'caseStudyId', 'pathId');

// Authentication middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// Role-based access control
function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure trust proxy for proper rate limiting behind proxies
  app.set('trust proxy', 1);
  
  // Apply security headers with dev-friendly CSP
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  }));
  
  // Apply rate limiting
  app.use('/api', generalLimiter);

  // Auth routes
  app.post('/api/auth/register', createAccountLimiter, async (req, res) => {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { user, token } = await authService.register(value);
      res.status(201).json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { user, token } = await authService.login(value.email, value.password);
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await userService.getUserProfile(req.user.id);
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  // User routes
  app.put('/api/users/profile', authenticateToken, async (req: any, res) => {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/users/doctors', authenticateToken, async (req: any, res) => {
    try {
      const doctors = await userService.getDoctors();
      res.json(doctors.map(doctor => ({ ...doctor, password: undefined })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Opportunity routes
  app.post('/api/opportunities', authenticateToken, async (req: any, res) => {
    try {
      const { error, value } = opportunitySchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const opportunity = await opportunityService.createOpportunity(req.user.id, value);
      res.status(201).json(opportunity);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/opportunities', authenticateToken, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const opportunities = await opportunityService.getOpportunities(limit, offset);
      res.json(opportunities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/opportunities/search', authenticateToken, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Search query required' });
      }
      const opportunities = await opportunityService.searchOpportunities(query);
      res.json(opportunities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/opportunities/:id/match', authenticateToken, async (req: any, res) => {
    try {
      const match = await opportunityService.matchUserToOpportunity(req.user.id, req.params.id);
      res.status(201).json(match);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/matches', authenticateToken, async (req: any, res) => {
    try {
      const matches = await opportunityService.getUserMatches(req.user.id);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Patient routes
  app.post('/api/patients', authenticateToken, requireRole('doctor', 'nurse'), async (req: any, res) => {
    try {
      const { error, value } = patientSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const patient = await patientService.createPatient(req.user.id, value);
      res.status(201).json(patient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/patients', authenticateToken, requireRole('doctor', 'nurse', 'admin'), async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const patients = await patientService.getPatients(limit, offset);
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/patients/search', authenticateToken, requireRole('doctor', 'nurse', 'admin'), async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Search query required' });
      }
      const patients = await patientService.searchPatients(query);
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/patients/:id', authenticateToken, requireRole('doctor', 'nurse', 'admin'), async (req: any, res) => {
    try {
      const hasAccess = await patientService.hasAccess(req.user.id, req.params.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this patient record' });
      }

      const patient = await patientService.getPatient(req.params.id, req.user.id);
      res.json(patient);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  app.put('/api/patients/:id', authenticateToken, requireRole('doctor', 'nurse'), async (req: any, res) => {
    try {
      const hasAccess = await patientService.hasAccess(req.user.id, req.params.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this patient record' });
      }

      // Validate request body
      const { error, value } = patientSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const patient = await patientService.updatePatient(req.params.id, req.user.id, value);
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Message routes
  app.post('/api/messages', authenticateToken, async (req: any, res) => {
    try {
      const { error, value } = messageSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const message = await messageService.sendMessage(req.user.id, value.receiverId, value.content);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/messages', authenticateToken, async (req: any, res) => {
    try {
      const messages = await messageService.getUserMessages(req.user.id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/messages/conversation/:userId', authenticateToken, async (req: any, res) => {
    try {
      const messages = await messageService.getConversation(req.user.id, req.params.userId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/messages/:id/read', authenticateToken, async (req: any, res) => {
    try {
      const result = await messageService.markAsRead(req.params.id, req.user.id);
      res.json({ success: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/messages/unread/count', authenticateToken, async (req: any, res) => {
    try {
      const count = await messageService.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin/Stats routes
  app.get('/api/admin/stats', authenticateToken, requireRole('admin'), async (req: any, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Video call routes
  app.post('/api/video-calls', authenticateToken, async (req: any, res) => {
    try {
      const { error, value } = videoCallSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const videoCall = await videoCallService.createVideoCall(
        req.user.id,
        value.participantId,
        value.title,
        value.purpose,
        value.scheduledAt
      );
      res.status(201).json(videoCall);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/video-calls', authenticateToken, async (req: any, res) => {
    try {
      const videoCalls = await videoCallService.getUserVideoCalls(req.user.id);
      res.json(videoCalls);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/video-calls/:id', authenticateToken, async (req: any, res) => {
    try {
      const videoCall = await videoCallService.getVideoCall(req.params.id);
      if (!videoCall) {
        return res.status(404).json({ message: 'Video call not found' });
      }
      
      // Only participants can view the call details
      if (videoCall.initiatorId !== req.user.id && videoCall.participantId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(videoCall);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/video-calls/:id/start', authenticateToken, async (req: any, res) => {
    try {
      const videoCall = await videoCallService.startCall(req.params.id, req.user.id);
      res.json(videoCall);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/video-calls/:id/end', authenticateToken, async (req: any, res) => {
    try {
      const { error, value } = endCallSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const videoCall = await videoCallService.endCall(
        req.params.id,
        req.user.id,
        value.duration,
        value.notes
      );
      res.json(videoCall);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/video-calls/:id/cancel', authenticateToken, async (req: any, res) => {
    try {
      const videoCall = await videoCallService.cancelCall(req.params.id, req.user.id);
      res.json(videoCall);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Resident routes - Learning modules
  app.get('/api/residents/learning/modules', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const modules = await storage.getLearningModules();
      res.json(modules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/residents/learning/modules/:id', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const module = await storage.getLearningModule(req.params.id);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }
      res.json(module);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Case studies
  app.get('/api/residents/learning/case-studies', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const caseStudies = await storage.getCaseStudies();
      res.json(caseStudies);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/residents/learning/case-studies/:id', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const caseStudy = await storage.getCaseStudy(req.params.id);
      if (!caseStudy) {
        return res.status(404).json({ message: 'Case study not found' });
      }
      res.json(caseStudy);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Learning paths
  app.get('/api/residents/learning/paths', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const paths = await storage.getLearningPaths();
      res.json(paths);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rotations
  app.get('/api/rotations/available', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const rotations = await storage.getAvailableRotations();
      res.json(rotations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/rotations/apply', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const { error, value } = rotationApplicationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      // Check for duplicate application
      const existingApplications = await storage.getRotationApplicationsByResident(req.user.id);
      const duplicateApplication = existingApplications.find(a => a.rotationId === value.rotationId && a.status === 'pending');
      if (duplicateApplication) {
        return res.status(400).json({ message: 'You already have a pending application for this rotation' });
      }

      const application = await storage.applyForRotation({
        ...value,
        residentId: req.user.id
      });
      res.status(201).json(application);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/rotations/my-applications', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const applications = await storage.getRotationApplicationsByResident(req.user.id);
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mentorship
  app.get('/api/mentors/available', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const mentors = await storage.getAvailableMentors();
      res.json(mentors.map(mentor => ({ ...mentor, password: undefined })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/mentors/:id/request', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const { error, value } = mentorshipRequestSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      // Check for duplicate request
      const existingRequests = await storage.getMentorshipRequestsByResident(req.user.id);
      const duplicateRequest = existingRequests.find(r => r.mentorId === req.params.id && r.status === 'pending');
      if (duplicateRequest) {
        return res.status(400).json({ message: 'You already have a pending request to this mentor' });
      }

      const request = await storage.requestMentorship({
        mentorId: req.params.id,
        residentId: req.user.id,
        message: value.message,
        expectedDuration: value.expectedDuration,
        goals: value.goals
      });
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/mentorships/my-requests', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const requests = await storage.getMentorshipRequestsByResident(req.user.id);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/mentorships/active', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const mentorships = await storage.getActiveMentorshipsByResident(req.user.id);
      res.json(mentorships);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Progress tracking
  app.get('/api/residents/progress', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const progress = await storage.getResidentProgress(req.user.id);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/residents/progress', authenticateToken, requireRole('resident'), async (req: any, res) => {
    try {
      const { error, value } = progressUpdateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const progress = await storage.updateProgress({
        ...value,
        residentId: req.user.id
      });
      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebRTC signaling service
  const signaling = new WebRTCSignalingService(httpServer);
  
  return httpServer;
}
