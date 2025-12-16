import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdvertiserProfile } from '@/hooks/useAdvertiserProfile';
import { updateListing } from '@/services/listings';
import { uploadListingPhoto, validateFileType, validateFileSize, FILE_LIMITS } from '@/services/storage';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Save, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ExistingPhoto {
  id: string;
  photo_url: string;
  is_main: boolean;
  display_order: number;
}

interface NewPhoto {
  file: File;
  preview: string;
}

export default function EditarItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useAdvertiserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    state: '',
    city: '',
    neighborhood: '',
    price: '',
    age: '',
  });

  useEffect(() => {
    async function fetchListing() {
      if (!id) return;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          listing_photos(id, photo_url, is_main, display_order)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast({
          title: "Erro",
          description: "Anúncio não encontrado",
          variant: "destructive",
        });
        navigate('/painel/itens');
        return;
      }

      setFormData({
        title: data.title || '',
        description: data.description || '',
        state: data.state || '',
        city: data.city || '',
        neighborhood: data.neighborhood || '',
        price: data.price?.toString() || '',
        age: data.age?.toString() || '',
      });

      setExistingPhotos(
        (data.listing_photos || []).sort((a: ExistingPhoto, b: ExistingPhoto) => a.display_order - b.display_order)
      );
      setLoading(false);
    }

    if (!profileLoading) {
      fetchListing();
    }
  }, [id, profileLoading, navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      if (!validateFileType(file, FILE_LIMITS.PHOTO.allowedTypes)) {
        toast({
          title: "Tipo inválido",
          description: `${file.name}: Use apenas JPG, PNG ou WebP`,
          variant: "destructive",
        });
        return false;
      }
      if (!validateFileSize(file, FILE_LIMITS.PHOTO.maxSizeMB)) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name}: Máximo ${FILE_LIMITS.PHOTO.maxSizeMB}MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const totalPhotos = existingPhotos.length - photosToDelete.length + newPhotos.length + validFiles.length;
    if (totalPhotos > 10) {
      toast({
        title: "Limite de fotos",
        description: "Máximo de 10 fotos por anúncio",
        variant: "destructive",
      });
      return;
    }

    const photos = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewPhotos(prev => [...prev, ...photos]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingPhoto = (photoId: string) => {
    setPhotosToDelete(prev => [...prev, photoId]);
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id || !id) return;

    if (!formData.title || !formData.description || !formData.state || !formData.city) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // 1. Update listing
      await updateListing(id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        state: formData.state.trim().toUpperCase(),
        city: formData.city.trim(),
        neighborhood: formData.neighborhood.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        age: formData.age ? parseInt(formData.age) : null,
      });

      // 2. Delete removed photos
      if (photosToDelete.length > 0) {
        await supabase
          .from('listing_photos')
          .delete()
          .in('id', photosToDelete);
      }

      // 3. Upload new photos
      if (newPhotos.length > 0) {
        const photoUrls = await Promise.all(
          newPhotos.map(p => uploadListingPhoto(p.file, id))
        );

        const remainingPhotosCount = existingPhotos.length - photosToDelete.length;
        const photoRecords = photoUrls.map((url, index) => ({
          listing_id: id,
          photo_url: url,
          is_main: remainingPhotosCount === 0 && index === 0,
          display_order: remainingPhotosCount + index,
        }));

        await supabase.from('listing_photos').insert(photoRecords);
      }

      toast({
        title: "Anúncio atualizado!",
        description: "Seu anúncio foi enviado para moderação",
      });

      navigate('/painel/itens');
    } catch (error: any) {
      console.error('Error updating listing:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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

  const visibleExistingPhotos = existingPhotos.filter(p => !photosToDelete.includes(p.id));
  const totalPhotos = visibleExistingPhotos.length + newPhotos.length;

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/painel/itens">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold">Editar Anúncio</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photos Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Fotos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {/* Existing Photos */}
                  {visibleExistingPhotos.map((photo, index) => (
                    <div key={photo.id} className="relative aspect-square group">
                      <img
                        src={photo.photo_url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(photo.id)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* New Photos */}
                  {newPhotos.map((photo, index) => (
                    <div key={`new-${index}`} className="relative aspect-square group">
                      <img
                        src={photo.preview}
                        alt={`Nova foto ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-dashed border-primary"
                      />
                      <span className="absolute bottom-1 left-1 text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                        Nova
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {totalPhotos < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-xs">Adicionar</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <p className="text-sm text-muted-foreground">
                  Adicione até 10 fotos. A primeira será a foto principal. Máximo 5MB cada.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Título do seu anúncio"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descreva seu anúncio em detalhes..."
                  rows={5}
                  maxLength={2000}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.description.length}/2000
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Ex: 25"
                    min={18}
                    max={99}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Valor (R$)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Ex: 200"
                    min={0}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Ex: SP"
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Ex: São Paulo"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  placeholder="Ex: Centro"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link to="/painel/itens">Cancelar</Link>
            </Button>
            <Button type="submit" className="gradient-bg" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Após editar, seu anúncio será enviado novamente para moderação.
          </p>
        </form>
      </div>
    </Layout>
  );
}
