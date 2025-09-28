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
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Search,
  Filter,
  Play,
  CheckCircle,
  Clock,
  Star,
  Award,
  FileText,
  Video,
  Headphones,
  Users,
  TrendingUp,
  Target,
  Calendar
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'video' | 'text' | 'interactive' | 'case-study' | 'quiz' | 'audio';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  progress: number; // percentage
  isCompleted: boolean;
  rating: number;
  totalRatings: number;
  author: string;
  publishedDate: string;
  lastAccessed?: string;
  dueDate?: string;
  isRequired: boolean;
  prerequisites: string[];
  tags: string[];
  thumbnail?: string;
}

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  specialty: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  patientAge: number;
  symptoms: string[];
  diagnosis: string;
  learningObjectives: string[];
  estimatedTime: number;
  progress: number;
  isCompleted: boolean;
  rating: number;
  authorName: string;
  publishedDate: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalModules: number;
  completedModules: number;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  progress: number;
  isEnrolled: boolean;
}

export default function LearningResources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'modules' | 'case-studies' | 'paths'>('modules');
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);

  // Fetch learning modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery<LearningModule[]>({
    queryKey: ['/api/residents/learning/modules'],
  });

  // Fetch case studies
  const { data: caseStudies = [], isLoading: casesLoading } = useQuery<CaseStudy[]>({
    queryKey: ['/api/residents/learning/case-studies'],
  });

  // Fetch learning paths
  const { data: learningPaths = [], isLoading: pathsLoading } = useQuery<LearningPath[]>({
    queryKey: ['/api/residents/learning/paths'],
  });

  // Start module mutation
  const startModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const response = await fetch(`/api/residents/learning/modules/${moduleId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to start module');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residents/learning/modules'] });
      toast({
        title: "Module Started",
        description: "You can now access the learning content"
      });
    }
  });

  // Enroll in path mutation
  const enrollPathMutation = useMutation({
    mutationFn: async (pathId: string) => {
      const response = await fetch(`/api/residents/learning/paths/${pathId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to enroll in learning path');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residents/learning/paths'] });
      toast({
        title: "Enrolled Successfully",
        description: "You can now access all modules in this learning path"
      });
    }
  });

  // Filter modules
  const filteredModules = modules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesType = selectedType === 'all' || module.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || module.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesType && matchesDifficulty;
  });

  // Filter case studies
  const filteredCaseStudies = caseStudies.filter(caseStudy => {
    const matchesSearch = caseStudy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseStudy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseStudy.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = selectedDifficulty === 'all' || caseStudy.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesDifficulty;
  });

  // Get unique values for filters
  const categories = Array.from(new Set(modules.map(m => m.category)));
  const types = Array.from(new Set(modules.map(m => m.type)));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Headphones className="h-4 w-4" />;
      case 'interactive': return <Target className="h-4 w-4" />;
      case 'case-study': return <Users className="h-4 w-4" />;
      case 'quiz': return <Award className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleStartModule = (module: LearningModule) => {
    setSelectedModule(module);
    if (module.progress === 0) {
      startModuleMutation.mutate(module.id);
    }
    setShowModuleModal(true);
  };

  return (
    <div className="space-y-6" data-testid="learning-resources">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Learning Resources</h2>
          <p className="text-muted-foreground">Enhance your medical knowledge with interactive content</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="outline" data-testid="button-my-progress">
            <TrendingUp className="mr-2 h-4 w-4" />
            My Progress
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-modules-completed">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Modules Completed</p>
                <p className="text-2xl font-bold">{modules.filter(m => m.isCompleted).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-hours-learned">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Hours Learned</p>
                <p className="text-2xl font-bold">
                  {Math.round(modules.filter(m => m.isCompleted).reduce((sum, m) => sum + m.duration, 0) / 60)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-case-studies">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Case Studies</p>
                <p className="text-2xl font-bold">{caseStudies.filter(c => c.isCompleted).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-learning-paths">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-md">
                <BookOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Learning Paths</p>
                <p className="text-2xl font-bold">{learningPaths.filter(p => p.isEnrolled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg" data-testid="learning-tabs">
        <Button
          variant={activeTab === 'modules' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('modules')}
          data-testid="tab-modules"
        >
          Modules ({modules.length})
        </Button>
        <Button
          variant={activeTab === 'case-studies' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('case-studies')}
          data-testid="tab-case-studies"
        >
          Case Studies ({caseStudies.length})
        </Button>
        <Button
          variant={activeTab === 'paths' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('paths')}
          data-testid="tab-learning-paths"
        >
          Learning Paths ({learningPaths.length})
        </Button>
      </div>

      {/* Search and Filters */}
      <Card data-testid="card-search-filters">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-resources"
              />
            </div>
            
            {activeTab === 'modules' && (
              <>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger data-testid="select-difficulty">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <Card key={module.id} className="hover:shadow-lg transition-shadow" data-testid={`card-module-${module.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{module.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{module.category}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getTypeIcon(module.type)}
                    {module.isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {module.duration}m
                      </span>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {module.rating.toFixed(1)} ({module.totalRatings})
                      </span>
                    </div>
                    <Badge className={getDifficultyColor(module.difficulty)}>
                      {module.difficulty}
                    </Badge>
                  </div>

                  {module.progress > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                    </div>
                  )}

                  {module.dueDate && (
                    <div className="flex items-center text-sm text-orange-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      Due: {new Date(module.dueDate).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {module.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {module.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{module.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => handleStartModule(module)}
                    data-testid={`button-start-module-${module.id}`}
                  >
                    {module.isCompleted ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Review
                      </>
                    ) : module.progress > 0 ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Continue
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'case-studies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCaseStudies.map((caseStudy) => (
            <Card key={caseStudy.id} className="hover:shadow-lg transition-shadow" data-testid={`card-case-study-${caseStudy.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{caseStudy.title}</CardTitle>
                    <p className="text-muted-foreground">{caseStudy.specialty}</p>
                  </div>
                  <Badge className={getDifficultyColor(caseStudy.difficulty)}>
                    {caseStudy.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{caseStudy.description}</p>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Patient:</strong> {caseStudy.patientAge} years old
                    </div>
                    <div className="text-sm">
                      <strong>Symptoms:</strong> {caseStudy.symptoms.slice(0, 3).join(', ')}
                      {caseStudy.symptoms.length > 3 && ` +${caseStudy.symptoms.length - 3} more`}
                    </div>
                    <div className="text-sm">
                      <strong>Estimated Time:</strong> {caseStudy.estimatedTime} minutes
                    </div>
                  </div>

                  {caseStudy.progress > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{caseStudy.progress}%</span>
                      </div>
                      <Progress value={caseStudy.progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      {caseStudy.rating.toFixed(1)}
                    </div>
                    <Button 
                      size="sm"
                      data-testid={`button-start-case-study-${caseStudy.id}`}
                    >
                      {caseStudy.isCompleted ? 'Review' : caseStudy.progress > 0 ? 'Continue' : 'Start'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'paths' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learningPaths.map((path) => (
            <Card key={path.id} className="hover:shadow-lg transition-shadow" data-testid={`card-learning-path-${path.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                    <p className="text-muted-foreground">{path.category}</p>
                  </div>
                  <Badge className={getDifficultyColor(path.difficulty)}>
                    {path.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{path.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Modules:</span>
                      <span>{path.completedModules}/{path.totalModules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Time:</span>
                      <span>{path.estimatedHours} hours</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{path.progress}%</span>
                    </div>
                    <Progress value={path.progress} className="h-2" />
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => path.isEnrolled ? null : enrollPathMutation.mutate(path.id)}
                    disabled={!path.isEnrolled && enrollPathMutation.isPending}
                    data-testid={`button-enroll-path-${path.id}`}
                  >
                    {path.isEnrolled ? (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Continue Path
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        {enrollPathMutation.isPending ? 'Enrolling...' : 'Enroll'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Module Detail Modal */}
      <Dialog open={showModuleModal} onOpenChange={setShowModuleModal}>
        <DialogContent className="sm:max-w-[700px]" data-testid="modal-module-detail">
          <DialogHeader>
            <DialogTitle>{selectedModule?.title}</DialogTitle>
            <DialogDescription>
              {selectedModule?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedModule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Category:</span> {selectedModule.category}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {selectedModule.duration} minutes
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span> 
                  <Badge className={`ml-2 ${getDifficultyColor(selectedModule.difficulty)}`}>
                    {selectedModule.difficulty}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedModule.type}
                </div>
              </div>

              {selectedModule.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Prerequisites:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {selectedModule.prerequisites.map((prereq, index) => (
                      <li key={index}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedModule.progress !== undefined && selectedModule.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Your Progress</span>
                    <span>{selectedModule.progress}%</span>
                  </div>
                  <Progress value={selectedModule.progress} />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleModal(false)}>
              Close
            </Button>
            <Button data-testid="button-start-learning">
              <Play className="mr-2 h-4 w-4" />
              {selectedModule?.isCompleted ? 'Review Content' : (selectedModule?.progress ?? 0) > 0 ? 'Continue Learning' : 'Start Learning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}