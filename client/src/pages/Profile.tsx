import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    role: user?.role || '',
    qualifications: user?.qualifications || '',
    location: user?.location || '',
    availability: user?.availability || { remote: false, inPerson: false }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/users/profile', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Professional Profile</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                data-testid="input-profile-fullname"
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={profileData.role}
                onValueChange={(value) => setProfileData({ ...profileData, role: value })}
              >
                <SelectTrigger data-testid="select-profile-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="qualifications">Qualifications</Label>
              <Textarea
                id="qualifications"
                rows={3}
                placeholder="List your qualifications, certifications, and experience"
                value={profileData.qualifications}
                onChange={(e) => setProfileData({ ...profileData, qualifications: e.target.value })}
                data-testid="textarea-profile-qualifications"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, Province"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                data-testid="input-profile-location"
              />
            </div>

            <div>
              <Label>Availability</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote"
                    checked={profileData.availability.remote}
                    onCheckedChange={(checked) =>
                      setProfileData({
                        ...profileData,
                        availability: { ...profileData.availability, remote: !!checked }
                      })
                    }
                    data-testid="checkbox-profile-remote"
                  />
                  <Label htmlFor="remote">Remote</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inPerson"
                    checked={profileData.availability.inPerson}
                    onCheckedChange={(checked) =>
                      setProfileData({
                        ...profileData,
                        availability: { ...profileData.availability, inPerson: !!checked }
                      })
                    }
                    data-testid="checkbox-profile-inperson"
                  />
                  <Label htmlFor="inPerson">In-person</Label>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={updateProfileMutation.isPending}
              data-testid="button-update-profile"
            >
              {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={user?.username || ''} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div>
              <Label>Account Status</Label>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
