import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw, Check, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ScanProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scanType = searchParams.get("type") as "product_name" | "expiry_date" || "product_name";
  
  const { user, loading } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      // Request camera with back camera preference
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });
        
        await videoRef.current.play();
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      const errorName = (error as Error).name;
      
      if (errorName === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera permissions in your browser settings.");
      } else if (errorName === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (errorName === "NotReadableError") {
        setCameraError("Camera is in use by another application.");
      } else {
        setCameraError("Could not access camera. Please check permissions.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  // Auto-start camera on mount
  useEffect(() => {
    if (!loading && user) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [loading, user]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const processImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-text", {
        body: {
          imageBase64: capturedImage,
          extractType: scanType,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const result = data.result;
      
      if (scanType === "expiry_date" && result === "NOT_FOUND") {
        toast.error("Could not find an expiry date. Please try again.");
        retakePhoto();
        return;
      }

      if (scanType === "product_name" && result === "Unknown Product") {
        toast.error("Could not identify the product. Please try again.");
        retakePhoto();
        return;
      }

      toast.success(`${scanType === "product_name" ? "Product name" : "Expiry date"} detected!`);
      
      // Navigate back to dashboard with the scanned result
      navigate(`/dashboard?scanned_${scanType}=${encodeURIComponent(result)}`);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    stopCamera();
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-white/20">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-medium text-white">
          Scan {scanType === "product_name" ? "Product Name" : "Expiry Date"}
        </h1>
        <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-white/20">
          <X className="h-6 w-6" />
        </Button>
      </header>

      {/* Camera View */}
      <div className="relative flex flex-1 items-center justify-center">
        {cameraError && (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <Camera className="h-16 w-16 text-muted-foreground" />
            <p className="text-white">{cameraError}</p>
            <Button onClick={startCamera} variant="secondary">
              Try Again
            </Button>
          </div>
        )}

        {!cameraError && !isCameraActive && !capturedImage && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="text-white">Starting camera...</p>
          </div>
        )}

        {isCameraActive && !capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="h-full w-full object-cover"
          />
        )}

        {/* Scanning guide overlay */}
        {isCameraActive && !capturedImage && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-72 rounded-lg border-2 border-dashed border-white/50" />
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Instructions */}
      <div className="bg-black/80 px-4 py-3 text-center">
        <p className="text-sm text-white/80">
          {scanType === "product_name"
            ? "Point camera at the product label or packaging"
            : "Point camera at the expiry date on the packaging"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 bg-black p-6">
        {isCameraActive && !capturedImage && (
          <Button
            onClick={captureImage}
            size="lg"
            className="h-16 w-16 rounded-full bg-white hover:bg-white/90"
          >
            <Camera className="h-8 w-8 text-black" />
          </Button>
        )}

        {capturedImage && !isProcessing && (
          <>
            <Button
              variant="outline"
              onClick={retakePhoto}
              className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/20"
            >
              <RotateCcw className="h-5 w-5" />
              Retake
            </Button>
            <Button onClick={processImage} className="gap-2">
              <Check className="h-5 w-5" />
              Use Photo
            </Button>
          </>
        )}

        {isProcessing && (
          <Button disabled className="gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </Button>
        )}
      </div>
    </div>
  );
};

export default ScanProduct;
