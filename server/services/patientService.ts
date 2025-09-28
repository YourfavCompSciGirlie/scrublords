import { storage } from '../storage';
import { InsertPatient, Patient } from '@shared/schema';

export class PatientService {
  async createPatient(userId: string, patientData: InsertPatient): Promise<Patient> {
    // Generate patient ID
    const patientId = `P${Date.now().toString().slice(-6)}`;
    
    const patient = await storage.createPatient({
      ...patientData,
      patientId,
      createdById: userId
    });

    // Log patient creation
    await storage.createAuditLog({
      userId,
      action: 'patient_created',
      resourceType: 'patient',
      resourceId: patient.id,
      details: { patientId: patient.patientId }
    });

    return patient;
  }

  async getPatients(limit?: number, offset?: number): Promise<Patient[]> {
    return await storage.getPatients(limit, offset);
  }

  async getPatient(id: string, userId: string): Promise<Patient> {
    const patient = await storage.getPatient(id);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Log patient access
    await storage.createAuditLog({
      userId,
      action: 'patient_accessed',
      resourceType: 'patient',
      resourceId: id
    });

    return patient;
  }

  async updatePatient(id: string, userId: string, patientData: Partial<InsertPatient>): Promise<Patient> {
    const patient = await storage.updatePatient(id, patientData);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Log patient update
    await storage.createAuditLog({
      userId,
      action: 'patient_updated',
      resourceType: 'patient',
      resourceId: id,
      details: patientData
    });

    return patient;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return await storage.searchPatients(query);
  }

  async getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
    return await storage.getPatientsByDoctor(doctorId);
  }

  async hasAccess(userId: string, patientId: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    const patient = await storage.getPatient(patientId);
    
    if (!user || !patient) {
      return false;
    }

    // Admin can access all
    if (user.role === 'admin') {
      return true;
    }

    // Doctor can access their assigned patients or patients they created
    if (user.role === 'doctor') {
      return patient.assignedDoctorId === userId || patient.createdById === userId;
    }

    // Nurse can access patients they created
    if (user.role === 'nurse') {
      return patient.createdById === userId;
    }

    return false;
  }
}

export const patientService = new PatientService();
