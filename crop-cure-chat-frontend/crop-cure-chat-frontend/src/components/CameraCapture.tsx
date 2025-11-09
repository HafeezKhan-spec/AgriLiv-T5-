import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, RotateCcw, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraCapture = ({ isOpen, onClose, onCapture }: CameraCaptureProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const usePhoto = () => {
    if (!capturedImage) return;

    // Convert data URL to File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
        handleClose();
      });
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    stopCamera();
    setTimeout(startCamera, 100);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  useEffect(() => {
    if (isOpen && !isStreaming && !capturedImage) {
      startCamera();
    }
    
    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen, facingMode]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Capture
          </DialogTitle>
        </DialogHeader>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-black rounded-lg overflow-hidden">
              {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-80 object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  
                  {isStreaming && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={switchCamera}
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        onClick={capturePhoto}
                        size="lg"
                        className="rounded-full w-16 h-16 bg-white text-black hover:bg-gray-200"
                      >
                        <Camera className="h-6 w-6" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClose}
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-80 object-cover"
                  />
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <Button
                      variant="outline"
                      onClick={retakePhoto}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retake
                    </Button>
                    
                    <Button
                      onClick={usePhoto}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Use Photo
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;