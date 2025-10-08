import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EnzonicLoading } from "@/components/ui/enzonic-loading";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  FileText, 
  UserX, 
  Lock, 
  Unlock,
  Plus,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import {
  getAllPrivacyRequests,
  getUserPersonalData,
  createPrivacyRequest,
  updatePrivacyRequestStatus,
  processErasureRequest,
  generateDataExport,
  processRestrictionRequest,
  processConsentWithdrawal,
  getPrivacyAuditLog,
  downloadDataExport,
  PRIVACY_REQUEST_TYPES,
  REQUEST_STATUS,
  getRequestTypeLabel,
  getStatusColor,
  getStatusLabel,
  type PrivacyRequest,
  type PrivacyRequestCounts,
  type UserPersonalData,
  type PrivacyAuditLog
} from "@/lib/privacyApi";

const PrivacyRightsManagement = () => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [requestCounts, setRequestCounts] = useState<PrivacyRequestCounts>({
    pending: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PrivacyRequest | null>(null);
  const [auditLogs, setAuditLogs] = useState<PrivacyAuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userData, setUserData] = useState<UserPersonalData | null>(null);
  
  // Form states
  const [newRequestForm, setNewRequestForm] = useState({
    type: "",
    description: "",
    userEmail: "",
    userId: ""
  });

  useEffect(() => {
    loadPrivacyRequests();
  }, []);

  const loadPrivacyRequests = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const data = await getAllPrivacyRequests(token);
      setRequests(data.requests);
      setRequestCounts(data.counts);
    } catch (error) {
      console.error('Error loading privacy requests:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequestForm.type || !newRequestForm.description || !newRequestForm.userEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing("Creating request...");
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      await createPrivacyRequest(
        newRequestForm.type as any,
        newRequestForm.description,
        { userEmail: newRequestForm.userEmail, userId: newRequestForm.userId },
        newRequestForm.userEmail,
        token
      );

      toast({
        title: "Success",
        description: "Privacy request created successfully",
      });

      setNewRequestForm({ type: "", description: "", userEmail: "", userId: "" });
      await loadPrivacyRequests();
    } catch (error) {
      console.error('Error creating privacy request:', error);
      toast({
        title: "Error",
        description: "Failed to create privacy request",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      setProcessing("Updating status...");
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      await updatePrivacyRequestStatus(requestId, status as any, notes, undefined, token);

      toast({
        title: "Success",
        description: "Request status updated successfully",
      });

      await loadPrivacyRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleProcessErasure = async (request: PrivacyRequest) => {
    try {
      setProcessing("Processing erasure request...");
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const userData = JSON.parse(request.userData || '{}');
      await processErasureRequest(userData.userId, request.id, token);

      toast({
        title: "Success",
        description: "User data erased successfully",
      });

      await loadPrivacyRequests();
    } catch (error) {
      console.error('Error processing erasure:', error);
      toast({
        title: "Error",
        description: "Failed to process erasure request",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleGenerateExport = async (request: PrivacyRequest) => {
    try {
      setProcessing("Generating data export...");
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const userData = JSON.parse(request.userData || '{}');
      const result = await generateDataExport(userData.userId, 'json', token);

      toast({
        title: "Success",
        description: "Data export generated successfully",
        action: (
          <Button
            size="sm"
            onClick={() => {
              window.open(downloadDataExport(result.filename, token), '_blank');
            }}
          >
            Download
          </Button>
        ),
      });

      await loadPrivacyRequests();
    } catch (error) {
      console.error('Error generating export:', error);
      toast({
        title: "Error",
        description: "Failed to generate data export",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleViewUserData = async (request: PrivacyRequest) => {
    try {
      setProcessing("Loading user data...");
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const userData = JSON.parse(request.userData || '{}');
      const data = await getUserPersonalData(userData.userId, token);
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleViewAuditLog = async (request: PrivacyRequest) => {
    try {
      setProcessing("Loading audit log...");
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const data = await getPrivacyAuditLog(request.id, token);
      setAuditLogs(data.logs);
      setSelectedRequest(request);
    } catch (error) {
      console.error('Error loading audit log:', error);
      toast({
        title: "Error",
        description: "Failed to load audit log",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesType = typeFilter === "all" || request.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return <EnzonicLoading message="Loading privacy requests..." />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{requestCounts.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{requestCounts.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{requestCounts.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{requestCounts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Rights Management
              </CardTitle>
              <CardDescription>
                Manage GDPR and CCPA privacy rights requests automatically
              </CardDescription>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create Privacy Request</DialogTitle>
                  <DialogDescription>
                    Create a new privacy rights request on behalf of a user.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Request Type</Label>
                    <Select
                      value={newRequestForm.type}
                      onValueChange={(value) => setNewRequestForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIVACY_REQUEST_TYPES).map(([key, value]) => (
                          <SelectItem key={value} value={value}>
                            {getRequestTypeLabel(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userEmail">User Email</Label>
                    <Input
                      id="userEmail"
                      value={newRequestForm.userEmail}
                      onChange={(e) => setNewRequestForm(prev => ({ ...prev, userEmail: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userId">User ID (Optional)</Label>
                    <Input
                      id="userId"
                      value={newRequestForm.userId}
                      onChange={(e) => setNewRequestForm(prev => ({ ...prev, userId: e.target.value }))}
                      placeholder="clerk_user_id"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newRequestForm.description}
                      onChange={(e) => setNewRequestForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the privacy request..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateRequest} disabled={!!processing}>
                    {processing ? <EnzonicLoading size="sm" variant="minimal" message="" /> : "Create Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.values(REQUEST_STATUS).map(status => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(PRIVACY_REQUEST_TYPES).map(type => (
                  <SelectItem key={type} value={type}>
                    {getRequestTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requests Table */}
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="border-l-4" style={{ borderLeftColor: `var(--${getStatusColor(request.status)}-500)` }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{getRequestTypeLabel(request.type)}</CardTitle>
                        <Badge variant={getStatusColor(request.status) === 'green' ? 'default' : 'secondary'}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <CardDescription>
                        <div className="flex items-center gap-4 text-sm">
                          <span>User: {request.userEmail || 'Unknown'}</span>
                          <span>•</span>
                          <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>ID: {request.id}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUserData(request)}
                        disabled={!!processing}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Data
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAuditLog(request)}
                        disabled={!!processing}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Audit Log
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                            disabled={!!processing}
                          >
                            Start Processing
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                            disabled={!!processing}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {request.status === 'in_progress' && (
                        <>
                          {request.type === 'erasure' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Process Erasure
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Data Erasure</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete all user data. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleProcessErasure(request)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Confirm Erasure
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          {request.type === 'portability' && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateExport(request)}
                              disabled={!!processing}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Generate Export
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(request.id, 'completed')}
                            disabled={!!processing}
                          >
                            Mark Complete
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {request.processedAt && (
                      <div className="text-sm text-muted-foreground">
                        Processed: {new Date(request.processedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No privacy requests found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Data Viewer Dialog */}
      <Dialog open={!!userData} onOpenChange={() => setUserData(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>User Personal Data</DialogTitle>
            <DialogDescription>
              Complete data export for user: {userData?.userId}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {userData && (
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(userData.data, null, 2)}
              </pre>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log</DialogTitle>
            <DialogDescription>
              Activity log for request: {selectedRequest?.id}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-muted-foreground">{log.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        By: {log.adminEmail || log.adminId}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <EnzonicLoading size="sm" variant="minimal" message="" />
              <span>{processing}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PrivacyRightsManagement;