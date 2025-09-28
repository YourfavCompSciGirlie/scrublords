import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Award, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Stethoscope
} from "lucide-react";
import { Link } from "wouter";

interface Rotation {
  id: string;
  department: string;
  supervisor: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'current' | 'completed';
  progress?: number;
}

interface Mentor {
  id: string;
  name: string;
  specialty: string;
  meetings: number;
  nextMeeting?: string;
}

interface LearningModule {
  id: string;
  title: string;
  category: string;
  progress: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface SkillAssessment {
  id: string;
  skill: string;
  level: number;
  maxLevel: number;
  lastAssessed: string;
  trend: 'up' | 'down' | 'stable';
}

export default function ResidentDashboard() {
  const { user } = useAuth();

  // Fetch resident-specific data
  const { data: rotations = [], isLoading: rotationsLoading } = useQuery<Rotation[]>({
    queryKey: ['/api/residents/rotations'],
  });

  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<Mentor[]>({
    queryKey: ['/api/residents/mentors'],
  });

  const { data: learningModules = [], isLoading: modulesLoading } = useQuery<LearningModule[]>({
    queryKey: ['/api/residents/learning/modules'],
  });

  const { data: skillAssessments = [], isLoading: skillsLoading } = useQuery<SkillAssessment[]>({
    queryKey: ['/api/residents/skills'],
  });

  const currentRotation = rotations.find(r => r.status === 'current');
  const upcomingRotations = rotations.filter(r => r.status === 'upcoming').slice(0, 3);
  const completedRotations = rotations.filter(r => r.status === 'completed').length;

  const overallProgress = learningModules.length > 0 
    ? Math.round(learningModules.reduce((sum, module) => sum + module.progress, 0) / learningModules.length)
    : 0;

  const urgentModules = learningModules.filter(m => m.priority === 'high' && m.progress < 100);

  return (
    <div className="space-y-6" data-testid="resident-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resident Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user?.fullName}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Link href="/learning-resources">
            <Button variant="outline" data-testid="button-learning-resources">
              <BookOpen className="mr-2 h-4 w-4" />
              Learning Resources
            </Button>
          </Link>
          <Link href="/mentorship">
            <Button data-testid="button-find-mentor">
              <Users className="mr-2 h-4 w-4" />
              Find Mentor
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-overall-progress">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-rotations">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <Stethoscope className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Completed Rotations</p>
                <p className="text-2xl font-bold">{completedRotations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-mentors">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Active Mentors</p>
                <p className="text-2xl font-bold">{mentors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-urgent-tasks">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Urgent Tasks</p>
                <p className="text-2xl font-bold">{urgentModules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Rotation & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Rotation */}
        <Card data-testid="card-current-rotation">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Current Rotation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentRotation ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{currentRotation.department}</h3>
                  <p className="text-muted-foreground">Supervisor: {currentRotation.supervisor}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{currentRotation.progress || 0}%</span>
                  </div>
                  <Progress value={currentRotation.progress || 0} className="h-2" />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Started: {new Date(currentRotation.startDate).toLocaleDateString()}</span>
                  <span>Ends: {new Date(currentRotation.endDate).toLocaleDateString()}</span>
                </div>
                <Link href="/rotations">
                  <Button className="w-full" data-testid="button-view-rotation-details">
                    View Rotation Details
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active rotation</p>
                <Link href="/rotations">
                  <Button className="mt-4" data-testid="button-browse-rotations">
                    Browse Available Rotations
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Urgent Learning Modules */}
        <Card data-testid="card-urgent-modules">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Urgent Learning Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentModules.length > 0 ? (
              <div className="space-y-3">
                {urgentModules.slice(0, 3).map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{module.title}</h4>
                      <p className="text-sm text-muted-foreground">{module.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={module.progress} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground">{module.progress}%</span>
                      </div>
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      Due {new Date(module.dueDate).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
                <Link href="/learning-resources">
                  <Button variant="outline" className="w-full" data-testid="button-view-all-modules">
                    View All Learning Modules
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">All urgent tasks completed!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Rotations & Recent Mentorship */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Rotations */}
        <Card data-testid="card-upcoming-rotations">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Upcoming Rotations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRotations.length > 0 ? (
              <div className="space-y-3">
                {upcomingRotations.map((rotation) => (
                  <div key={rotation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{rotation.department}</h4>
                      <p className="text-sm text-muted-foreground">with {rotation.supervisor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(rotation.startDate).toLocaleDateString()}
                      </p>
                      <Badge variant="outline">
                        {Math.ceil((new Date(rotation.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link href="/rotations">
                  <Button variant="outline" className="w-full" data-testid="button-manage-rotations">
                    Manage Rotations
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming rotations scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Mentorships */}
        <Card data-testid="card-active-mentorships">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Active Mentorships
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mentors.length > 0 ? (
              <div className="space-y-3">
                {mentors.slice(0, 3).map((mentor) => (
                  <div key={mentor.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{mentor.name}</h4>
                      <p className="text-sm text-muted-foreground">{mentor.specialty}</p>
                      <p className="text-xs text-muted-foreground">{mentor.meetings} meetings completed</p>
                    </div>
                    <div className="text-right">
                      {mentor.nextMeeting && (
                        <Badge variant="outline">
                          Next: {new Date(mentor.nextMeeting).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                <Link href="/mentorship">
                  <Button variant="outline" className="w-full" data-testid="button-manage-mentorships">
                    Manage Mentorships
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active mentorships</p>
                <Link href="/mentorship">
                  <Button className="mt-4" data-testid="button-find-first-mentor">
                    Find Your First Mentor
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skills Progress */}
      <Card data-testid="card-skills-progress">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-5 w-5" />
            Skills Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {skillAssessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillAssessments.slice(0, 6).map((skill) => (
                <div key={skill.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.skill}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{skill.level}/{skill.maxLevel}</span>
                      {skill.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {skill.trend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 transform rotate-180" />}
                    </div>
                  </div>
                  <Progress value={(skill.level / skill.maxLevel) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No skill assessments completed yet</p>
              <Button className="mt-4" data-testid="button-start-assessment">
                Start First Assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}