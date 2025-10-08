import { useState, useEffect } from "react";
import { 
  checkAdminStatus,
  getEnvironmentVariables, 
  updateEnvironmentVariables,
  getServiceConfigurations,
  updateServiceConfiguration,
  getLiveStatistics,
  getSystemHealth,
  refreshAllData
} from '@/lib/adminApi';
import { getRealtimeData } from '@/lib/serviceApi';
import { useAuth, useUser } from "@clerk/clerk-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrivacyRightsManagement from "@/components/PrivacyRightsManagement";
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
  Eye
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePageMetadata } from "@/hooks/use-page-metadata";

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
  const { toast } = useToast();

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
      console.debug('Error refreshing realtime data:', error);
      // Don't show toast for realtime data failures
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
              <TabsList className="grid w-full max-w-4xl grid-cols-5">
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
                  {services.map((service) => (
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
