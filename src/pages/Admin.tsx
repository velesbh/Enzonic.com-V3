import { useState, useEffect } from "react";
import { 
  checkAdminStatus,
  getEnvironmentVariables, 
  updateEnvironmentVariables,
  getServiceConfigurations,
  updateServiceConfiguration,
  getLiveStatistics,
  getSystemHealth,
  refreshAllData,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  sendUserNotification,
  getUserStatistics
} from '@/lib/adminApi';
import { getRealtimeData, getAllServicesStatus } from '@/lib/serviceApi';
import { 
  getPendingSongs, 
  approveSong, 
  rejectSong, 
  Song,
  SongReport,
  getPendingReports,
  reviewReport,
  adminDeleteSong,
  banArtist,
  unbanArtist
} from '@/lib/musicApi';
import { useAuth, useUser } from "@clerk/clerk-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrivacyRightsManagement from "@/components/PrivacyRightsManagement";
import ServiceLoadingOverlay from "@/components/ServiceLoadingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSystemMonitor } from "@/hooks/use-system-monitor";
import { EnzonicLoading, EnzonicPageLoading, EnzonicOverlayLoading } from "@/components/ui/enzonic-loading";
import { EnzonicError } from "@/components/ui/enzonic-error";
import { 
  Lock, 
  Settings, 
  BarChart3, 
  Database, 
  Globe, 
  Package, 
  Calculator, 
  Languages,
  Server,
  Activity,
  Users,
  Zap,
  HardDrive,
  Cpu,
  Network,
  AlertTriangle,
  CheckCircle,
  Upload,
  Save,
  RefreshCw,
  TrendingUp,
  Eye,
  Music,
  Check,
  X,
  Clock,
  Flag,
  Trash2,
  Mail,
  Search,
  Filter,
  MoreHorizontal,
  Ban,
  UserCheck,
  UserX,
  Shield,
  Crown
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";


interface ServiceConfig {
  id: string;
  name: string;
  logo: string;
  icon: string;
  description: string;
  enabled: boolean;
  endpoint: string;
  color: string;
}

interface LiveStats {
  overview: {
    totalUsers: number;
    totalTranslations: number;
    totalApiCalls: number;
    activeUsers: number;
  };
  services: Record<string, {
    usage: { daily: number; weekly: number; monthly: number };
    uptime: number;
    responseTime: number;
  }>;
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: { incoming: number; outgoing: number };
  };
  recentActivity: Array<{
    id: number;
    activity: string;
    timestamp: string;
    type: string;
  }>;
  realtime?: {
    activeUsers: number;
    recentTranslations: number;
    recentApiCalls: number;
    timestamp: string;
  };
}

