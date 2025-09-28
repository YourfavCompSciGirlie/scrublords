import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Opportunities from "@/pages/Opportunities";
import Patients from "@/pages/Patients";
import Messages from "@/pages/Messages";
import VideoCalls from "@/pages/VideoCalls";
import ResidentDashboard from "@/pages/ResidentDashboard";
import TrainingRotations from "@/pages/TrainingRotations";
import MentorshipMatching from "@/pages/MentorshipMatching";
import LearningResources from "@/pages/LearningResources";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ 
  component: Component, 
  allowedRoles = ['doctor', 'nurse', 'admin', 'resident'] 
}: { 
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    </div>;
  }
  
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function RoleBasedHomeRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (user.role === 'resident') {
    return <Redirect to="/resident-dashboard" />;
  }
  
  return <Redirect to="/dashboard" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={RoleBasedHomeRoute} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} allowedRoles={['doctor', 'nurse', 'admin']} />} />
      <Route path="/resident-dashboard" component={() => <ProtectedRoute component={ResidentDashboard} allowedRoles={['resident']} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/opportunities" component={() => <ProtectedRoute component={Opportunities} allowedRoles={['doctor', 'nurse', 'admin']} />} />
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} allowedRoles={['doctor', 'nurse', 'admin']} />} />
      <Route path="/messages" component={() => <ProtectedRoute component={Messages} />} />
      <Route path="/video-calls" component={() => <ProtectedRoute component={VideoCalls} />} />
      <Route path="/learning-resources" component={() => <ProtectedRoute component={LearningResources} allowedRoles={['resident']} />} />
      <Route path="/rotations" component={() => <ProtectedRoute component={TrainingRotations} allowedRoles={['resident']} />} />
      <Route path="/mentorship" component={() => <ProtectedRoute component={MentorshipMatching} allowedRoles={['resident']} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
