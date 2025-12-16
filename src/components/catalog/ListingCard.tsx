import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Star, Sparkles, Calendar } from 'lucide-react';
import { StoryRing, StoryViewer } from '@/components/stories';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number | null;
    price_info?: string | null;
    state: string;
    city: string;
    neighborhood?: string | null;
    age?: number | null;
    views_count: number;
    is_featured: boolean;
    main_photo_url?: string | null;
    has_active_highlight?: boolean;
    highlight_url?: string | null;
    highlight_type?: 'image' | 'video' | null;
    advertiser_name?: string;
    is_verified?: boolean;
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const [storyOpen, setStoryOpen] = useState(false);

  const hasStory = listing.has_active_highlight && listing.highlight_url;

  const handleStoryClick = (e: React.MouseEvent) => {
    if (hasStory) {
      e.preventDefault();
      e.stopPropagation();
      setStoryOpen(true);
    }
  };

  const cardContent = (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 h-full">
      <div className="aspect-[4/5] relative overflow-hidden bg-muted">
        {listing.main_photo_url ? (
          <img
            src={listing.main_photo_url}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-4xl opacity-50">📷</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {listing.has_active_highlight && (
            <Badge className="bg-accent text-accent-foreground shadow-lg">
              <Sparkles className="h-3 w-3 mr-1" />
              Destaque
            </Badge>
          )}
          {listing.is_featured && !listing.has_active_highlight && (
            <Badge className="gradient-bg shadow-lg">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Premium
            </Badge>
          )}
        </div>

        {/* Verified badge */}
        {listing.is_verified && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-success/90 text-success-foreground">
              ✓ Verificado
            </Badge>
          </div>
        )}

        {/* Views overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center justify-between text-white text-sm">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {listing.views_count.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
          {listing.title}
        </h3>
        
        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {listing.city}, {listing.state}
          </span>
          {listing.age && (
            <span className="ml-auto flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {listing.age} anos
            </span>
          )}
        </div>
        
        <div className="mt-3 flex items-end justify-between">
          {listing.price ? (
            <p className="font-bold text-lg text-primary">
              R$ {listing.price.toLocaleString('pt-BR')}
            </p>
          ) : listing.price_info ? (
            <p className="text-sm text-muted-foreground">
              {listing.price_info}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Consultar
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Link to={`/item/${listing.id}`}>
        <StoryRing 
          hasStory={!!hasStory} 
          onClick={handleStoryClick}
        >
          {cardContent}
        </StoryRing>
      </Link>

      {/* Story Viewer */}
      {hasStory && (
        <StoryViewer
          open={storyOpen}
          onOpenChange={setStoryOpen}
          storyUrl={listing.highlight_url!}
          storyType={listing.highlight_type || 'video'}
          title={listing.title}
        />
      )}
    </>
  );
}
