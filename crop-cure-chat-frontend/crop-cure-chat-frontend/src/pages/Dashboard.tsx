import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReportModal from "@/components/ReportModal";
import { 
  Upload, 
  Camera, 
  Mic, 
  Send, 
  Paperclip, 
  Trash2, 
  Leaf, 
  Bot,
  User,
  FileText,
  Image as ImageIcon,
  Loader2,
  Download
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import CameraCapture from "@/components/CameraCapture";
import { useLanguage } from "@/contexts/LanguageContext";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface ClassificationResult {
  diseaseDetected: boolean;
  diseaseName: string;
  confidence: number;
  severity?: string;
  affectedArea?: number;
  recommendations: string[];
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: { name: string; type: string; url: string }[];
  classification?: ClassificationResult;
  domain?: 'plant' | 'livestock' | 'fish';
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  url: string;
  timestamp: Date;
  uploadId?: string; // ID returned from server after upload
}

const Dashboard = () => {
  const { t } = useLanguage();
  
  // Map confidence percentage to text color classes
  const confidenceColor = (val?: number) => {
    if (typeof val !== "number") return "text-muted-foreground";
    if (val <= 40) return "text-red-600"; // Low
    if (val <= 70) return "text-orange-500"; // Medium
    if (val <= 90) return "text-green-500"; // Good
    return "text-green-700"; // High
  };
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  
  // Fetch chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      
      try {
        setIsLoadingHistory(true);
        
        // First check if there are any existing sessions
        const sessionsResponse = await fetch('/api/chat/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const sessionsData = await sessionsResponse.json();
        
        if (sessionsData.success && sessionsData.data.sessions.length > 0) {
          // Use the most recent session
          const latestSession = sessionsData.data.sessions[0];
          setSessionId(latestSession._id);
          
          // Fetch messages for this session
          const historyResponse = await fetch(`/api/chat/history/${latestSession._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const historyData = await historyResponse.json();
          
          if (historyData.success) {
            // Transform messages to match our interface
            const formattedMessages = historyData.data.messages.map((msg: {
              _id: string;
              messageType: string;
              content: {
                text?: string;
                attachments?: Array<{
                  originalName: string;
                  mimeType: string;
                  fileUrl: string;
                }>;
              };
              createdAt: string;
            }) => ({
              id: msg._id,
              type: msg.messageType === 'user' ? 'user' : 'ai',
              content: msg.content.text || '',
              timestamp: new Date(msg.createdAt),
              attachments: msg.content.attachments?.map((att: { originalName: string; mimeType: string; fileUrl: string }) => ({
                name: att.originalName,
                type: att.mimeType,
                url: att.fileUrl
              }))
            }));
            
            setMessages(formattedMessages);
          }
        } else {
          // No existing sessions, create a welcome message
          setMessages([
            {
              id: '1',
              type: 'ai',
              content: 'Hello! I\'m your AgriClip AI assistant. I can help you identify crop diseases, provide treatment recommendations, and answer agricultural questions. Upload an image or ask me anything!',
              timestamp: new Date(),
            }
          ]);
}
      } catch (error) {
        console.error('Error fetching chat history:', error);
        // Set default welcome message on error
        setMessages([
          {
            id: '1',
            type: 'ai',
            content: 'Hello! I\'m your AgriClip AI assistant. I can help you identify crop diseases, provide treatment recommendations, and answer agricultural questions. Upload an image or ask me anything!',
            timestamp: new Date(),
          }
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchChatHistory();
  }, []);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraContext, setCameraContext] = useState<'crop' | 'chat'>('crop');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Domain selection state for post-upload classification
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<'plant' | 'livestock' | 'fish' | null>(null);
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [pendingMessageContent, setPendingMessageContent] = useState<string>('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Function to download analysis report
  const downloadReport = (messageContent: string, timestamp: Date) => {
    // Extract analysis data from message content
    const reportContent = `AgriClip AI Analysis Report\n` +
      `Generated on: ${timestamp.toLocaleString()}\n` +
      `\n${messageContent.replace(/\*\*/g, '').replace(/🔍|🦠|🎯|⚠️|📊|💊|✅|🌱|❌/g, '')}\n\n` +
      `Report generated by AgriClip AI - Advanced Crop Disease Detection System`;
    
    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AgriClip_Analysis_Report_${timestamp.toISOString().split('T')[0]}_${timestamp.getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded",
      description: "Analysis report has been saved to your downloads folder.",
    });
  };

  const handleFileUpload = async (files: FileList | null, context: 'crop' | 'chat' = 'crop') => {
    if (!files) return;

    const file = files[0];
    if (!file) return;

    // Check authentication
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({
        title: t('toast.authRequired'),
        description: t('toast.loginToUpload'),
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('toast.invalidFileType'),
        description: t('toast.uploadImageFile'),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Create form data for file upload
    const formData = new FormData();
    formData.append('image', file);
    formData.append('uploadType', context === 'crop' ? 'crop_analysis' : 'chat_attachment');

    try {
      // Track upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 100);

      // Upload file to server
      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      if (!uploadResponse.ok) {
        // Handle auth errors explicitly: clear session and redirect
        if (uploadResponse.status === 401) {
          try {
            const errJson = await uploadResponse.json();
            toast({
              title: t('toast.authRequired') || 'Authentication Required',
              description: errJson?.message || 'Your session expired. Please log in again.',
              variant: 'destructive',
            });
          } catch (_) {
            toast({
              title: t('toast.authRequired') || 'Authentication Required',
              description: 'Your session expired. Please log in again.',
              variant: 'destructive',
            });
          }
          localStorage.removeItem('authToken');
          localStorage.removeItem('userName');
          // Redirect to login/home
          window.location.href = '/';
          return;
        }
        // For other errors, try to surface server message
        try {
          const errJson = await uploadResponse.json();
          throw new Error(errJson?.message || 'File upload failed');
        } catch (_) {
          throw new Error('File upload failed');
        }
      }

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.message || 'File upload failed');
      }

      // Create temporary URL for preview
      const fileUrl = URL.createObjectURL(file);
      const newFile: UploadedFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl,
        timestamp: new Date(),
        uploadId: uploadData.data.uploadId // Store the upload ID from server
      };

      setUploadedFiles(prev => [newFile, ...prev]);
      setUploadProgress(100);
      
      // Prepare message content based on context
      const messageContent = context === 'crop' 
        ? 'I\'ve uploaded an image for analysis' 
        : 'I\'ve attached an image';
      
      // Create temporary message for UI
      const tempMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: messageContent,
        timestamp: new Date(),
        attachments: [{ name: file.name, type: file.type, url: fileUrl }],
      };
      
      // Add to UI immediately
      setMessages(prev => [...prev, tempMessage]);
      
      // Send message with attachment to API
      const messageResponse = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: {
            text: messageContent,
            attachments: [{
              uploadId: uploadData.data.uploadId,
              filename: uploadData.data.filename,
              originalName: file.name,
              mimeType: file.type
            }]
          },
          sessionId: sessionId || undefined,
          messageType: 'user',
          context: {
            conversationTopic: context === 'crop' ? 'crop_analysis' : 'general'
          }
        })
      });

      const messageData = await messageResponse.json();

      if (messageData.success) {
        // Update session ID if this is a new conversation
        if (!sessionId) {
          setSessionId(messageData.data.sessionId);
        }
        // Store pending classification info and open domain selection dialog
        setPendingUploadId(uploadData.data.uploadId);
        setPendingSessionId(sessionId || messageData.data.sessionId);
        // Prefer user's typed symptom description if available; otherwise use the generic message
        const contextText = (inputMessage && inputMessage.trim().length > 0)
          ? inputMessage.trim()
          : messageContent;
        setPendingMessageContent(contextText);
        setIsDomainDialogOpen(true);
      } else {
        toast({
          title: t('toast.error'),
          description: messageData.message || t('toast.messageFailed'),
          variant: "destructive",
        });
      }

      toast({
        title: t('toast.imageUploaded'),
        description: t('toast.analysisInProgress'),
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('toast.uploadFailed'),
        description: error instanceof Error ? error.message : t('toast.tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      scrollToBottom();
    }
  };

  // Trigger classification with selected domain
  const startClassification = async (domain: 'plant' | 'livestock' | 'fish') => {
    const token = localStorage.getItem("authToken");
    if (!token || !pendingUploadId) return;

    setIsDomainDialogOpen(false);
    setSelectedDomain(domain);

    const classifyResponse = await fetch('/api/model/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        uploadId: pendingUploadId,
        imageDomain: domain,
        cropType: domain === 'plant' ? 'general' : undefined,
        location: undefined,
        additionalInfo: { messageContent: pendingMessageContent },
        sessionId: pendingSessionId || undefined
      })
    });

    const classifyData = await classifyResponse.json();

    if (classifyData.success) {
      const domainLabel = domain === 'plant' ? 'crop' : domain === 'livestock' ? 'livestock' : 'fish';
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `🔄 Analyzing your ${domainLabel} image with AgriClip AI model... This may take a few seconds.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, processingMessage]);
      scrollToBottom();

      // Poll for classification results
      const pollForResults = async () => {
        try {
          const statusResponse = await fetch(`/api/model/classify/${pendingUploadId}/status`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const statusData = await statusResponse.json();

          if (statusData.success && statusData.data.status === 'completed') {
            let classification = statusData.data.classification as ClassificationResult;
            const report = statusData.data.report as string | undefined;

            // Compose chat content based on domain
            let analysisContent: string;
            if (domain === 'plant') {
              // Show structured fields for plants and append dynamic narrative if provided
              analysisContent = [
                `Disease: ${classification.diseaseName}`,
                classification.severity ? `Severity: ${classification.severity}` : undefined,
                `Confidence: ${classification.confidence}%`,
                typeof classification.affectedArea === 'number' ? `Affected Area: ${classification.affectedArea}%` : undefined,
              ].filter(Boolean).join('\n');
            } else {
              // For livestock/fish: only show name + confidence in chat
              analysisContent = [
                `Name: ${classification.diseaseName}`,
                `Confidence: ${classification.confidence}%`,
              ].join('\n');

              // Sanitize classification fields (hide plant-specific fields)
              classification = {
                diseaseDetected: classification.diseaseDetected,
                diseaseName: classification.diseaseName,
                confidence: classification.confidence,
                // omit severity, affectedArea, recommendations
              } as ClassificationResult;
            }

            // Append dynamic narrative from model service when available
            if (report && String(report).trim().length > 0) {
              analysisContent = `${analysisContent}\n\n${report}`;
            }

            const aiResponse: Message = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: analysisContent,
              timestamp: new Date(),
              classification,
              // Use the requested domain directly to avoid stale state
              domain
            };

            setMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== processingMessage.id);
              return [...filtered, aiResponse];
            });
            scrollToBottom();

            // Clear pending state
            setPendingUploadId(null);
            setPendingSessionId(null);
            setPendingMessageContent('');

          } else if (statusData.success && statusData.data.status === 'failed') {
            const errorMessage: Message = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: `❌ **Analysis Failed**\n\nSorry, there was an error analyzing your image: ${statusData.data.error || 'Unknown error'}\n\nPlease try uploading the image again or contact support if the issue persists.`,
              timestamp: new Date(),
            };

            setMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== processingMessage.id);
              return [...filtered, errorMessage];
            });
            scrollToBottom();

            setPendingUploadId(null);
            setPendingSessionId(null);
            setPendingMessageContent('');

          } else if (statusData.success && statusData.data.status === 'processing') {
            setTimeout(pollForResults, 2000);
          }

        } catch (error) {
          console.error('Error polling for classification results:', error);
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: 'ai',
            content: '❌ **Analysis Error**\n\nThere was an error retrieving the analysis results. Please try again.',
            timestamp: new Date(),
          };

          setMessages(prev => {
            const filtered = prev.filter(msg => msg.id !== processingMessage.id);
            return [...filtered, errorMessage];
          });
          scrollToBottom();

          setPendingUploadId(null);
          setPendingSessionId(null);
          setPendingMessageContent('');
        }
      };

      setTimeout(pollForResults, 3000);
    } else {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `❌ **Analysis Unavailable**\n\nI received your image but couldn't start the AI analysis. The image has been uploaded successfully.\n\nError: ${classifyData.message || 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
      scrollToBottom();
    }
  };

  const handleCameraCapture = (file: File) => {
    const fileList = new DataTransfer();
    fileList.items.add(file);
    handleFileUpload(fileList.files, cameraContext);
  };

  const openCamera = (context: 'crop' | 'chat') => {
    setCameraContext(context);
    setIsCameraOpen(true);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to send messages",
        variant: "destructive"
      });
      return;
    }

    // Create a temporary message to show immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    // Add to UI immediately for better UX
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Send message to API
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: {
            text: userMessage.content
          },
          sessionId: sessionId || undefined,
          messageType: 'user',
          context: {
            conversationTopic: 'general'
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update session ID if this is a new conversation
        if (!sessionId) {
          setSessionId(data.data.sessionId);
        }
        
        // Wait for AI response (the backend will generate it asynchronously)
        // Poll for new messages with retries to avoid missing slower generations
        const currentSessionId = sessionId || data.data.sessionId;
        let attempts = 0;
        const maxAttempts = 12; // ~12 seconds total
        const pollIntervalMs = 1000;

        const pollForAiResponse = async () => {
          attempts += 1;
          try {
            console.log(`Polling AI response (attempt ${attempts}) for sessionId:`, currentSessionId);
            const historyResponse = await fetch(`/api/chat/history/${currentSessionId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!historyResponse.ok) {
              console.error('History response not ok:', await historyResponse.text());
              throw new Error('History fetch failed');
            }

            const historyData = await historyResponse.json();
            if (historyData.success && historyData.data.messages) {
              const aiMessages = historyData.data.messages.filter((msg: { messageType: string }) => msg.messageType === 'ai');
              const latestAiMessage = aiMessages[aiMessages.length - 1];

              if (latestAiMessage && latestAiMessage.content?.text) {
                const aiResponse: Message = {
                  id: latestAiMessage._id,
                  type: 'ai',
                  content: latestAiMessage.content.text,
                  timestamp: new Date(latestAiMessage.createdAt),
                };

                setMessages(prev => {
                  const exists = prev.some(msg => msg.id === aiResponse.id);
                  return exists ? prev : [...prev, aiResponse];
                });

                setIsTyping(false);
                scrollToBottom();
                return; // Stop polling after receiving AI message
              }
            }

            if (attempts < maxAttempts) {
              setTimeout(pollForAiResponse, pollIntervalMs);
            } else {
              console.warn('AI response not received within expected time window');
              setIsTyping(false);
              scrollToBottom();
            }
          } catch (pollError) {
            console.error('Error polling for AI response:', pollError);
            if (attempts < maxAttempts) {
              setTimeout(pollForAiResponse, pollIntervalMs);
            } else {
              setIsTyping(false);
              scrollToBottom();
            }
          }
        };

        // Initial delay to give backend a head start
        setTimeout(pollForAiResponse, 1500);
        
      } else {
        toast({
          title: "Failed to send message",
          description: data.message || "Please try again",
          variant: "destructive"
        });
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      setIsTyping(false);
    }

    scrollToBottom();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    const token = localStorage.getItem("authToken");
    const performClear = async () => {
      try {
        if (token && sessionId) {
          await fetch(`/api/chat/session/${sessionId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }

        setMessages([
          {
            id: '1',
            type: 'ai',
            content: 'Chat cleared! How can I help you today?',
            timestamp: new Date(),
          }
        ]);
        setSessionId("");
        toast({
          title: t('toast.chatCleared'),
          description: t('toast.chatClearedDesc'),
        });
      } catch (error) {
        toast({
          title: "Failed to clear chat",
          description: "Please try again.",
          variant: "destructive"
        });
      }
    };

    performClear();
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6 text-center animate-fade-in">
        <h1 className="text-3xl font-bold gradient-text mb-2">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - Image Upload */}
        <div className="space-y-4 animate-slide-up">
          <Card className="floating-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                {t('dashboard.cropAnalysis')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div
                className="upload-area cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files, 'crop');
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="space-y-4">
                  <div className="mx-auto h-12 w-12 text-muted-foreground">
                    <ImageIcon className="h-full w-full" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      {t('dashboard.dropImage')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.clickToBrowse')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('dashboard.supportedFormats')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('dashboard.uploadingAndAnalyzing')}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  {t('dashboard.browseFiles')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openCamera('crop')}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {t('dashboard.takePhoto')}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files, 'crop')}
                className="hidden"
                aria-label="Upload crop image"
              />
              <input
                ref={chatFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files, 'chat')}
                className="hidden"
                aria-label="Upload chat image"
              />
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card className="floating-card">
            <CardHeader>
              <CardTitle className="text-sm">{t('dashboard.recentUploads')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                {uploadedFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('dashboard.noUploadsYet')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded border">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {file.timestamp.toLocaleTimeString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - AI Assistant */}
        <div className="flex flex-col animate-slide-up h-[calc(100vh-8rem)]">
          <Card className="floating-card flex-1 flex flex-col h-full">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  {t('dashboard.aiAssistant')}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <Separator className="flex-shrink-0" />
            
            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`chat-bubble ${
                          message.type === 'user' 
                            ? 'chat-bubble-user' 
                            : 'chat-bubble-ai'
                        }`}
                        id={`message-${message.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0">
                            {message.type === 'user' ? (
                              <User className="h-4 w-4 mt-1" />
                            ) : (
                              <Leaf className="h-4 w-4 mt-1 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                            {message.classification && (
                              <div className="mt-3 space-y-3">
                                <div className="flex gap-2 flex-wrap">
                                  {message.classification.diseaseName && (
                                    <Badge variant="secondary">{message.domain === 'plant' ? 'Disease' : 'Name'}: {message.classification.diseaseName}</Badge>
                                  )}
                                  {message.domain === 'plant' && message.classification.severity && (
                                    <Badge variant="outline">Severity: {message.classification.severity}</Badge>
                                  )}
                                </div>
                                <div className={`grid ${message.domain === 'plant' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Confidence
                                      {typeof message.classification.confidence === 'number' && (
                                        <span className={`ml-2 font-medium ${confidenceColor(message.classification.confidence)}`}>
                                          {message.classification.confidence}%
                                        </span>
                                      )}
                                    </p>
                                    <Progress value={message.classification.confidence} />
                                  </div>
                                  {message.domain === 'plant' && typeof message.classification.affectedArea === 'number' && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Affected Area</p>
                                      <Progress value={message.classification.affectedArea} />
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 h-40">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={
                                      message.domain === 'plant'
                                        ? [
                                            { name: 'Confidence', value: message.classification.confidence },
                                            { name: 'Affected Area', value: message.classification.affectedArea ?? 0 },
                                          ]
                                        : [
                                            { name: 'Confidence', value: message.classification.confidence },
                                          ]
                                    }>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="name" />
                                      <YAxis domain={[0, 100]} />
                                      <Tooltip />
                                      <Legend />
                                      <Bar dataKey="value" fill="#22c55e" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}
                            {message.attachments && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment, index) => (
                                  <div key={index} className="border rounded p-2">
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name}
                                      className="max-w-full h-32 object-cover rounded"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {attachment.name}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Download & View Report buttons for AI analysis */}
                            {message.type === 'ai' && (
                              <div className="mt-3 flex gap-2">
                                {message.classification && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setReportMessageId(message.id);
                                      setIsReportOpen(true);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <ImageIcon className="h-3 w-3" />
                                    View Report
                                  </Button>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="chat-bubble chat-bubble-ai">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {t('dashboard.aiIsTyping')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>

            {/* Message Input - Fixed at bottom */}
            <div className="p-4 border-t bg-background flex-shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => chatFileInputRef.current?.click()}
                      title="Attach file"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openCamera('chat')}
                      title="Take photo"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Voice input (coming soon)">
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('dashboard.askAboutCrops')}
                    className="resize-none"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Domain Selection Dialog */}
      <Dialog open={isDomainDialogOpen} onOpenChange={setIsDomainDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Image Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please choose what this image represents so we can analyze it correctly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button variant="default" onClick={() => startClassification('plant')} className="w-full">
                Plants
              </Button>
              <Button variant="secondary" onClick={() => startClassification('livestock')} className="w-full">
                Livestock
              </Button>
              <Button variant="outline" onClick={() => startClassification('fish')} className="w-full">
                Fish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        message={reportMessageId ? messages.find(m => m.id === reportMessageId) as Message : null}
        imageUrl={(() => {
          // Prefer attachments tied to the selected message; if not present, find latest user attachment
          const msg = reportMessageId ? messages.find(m => m.id === reportMessageId) : null;
          const aiIndex = msg ? messages.findIndex(m => m.id === msg.id) : -1;
          // Scan backwards for a user message with attachments
          for (let i = aiIndex - 1; i >= 0; i--) {
            const m = messages[i];
            if (m.type === 'user' && m.attachments && m.attachments.length) {
              return m.attachments[0].url;
            }
          }
          return null;
        })()}
      />
    </div>
  );
};

export default Dashboard;

// Function to download analysis report as PDF (text + chart)
const downloadReportPDF = async (message: Message) => {
  try {
    const el = document.getElementById(`message-${message.id}`);
    if (!el) {
      toast({ title: "Download failed", description: "Could not find report section.", variant: "destructive" });
      return;
    }
    const canvas = await html2canvas(el as HTMLElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.setFontSize(14);
    pdf.text("AgriClip AI Analysis Report", 10, 15);
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${message.timestamp.toLocaleString()}`, 10, 22);

    const y = 30;
    const availableHeight = pageHeight - y - 10;
    const scaledHeight = imgHeight > availableHeight ? availableHeight : imgHeight;
    const scaledWidth = imgWidth;

    pdf.addImage(imgData, 'PNG', 10, y, scaledWidth, scaledHeight);

    pdf.save(`AgriClip_Analysis_Report_${message.timestamp.toISOString().split('T')[0]}_${message.timestamp.getTime()}.pdf`);
    toast({ title: "Report Downloaded", description: "PDF saved to your downloads folder." });
  } catch (err) {
    console.error('PDF export error', err);
    toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
  }
};
