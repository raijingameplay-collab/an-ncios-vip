import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { approveListing, rejectListing } from '@/services/moderation';
import { Loader2, CheckCircle, XCircle, Eye, Users, FileText, Flag, ExternalLink } from 'lucide-react';

interface PendingListing {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  price: number | null;
  age: number | null;
  created_at: string;
  advertiser_profiles: {
    display_name: string;
    is_verified: boolean;
  } | null;
  listing_photos: { photo_url: string; is_main: boolean }[];
}

interface PendingReport {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  listing_id: string;
  listings: {
    id: string;
    title: string;
  } | null;
}

export default function AdminModeracao() {
  const { toast } = useToast();
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewListing, setPreviewListing] = useState<PendingListing | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [listingsRes, reportsRes] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, description, city, state, price, age, created_at, advertiser_profiles(display_name, is_verified), listing_photos(photo_url, is_main)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true }),
      supabase
        .from('reports')
        .select('id, reason, details, created_at, listing_id, listings(id, title)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true }),
    ]);

    setPendingListings((listingsRes.data as unknown as PendingListing[]) || []);
    setPendingReports((reportsRes.data as unknown as PendingReport[]) || []);
    setLoading(false);
  }

  const handleApprove = async () => {
    if (!selectedListing) return;
    
    setProcessingId(selectedListing.id);
    try {
      await approveListing(selectedListing.id);
      setPendingListings(prev => prev.filter(l => l.id !== selectedListing.id));
      toast({
        title: "Anúncio aprovado",
        description: "O anúncio foi publicado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
      setApproveDialogOpen(false);
      setSelectedListing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedListing || !rejectionReason.trim()) return;
    
    setProcessingId(selectedListing.id);
    try {
      await rejectListing(selectedListing.id, rejectionReason.trim());
      setPendingListings(prev => prev.filter(l => l.id !== selectedListing.id));
      toast({
        title: "Anúncio rejeitado",
        description: "O anunciante será notificado",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
      setRejectDialogOpen(false);
      setSelectedListing(null);
      setRejectionReason('');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    setProcessingId(reportId);
    try {
      await supabase
        .from('reports')
        .update({ status: 'resolved', reviewed_at: new Date().toISOString() })
        .eq('id', reportId);
      
      setPendingReports(prev => prev.filter(r => r.id !== reportId));
      toast({
        title: "Denúncia resolvida",
        description: "A denúncia foi marcada como resolvida",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getMainPhoto = (listing: PendingListing) => {
    const mainPhoto = listing.listing_photos?.find(p => p.is_main);
    return mainPhoto?.photo_url || listing.listing_photos?.[0]?.photo_url;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
                <FileText className="h-5 w-5 text-yellow-500" />
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
                Total Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{pendingListings.length + pendingReports.length}</span>
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
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum anúncio pendente de moderação.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingListings.map((listing) => (
                  <Card key={listing.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          {getMainPhoto(listing) ? (
                            <img
                              src={getMainPhoto(listing)}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <FileText className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{listing.title}</h3>
                            {listing.advertiser_profiles?.is_verified && (
                              <Badge variant="secondary" className="text-xs">Verificado</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {listing.city}, {listing.state}
                            {listing.price && ` • R$ ${listing.price}`}
                            {listing.age && ` • ${listing.age} anos`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Por: {listing.advertiser_profiles?.display_name || 'Desconhecido'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enviado em {formatDate(listing.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPreviewListing(listing);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedListing(listing);
                              setApproveDialogOpen(true);
                            }}
                            disabled={processingId === listing.id}
                          >
                            {processingId === listing.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedListing(listing);
                              setRejectDialogOpen(true);
                            }}
                            disabled={processingId === listing.id}
                          >
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
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
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
                            <h3 className="font-semibold">{report.listings?.title || 'Anúncio removido'}</h3>
                            <Badge variant="outline">{report.reason}</Badge>
                          </div>
                          {report.details && (
                            <p className="text-sm text-muted-foreground mb-2">{report.details}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Denunciado em {formatDate(report.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {report.listings && (
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/item/${report.listings.id}`} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Ver Anúncio
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleResolveReport(report.id)}
                            disabled={processingId === report.id}
                          >
                            {processingId === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Resolver'
                            )}
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
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma verificação pendente.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewListing?.title}</DialogTitle>
            <DialogDescription>
              {previewListing?.city}, {previewListing?.state}
            </DialogDescription>
          </DialogHeader>
          
          {previewListing && (
            <div className="space-y-4">
              {/* Photos */}
              {previewListing.listing_photos && previewListing.listing_photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previewListing.listing_photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo.photo_url}
                      alt={`Foto ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Details */}
              <div className="space-y-2">
                <div className="flex gap-4 text-sm">
                  {previewListing.price && (
                    <span><strong>Valor:</strong> R$ {previewListing.price}</span>
                  )}
                  {previewListing.age && (
                    <span><strong>Idade:</strong> {previewListing.age} anos</span>
                  )}
                </div>
                <div>
                  <strong className="text-sm">Descrição:</strong>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                    {previewListing.description}
                  </p>
                </div>
                <div className="text-sm">
                  <strong>Anunciante:</strong> {previewListing.advertiser_profiles?.display_name}
                  {previewListing.advertiser_profiles?.is_verified && (
                    <Badge variant="secondary" className="ml-2 text-xs">Verificado</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setPreviewOpen(false);
                setSelectedListing(previewListing);
                setApproveDialogOpen(true);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprovar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setPreviewOpen(false);
                setSelectedListing(previewListing);
                setRejectDialogOpen(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              O anúncio "{selectedListing?.title}" será publicado e ficará visível para todos os usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={processingId === selectedListing?.id}
            >
              {processingId === selectedListing?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Aprovar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar anúncio</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O anunciante receberá esta informação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo da rejeição *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Conteúdo inapropriado, informações incompletas, fotos inadequadas..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingId === selectedListing?.id}
            >
              {processingId === selectedListing?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Rejeitar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