const Admin = () => {
  usePageMetadata();
  
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { stats: systemStats, loading: systemLoading, error: systemError, refresh: refreshSystem } = useSystemMonitor(3000);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string>('');
  const [serviceStatuses, setServiceStatuses] = useState<any>({});
  const [checkingServiceStatus, setCheckingServiceStatus] = useState(false);
  const [pendingSongs, setPendingSongs] = useState<Song[]>([]);
  const [loadingPendingSongs, setLoadingPendingSongs] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedSongForRejection, setSelectedSongForRejection] = useState<Song | null>(null);
  const [pendingReports, setPendingReports] = useState<SongReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportActionReason, setReportActionReason] = useState('');
  const { toast } = useToast();

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilters, setUserFilters] = useState({
    role: '',
    status: '',
    limit: 50,
    offset: 0
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userActionDialog, setUserActionDialog] = useState<{
    open: boolean;
    action: string;
    user?: any;
    users?: any[];
  }>({ open: false, action: '' });
  const [userActionReason, setUserActionReason] = useState('');

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !isAdmin) return;
    
    const interval = setInterval(() => {
      refreshStats();
      refreshRealtimeData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, isAdmin]);

  // Real-time data refresh (more frequent)
  useEffect(() => {
    if (!isAdmin) return;
    
    const interval = setInterval(() => {
      refreshRealtimeData();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Check admin status using backend verification
  useEffect(() => {
    async function checkAdminAccess() {
      if (!isLoaded || !isSignedIn) {
        setAdminCheckLoading(false);
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          setIsAdmin(false);
          setAdminCheckLoading(false);
          return;
        }

        setAdminToken(token);
        const result = await checkAdminStatus(token);
        setIsAdmin(result.isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    }

    checkAdminAccess();
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (isAdmin === true) {
      loadData();
      refreshRealtimeData();
      loadPendingSongs();
      loadUsers();
      loadUserStats();
    }
  }, [isAdmin]);

  // Load all admin data
  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const data = await refreshAllData(token);
      setEnvVars(data.envVars || {});
      setServices(data.services || []);
      setStats(data.stats || null);
      setHealth(data.health || null);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const [statsData, healthData] = await Promise.all([
        getLiveStatistics(token),
        getSystemHealth(token)
      ]);
      
      setStats(statsData.stats || null);
      setHealth(healthData.health || null);
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast({
        title: "Error",
        description: "Failed to refresh statistics",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const refreshRealtimeData = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getRealtimeData(token);
      if (data) {
        setRealtimeData(data);
      }
    } catch (error) {
      console.error('Error refreshing realtime data:', error);
    }
  };

  const loadPendingSongs = async () => {
    setLoadingPendingSongs(true);
    try {
      const { songs } = await getPendingSongs(getToken);
      setPendingSongs(songs);
    } catch (error) {
      console.error('Error loading pending songs:', error);
      toast({
        title: "Error",
        description: "Failed to load pending songs",
        variant: "destructive",
      });
    } finally {
      setLoadingPendingSongs(false);
    }
  };

  const handleApproveSong = async (songId: string) => {
    setActionLoading('Approving song...');
    try {
      await approveSong(songId, getToken);
      toast({
        title: "Success",
        description: "Song approved successfully",
      });
      // Refresh pending songs list
      await loadPendingSongs();
    } catch (error) {
      console.error('Error approving song:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve song",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSong = async (songId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setActionLoading('Rejecting song...');
    try {
      await rejectSong(songId, reason, getToken);
      toast({
        title: "Success",
        description: "Song rejected successfully",
      });
      setSelectedSongForRejection(null);
      setRejectionReason('');
      // Refresh pending songs list
      await loadPendingSongs();
    } catch (error) {
      console.error('Error rejecting song:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject song",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const loadPendingReports = async () => {
    setLoadingReports(true);
    try {
      const { reports } = await getPendingReports(getToken);
      setPendingReports(reports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoadingReports(false);
    }
  };

  const handleReviewReport = async (reportId: string, action: 'dismiss' | 'delete_song' | 'ban_artist', notes?: string) => {
    setActionLoading('Processing report...');
    try {
      await reviewReport(reportId, { action, adminNotes: notes }, getToken);
      toast({
        title: "Success",
        description: `Report action completed: ${action}`,
      });
      setSelectedReportId(null);
      setReportActionReason('');
      await loadPendingReports();
    } catch (error) {
      console.error('Error reviewing report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to review report",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // User management functions
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const filters = {
        ...userFilters,
        search: userSearchQuery || undefined
      };

      const response = await getAllUsers(token, filters);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const stats = await getUserStatistics(token);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleUserSearch = () => {
    setUserFilters(prev => ({ ...prev, offset: 0 }));
    loadUsers();
  };

  const handleUserFilterChange = (filterType: string, value: string) => {
    setUserFilters(prev => ({ ...prev, [filterType]: value, offset: 0 }));
    setTimeout(() => loadUsers(), 100); // Debounce
  };

  const handleUserAction = async (action: string, userIds: string[], reason?: string) => {
    setActionLoading(`Processing ${action}...`);
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      switch (action) {
        case 'ban':
          for (const userId of userIds) {
            await updateUserStatus(userId, { status: 'banned', reason }, token);
          }
          break;
        case 'unban':
          for (const userId of userIds) {
            await updateUserStatus(userId, { status: 'active', reason }, token);
          }
          break;
        case 'delete':
          for (const userId of userIds) {
            await deleteUser(userId, reason || 'Admin deletion', token);
          }
          break;
        case 'notify':
          await sendUserNotification(userIds, {
            title: 'Admin Notification',
            message: reason || 'Message from administrator',
            type: 'admin'
          }, token);
          break;
      }

      toast({
        title: "Success",
        description: `${action} action completed for ${userIds.length} user(s)`,
      });

      setSelectedUsers([]);
      setUserActionDialog({ open: false, action: '' });
      setUserActionReason('');
      await loadUsers();
      await loadUserStats();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} user(s)`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const handleSelectAllUsers = (checked: boolean) => {
    setSelectedUsers(checked ? users.map(user => user.id) : []);
  };

  // Check all service availability
  const checkServiceStatuses = async () => {
    setCheckingServiceStatus(true);
    try {
      const statuses = await getAllServicesStatus();
      setServiceStatuses(statuses);
    } catch (error) {
      console.error('Error checking service statuses:', error);
      toast({
        title: "Error",
        description: "Failed to check service availability",
        variant: "destructive",
      });
    } finally {
      setCheckingServiceStatus(false);
    }
  };

  const handleSaveEnvironment = async () => {
    setSaving(true);
    setActionLoading("Saving environment variables...");
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      await updateEnvironmentVariables(envVars, token);
      toast({
        title: "Success",
        description: "Environment variables updated successfully",
      });
    } catch (error) {
      console.error('Error saving environment variables:', error);
      toast({
        title: "Error",
        description: "Failed to update environment variables",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setActionLoading(null);
    }
  };

  const handleUpdateService = async (serviceId: string, config: ServiceConfig) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      await updateServiceConfiguration(serviceId, config, token);
      
      // Update local state
      setServices(prev => prev.map(s => s.id === serviceId ? config : s));
      
      toast({
        title: "Success",
        description: `${config.name} updated successfully`,
      });
      
      // Refresh stats to show updated service status
      refreshStats();
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service configuration",
        variant: "destructive",
      });
    }
  };

  const handleServiceToggle = async (serviceId: string, enabled: boolean) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    setActionLoading(`${enabled ? 'Enabling' : 'Disabling'} ${service.name}...`);
    const updatedService = { ...service, enabled };
    await handleUpdateService(serviceId, updatedService);
    setActionLoading(null);
  };

  const handleServiceUpdate = async (serviceId: string, updates: Partial<ServiceConfig>) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    const updatedService = { ...service, ...updates };
    await handleUpdateService(serviceId, updatedService);
  };

  if (!isLoaded || adminCheckLoading) {
    return (
      <EnzonicPageLoading 
        message={!isLoaded ? 'Initializing...' : 'Checking admin access...'} 
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <EnzonicError
            title="Access Denied"
            description={!isSignedIn 
              ? 'Please sign in to access the admin panel.'
              : 'You do not have admin privileges. Contact your administrator if you believe this is an error.'
            }
            showRetry={false}
            onGoHome={() => window.location.href = '/'}
            variant="card"
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <EnzonicLoading size="lg" message="Loading admin dashboard..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Service status checking overlay */}
      <ServiceLoadingOverlay isLoading={checkingServiceStatus} />
      
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your platform settings, services, and monitor performance</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                    id="auto-refresh"
                  />
                  <Label htmlFor="auto-refresh" className="text-sm">
                    Auto-refresh
                  </Label>
                </div>
                <Button onClick={checkServiceStatuses} disabled={checkingServiceStatus} variant="outline" size="sm">
                  {checkingServiceStatus ? (
                    <EnzonicLoading size="sm" variant="minimal" message="" showLogo={false} />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {checkingServiceStatus ? 'Checking...' : 'Check Services'}
                </Button>
                <Button onClick={refreshStats} disabled={refreshing} variant="outline">
                  {refreshing ? (
                    <EnzonicLoading size="sm" variant="minimal" message="" showLogo={false} />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="grid w-full max-w-6xl grid-cols-8">
                <TabsTrigger value="overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="environment">
                  <Settings className="h-4 w-4 mr-2" />
                  Environment
                </TabsTrigger>
                <TabsTrigger value="services">
                  <Package className="h-4 w-4 mr-2" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="music">
                  <Music className="h-4 w-4 mr-2" />
                  Music Approval
                </TabsTrigger>
                <TabsTrigger value="reports" onClick={loadPendingReports}>
                  <Flag className="h-4 w-4 mr-2" />
                  Song Reports
                </TabsTrigger>
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </TabsTrigger>
                <TabsTrigger value="privacy">
                  <Lock className="h-4 w-4 mr-2" />
                  Privacy Rights
                </TabsTrigger>
                <TabsTrigger value="monitoring">
                  <Activity className="h-4 w-4 mr-2" />
                  Monitoring
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {realtimeData && (
                  <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Real-Time Statistics
                        <Badge variant="secondary" className="ml-auto">
                          Live
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Updated every 10 seconds • Last update: {new Date(realtimeData.timestamp).toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{realtimeData.statistics.activeUsers}</div>
                          <p className="text-sm text-muted-foreground">Active Users (5 min)</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{realtimeData.statistics.recentTranslations}</div>
                          <p className="text-sm text-muted-foreground">Recent Translations (1h)</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{realtimeData.statistics.recentApiCalls}</div>
                          <p className="text-sm text-muted-foreground">Recent API Calls (1h)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {stats && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.overview.totalUsers.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">
                            {stats.overview.activeUsers} active now
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                          <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.overview.totalApiCalls.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">
                            All time
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Translations</CardTitle>
                          <Languages className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.overview.totalTranslations.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">
                            Total processed
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">System Health</CardTitle>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-500">99.9%</div>
                          <p className="text-xs text-muted-foreground">
                            Uptime
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            System Resources
                            {systemLoading && (
                              <EnzonicLoading size="sm" variant="minimal" message="" showLogo={false} />
                            )}
                          </CardTitle>
                          {systemStats && (
                            <CardDescription>
                              Updated {new Date(systemStats.timestamp).toLocaleTimeString()}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {systemError ? (
                            <EnzonicError
                              title="System monitoring error"
                              description={systemError}
                              variant="inline"
                              onRetry={refreshSystem}
                              showHome={false}
                              showBack={false}
                            />
                          ) : systemStats ? (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Cpu className="h-4 w-4" />
                                  <span className="text-sm">CPU Usage</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-24 bg-muted rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-500 ${
                                        systemStats.cpuUsage > 80 ? 'bg-red-500' :
                                        systemStats.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-primary'
                                      }`}
                                      style={{ width: `${Math.min(systemStats.cpuUsage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium w-12 text-right">
                                    {systemStats.cpuUsage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <HardDrive className="h-4 w-4" />
                                  <span className="text-sm">Memory Usage</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-24 bg-muted rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-500 ${
                                        systemStats.memoryUsage > 80 ? 'bg-red-500' :
                                        systemStats.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-primary'
                                      }`}
                                      style={{ width: `${Math.min(systemStats.memoryUsage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium w-12 text-right">
                                    {systemStats.memoryUsage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Database className="h-4 w-4" />
                                  <span className="text-sm">Disk Usage</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-24 bg-muted rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-500 ${
                                        systemStats.diskUsage > 80 ? 'bg-red-500' :
                                        systemStats.diskUsage > 60 ? 'bg-yellow-500' : 'bg-primary'
                                      }`}
                                      style={{ width: `${Math.min(systemStats.diskUsage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium w-12 text-right">
                                    {systemStats.diskUsage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Network className="h-4 w-4" />
                                  <span className="text-sm">Network I/O</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-blue-500">↓ {systemStats.networkIO.incoming.toFixed(1)} MB/s</span>
                                  {" "}
                                  <span className="text-green-500">↑ {systemStats.networkIO.outgoing.toFixed(1)} MB/s</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-4">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                  <div className="h-6 bg-muted rounded"></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {stats.recentActivity.map((activity) => (
                              <div key={activity.id} className="flex items-center space-x-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${
                                  activity.type === 'success' ? 'bg-green-500' :
                                  activity.type === 'warning' ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`}></div>
                                <span className="flex-1">{activity.activity}</span>
                                <span className="text-muted-foreground text-xs">
                                  {new Date(activity.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="environment" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Environment Variables</CardTitle>
                    <CardDescription>
                      Manage your application's environment configuration. Changes will require a server restart.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Be careful when modifying environment variables. Incorrect values may cause system instability.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-4">
                      {Object.entries(envVars).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <Label className="font-mono text-sm">{key}</Label>
                          <div className="md:col-span-2">
                            {key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') ? (
                              <Input
                                type="password"
                                value={value}
                                onChange={(e) => setEnvVars(prev => ({ ...prev, [key]: e.target.value }))}
                                className="font-mono text-sm"
                                placeholder="Enter value..."
                              />
                            ) : (
                              <Input
                                value={value}
                                onChange={(e) => setEnvVars(prev => ({ ...prev, [key]: e.target.value }))}
                                className="font-mono text-sm"
                                placeholder="Enter value..."
                              />
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <Input
                          placeholder="New variable name"
                          className="font-mono text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              const key = input.value.trim();
                              if (key && !envVars[key]) {
                                setEnvVars(prev => ({ ...prev, [key]: '' }));
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <div className="md:col-span-2 text-sm text-muted-foreground">
                          Press Enter to add a new environment variable
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSaveEnvironment} className="w-full md:w-auto">
                      <Save className="h-4 w-4 mr-2" />
                      Save Environment Variables
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <div className="grid gap-6">
                  {services.map((service) => {
                    const statusInfo = serviceStatuses[service.id];
                    const isAvailable = statusInfo?.available;
                    
                    return (
                      <Card key={service.id}>
                        <CardHeader>
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: service.color }}
                            >
                              {service.icon === 'Languages' && <Languages className="h-6 w-6" />}
                              {service.icon === 'Package' && <Package className="h-6 w-6" />}
                              {service.icon === 'Calculator' && <Calculator className="h-6 w-6" />}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="flex items-center space-x-2">
                                <span>{service.name}</span>
                                <Badge variant={service.enabled ? "default" : "secondary"}>
                                  {service.enabled ? "Enabled" : "Disabled"}
                                </Badge>
                                {isAvailable !== undefined && (
                                  <Badge variant={isAvailable ? "default" : "destructive"} className="text-xs">
                                    {isAvailable ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Available
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Unavailable
                                      </>
                                    )}
                                  </Badge>
                                )}
                                {realtimeData?.services[service.id] && (
                                  <Badge variant="outline" className="text-xs">
                                    <Eye className="h-3 w-3 mr-1" />
                                    {realtimeData.services[service.id].enabled ? 'Live' : 'Offline'}
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription>{service.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-base font-medium">Service Status</Label>
                              <p className="text-sm text-muted-foreground">
                                Enable or disable this service for users
                              </p>
                            </div>
                            <Switch
                              checked={service.enabled}
                              onCheckedChange={(checked) => handleServiceToggle(service.id, checked)}
                            />
                          </div>

                          <div className="pt-4 border-t">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Endpoint:</span>
                                <span className="ml-2 font-mono">{service.endpoint}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <span className={`ml-2 ${service.enabled ? 'text-green-600' : 'text-red-600'}`}>
                                  {service.enabled ? 'Active' : 'Disabled'}
                                </span>
                              </div>
                              {statusInfo?.responseTime && (
                                <div>
                                  <span className="text-muted-foreground">Response Time:</span>
                                  <span className="ml-2 font-mono">{statusInfo.responseTime}ms</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="music" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Pending Song Approvals
                      {pendingSongs.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {pendingSongs.length} pending
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Review and approve or reject uploaded songs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPendingSongs ? (
                      <div className="flex items-center justify-center py-12">
                        <EnzonicLoading message="Loading pending songs..." />
                      </div>
                    ) : pendingSongs.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                        <p className="text-muted-foreground">No pending songs to review</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingSongs.map((song) => (
                          <Card key={song.id} className="border-2">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                {/* Song Cover */}
                                {song.cover_image_url ? (
                                  <img
                                    src={song.cover_image_url}
                                    alt={song.title}
                                    className="w-24 h-24 rounded-md object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-24 h-24 rounded-md bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                                    <Music className="h-8 w-8 text-white" />
                                  </div>
                                )}

                                {/* Song Info */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold mb-1">{song.title}</h3>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Artist: {song.artist_name}
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Duration:</span>
                                      <span className="ml-2">
                                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Format:</span>
                                      <span className="ml-2">{song.file_format || 'Unknown'}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Size:</span>
                                      <span className="ml-2">
                                        {song.file_size ? (song.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Lyrics:</span>
                                      <span className="ml-2">{song.has_lyrics ? 'Yes' : 'No'}</span>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    Uploaded {new Date(song.created_at).toLocaleDateString()} at {new Date(song.created_at).toLocaleTimeString()}
                                  </div>

                                  {/* Audio Preview */}
                                  <div className="mt-4">
                                    <audio controls className="w-full max-w-md">
                                      <source src={song.file_url} type={song.file_format} />
                                      Your browser does not support the audio element.
                                    </audio>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveSong(song.id)}
                                    className="gap-2"
                                  >
                                    <Check className="h-4 w-4" />
                                    Approve
                                  </Button>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="gap-2"
                                        onClick={() => setSelectedSongForRejection(song)}
                                      >
                                        <X className="h-4 w-4" />
                                        Reject
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject Song</DialogTitle>
                                        <DialogDescription>
                                          Please provide a reason for rejecting "{song.title}"
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <Textarea
                                          placeholder="Enter rejection reason..."
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          className="min-h-[100px]"
                                        />
                                        <div className="flex gap-2 justify-end">
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedSongForRejection(null);
                                              setRejectionReason('');
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() => handleRejectSong(song.id, rejectionReason)}
                                            disabled={!rejectionReason.trim()}
                                          >
                                            Reject Song
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Flag className="h-5 w-5 text-red-500" />
                          Song Reports Moderation
                        </CardTitle>
                        <CardDescription>
                          Review and take action on reported songs
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{pendingReports.length} pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingReports ? (
                      <EnzonicLoading />
                    ) : pendingReports.length === 0 ? (
                      <div className="text-center py-12">
                        <Flag className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
                        <p className="text-zinc-400">No pending reports</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingReports.map((report) => (
                          <Card key={report.id} className="bg-zinc-900/50 border-zinc-800">
                            <CardContent className="p-6">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                                {/* Report Info */}
                                <div className="flex-1">
                                  <div className="flex items-start gap-3 mb-3">
                                    <Badge className="flex-shrink-0">
                                      {report.report_type.replace(/_/g, ' ')}
                                    </Badge>
                                    <Badge variant="outline">
                                      {report.status}
                                    </Badge>
                                  </div>

                                  <h4 className="font-semibold mb-1">
                                    Song: {report.song_title}
                                  </h4>
                                  <p className="text-sm text-zinc-400 mb-3">
                                    Artist: {report.artist_name}
                                  </p>

                                  {report.description && (
                                    <div className="bg-zinc-800/50 p-3 rounded mb-3 text-sm">
                                      <p className="text-zinc-300">{report.description}</p>
                                    </div>
                                  )}

                                  <div className="flex flex-col gap-1 text-xs text-zinc-500">
                                    <p>
                                      Reported on: {new Date(report.created_at).toLocaleDateString()}
                                    </p>
                                    <p>Report ID: {report.id}</p>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2 flex-shrink-0 md:min-w-[200px]">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => setSelectedReportId(report.id)}
                                      >
                                        <Check className="h-4 w-4" />
                                        Dismiss Report
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Dismiss Report</DialogTitle>
                                        <DialogDescription>
                                          Confirm dismissing this report
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <Textarea
                                          placeholder="Admin notes (optional)..."
                                          value={reportActionReason}
                                          onChange={(e) => setReportActionReason(e.target.value)}
                                          className="min-h-[80px]"
                                        />
                                        <div className="flex gap-2 justify-end">
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedReportId(null);
                                              setReportActionReason('');
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            onClick={() => {
                                              handleReviewReport(report.id, 'dismiss', reportActionReason);
                                              setReportActionReason('');
                                            }}
                                            disabled={actionLoading !== null}
                                          >
                                            Dismiss
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="gap-2"
                                        onClick={() => setSelectedReportId(report.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Song
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Delete Song</DialogTitle>
                                        <DialogDescription>
                                          This will permanently delete the song "{report.song_title}"
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <Textarea
                                          placeholder="Admin notes..."
                                          value={reportActionReason}
                                          onChange={(e) => setReportActionReason(e.target.value)}
                                          className="min-h-[80px]"
                                        />
                                        <div className="flex gap-2 justify-end">
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedReportId(null);
                                              setReportActionReason('');
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() => {
                                              handleReviewReport(report.id, 'delete_song', reportActionReason);
                                              setReportActionReason('');
                                            }}
                                            disabled={actionLoading !== null}
                                          >
                                            Delete Song
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="gap-2"
                                        onClick={() => setSelectedReportId(report.id)}
                                      >
                                        <Users className="h-4 w-4" />
                                        Ban Artist
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Ban Artist</DialogTitle>
                                        <DialogDescription>
                                          This will ban the artist and delete the reported song
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <Textarea
                                          placeholder="Ban reason and admin notes..."
                                          value={reportActionReason}
                                          onChange={(e) => setReportActionReason(e.target.value)}
                                          className="min-h-[80px]"
                                        />
                                        <div className="flex gap-2 justify-end">
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedReportId(null);
                                              setReportActionReason('');
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() => {
                                              handleReviewReport(report.id, 'ban_artist', reportActionReason);
                                              setReportActionReason('');
                                            }}
                                            disabled={actionLoading !== null}
                                          >
                                            Ban Artist
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <div className="space-y-6">
                  {/* User Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-2xl font-bold">{userStats?.totalUsers || stats?.overview.totalUsers || 0}</p>
                            <p className="text-xs text-muted-foreground">Total Users</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-2xl font-bold">{userStats?.activeUsers || stats?.overview.activeUsers || 0}</p>
                            <p className="text-xs text-muted-foreground">Active Users</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="text-2xl font-bold">{userStats?.artists || 0}</p>
                            <p className="text-xs text-muted-foreground">Artists</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Ban className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="text-2xl font-bold">{userStats?.bannedUsers || 0}</p>
                            <p className="text-xs text-muted-foreground">Banned Users</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* User Search and Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>
                        Search, filter, and manage platform users
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                          <Input
                            placeholder="Search by username, email, or name..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                            className="w-full"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleUserSearch} disabled={loadingUsers} variant="outline" size="sm">
                            <Search className="h-4 w-4 mr-2" />
                            Search
                          </Button>
                          <Button onClick={loadUsers} disabled={loadingUsers} variant="outline" size="sm">
                            <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <select
                          value={userFilters.role}
                          onChange={(e) => handleUserFilterChange('role', e.target.value)}
                          className="px-3 py-1 border rounded-md text-sm"
                        >
                          <option value="">All Roles</option>
                          <option value="user">Regular User</option>
                          <option value="artist">Artist</option>
                          <option value="admin">Admin</option>
                        </select>
                        <select
                          value={userFilters.status}
                          onChange={(e) => handleUserFilterChange('status', e.target.value)}
                          className="px-3 py-1 border rounded-md text-sm"
                        >
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="banned">Banned</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>

                      {/* Bulk Actions */}
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md mb-4">
                          <span className="text-sm font-medium">{selectedUsers.length} user(s) selected</span>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setUserActionDialog({ open: true, action: 'ban', users: selectedUsers })}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban Selected
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setUserActionDialog({ open: true, action: 'notify', users: selectedUsers })}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Notification
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => setUserActionDialog({ open: true, action: 'delete', users: selectedUsers })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Selected
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Users Table */}
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={users.length > 0 && selectedUsers.length === users.length}
                                  onCheckedChange={handleSelectAllUsers}
                                />
                              </TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Joined</TableHead>
                              <TableHead>Last Active</TableHead>
                              <TableHead className="w-12">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingUsers ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                  <EnzonicLoading message="Loading users..." />
                                </TableCell>
                              </TableRow>
                            ) : users.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                  No users found
                                </TableCell>
                              </TableRow>
                            ) : (
                              users.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedUsers.includes(user.id)}
                                      onCheckedChange={(checked) => handleSelectUser(user.id, checked)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-sm font-medium">
                                          {user.firstName?.[0] || user.username?.[0] || user.email?.[0] || '?'}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="font-medium">
                                          {user.firstName && user.lastName 
                                            ? `${user.firstName} ${user.lastName}` 
                                            : user.username || 'Unknown User'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'artist' ? 'secondary' : 'outline'}>
                                      {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                      {user.role === 'artist' && <Crown className="h-3 w-3 mr-1" />}
                                      {user.role || 'user'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        user.status === 'active' ? 'default' :
                                        user.status === 'banned' ? 'destructive' :
                                        user.status === 'inactive' ? 'secondary' : 'outline'
                                      }
                                    >
                                      {user.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                      {user.status === 'banned' && <Ban className="h-3 w-3 mr-1" />}
                                      {user.status || 'unknown'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() => setUserActionDialog({ open: true, action: 'notify', user })}
                                        >
                                          <Mail className="h-4 w-4 mr-2" />
                                          Send Message
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {user.status === 'banned' ? (
                                          <DropdownMenuItem
                                            onClick={() => setUserActionDialog({ open: true, action: 'unban', user })}
                                          >
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Unban User
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem
                                            onClick={() => setUserActionDialog({ open: true, action: 'ban', user })}
                                          >
                                            <Ban className="h-4 w-4 mr-2" />
                                            Ban User
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => setUserActionDialog({ open: true, action: 'delete', user })}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete User
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* User Action Dialog */}
                <Dialog 
                  open={userActionDialog.open} 
                  onOpenChange={(open) => setUserActionDialog({ ...userActionDialog, open })}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {userActionDialog.action === 'ban' && 'Ban User'}
                        {userActionDialog.action === 'unban' && 'Unban User'}
                        {userActionDialog.action === 'delete' && 'Delete User'}
                        {userActionDialog.action === 'notify' && 'Send Notification'}
                      </DialogTitle>
                      <DialogDescription>
                        {userActionDialog.action === 'ban' && `Ban ${userActionDialog.users?.length || 1} user(s). They will lose access to the platform.`}
                        {userActionDialog.action === 'unban' && `Unban ${userActionDialog.users?.length || 1} user(s). They will regain access to the platform.`}
                        {userActionDialog.action === 'delete' && `Permanently delete ${userActionDialog.users?.length || 1} user(s). This action cannot be undone.`}
                        {userActionDialog.action === 'notify' && `Send a notification to ${userActionDialog.users?.length || 1} user(s).`}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {(userActionDialog.action === 'ban' || userActionDialog.action === 'delete') && (
                        <div>
                          <Label htmlFor="reason">Reason (required)</Label>
                          <Textarea
                            id="reason"
                            placeholder="Enter reason for this action..."
                            value={userActionReason}
                            onChange={(e) => setUserActionReason(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                      )}
                      {userActionDialog.action === 'notify' && (
                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Enter notification message..."
                            value={userActionReason}
                            onChange={(e) => setUserActionReason(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                      )}
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUserActionDialog({ open: false, action: '' });
                            setUserActionReason('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant={userActionDialog.action === 'delete' ? 'destructive' : 'default'}
                          onClick={() => {
                            const userIds = userActionDialog.users || [userActionDialog.user?.id];
                            handleUserAction(userActionDialog.action, userIds, userActionReason);
                          }}
                          disabled={
                            (userActionDialog.action !== 'notify' && !userActionReason.trim()) ||
                            actionLoading !== null
                          }
                        >
                          {userActionDialog.action === 'ban' && 'Ban User'}
                          {userActionDialog.action === 'unban' && 'Unban User'}
                          {userActionDialog.action === 'delete' && 'Delete User'}
                          {userActionDialog.action === 'notify' && 'Send Notification'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6">
                <PrivacyRightsManagement />
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-6">
                {stats && (
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Service Performance</CardTitle>
                        <CardDescription>Real-time performance metrics for all services</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          {Object.entries(stats.services).map(([serviceName, serviceStats]) => (
                            <div key={serviceName} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium capitalize">{serviceName}</h4>
                                <Badge variant={serviceStats.uptime > 99 ? "default" : "destructive"}>
                                  {serviceStats.uptime}% uptime
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Daily Usage</div>
                                  <div className="font-medium">{serviceStats.usage.daily.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Weekly Usage</div>
                                  <div className="font-medium">{serviceStats.usage.weekly.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Monthly Usage</div>
                                  <div className="font-medium">{serviceStats.usage.monthly.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Response Time</div>
                                  <div className="font-medium">{serviceStats.responseTime}ms</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Overlay Loading */}
      <EnzonicOverlayLoading 
        show={!!actionLoading} 
        message={actionLoading || "Processing..."} 
      />
    </div>
  );
};

export default Admin;
