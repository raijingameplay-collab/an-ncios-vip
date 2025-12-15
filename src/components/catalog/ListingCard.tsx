import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Star } from 'lucide-react';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number | null;
    price_info: string | null;
    state: string;
    city: string;
    neighborhood: string | null;
    views_count: number;
    is_featured: boolean;
    main_photo_url?: string;
    has_active_highlight?: boolean;
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
        <div className="aspect-[4/5] relative overflow-hidden bg-muted">
          {listing.main_photo_url ? (
            <img
              src={listing.main_photo_url}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">📷</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {listing.has_active_highlight && (
              <Badge className="bg-accent text-accent-foreground">
                <Star className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            )}
            {listing.is_featured && !listing.has_active_highlight && (
              <Badge variant="secondary">
                Premium
              </Badge>
            )}
          </div>

          {/* Views */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur">
              <Eye className="h-3 w-3 mr-1" />
              {listing.views_count}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">
              {listing.city}, {listing.state}
              {listing.neighborhood && ` - ${listing.neighborhood}`}
            </span>
          </div>
          
          {listing.price ? (
            <p className="mt-2 font-bold text-lg text-primary">
              R$ {listing.price.toLocaleString('pt-BR')}
            </p>
          ) : listing.price_info ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {listing.price_info}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
