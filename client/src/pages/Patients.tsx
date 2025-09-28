import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Eye, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import PatientRecordModal from '@/components/PatientRecordModal';

export default function Patients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOnline, storeOfflineData } = useOfflineStorage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['/api/patients'],
    enabled: user?.role !== undefined,
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/patients/search', { q: searchQuery }],
    enabled: !!searchQuery && searchQuery.length > 2,
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!isOnline) {
        const offlineId = storeOfflineData('patient', data);
        toast({
          title: 'Saved Offline',
          description: 'Patient record saved locally and will sync when online',
        });
        return { id: offlineId, ...data, offline: true };
      }
      const response = await apiRequest('POST', '/api/patients', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (!data.offline) {
        queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
        toast({
          title: 'Success',
          description: 'Patient record created successfully',
        });
      }
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create patient record',
        variant: 'destructive',
      });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!isOnline) {
        storeOfflineData('patient', { ...data, id, _action: 'update' });
        toast({
          title: 'Saved Offline',
          description: 'Patient record updated locally and will sync when online',
        });
        return { id, ...data, offline: true };
      }
      const response = await apiRequest('PUT', `/api/patients/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      if (!data.offline) {
        queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
        toast({
          title: 'Success',
          description: 'Patient record updated successfully',
        });
      }
      setSelectedPatient(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update patient record',
        variant: 'destructive',
      });
    },
  });

  const viewPatientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('GET', `/api/patients/${id}`, undefined);
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedPatient(data);
      setIsViewModalOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load patient record',
        variant: 'destructive',
      });
    },
  });

  const handleCreatePatient = (patientData: any) => {
    createPatientMutation.mutate(patientData);
  };

  const handleUpdatePatient = (patientData: any) => {
    if (selectedPatient) {
      updatePatientMutation.mutate({ id: selectedPatient.id, data: patientData });
    }
  };

  const handleViewPatient = (patient: any) => {
    if (isOnline) {
      viewPatientMutation.mutate(patient.id);
    } else {
      setSelectedPatient(patient);
      setIsViewModalOpen(true);
    }
  };

  const handleEditPatient = (patient: any) => {
    setSelectedPatient(patient);
  };

  const displayPatients = searchQuery && searchResults ? searchResults : patients || [];

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'destructive';
      case 'urgent':
        return 'default';
      case 'routine':
      default:
        return 'secondary';
    }
  };

  const getPriorityClassName = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'priority-emergency';
      case 'urgent':
        return 'priority-urgent';
      case 'routine':
      default:
        return 'priority-routine';
    }
  };

  // Check if user has permission to view patients
  if (user?.role !== 'doctor' && user?.role !== 'nurse' && user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              You do not have permission to access patient records.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold">Patient Records</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-patients"
            />
          </div>
          {(user?.role === 'doctor' || user?.role === 'nurse') && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-patient">
                  <Plus className="mr-2 h-4 w-4" />
                  New Record
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Patient Record</DialogTitle>
                </DialogHeader>
                <PatientRecordModal
                  onSubmit={handleCreatePatient}
                  onCancel={() => setIsCreateModalOpen(false)}
                  isLoading={createPatientMutation.isPending}
                  isOffline={!isOnline}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!isOnline && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-700">
                Working offline - Records will sync when connection is restored
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading || isSearching ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="loading-skeleton h-16"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="px-6 py-3">Patient ID</TableHead>
                    <TableHead className="px-6 py-3">Name</TableHead>
                    <TableHead className="px-6 py-3">Last Visit</TableHead>
                    <TableHead className="px-6 py-3">Priority</TableHead>
                    <TableHead className="px-6 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPatients.map((patient: any) => (
                    <TableRow 
                      key={patient.id} 
                      className="hover:bg-accent/50"
                      data-testid={`patient-row-${patient.id}`}
                    >
                      <TableCell className="px-6 py-4 font-medium">
                        {patient.patientId}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {patient.fullName}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground">
                        {patient.lastVisit 
                          ? new Date(patient.lastVisit).toLocaleDateString()
                          : 'No visits'
                        }
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge 
                          variant={getPriorityBadgeVariant(patient.priority)}
                          className={getPriorityClassName(patient.priority)}
                        >
                          {patient.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewPatient(patient)}
                            disabled={viewPatientMutation.isPending}
                            data-testid={`button-view-patient-${patient.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(user?.role === 'doctor' || user?.role === 'nurse') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditPatient(patient)}
                              data-testid={`button-edit-patient-${patient.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {displayPatients.length === 0 && !isLoading && (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No patients found matching your search.' : 'No patient records found.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Patient Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Patient Record - {selectedPatient?.fullName}
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Patient Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>ID:</strong> {selectedPatient.patientId}</div>
                    <div><strong>Name:</strong> {selectedPatient.fullName}</div>
                    <div><strong>Date of Birth:</strong> {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'Not specified'}</div>
                    <div><strong>Gender:</strong> {selectedPatient.gender || 'Not specified'}</div>
                    <div><strong>Contact:</strong> {selectedPatient.contactNumber || 'Not specified'}</div>
                    <div><strong>Priority:</strong> 
                      <Badge 
                        variant={getPriorityBadgeVariant(selectedPatient.priority)}
                        className={`ml-2 ${getPriorityClassName(selectedPatient.priority)}`}
                      >
                        {selectedPatient.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Medical Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Last Visit:</strong> {selectedPatient.lastVisit ? new Date(selectedPatient.lastVisit).toLocaleDateString() : 'No visits'}</div>
                    <div><strong>Status:</strong> {selectedPatient.status}</div>
                  </div>
                </div>
              </div>
              
              {selectedPatient.medicalHistory && (
                <div>
                  <h4 className="font-medium mb-2">Medical History</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {selectedPatient.medicalHistory}
                  </p>
                </div>
              )}
              
              {selectedPatient.currentCondition && (
                <div>
                  <h4 className="font-medium mb-2">Current Condition</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {selectedPatient.currentCondition}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog open={!!selectedPatient && !isViewModalOpen} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Patient Record - {selectedPatient?.fullName}
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <PatientRecordModal
              patient={selectedPatient}
              onSubmit={handleUpdatePatient}
              onCancel={() => setSelectedPatient(null)}
              isLoading={updatePatientMutation.isPending}
              isOffline={!isOnline}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
