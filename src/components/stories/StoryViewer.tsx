import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyUrl: string;
  storyType: 'image' | 'video';
  title?: string;
}

export function StoryViewer({ 
  open, 
  onOpenChange, 
  storyUrl, 
  storyType,
  title 
}: StoryViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && videoRef.current && storyType === 'video') {
      videoRef.current.play();
    }
  }, [open, storyType]);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      setPaused(false);
    }
  }, [open]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  const handleVideoEnd = () => {
    onOpenChange(false);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted(!muted);
    if (videoRef.current) {
      videoRef.current.muted = !muted;
    }
  };

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      setPaused(!paused);
    }
  };

  // For images, auto-close after 5 seconds
  useEffect(() => {
    if (open && storyType === 'image') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            onOpenChange(false);
            return 0;
          }
          return prev + 2; // 5 seconds = 100/2 = 50 intervals * 100ms
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [open, storyType, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-black border-none overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2">
          <Progress value={progress} className="h-1 bg-white/30" />
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4 flex items-center justify-between">
          {title && (
            <span className="text-white font-medium text-sm truncate">
              {title}
            </span>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="ml-auto p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="aspect-[9/16] relative bg-black flex items-center justify-center"
          onClick={storyType === 'video' ? togglePause : undefined}
        >
          {storyType === 'video' ? (
            <>
              <video
                ref={videoRef}
                src={storyUrl}
                className="w-full h-full object-contain"
                playsInline
                muted={muted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
              />
              {/* Video controls */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
              {/* Pause indicator */}
              {paused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-16 w-16 text-white" />
                </div>
              )}
            </>
          ) : (
            <img
              src={storyUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
