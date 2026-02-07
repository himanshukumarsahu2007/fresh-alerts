import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, RotateCcw, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CameraScannerProps {
  scanType: "product_name" | "expiry_date";
  onResult: (result: string) => void;
  onClose: () => void;
}

const CameraScanner = ({ scanType, onResult, onClose }: CameraScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

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

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

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
      onResult(result);
      onClose();
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">
            Scan {scanType === "product_name" ? "Product Name" : "Expiry Date"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {!isCameraActive && !capturedImage && (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <Camera className="h-12 w-12 text-muted-foreground" />
                <Button onClick={startCamera}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              </div>
            )}
            {isCameraActive && !capturedImage && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
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
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <p className="text-center text-sm text-muted-foreground">
            {scanType === "product_name"
              ? "Point the camera at the product label or packaging"
              : "Point the camera at the expiry date on the packaging"}
          </p>

          <div className="flex justify-center gap-3">
            {isCameraActive && !capturedImage && (
              <Button onClick={captureImage} size="lg" className="gap-2">
                <Camera className="h-5 w-5" />
                Capture
              </Button>
            )}
            {capturedImage && !isProcessing && (
              <>
                <Button variant="outline" onClick={retakePhoto} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={processImage} className="gap-2">
                  <Check className="h-4 w-4" />
                  Use Photo
                </Button>
              </>
            )}
            {isProcessing && (
              <Button disabled className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraScanner;
