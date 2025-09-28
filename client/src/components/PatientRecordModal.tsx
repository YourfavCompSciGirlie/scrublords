import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface PatientRecordModalProps {
  patient?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  isOffline: boolean;
}

export default function PatientRecordModal({ 
  patient, 
  onSubmit, 
  onCancel, 
  isLoading, 
  isOffline 
}: PatientRecordModalProps) {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: patient?.fullName || '',
    dateOfBirth: patient?.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
    gender: patient?.gender || '',
    contactNumber: patient?.contactNumber || '',
    medicalHistory: patient?.medicalHistory || '',
    currentCondition: patient?.currentCondition || '',
    assignedDoctorId: patient?.assignedDoctorId || '',
    priority: patient?.priority || 'routine'
  });

  const { data: doctors } = useQuery({
    queryKey: ['/api/users/doctors'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle date of birth conversion safely
    let dateOfBirth = null;
    if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
      const date = new Date(formData.dateOfBirth);
      if (!isNaN(date.getTime())) {
        dateOfBirth = date.toISOString();
      }
    }
    
    const submitData = {
      ...formData,
      dateOfBirth,
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patientId">Patient ID</Label>
          <Input
            id="patientId"
            value={patient?.patientId || 'Auto-generated'}
            disabled
            className="bg-muted"
            data-testid="input-patient-id"
          />
        </div>
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder="Enter patient name"
            required
            data-testid="input-patient-fullname"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            data-testid="input-patient-dob"
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => handleInputChange('gender', value)}
          >
            <SelectTrigger data-testid="select-patient-gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input
            id="contactNumber"
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => handleInputChange('contactNumber', e.target.value)}
            placeholder="+27 XX XXX XXXX"
            data-testid="input-patient-contact"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="medicalHistory">Medical History</Label>
        <Textarea
          id="medicalHistory"
          rows={4}
          value={formData.medicalHistory}
          onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
          placeholder="Previous conditions, surgeries, allergies, medications..."
          data-testid="textarea-patient-history"
        />
      </div>

      <div>
        <Label htmlFor="currentCondition">Current Condition/Diagnosis</Label>
        <Textarea
          id="currentCondition"
          rows={3}
          value={formData.currentCondition}
          onChange={(e) => handleInputChange('currentCondition', e.target.value)}
          placeholder="Current symptoms, diagnosis, treatment plan..."
          data-testid="textarea-patient-condition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assignedDoctor">Assigned Doctor</Label>
          <Select
            value={formData.assignedDoctorId}
            onValueChange={(value) => handleInputChange('assignedDoctorId', value)}
          >
            <SelectTrigger data-testid="select-assigned-doctor">
              <SelectValue placeholder="Select doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors?.map((doctor: any) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority Level</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => handleInputChange('priority', value)}
          >
            <SelectTrigger data-testid="select-patient-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <span className="text-sm text-muted-foreground">
            {isOffline ? 'Saved locally - will sync when online' : 'Will save to server'}
          </span>
        </div>
        <div className="space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel-patient"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !formData.fullName.trim()}
            data-testid="button-save-patient"
          >
            {isLoading ? 'Saving...' : (patient ? 'Update Record' : 'Save Record')}
          </Button>
        </div>
      </div>
    </form>
  );
}
