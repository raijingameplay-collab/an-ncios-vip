import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Calendar,
  DollarSign,
  CheckCircle,
  Share2,
  Heart,
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
  created_at: string;
  advertiser_profiles: {
    display_name: string;
    whatsapp: string | null;
    telegram: string | null;
    instagram: string | null;
    is_verified: boolean;
    bio: string | null;
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
            is_verified,
            bio
          )
        `)
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle();

      if (error || !listingData) {
        console.error('Error fetching listing:', error);
        setLoading(false);
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
  }, [id]);

  const handleContactClick = async (type: 'whatsapp' | 'telegram' | 'instagram') => {
    if (!listing) return;

    // Increment contact clicks
    await supabase
      .from('listings')
      .update({ contact_clicks: listing.contact_clicks + 1 })
      .eq('id', listing.id);

    const { advertiser_profiles: profile } = listing;

    if (type === 'whatsapp' && profile.whatsapp) {
      const message = encodeURIComponent(`Olá! Vi seu anúncio "${listing.title}" e gostaria de mais informações.`);
      window.open(`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
    } else if (type === 'telegram' && profile.telegram) {
      window.open(`https://t.me/${profile.telegram.replace('@', '')}`, '_blank');
    } else if (type === 'instagram' && profile.instagram) {
      window.open(`https://instagram.com/${profile.instagram.replace('@', '')}`, '_blank');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          url: url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copiado!',
        description: 'O link do anúncio foi copiado para sua área de transferência.',
      });
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

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (photos.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        setCurrentPhotoIndex(i => i === 0 ? photos.length - 1 : i - 1);
      } else if (e.key === 'ArrowRight') {
        setCurrentPhotoIndex(i => i === photos.length - 1 ? 0 : i + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 max-w-6xl">
          <Skeleton className="h-10 w-24 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[4/5] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Anúncio não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Este anúncio pode ter sido removido ou não está mais disponível.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao catálogo</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const { advertiser_profiles: profile } = listing;
  const hasContactInfo = profile.whatsapp || profile.telegram || profile.instagram;

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Photo gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] relative rounded-xl overflow-hidden bg-muted shadow-lg">
              {photos.length > 0 ? (
                <>
                  <img
                    src={photos[currentPhotoIndex].photo_url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Photo counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>

                  {/* Navigation arrows */}
                  {photos.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
                        onClick={() => setCurrentPhotoIndex(i => i === 0 ? photos.length - 1 : i - 1)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
                        onClick={() => setCurrentPhotoIndex(i => i === photos.length - 1 ? 0 : i + 1)}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}

                  {/* Badges overlay */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {listing.is_featured && (
                      <Badge className="gradient-bg shadow-lg">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Premium
                      </Badge>
                    )}
                    {profile.is_verified && (
                      <Badge className="bg-success text-success-foreground shadow-lg">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                  <span className="text-8xl mb-4">📷</span>
                  <p>Sem fotos disponíveis</p>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-transparent hover:border-muted-foreground/30'
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
            {/* Title and badges */}
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                {listing.title}
              </h1>
              
              {/* Location */}
              <div className="flex items-center gap-2 mt-3 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>
                  {listing.city}, {listing.state}
                  {listing.neighborhood && ` • ${listing.neighborhood}`}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {listing.views_count.toLocaleString('pt-BR')} visualizações
                </span>
              </div>
            </div>

            {/* Price */}
            {listing.price && (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-bold text-primary">
                  R$ {listing.price.toLocaleString('pt-BR')}
                </span>
                {listing.price_info && (
                  <span className="text-muted-foreground">/ {listing.price_info}</span>
                )}
              </div>
            )}

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3">
              {listing.age && (
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Idade</p>
                      <p className="font-semibold">{listing.age} anos</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {listing.price && (
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="font-semibold">R$ {listing.price.toLocaleString('pt-BR')}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tags/Categories */}
            {tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Categorias</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="px-3 py-1">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-3">Descrição</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>

            <Separator />

            {/* Advertiser info */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{profile.display_name}</p>
                    {profile.is_verified && (
                      <p className="text-sm text-success flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Anunciante verificado
                      </p>
                    )}
                  </div>
                </div>
                {profile.bio && (
                  <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Contact buttons */}
            {hasContactInfo ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Entrar em contato</h3>
                <div className="flex flex-col gap-2">
                  {profile.whatsapp && (
                    <Button
                      size="lg"
                      className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
                      onClick={() => handleContactClick('whatsapp')}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Conversar no WhatsApp
                    </Button>
                  )}
                  {profile.telegram && (
                    <Button
                      size="lg"
                      className="w-full bg-[#0088CC] hover:bg-[#0077B5] text-white"
                      onClick={() => handleContactClick('telegram')}
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Conversar no Telegram
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
                      Ver no Instagram
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center text-muted-foreground">
                  <p>Nenhuma informação de contato disponível</p>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              
              <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-muted-foreground">
                    <Flag className="h-4 w-4 mr-2" />
                    Denunciar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Denunciar anúncio</DialogTitle>
                    <DialogDescription>
                      Informe o motivo da denúncia. Nossa equipe analisará o caso com atenção.
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
                        <SelectItem value="scam">Golpe / Fraude</SelectItem>
                        <SelectItem value="other">Outro motivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Descreva o problema (opcional)"
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={4}
                    />
                    <Button
                      className="w-full"
                      onClick={handleReport}
                      disabled={!reportReason || submittingReport}
                    >
                      {submittingReport ? 'Enviando...' : 'Enviar denúncia'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
