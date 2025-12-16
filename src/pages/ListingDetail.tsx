import { useEffect, useState } from 'react';
// Note: This page is now accessible via /item/:id
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  MessageCircle,
  Send,
  Instagram,
  Eye,
  Flag,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: number | null;
  price_info: string | null;
  state: string;
  city: string;
  neighborhood: string | null;
  age: number | null;
  views_count: number;
  contact_clicks: number;
  is_featured: boolean;
  advertiser_profiles: {
    display_name: string;
    whatsapp: string | null;
    telegram: string | null;
    instagram: string | null;
    is_verified: boolean;
  };
}

interface Photo {
  id: string;
  photo_url: string;
  is_main: boolean;
}

interface Tag {
  id: string;
  name: string;
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      // Fetch listing with advertiser profile
      const { data: listingData, error } = await supabase
        .from('listings')
        .select(`
          *,
          advertiser_profiles (
            display_name,
            whatsapp,
            telegram,
            instagram,
            is_verified
          )
        `)
        .eq('id', id)
        .eq('status', 'approved')
        .single();

      if (error || !listingData) {
        console.error('Error fetching listing:', error);
        navigate('/');
        return;
      }

      setListing(listingData as ListingDetail);

      // Fetch photos
      const { data: photosData } = await supabase
        .from('listing_photos')
        .select('id, photo_url, is_main')
        .eq('listing_id', id)
        .order('is_main', { ascending: false })
        .order('display_order');

      if (photosData) setPhotos(photosData);

      // Fetch tags
      const { data: tagsData } = await supabase
        .from('listing_tags')
        .select('tag_id, service_tags(id, name)')
        .eq('listing_id', id);

      if (tagsData) {
        setTags(tagsData.map(t => t.service_tags as unknown as Tag).filter(Boolean));
      }

      // Increment view count
      await supabase
        .from('listings')
        .update({ views_count: (listingData.views_count || 0) + 1 })
        .eq('id', id);

      setLoading(false);
    };

    fetchListing();
  }, [id, navigate]);

  const handleContactClick = async (type: 'whatsapp' | 'telegram' | 'instagram') => {
    if (!listing) return;

    // Increment contact clicks
    await supabase
      .from('listings')
      .update({ contact_clicks: listing.contact_clicks + 1 })
      .eq('id', listing.id);

    const { advertiser_profiles: profile } = listing;

    if (type === 'whatsapp' && profile.whatsapp) {
      window.open(`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`, '_blank');
    } else if (type === 'telegram' && profile.telegram) {
      window.open(`https://t.me/${profile.telegram.replace('@', '')}`, '_blank');
    } else if (type === 'instagram' && profile.instagram) {
      window.open(`https://instagram.com/${profile.instagram.replace('@', '')}`, '_blank');
    }
  };

  const handleReport = async () => {
    if (!reportReason || !id) return;

    setSubmittingReport(true);

    const { error } = await supabase
      .from('reports')
      .insert({
        listing_id: id,
        reason: reportReason as 'misleading' | 'fake' | 'inappropriate' | 'scam' | 'other',
        details: reportDetails || null,
      });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar denúncia',
        description: 'Tente novamente mais tarde.',
      });
    } else {
      toast({
        title: 'Denúncia enviada',
        description: 'Sua denúncia será analisada pela nossa equipe.',
      });
      setReportOpen(false);
      setReportReason('');
      setReportDetails('');
    }

    setSubmittingReport(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[4/5] rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-xl text-muted-foreground">Anúncio não encontrado</p>
        </div>
      </Layout>
    );
  }

  const { advertiser_profiles: profile } = listing;

  return (
    <Layout>
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Photo gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] relative rounded-lg overflow-hidden bg-muted">
              {photos.length > 0 ? (
                <>
                  <img
                    src={photos[currentPhotoIndex].photo_url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  {photos.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                        onClick={() => setCurrentPhotoIndex(i => i === 0 ? photos.length - 1 : i - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setCurrentPhotoIndex(i => i === photos.length - 1 ? 0 : i + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <span className="text-6xl">📷</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      index === currentPhotoIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={photo.photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {listing.is_featured && (
                  <Badge className="bg-accent">
                    <Star className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {profile.is_verified && (
                  <Badge variant="secondary">Verificado</Badge>
                )}
              </div>

              <h1 className="font-display text-3xl font-bold">{listing.title}</h1>
              
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {listing.city}, {listing.state}
                    {listing.neighborhood && ` - ${listing.neighborhood}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{listing.views_count} views</span>
                </div>
              </div>

              {listing.price && (
                <p className="mt-4 text-3xl font-bold text-primary">
                  R$ {listing.price.toLocaleString('pt-BR')}
                </p>
              )}
              {listing.price_info && (
                <p className="text-muted-foreground">{listing.price_info}</p>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="font-semibold mb-2">Descrição</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* Advertiser info */}
            <Card>
              <CardContent className="p-4">
                <p className="font-semibold">{profile.display_name}</p>
                {profile.is_verified && (
                  <p className="text-sm text-muted-foreground">Anunciante verificado</p>
                )}
              </CardContent>
            </Card>

            {/* Contact buttons */}
            <div className="flex flex-col gap-3">
              {profile.whatsapp && (
                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleContactClick('whatsapp')}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  WhatsApp
                </Button>
              )}
              {profile.telegram && (
                <Button
                  size="lg"
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={() => handleContactClick('telegram')}
                >
                  <Send className="h-5 w-5 mr-2" />
                  Telegram
                </Button>
              )}
              {profile.instagram && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleContactClick('instagram')}
                >
                  <Instagram className="h-5 w-5 mr-2" />
                  Instagram
                </Button>
              )}
            </div>

            {/* Report button */}
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground">
                  <Flag className="h-4 w-4 mr-2" />
                  Denunciar anúncio
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Denunciar anúncio</DialogTitle>
                  <DialogDescription>
                    Informe o motivo da denúncia. Nossa equipe analisará o caso.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Select value={reportReason} onValueChange={setReportReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="misleading">Conteúdo enganoso</SelectItem>
                      <SelectItem value="fake">Perfil falso</SelectItem>
                      <SelectItem value="inappropriate">Conteúdo inapropriado</SelectItem>
                      <SelectItem value="scam">Golpe</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Detalhes adicionais (opcional)"
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    onClick={handleReport}
                    disabled={!reportReason || submittingReport}
                  >
                    Enviar denúncia
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </Layout>
  );
}
