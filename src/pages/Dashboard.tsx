import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Eye, MousePointer } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">Meus Anúncios</h1>
          <Button className="gradient-bg">
            <Plus className="h-4 w-4 mr-2" />
            Novo Anúncio
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">0</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cliques em Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">0</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anúncios Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">0</span>
            </CardContent>
          </Card>
        </div>

        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">Você ainda não tem anúncios.</p>
          <Button className="mt-4 gradient-bg">
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro anúncio
          </Button>
        </div>
      </div>
    </Layout>
  );
}
