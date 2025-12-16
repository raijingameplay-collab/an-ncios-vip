import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdvertiserProfile } from '@/hooks/useAdvertiserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Eye, Edit, Trash2 } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  city: string;
  state: string;
  status: string;
  views_count: number;
  contact_clicks: number;
  created_at: string;
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
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      if (!profile?.id) return;

      const { data } = await supabase
        .from('listings')
        .select('id, title, city, state, status, views_count, contact_clicks, created_at')
        .eq('advertiser_id', profile.id)
        .order('created_at', { ascending: false });

      setListings(data || []);
      setLoading(false);
    }

    if (!profileLoading && profile) {
      fetchListings();
    } else if (!profileLoading && !profile) {
      setLoading(false);
    }
  }, [profile, profileLoading]);

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
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{listing.title}</h3>
                        <Badge variant={statusLabels[listing.status]?.variant || 'secondary'}>
                          {statusLabels[listing.status]?.label || listing.status}
                        </Badge>
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
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link to={`/item/${listing.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
