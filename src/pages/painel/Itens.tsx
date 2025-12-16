import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdvertiserProfile } from '@/hooks/useAdvertiserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StoryUploader } from '@/components/stories';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Eye, Edit, Trash2, AlertCircle, Video, Sparkles } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  city: string;
  state: string;
  status: string;
  views_count: number;
  contact_clicks: number;
  created_at: string;
  rejection_reason: string | null;
  listing_photos: { photo_url: string; is_main: boolean }[];
  highlights?: { id: string; is_active: boolean; expires_at: string }[];
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  approved: { label: 'Ativo', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
  suspended: { label: 'Suspenso', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'outline' },
};

export default function PainelItens() {
  const { profile, loading: profileLoading } = useAdvertiserProfile();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [storyListingId, setStoryListingId] = useState<string | null>(null);

  const fetchListings = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('listings')
      .select(`
        id, title, city, state, status, views_count, contact_clicks, created_at, rejection_reason,
        listing_photos(photo_url, is_main),
        highlights(id, is_active, expires_at)
      `)
      .eq('advertiser_id', profile.id)
      .order('created_at', { ascending: false });

    setListings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!profileLoading && profile) {
      fetchListings();
    } else if (!profileLoading && !profile) {
      setLoading(false);
    }
  }, [profile, profileLoading]);

  const handleDelete = async (listingId: string) => {
    setDeletingId(listingId);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      setListings(prev => prev.filter(l => l.id !== listingId));
      toast({
        title: "Anúncio excluído",
        description: "O anúncio foi removido com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getMainPhoto = (listing: Listing) => {
    const mainPhoto = listing.listing_photos?.find(p => p.is_main);
    return mainPhoto?.photo_url || listing.listing_photos?.[0]?.photo_url;
  };

  const hasActiveStory = (listing: Listing) => {
    return listing.highlights?.some(
      h => h.is_active && new Date(h.expires_at) > new Date()
    ) || false;
  };

  if (profileLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">Meus Anúncios</h1>
          <Button asChild className="gradient-bg">
            <Link to="/painel/novo-item">
              <Plus className="h-4 w-4 mr-2" />
              Novo Anúncio
            </Link>
          </Button>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground mb-4">Você ainda não tem anúncios.</p>
            <Button asChild className="gradient-bg">
              <Link to="/painel/novo-item">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro anúncio
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted relative">
                      {getMainPhoto(listing) ? (
                        <img
                          src={getMainPhoto(listing)}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Eye className="h-6 w-6" />
                        </div>
                      )}
                      {hasActiveStory(listing) && (
                        <div className="absolute inset-0 ring-2 ring-primary ring-offset-1 rounded-lg" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold truncate">{listing.title}</h3>
                        <Badge variant={statusLabels[listing.status]?.variant || 'secondary'}>
                          {statusLabels[listing.status]?.label || listing.status}
                        </Badge>
                        {hasActiveStory(listing) && (
                          <Badge className="bg-accent text-accent-foreground">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Story Ativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {listing.city}, {listing.state}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {listing.views_count} views
                        </span>
                        <span>{listing.contact_clicks} cliques</span>
                      </div>

                      {/* Rejection reason */}
                      {listing.status === 'rejected' && listing.rejection_reason && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-destructive/10 rounded text-sm">
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          <span className="text-destructive">{listing.rejection_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-2 flex-wrap">
                      {listing.status === 'approved' && !hasActiveStory(listing) && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setStoryListingId(listing.id)}
                          title="Adicionar Story"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="icon" asChild>
                        <Link to={`/item/${listing.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <Link to={`/painel/editar/${listing.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O anúncio e todas as suas fotos serão removidos permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(listing.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deletingId === listing.id}
                            >
                              {deletingId === listing.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Excluir'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Story Uploader */}
      <StoryUploader
        open={!!storyListingId}
        onOpenChange={(open) => !open && setStoryListingId(null)}
        listingId={storyListingId || ''}
        onSuccess={() => {
          setStoryListingId(null);
          fetchListings();
        }}
      />
    </Layout>
  );
}
