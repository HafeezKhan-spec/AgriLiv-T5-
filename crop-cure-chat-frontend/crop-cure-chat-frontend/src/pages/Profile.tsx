import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  Edit3, 
  Camera, 
  Save, 
  X, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Leaf,
  MessageCircle,
  Upload,
  TrendingUp,
  Award,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ReportModal from "@/components/ReportModal";

interface HistoryItem {
  id: string;
  type: 'upload' | 'chat';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'healthy' | 'disease' | 'warning';
  confidence?: number;
}

const Profile = () => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: localStorage.getItem("userName") || "John Farmer",
    email: "john.farmer@example.com",
    phone: "+1 (555) 123-4567",
    location: "Iowa, United States",
    bio: "Organic farmer with 15+ years of experience. Passionate about sustainable agriculture and crop health management.",
    farmSize: "250 acres",
    primaryCrops: "Corn, Soybeans, Wheat",
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    healthyDetections: 0,
    diseaseDetections: 0,
    chatSessions: 0,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    classification?: {
      diseaseDetected?: boolean;
      diseaseName?: string;
      confidence?: number;
      severity?: string;
      affectedArea?: number;
      recommendations?: string[];
    };
    domain?: 'plant' | 'livestock' | 'fish';
  } | null>(null);
  const [reportImageUrl, setReportImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const fetchStatsAndHistory = async () => {
      try {
        // Fetch upload stats
        const statsResp = await fetch('/api/upload/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsResp.ok) {
          const statsJson = await statsResp.json();
          if (statsJson.success) {
            setStats(prev => ({
              ...prev,
              totalAnalyses: statsJson.data.totalAnalyses || 0,
              healthyDetections: statsJson.data.healthyDetections || 0,
              diseaseDetections: statsJson.data.diseaseDetections || 0,
            }));
          }
        }

        // Fetch chat sessions count
        const sessionsResp = await fetch('/api/chat/sessions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sessionsResp.ok) {
          const sessionsJson = await sessionsResp.json();
          if (sessionsJson.success) {
            setStats(prev => ({
              ...prev,
              chatSessions: sessionsJson.data.sessions.length || 0,
            }));
          }
        }

        // Fetch upload history
        const historyResp = await fetch('/api/upload/history?limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (historyResp.ok) {
          const historyJson = await historyResp.json();
          if (historyJson.success) {
            const items: HistoryItem[] = historyJson.data.uploads.map((u: {
              _id: string;
              processingStatus: string;
              analysisResult?: {
                diseaseDetected?: boolean;
                diseaseName?: string;
                confidence?: number;
              };
              createdAt: string;
            }) => {
              const isCompleted = u.processingStatus === 'completed';
              const diseaseDetected = isCompleted ? u.analysisResult?.diseaseDetected : null;
              const status: 'healthy' | 'disease' | 'warning' | undefined =
                isCompleted ? (diseaseDetected ? 'disease' : 'healthy') : 'warning';
              const title = isCompleted
                ? (diseaseDetected ? `${u.analysisResult?.diseaseName || 'Disease Detected'}` : 'Healthy Crop Analysis')
                : 'Analysis Pending';
              const description = isCompleted
                ? (diseaseDetected ? `Detected: ${u.analysisResult?.diseaseName}` : 'No disease detected')
                : `Status: ${u.processingStatus}`;
              return {
                id: u._id,
                type: 'upload',
                title,
                description,
                timestamp: new Date(u.createdAt),
                status,
                confidence: isCompleted ? u.analysisResult?.confidence ?? undefined : undefined,
              };
            });
            setHistory(items);
          }
        }
      } catch (err) {
        // Ignore errors; UI remains with initial zero stats
      }
    };

    fetchStatsAndHistory();
  }, []);

  const refreshStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const statsResp = await fetch('/api/upload/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResp.ok) {
        const statsJson = await statsResp.json();
        if (statsJson.success) {
          setStats(prev => ({
            ...prev,
            totalAnalyses: statsJson.data.totalAnalyses || 0,
            healthyDetections: statsJson.data.healthyDetections || 0,
            diseaseDetections: statsJson.data.diseaseDetections || 0,
          }));
        }
      }
    } catch {
      // ignore
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = () => {
    // Mock save - replace with actual API call
    localStorage.setItem("userName", profileData.name);
    setIsEditing(false);
    toast({
      title: t('toast.profileUpdated'),
      description: t('toast.profileUpdatedDesc'),
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'bg-success text-success-foreground';
      case 'disease': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (type: string) => {
    return type === 'upload' ? <Upload className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (prev.size === history.length) return new Set();
      return new Set(history.map(h => h.id));
    });
  };

  const deleteItem = async (id: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({ title: "Login required", description: "Please login to delete reports", variant: "destructive" });
      return;
    }
    try {
      setIsDeleting(true);
      const resp = await fetch(`/api/upload/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Delete failed');
      const json = await resp.json();
      if (!json.success) throw new Error(json.message || 'Delete failed');
      setHistory(prev => prev.filter(h => h.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast({ title: "Deleted", description: "Report removed from history" });
      await refreshStats();
    } catch (e) {
      toast({ title: "Failed to delete", description: e instanceof Error ? e.message : "Please try again", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteSelected = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({ title: "Login required", description: "Please login to delete reports", variant: "destructive" });
      return;
    }
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      setIsDeleting(true);
      const results = await Promise.allSettled(ids.map(id => fetch(`/api/upload/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })));
      const successful = new Set<string>();
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value.ok) {
          const j = await r.value.json();
          if (j.success) successful.add(ids[i]);
        }
      }
      if (successful.size > 0) {
        setHistory(prev => prev.filter(h => !successful.has(h.id)));
        setSelectedIds(new Set());
        toast({ title: "Deleted", description: `${successful.size} report(s) removed` });
        await refreshStats();
      } else {
        toast({ title: "No deletions", description: "Could not delete selected reports", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Failed to delete", description: e instanceof Error ? e.message : "Please try again", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const viewReport = async (id: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({ title: "Login required", description: "Please login to view reports", variant: "destructive" });
      return;
    }
    try {
      // Fetch upload details for image URL
      const uploadResp = await fetch(`/api/upload/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!uploadResp.ok) throw new Error('Failed to fetch upload details');
      const uploadJson = await uploadResp.json();
      if (!uploadJson.success) throw new Error(uploadJson.message || 'Failed to fetch upload details');
      const upload = uploadJson.data.upload;
      const imageUrl: string | null = upload?.fileUrl || null;

      // Fetch classification status and report
      const statusResp = await fetch(`/api/model/classify/${id}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!statusResp.ok) throw new Error('Failed to fetch classification status');
      const statusJson = await statusResp.json();
      if (!statusJson.success) throw new Error(statusJson.message || 'Failed to fetch classification status');

      const data = statusJson.data;
      if (data.status !== 'completed') {
        toast({ title: "Analysis not completed", description: `Current status: ${data.status}`, variant: "destructive" });
        return;
      }

      const classification = data.classification || undefined;
      const narrative = data.report || '';

      // Derive domain (fallback to plant)
      let domain: 'plant' | 'livestock' | 'fish' | undefined = 'plant';
      // Basic heuristic: if recommendations absent and breed present then livestock; else if tags include fish
      try {
        if (classification && typeof classification === 'object' && 'breed' in classification) {
          domain = 'livestock';
        } else if (Array.isArray(upload?.tags) && upload.tags.includes('fish')) {
          domain = 'fish';
        }
      } catch (e) {
        // Silently ignore domain detection errors; fallback remains 'plant'
      }

      setReportImageUrl(imageUrl);
      setReportMessage({
        id,
        type: 'ai',
        content: narrative || '',
        timestamp: new Date(data.updatedAt || Date.now()),
        classification,
        domain
      });
      setIsReportOpen(true);
    } catch (e) {
      toast({ title: "Failed to open report", description: e instanceof Error ? e.message : "Please try again", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">{t('profile.title')}</h1>
        <p className="text-muted-foreground">
          {t('profile.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="floating-card">
            <CardHeader className="text-center">
              <div className="relative mx-auto">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {profileData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <CardTitle className="text-xl">{profileData.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 justify-center">
                  <MapPin className="h-3 w-3" />
                  {profileData.location}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {profileData.bio}
                </p>
                <Badge variant="outline" className="bg-primary/10">
                  <Leaf className="h-3 w-3 mr-1" />
                  {t('profile.verifiedFarmer')}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t('profile.farmSize')}:</span>
                  <span className="text-muted-foreground">{profileData.farmSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{t('profile.primaryCrops')}:</span>
                </div>
                <p className="text-muted-foreground text-xs ml-6">
                  {profileData.primaryCrops}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="floating-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4" />
                {t('profile.activityStats')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('profile.totalAnalyses')}</span>
                <Badge variant="secondary">{stats.totalAnalyses}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('profile.healthyCrops')}</span>
                <Badge className="bg-success text-success-foreground">{stats.healthyDetections}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('profile.issuesFound')}</span>
                <Badge className="bg-warning text-warning-foreground">{stats.diseaseDetections}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('profile.chatSessions')}</span>
                <Badge variant="outline">{stats.chatSessions}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">{t('profile.profileSettings')}</TabsTrigger>
              <TabsTrigger value="history">{t('profile.activityHistory')}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card className="floating-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('profile.personalInformation')}</CardTitle>
                    <CardDescription>
                      {t('profile.updateProfileDetails')}
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        setIsEditing(false);
                      } else {
                        setIsEditing(true);
                      }
                    }}
                  >
                    {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    {isEditing ? t('common.cancel') : t('common.edit')}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('profile.fullName')}</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('login.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('profile.phoneNumber')}</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">{t('profile.location')}</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">{t('profile.bio')}</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="farmSize">{t('profile.farmSize')}</Label>
                      <Input
                        id="farmSize"
                        value={profileData.farmSize}
                        onChange={(e) => handleInputChange('farmSize', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryCrops">{t('profile.primaryCrops')}</Label>
                      <Input
                        id="primaryCrops"
                        value={profileData.primaryCrops}
                        onChange={(e) => handleInputChange('primaryCrops', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveProfile} className="bg-gradient-primary hover:opacity-90">
                        <Save className="mr-2 h-4 w-4" />
                        {t('profile.saveChanges')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card className="floating-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('profile.activityHistory')}</CardTitle>
                      <CardDescription>
                        {t('profile.recentAnalyses')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedIds.size === history.length && history.length > 0}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                        <span className="text-xs text-muted-foreground">Select all</span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedIds.size === 0 || isDeleting}
                        onClick={deleteSelected}
                      >
                        Delete selected
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {history.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 animate-scale-in">
                          <div className={`p-2 rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Checkbox
                                checked={selectedIds.has(item.id)}
                                onCheckedChange={() => toggleSelect(item.id)}
                                aria-label={`Select ${item.title}`}
                              />
                              <h4 className="font-medium text-sm">{item.title}</h4>
                              {item.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  {item.confidence}% confidence
                                </Badge>
                              )}
                              <div className="ml-auto">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isDeleting}
                                  onClick={() => deleteItem(item.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  Delete
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-2"
                                  onClick={() => viewReport(item.id)}
                                >
                                  View Report
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        message={reportMessage}
        imageUrl={reportImageUrl}
      />
    </div>
  );
};

export default Profile;