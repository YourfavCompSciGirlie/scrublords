import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, Plus, MapPin, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

export default function Opportunities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    description: '',
    type: '',
    location: '',
    isRemote: false,
    requirements: ''
  });

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['/api/opportunities'],
  });

  const createOpportunityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/opportunities', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opportunities'] });
      setIsCreateModalOpen(false);
      setNewOpportunity({
        title: '',
        description: '',
        type: '',
        location: '',
        isRemote: false,
        requirements: ''
      });
      toast({
        title: 'Success',
        description: 'Opportunity created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create opportunity',
        variant: 'destructive',
      });
    },
  });

  const matchOpportunityMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      const response = await apiRequest('POST', `/api/opportunities/${opportunityId}/match`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Successfully matched to opportunity',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to match opportunity',
        variant: 'destructive',
      });
    },
  });

  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data - exclude location for remote opportunities
    const opportunityData = { ...newOpportunity };
    if (opportunityData.isRemote) {
      delete opportunityData.location;
    }
    
    createOpportunityMutation.mutate(opportunityData);
  };

  const handleMatch = (opportunityId: string) => {
    matchOpportunityMutation.mutate(opportunityId);
  };

  const filteredOpportunities = opportunities?.filter((opportunity: any) =>
    opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opportunity.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold">Opportunities</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-opportunities"
            />
          </div>
          <Button variant="outline" data-testid="button-filter-opportunities">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-opportunity">
                <Plus className="mr-2 h-4 w-4" />
                New Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Opportunity</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateOpportunity} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newOpportunity.title}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                    required
                    data-testid="input-opportunity-title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newOpportunity.type}
                    onValueChange={(value) => setNewOpportunity({ ...newOpportunity, type: value })}
                  >
                    <SelectTrigger data-testid="select-opportunity-type">
                      <SelectValue placeholder="Select opportunity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="job">Job</SelectItem>
                      <SelectItem value="practical">Practical</SelectItem>
                      <SelectItem value="mentorship">Mentorship</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={newOpportunity.description}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                    required
                    data-testid="textarea-opportunity-description"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRemote"
                    checked={newOpportunity.isRemote}
                    onCheckedChange={(checked) => 
                      setNewOpportunity({ ...newOpportunity, isRemote: !!checked })
                    }
                    data-testid="checkbox-opportunity-remote"
                  />
                  <Label htmlFor="isRemote">Remote opportunity</Label>
                </div>
                
                {!newOpportunity.isRemote && (
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newOpportunity.location}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, location: e.target.value })}
                      data-testid="input-opportunity-location"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    rows={2}
                    value={newOpportunity.requirements}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, requirements: e.target.value })}
                    data-testid="textarea-opportunity-requirements"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                    data-testid="button-cancel-opportunity"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createOpportunityMutation.isPending}
                    data-testid="button-submit-opportunity"
                  >
                    {createOpportunityMutation.isPending ? 'Creating...' : 'Create Opportunity'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="loading-skeleton h-32"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOpportunities.map((opportunity: any) => (
            <Card key={opportunity.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{opportunity.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {opportunity.type}
                    </p>
                    <p className="text-muted-foreground mt-2">{opportunity.description}</p>
                    
                    {opportunity.requirements && (
                      <div className="mt-3">
                        <p className="text-sm font-medium">Requirements:</p>
                        <p className="text-sm text-muted-foreground">{opportunity.requirements}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center mt-4 space-x-4">
                      <Badge variant={opportunity.isRemote ? "default" : "secondary"}>
                        {opportunity.isRemote ? (
                          <><Video className="mr-1 h-3 w-3" />Remote</>
                        ) : (
                          <><MapPin className="mr-1 h-3 w-3" />{opportunity.location}</>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Posted {new Date(opportunity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleMatch(opportunity.id)}
                    disabled={matchOpportunityMutation.isPending}
                    data-testid={`button-match-${opportunity.id}`}
                  >
                    {opportunity.type === 'job' || opportunity.type === 'practical' ? 'Apply' : 'Connect'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredOpportunities.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No opportunities found matching your search.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
