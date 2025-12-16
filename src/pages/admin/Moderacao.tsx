import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, Eye, Users, FileText, Flag } from 'lucide-react';

interface PendingListing {
  id: string;
  title: string;
  city: string;
  state: string;
  created_at: string;
  advertiser_profiles: {
    display_name: string;
  };
}

interface PendingReport {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  listings: {
    title: string;
  };
}

export default function AdminModeracao() {
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [listingsRes, reportsRes] = await Promise.all([
        supabase
          .from('listings')
          .select('id, title, city, state, created_at, advertiser_profiles(display_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),
        supabase
          .from('reports')
          .select('id, reason, details, created_at, listings(title)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),
      ]);

      setPendingListings((listingsRes.data as unknown as PendingListing[]) || []);
      setPendingReports((reportsRes.data as unknown as PendingReport[]) || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
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
        <h1 className="font-display text-3xl font-bold mb-8">Moderação</h1>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anúncios Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-warning" />
                <span className="text-2xl font-bold">{pendingListings.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verificações Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">0</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Denúncias Abertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-destructive" />
                <span className="text-2xl font-bold">{pendingReports.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ações Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-2xl font-bold">0</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">
              Anúncios ({pendingListings.length})
            </TabsTrigger>
            <TabsTrigger value="reports">
              Denúncias ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="verifications">
              Verificações (0)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {pendingListings.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Nenhum anúncio pendente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingListings.map((listing) => (
                  <Card key={listing.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{listing.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {listing.city}, {listing.state} •{' '}
                            {listing.advertiser_profiles?.display_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button variant="default" size="sm" className="bg-success hover:bg-success/90">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button variant="destructive" size="sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports">
            {pendingReports.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Nenhuma denúncia pendente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{report.listings?.title}</h3>
                            <Badge variant="outline">{report.reason}</Badge>
                          </div>
                          {report.details && (
                            <p className="text-sm text-muted-foreground">{report.details}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Anúncio
                          </Button>
                          <Button variant="destructive" size="sm">
                            Resolver
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verifications">
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Nenhuma verificação pendente.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
