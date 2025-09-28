import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Stethoscope
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface Rotation {
  id: string;
  department: string;
  specialty: string;
  supervisor: string;
  supervisorId: string;
  hospitalName: string;
  location: string;
  startDate: string;
  endDate: string;
  duration: number; // weeks
  status: 'available' | 'applied' | 'accepted' | 'current' | 'completed' | 'cancelled';
  description: string;
  requirements: string[];
  maxResidents: number;
  currentResidents: number;
  applicationDeadline: string;
  isElective: boolean;
  credits: number;
}

interface Application {
  id: string;
  rotationId: string;
  status: 'pending' | 'accepted' | 'rejected';
  applicationDate: string;
  statement: string;
}

const applicationSchema = z.object({
  statement: z.string().min(100, "Personal statement must be at least 100 characters").max(1000, "Personal statement must be less than 1000 characters"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function TrainingRotations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedRotation, setSelectedRotation] = useState<Rotation | null>(null);

  // Fetch rotations
  const { data: rotations = [], isLoading: rotationsLoading } = useQuery<Rotation[]>({
    queryKey: ['/api/residents/rotations/available'],
  });

  // Fetch my applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['/api/residents/applications'],
  });

  const applicationForm = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      statement: ""
    }
  });

  // Apply for rotation mutation
  const applyMutation = useMutation({
    mutationFn: async ({ rotationId, data }: { rotationId: string; data: ApplicationFormData }) => {
      const response = await fetch(`/api/residents/rotations/${rotationId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to submit application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residents/rotations/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/residents/applications'] });
      setShowApplicationModal(false);
      setSelectedRotation(null);
      applicationForm.reset();
      toast({
        title: "Application Submitted",
        description: "Your rotation application has been submitted successfully"
      });
    }
  });

  // Filter rotations
  const filteredRotations = rotations.filter(rotation => {
    const matchesSearch = rotation.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rotation.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rotation.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || rotation.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || rotation.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Get unique departments for filter
  const departments = Array.from(new Set(rotations.map(r => r.department)));

  const handleApply = (rotation: Rotation) => {
    setSelectedRotation(rotation);
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = (data: ApplicationFormData) => {
    if (selectedRotation) {
      applyMutation.mutate({ rotationId: selectedRotation.id, data });
    }
  };

  const getStatusColor = (status: Rotation['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-purple-100 text-purple-800';
      case 'current': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationStatus = (rotationId: string) => {
    return applications.find(app => app.rotationId === rotationId);
  };

  const isApplicationDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  return (
    <div className="space-y-6" data-testid="training-rotations">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Training Rotations</h2>
          <p className="text-muted-foreground">Find and apply for clinical training rotations</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button data-testid="button-view-my-rotations">
            <Calendar className="mr-2 h-4 w-4" />
            My Rotations
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card data-testid="card-search-filters">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search rotations by department, specialty, or hospital..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-rotations"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger data-testid="select-department">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rotations Grid */}
      {rotationsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRotations.map((rotation) => {
            const application = getApplicationStatus(rotation.id);
            const deadlinePassed = isApplicationDeadlinePassed(rotation.applicationDeadline);
            const canApply = !application && !deadlinePassed && rotation.status === 'available';

            return (
              <Card key={rotation.id} className="hover:shadow-lg transition-shadow" data-testid={`card-rotation-${rotation.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{rotation.department}</CardTitle>
                      <p className="text-muted-foreground">{rotation.specialty}</p>
                    </div>
                    <Badge className={getStatusColor((application?.status as any) || rotation.status)}>
                      {application ? application.status : rotation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Stethoscope className="mr-2 h-4 w-4" />
                      <span>Supervisor: {rotation.supervisor}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>{rotation.hospitalName}, {rotation.location}</span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{new Date(rotation.startDate).toLocaleDateString()} - {new Date(rotation.endDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>{rotation.duration} weeks • {rotation.credits} credits</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        <span>{rotation.currentResidents}/{rotation.maxResidents} residents</span>
                      </div>
                      {rotation.isElective && (
                        <Badge variant="outline">Elective</Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Capacity</span>
                        <span>{Math.round((rotation.currentResidents / rotation.maxResidents) * 100)}%</span>
                      </div>
                      <Progress value={(rotation.currentResidents / rotation.maxResidents) * 100} className="h-2" />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {rotation.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {rotation.requirements.slice(0, 3).map((req, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                      {rotation.requirements.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{rotation.requirements.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="pt-2 space-y-2">
                      {deadlinePassed && !application && (
                        <div className="flex items-center text-sm text-red-600">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Application deadline passed
                        </div>
                      )}
                      
                      {application && (
                        <div className="flex items-center text-sm text-blue-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Application {application.status}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-details-${rotation.id}`}>
                          <BookOpen className="mr-2 h-3 w-3" />
                          Details
                        </Button>
                        
                        {canApply && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleApply(rotation)}
                            data-testid={`button-apply-${rotation.id}`}
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredRotations.length === 0 && !rotationsLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rotations Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Application Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="sm:max-w-[600px]" data-testid="modal-apply-rotation">
          <DialogHeader>
            <DialogTitle>Apply for Rotation</DialogTitle>
            <DialogDescription>
              {selectedRotation && (
                <>Apply for the {selectedRotation.department} rotation at {selectedRotation.hospitalName}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...applicationForm}>
            <form onSubmit={applicationForm.handleSubmit(handleSubmitApplication)} className="space-y-4">
              {selectedRotation && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">{selectedRotation.department} - {selectedRotation.specialty}</h4>
                  <p className="text-sm text-muted-foreground">{selectedRotation.hospitalName}</p>
                  <p className="text-sm">
                    <strong>Duration:</strong> {selectedRotation.duration} weeks 
                    ({new Date(selectedRotation.startDate).toLocaleDateString()} - {new Date(selectedRotation.endDate).toLocaleDateString()})
                  </p>
                  <p className="text-sm">
                    <strong>Application Deadline:</strong> {new Date(selectedRotation.applicationDeadline).toLocaleDateString()}
                  </p>
                </div>
              )}

              <FormField
                control={applicationForm.control}
                name="statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Statement</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain why you're interested in this rotation and what you hope to learn..."
                        className="min-h-[120px]"
                        data-testid="textarea-personal-statement"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowApplicationModal(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={applyMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}