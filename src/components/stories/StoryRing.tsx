import { cn } from '@/lib/utils';

interface StoryRingProps {
  hasStory: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function StoryRing({ hasStory, children, className, onClick }: StoryRingProps) {
  if (!hasStory) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={cn(
        "relative cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Gradient ring */}
      <div className="absolute -inset-1 rounded-lg bg-gradient-to-tr from-primary via-accent to-primary animate-pulse" />
      <div className="absolute -inset-0.5 rounded-lg bg-background" />
      <div className="relative">
        {children}
      </div>
      {/* Story indicator badge */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
        <span className="px-2 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full shadow-lg whitespace-nowrap">
          STORY
        </span>
      </div>
    </div>
  );
}
