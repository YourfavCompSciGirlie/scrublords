import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { VideoIcon, CalendarIcon, ClockIcon, UserIcon, PhoneIcon, PhoneOffIcon, PlayIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import VideoCallRoom from "@/components/VideoCallRoom";

// Types
interface VideoCall {
  id: string;
  title: string;
  initiatorId: string;
  participantId: string;
  roomId: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  purpose: 'consultation' | 'mentorship' | 'meeting' | 'training';
  notes?: string;
  createdAt: string;
}

interface User {
  id: string;
  fullName: string;
  role: string;
}

const videoCallSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  participantId: z.string().min(1, "Please select a participant"),
  purpose: z.enum(["consultation", "mentorship", "meeting", "training"]),
  scheduledAt: z.string().optional()
});

type VideoCallFormData = z.infer<typeof videoCallSchema>;

const endCallSchema = z.object({
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  notes: z.string().max(1000).optional()
});

type EndCallFormData = z.infer<typeof endCallSchema>;

export default function VideoCalls() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEndCallModalOpen, setIsEndCallModalOpen] = useState(false);
  const [isVideoRoomOpen, setIsVideoRoomOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<VideoCall | null>(null);
  const { toast } = useToast();

  // Fetch video calls
  const { data: videoCalls = [], isLoading: isLoadingCalls } = useQuery<VideoCall[]>({
    queryKey: ['/api/video-calls'],
  });

  // Fetch available users for video calls
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users/doctors'],
  });

  const form = useForm<VideoCallFormData>({
    resolver: zodResolver(videoCallSchema),
    defaultValues: {
      title: "",
      participantId: "",
      purpose: "consultation"
    }
  });

  const endCallForm = useForm<EndCallFormData>({
    resolver: zodResolver(endCallSchema),
    defaultValues: {
      duration: 1,
      notes: ""
    }
  });

  // Create video call mutation
  const createVideoCallMutation = useMutation({
    mutationFn: async (data: VideoCallFormData) => {
      const response = await fetch('/api/video-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...data,
          scheduledAt: data.scheduledAt || new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-calls'] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Video call scheduled successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule video call",
        variant: "destructive"
      });
    }
  });

  // Start call mutation
  const startCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      const response = await fetch(`/api/video-calls/${callId}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-calls'] });
      toast({
        title: "Call Started",
        description: "Video call is now active"
      });
    }
  });

  // End call mutation
  const endCallMutation = useMutation({
    mutationFn: async ({ callId, data }: { callId: string; data: EndCallFormData }) => {
      const response = await fetch(`/api/video-calls/${callId}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-calls'] });
      setIsEndCallModalOpen(false);
      setSelectedCall(null);
      endCallForm.reset();
      toast({
        title: "Call Ended",
        description: "Video call ended successfully"
      });
    }
  });

  // Cancel call mutation
  const cancelCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      const response = await fetch(`/api/video-calls/${callId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-calls'] });
      toast({
        title: "Call Cancelled",
        description: "Video call cancelled successfully"
      });
    }
  });

  const handleCreateCall = (data: VideoCallFormData) => {
    createVideoCallMutation.mutate(data);
  };

  const handleStartCall = (call: VideoCall) => {
    startCallMutation.mutate(call.id, {
      onSuccess: () => {
        setSelectedCall(call);
        setIsVideoRoomOpen(true);
      }
    });
  };

  const handleJoinCall = (call: VideoCall) => {
    setSelectedCall(call);
    setIsVideoRoomOpen(true);
  };

  const handleEndCall = (data: EndCallFormData) => {
    if (selectedCall) {
      endCallMutation.mutate({ callId: selectedCall.id, data });
    }
  };

  const handleVideoRoomEndCall = () => {
    if (selectedCall) {
      setIsEndCallModalOpen(true);
    }
  };

  const handleVideoRoomClose = () => {
    setIsVideoRoomOpen(false);
    setSelectedCall(null);
  };

  const handleCancelCall = (call: VideoCall) => {
    cancelCallMutation.mutate(call.id);
  };

  const getStatusBadge = (status: VideoCall['status']) => {
    const variants: Record<VideoCall['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'outline',
      active: 'default',
      ended: 'secondary',
      cancelled: 'destructive'
    };
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPurposeBadge = (purpose: VideoCall['purpose']) => {
    const colors: Record<VideoCall['purpose'], string> = {
      consultation: 'bg-blue-100 text-blue-800',
      mentorship: 'bg-green-100 text-green-800',
      meeting: 'bg-purple-100 text-purple-800',
      training: 'bg-orange-100 text-orange-800'
    };
    
    return <Badge className={colors[purpose]}>{purpose}</Badge>;
  };

  if (isLoadingCalls) {
    return <div className="p-6">Loading video calls...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Video Calls</h1>
          <p className="text-muted-foreground">
            Schedule and manage video consultations and meetings
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-schedule-call">
              <VideoIcon className="h-4 w-4 mr-2" />
              Schedule Call
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Video Call</DialogTitle>
              <DialogDescription>
                Schedule a new video call with a healthcare professional
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateCall)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Title</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-call-title"
                          placeholder="e.g., Weekly check-in with Dr. Smith" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participant</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-participant">
                            <SelectValue placeholder="Select a healthcare professional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.fullName} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-purpose">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="mentorship">Mentorship</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Time (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-scheduled-time"
                          type="datetime-local" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    data-testid="button-create-call"
                    type="submit" 
                    disabled={createVideoCallMutation.isPending}
                  >
                    {createVideoCallMutation.isPending ? "Scheduling..." : "Schedule Call"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {videoCalls.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <VideoIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No video calls scheduled</h3>
              <p className="text-muted-foreground text-center">
                Schedule your first video call to start consulting with healthcare professionals
              </p>
            </CardContent>
          </Card>
        ) : (
          videoCalls.map((call: VideoCall) => (
            <Card key={call.id} data-testid={`card-video-call-${call.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <VideoIcon className="h-5 w-5" />
                      {call.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {new Date(call.scheduledAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {new Date(call.scheduledAt).toLocaleTimeString()}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(call.status)}
                    {getPurposeBadge(call.purpose)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {call.duration && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Duration: {call.duration} minutes
                  </p>
                )}
                
                {call.notes && (
                  <p className="text-sm mb-4 p-3 bg-muted rounded-md">
                    <strong>Notes:</strong> {call.notes}
                  </p>
                )}

                <div className="flex gap-2">
                  {call.status === 'scheduled' && (
                    <>
                      <Button 
                        data-testid={`button-start-call-${call.id}`}
                        onClick={() => handleStartCall(call)}
                        disabled={startCallMutation.isPending}
                      >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Start Call
                      </Button>
                      <Button 
                        data-testid={`button-cancel-call-${call.id}`}
                        variant="outline" 
                        onClick={() => handleCancelCall(call)}
                        disabled={cancelCallMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  
                  {call.status === 'active' && (
                    <>
                      <Button 
                        data-testid={`button-join-call-${call.id}`}
                        onClick={() => handleJoinCall(call)}
                      >
                        <VideoIcon className="h-4 w-4 mr-2" />
                        Join Call
                      </Button>
                      <Button 
                        data-testid={`button-end-call-${call.id}`}
                        variant="destructive"
                        onClick={() => {
                          setSelectedCall(call);
                          setIsEndCallModalOpen(true);
                        }}
                      >
                        <PhoneOffIcon className="h-4 w-4 mr-2" />
                        End Call
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* End Call Modal */}
      <Dialog open={isEndCallModalOpen} onOpenChange={setIsEndCallModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>End Video Call</DialogTitle>
            <DialogDescription>
              Please provide the call duration and any notes
            </DialogDescription>
          </DialogHeader>
          
          <Form {...endCallForm}>
            <form onSubmit={endCallForm.handleSubmit(handleEndCall)} className="space-y-4">
              <FormField
                control={endCallForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-call-duration"
                        type="number" 
                        min="1"
                        placeholder="e.g., 30" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={endCallForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="textarea-call-notes"
                        placeholder="Add any notes about the call..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEndCallModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  data-testid="button-save-end-call"
                  type="submit" 
                  disabled={endCallMutation.isPending}
                >
                  {endCallMutation.isPending ? "Ending..." : "End Call"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Video Call Room */}
      {selectedCall && (
        <VideoCallRoom
          videoCall={selectedCall}
          isOpen={isVideoRoomOpen}
          onClose={handleVideoRoomClose}
          onEndCall={handleVideoRoomEndCall}
        />
      )}
    </div>
  );
}