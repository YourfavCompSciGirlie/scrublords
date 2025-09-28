import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Handshake, FileText, MessageCircle, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: user?.role === 'admin',
  });

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery({
    queryKey: ['/api/opportunities'],
  });

  const { data: recentPatients, isLoading: patientsLoading } = useQuery({
    queryKey: ['/api/patients'],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="mt-4 sm:mt-0">
          <Button variant="outline" data-testid="button-export-data">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-users">
                    {statsLoading ? '...' : stats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-md">
                  <Handshake className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Matches Made</p>
                  <p className="text-2xl font-bold" data-testid="stat-matches-made">
                    {statsLoading ? '...' : stats?.totalMatches || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-md">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Patient Records</p>
                  <p className="text-2xl font-bold" data-testid="stat-patient-records">
                    {statsLoading ? '...' : stats?.totalPatients || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-md">
                  <MessageCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Active Conversations</p>
                  <p className="text-2xl font-bold" data-testid="stat-active-conversations">
                    {statsLoading ? '...' : stats?.activeConversations || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Available Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunitiesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="loading-skeleton h-20"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {opportunities?.slice(0, 3).map((opportunity: any) => (
                  <div 
                    key={opportunity.id} 
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    data-testid={`opportunity-${opportunity.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{opportunity.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{opportunity.description}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <Badge variant={opportunity.isRemote ? "default" : "secondary"}>
                            {opportunity.isRemote ? 'Remote' : opportunity.location}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(opportunity.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" data-testid={`button-connect-${opportunity.id}`}>
                        Connect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Patient Records</CardTitle>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="loading-skeleton h-16"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentPatients?.slice(0, 5).map((patient: any) => (
                  <div 
                    key={patient.id} 
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                    data-testid={`patient-${patient.id}`}
                  >
                    <div>
                      <p className="font-medium">{patient.fullName}</p>
                      <p className="text-sm text-muted-foreground">ID: {patient.patientId}</p>
                    </div>
                    <Badge 
                      variant={patient.priority === 'urgent' ? 'destructive' : 'secondary'}
                      className={patient.priority === 'routine' ? 'priority-routine' : 
                                 patient.priority === 'urgent' ? 'priority-urgent' : 'priority-emergency'}
                    >
                      {patient.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">Welcome to Healthcare Connect</h3>
          <p className="text-muted-foreground">
            Connect with healthcare professionals, manage patient records, and access opportunities 
            across South Africa's public healthcare system. This platform works offline and syncs 
            when you're connected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
