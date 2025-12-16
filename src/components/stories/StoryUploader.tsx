import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Video, 
  Upload, 
  X, 
  Play, 
  Square, 
  Scissors,
  Check,
  Loader2 
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { uploadHighlight, FILE_LIMITS } from '@/services/storage';
import { supabase } from '@/integrations/supabase/client';

interface StoryUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  onSuccess?: () => void;
}

const MAX_DURATION = FILE_LIMITS.HIGHLIGHT.maxDurationSeconds;

export function StoryUploader({ 
  open, 
  onOpenChange, 
  listingId,
  onSuccess 
}: StoryUploaderProps) {
  const [mode, setMode] = useState<'select' | 'record' | 'trim' | 'preview'>('select');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, MAX_DURATION]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopRecording();
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const resetState = () => {
    stopRecording();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setMode('select');
    setVideoBlob(null);
    setVideoUrl(null);
    setIsRecording(false);
    setRecordingTime(0);
    setTrimRange([0, MAX_DURATION]);
    setVideoDuration(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 1280 },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
        setMode('preview');
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Auto-stop after max duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Não foi possível acessar a câmera');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!FILE_LIMITS.HIGHLIGHT.allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use MP4 ou WebM.');
      return;
    }

    if (file.size > FILE_LIMITS.HIGHLIGHT.maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${FILE_LIMITS.HIGHLIGHT.maxSizeMB}MB`);
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoBlob(file);
    
    // Check video duration
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      const duration = video.duration;
      setVideoDuration(duration);
      
      if (duration > MAX_DURATION) {
        setTrimRange([0, MAX_DURATION]);
        setMode('trim');
      } else {
        setTrimRange([0, duration]);
        setMode('preview');
      }
    };
    video.src = url;
  };

  const handleTrimChange = (value: number[]) => {
    const [start, end] = value;
    // Ensure max 30 second window
    if (end - start > MAX_DURATION) {
      setTrimRange([start, start + MAX_DURATION]);
    } else {
      setTrimRange([start, end] as [number, number]);
    }
  };

  const trimVideo = useCallback(async () => {
    if (!videoUrl || !videoBlob) return;
    
    // For now, we'll upload the full video and let the server handle trimming
    // or we can use the trim range metadata
    setMode('preview');
  }, [videoUrl, videoBlob]);

  const handleUpload = async () => {
    if (!videoBlob || !listingId) return;

    setUploading(true);
    try {
      // Convert webm to mp4 if needed, or upload as is
      const file = new File([videoBlob], `story_${Date.now()}.webm`, { 
        type: videoBlob.type 
      });
      
      const publicUrl = await uploadHighlight(file, listingId);
      
      // Calculate expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create highlight record
      const { error } = await supabase
        .from('highlights')
        .insert({
          listing_id: listingId,
          content_url: publicUrl,
          content_type: 'video',
          expires_at: expiresAt.toISOString(),
          is_active: true
        });

      if (error) throw error;

      toast.success('Story publicado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading story:', error);
      toast.error('Erro ao publicar story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'select' && 'Criar Story'}
            {mode === 'record' && 'Gravando...'}
            {mode === 'trim' && 'Cortar Vídeo'}
            {mode === 'preview' && 'Preview'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select mode */}
          {mode === 'select' && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => {
                  setMode('record');
                  startRecording();
                }}
              >
                <Video className="h-8 w-8" />
                <span>Gravar agora</span>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8" />
                <span>Da galeria</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Recording mode */}
          {mode === 'record' && (
            <div className="space-y-4">
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                {/* Recording indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  {recordingTime}s / {MAX_DURATION}s
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-16 h-16"
                  onClick={stopRecording}
                >
                  <Square className="h-6 w-6 fill-current" />
                </Button>
              </div>
            </div>
          )}

          {/* Trim mode */}
          {mode === 'trim' && videoUrl && (
            <div className="space-y-4">
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                <video
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  controls
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Vídeo muito longo ({Math.round(videoDuration)}s). Selecione até {MAX_DURATION} segundos.
                </p>
                <Slider
                  value={trimRange}
                  onValueChange={handleTrimChange}
                  max={videoDuration}
                  step={0.1}
                  className="py-4"
                />
                <p className="text-sm text-center">
                  {trimRange[0].toFixed(1)}s - {trimRange[1].toFixed(1)}s 
                  ({(trimRange[1] - trimRange[0]).toFixed(1)}s)
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={trimVideo} className="flex-1">
                  <Scissors className="h-4 w-4 mr-2" />
                  Aplicar
                </Button>
              </div>
            </div>
          )}

          {/* Preview mode */}
          {mode === 'preview' && videoUrl && (
            <div className="space-y-4">
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                <video
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                O story ficará disponível por 24 horas
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpload} 
                  className="flex-1"
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Publicar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
