import { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Users, 
  Search,
  MapPin,
  Calendar,
  Star,
  MessageCircle,
  Video,
  Award,
  BookOpen,
  Clock,
  CheckCircle,
  UserPlus,
  Stethoscope
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface Mentor {
  id: string;
  fullName: string;
  specialty: string;
  hospital: string;
  location: string;
  yearsExperience: number;
  qualifications: string[];
  areasOfExpertise: string[];
  menteeCount: number;
  maxMentees: number;
  rating: number;
  totalReviews: number;
  bio: string;
  availability: {
    remote: boolean;
    inPerson: boolean;
    preferredMeetingFrequency: string;
    timeZone: string;
  };
  isActive: boolean;
  lastActive: string;
}

interface MentorshipRequest {
  id: string;
  mentorId: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestDate: string;
  message: string;
  expectedDuration: string;
  goals: string[];
}

interface CurrentMentorship {
  id: string;
  mentor: Mentor;
  startDate: string;
  meetingCount: number;
  nextMeeting?: string;
  status: 'active' | 'paused' | 'completed';
}

const mentorshipRequestSchema = z.object({
  message: z.string().min(50, "Message must be at least 50 characters").max(500, "Message must be less than 500 characters"),
  expectedDuration: z.string().min(1, "Please select expected duration"),
  goals: z.string().min(20, "Please describe your goals (at least 20 characters)"),
});

type MentorshipRequestFormData = z.infer<typeof mentorshipRequestSchema>;

export default function MentorshipMatching() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'current' | 'requests'>('browse');

  // Fetch available mentors
  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<Mentor[]>({
    queryKey: ['/api/residents/mentors/available'],
  });

  // Fetch current mentorships
  const { data: currentMentorships = [], isLoading: currentLoading } = useQuery<CurrentMentorship[]>({
    queryKey: ['/api/residents/mentorships/current'],
  });

  // Fetch mentorship requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery<MentorshipRequest[]>({
    queryKey: ['/api/residents/mentorships/requests'],
  });

  const requestForm = useForm<MentorshipRequestFormData>({
    resolver: zodResolver(mentorshipRequestSchema),
    defaultValues: {
      message: "",
      expectedDuration: "",
      goals: ""
    }
  });

  // Send mentorship request mutation
  const requestMutation = useMutation({
    mutationFn: async ({ mentorId, data }: { mentorId: string; data: MentorshipRequestFormData }) => {
      const response = await fetch(`/api/residents/mentors/${mentorId}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to send mentorship request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residents/mentors/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/residents/mentorships/requests'] });
      setShowRequestModal(false);
      setSelectedMentor(null);
      requestForm.reset();
      toast({
        title: "Request Sent",
        description: "Your mentorship request has been sent successfully"
      });
    }
  });

  // Filter mentors
  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.areasOfExpertise.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'all' || mentor.specialty === selectedSpecialty;
    const matchesLocation = selectedLocation === 'all' || mentor.location === selectedLocation;
    
    return matchesSearch && matchesSpecialty && matchesLocation && mentor.isActive;
  });

  // Get unique specialties and locations for filters
  const specialties = Array.from(new Set(mentors.map(m => m.specialty)));
  const locations = Array.from(new Set(mentors.map(m => m.location)));

  const handleRequestMentorship = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = (data: MentorshipRequestFormData) => {
    if (selectedMentor) {
      const goals = data.goals.split(',').map(g => g.trim()).filter(g => g.length > 0);
      requestMutation.mutate({ 
        mentorId: selectedMentor.id, 
        data: { ...data, goals: goals.join(',') }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasRequestedMentor = (mentorId: string) => {
    return requests.some(req => req.mentorId === mentorId && req.status === 'pending');
  };

  const isCurrentMentor = (mentorId: string) => {
    return currentMentorships.some(mentorship => mentorship.mentor.id === mentorId && mentorship.status === 'active');
  };

  return (
    <div className="space-y-6" data-testid="mentorship-matching">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mentorship Matching</h2>
          <p className="text-muted-foreground">Connect with experienced healthcare professionals for guidance</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg" data-testid="mentorship-tabs">
        <Button
          variant={activeTab === 'browse' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('browse')}
          data-testid="tab-browse-mentors"
        >
          Browse Mentors
        </Button>
        <Button
          variant={activeTab === 'current' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('current')}
          data-testid="tab-current-mentorships"
        >
          Current Mentorships ({currentMentorships.length})
        </Button>
        <Button
          variant={activeTab === 'requests' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('requests')}
          data-testid="tab-requests"
        >
          Requests ({requests.filter(r => r.status === 'pending').length})
        </Button>
      </div>

      {/* Browse Mentors Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card data-testid="card-search-filters">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search mentors by name, specialty, or expertise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-mentors"
                  />
                </div>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger data-testid="select-specialty">
                    <SelectValue placeholder="All Specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {specialties.map(specialty => (
                      <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger data-testid="select-location">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Mentors Grid */}
          {mentorsLoading ? (
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
              {filteredMentors.map((mentor) => {
                const hasRequested = hasRequestedMentor(mentor.id);
                const isCurrent = isCurrentMentor(mentor.id);
                const canRequest = !hasRequested && !isCurrent && mentor.menteeCount < mentor.maxMentees;

                return (
                  <Card key={mentor.id} className="hover:shadow-lg transition-shadow" data-testid={`card-mentor-${mentor.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{mentor.fullName}</CardTitle>
                          <p className="text-muted-foreground">{mentor.specialty}</p>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{mentor.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground ml-1">({mentor.totalReviews})</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Stethoscope className="mr-2 h-4 w-4" />
                          <span>{mentor.hospital}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="mr-2 h-4 w-4" />
                          <span>{mentor.location}</span>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Award className="mr-2 h-4 w-4" />
                          <span>{mentor.yearsExperience} years experience</span>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="mr-2 h-4 w-4" />
                          <span>{mentor.menteeCount}/{mentor.maxMentees} mentees</span>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {mentor.bio}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {mentor.areasOfExpertise.slice(0, 3).map((area, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {mentor.areasOfExpertise.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{mentor.areasOfExpertise.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {mentor.availability.remote && (
                            <div className="flex items-center">
                              <Video className="mr-1 h-3 w-3" />
                              Remote
                            </div>
                          )}
                          {mentor.availability.inPerson && (
                            <div className="flex items-center">
                              <Users className="mr-1 h-3 w-3" />
                              In-Person
                            </div>
                          )}
                        </div>

                        <div className="pt-2 space-y-2">
                          {isCurrent && (
                            <div className="flex items-center text-sm text-blue-600">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Current mentor
                            </div>
                          )}
                          
                          {hasRequested && (
                            <div className="flex items-center text-sm text-yellow-600">
                              <Clock className="mr-2 h-4 w-4" />
                              Request pending
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-profile-${mentor.id}`}>
                              <BookOpen className="mr-2 h-3 w-3" />
                              Profile
                            </Button>
                            
                            {canRequest && (
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleRequestMentorship(mentor)}
                                data-testid={`button-request-${mentor.id}`}
                              >
                                <UserPlus className="mr-2 h-3 w-3" />
                                Request
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

          {filteredMentors.length === 0 && !mentorsLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Mentors Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria to find available mentors.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Current Mentorships Tab */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          {currentMentorships.length > 0 ? (
            currentMentorships.map((mentorship) => (
              <Card key={mentorship.id} data-testid={`card-current-mentorship-${mentorship.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{mentorship.mentor.fullName}</h3>
                      <p className="text-muted-foreground">{mentorship.mentor.specialty}</p>
                      <p className="text-sm text-muted-foreground mt-1">{mentorship.mentor.hospital}</p>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium">Started</p>
                          <p className="text-sm text-muted-foreground">{new Date(mentorship.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Meetings</p>
                          <p className="text-sm text-muted-foreground">{mentorship.meetingCount} completed</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Next Meeting</p>
                          <p className="text-sm text-muted-foreground">
                            {mentorship.nextMeeting ? new Date(mentorship.nextMeeting).toLocaleDateString() : 'Not scheduled'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(mentorship.status)}>
                        {mentorship.status}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-message-mentor-${mentorship.id}`}>
                          <MessageCircle className="mr-2 h-3 w-3" />
                          Message
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-schedule-meeting-${mentorship.id}`}>
                          <Calendar className="mr-2 h-3 w-3" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Mentorships</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active mentorships yet. Browse mentors to get started.
                </p>
                <Button onClick={() => setActiveTab('browse')} data-testid="button-browse-mentors">
                  Browse Mentors
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length > 0 ? (
            requests.map((request) => {
              const mentor = mentors.find(m => m.id === request.mentorId);
              return (
                <Card key={request.id} data-testid={`card-request-${request.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{mentor?.fullName || 'Unknown Mentor'}</h3>
                        <p className="text-muted-foreground">{mentor?.specialty}</p>
                        
                        <div className="mt-4 space-y-2">
                          <div>
                            <p className="text-sm font-medium">Request Date</p>
                            <p className="text-sm text-muted-foreground">{new Date(request.requestDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Expected Duration</p>
                            <p className="text-sm text-muted-foreground">{request.expectedDuration}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Message</p>
                            <p className="text-sm text-muted-foreground">{request.message}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Requests</h3>
                <p className="text-muted-foreground">
                  You haven't sent any mentorship requests yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Mentorship Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-[600px]" data-testid="modal-request-mentorship">
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            <DialogDescription>
              {selectedMentor && (
                <>Send a mentorship request to {selectedMentor.fullName}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <Form {...requestForm}>
            <form onSubmit={requestForm.handleSubmit(handleSubmitRequest)} className="space-y-4">
              {selectedMentor && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">{selectedMentor.fullName}</h4>
                  <p className="text-sm text-muted-foreground">{selectedMentor.specialty} at {selectedMentor.hospital}</p>
                  <p className="text-sm">
                    <strong>Availability:</strong> {selectedMentor.availability.preferredMeetingFrequency}
                  </p>
                </div>
              )}

              <FormField
                control={requestForm.control}
                name="expectedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-duration">
                          <SelectValue placeholder="How long do you expect this mentorship to last?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3-months">3 months</SelectItem>
                        <SelectItem value="6-months">6 months</SelectItem>
                        <SelectItem value="1-year">1 year</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={requestForm.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Goals</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What do you hope to learn or achieve through this mentorship? (separate multiple goals with commas)"
                        className="min-h-[80px]"
                        data-testid="textarea-goals"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={requestForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Introduce yourself and explain why you'd like this person as your mentor..."
                        className="min-h-[120px]"
                        data-testid="textarea-message"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={requestMutation.isPending}
                  data-testid="button-send-request"
                >
                  {requestMutation.isPending ? "Sending..." : "Send Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}