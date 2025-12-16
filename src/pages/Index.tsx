import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ListingCard } from '@/components/catalog/ListingCard';
import { ListingCardSkeleton } from '@/components/catalog/ListingCardSkeleton';
import { ListingFilters } from '@/components/catalog/ListingFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, SlidersHorizontal } from 'lucide-react';
import type { ListingCard as ListingCardType } from '@/types/database';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 12;

export default function Index() {
  const [listings, setListings] = useState<ListingCardType[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    state: 'all',
    city: '',
    minPrice: '',
    maxPrice: '',
    tags: [] as string[],
  });

  // Ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchTags = async () => {
    const { data } = await supabase
      .from('service_tags')
      .select('id, name, slug')
      .eq('is_active', true);
    
    if (data) setTags(data);
  };

  const fetchListings = useCallback(async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Query otimizada com join de fotos e highlights
      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          price,
          price_info,
          state,
          city,
          neighborhood,
          views_count,
          is_featured,
          priority_level,
          advertiser_profiles!inner(display_name, is_verified),
          listing_photos(photo_url, is_main),
          highlights(id, is_active, expires_at)
        `)
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      // Apply filters
      if (filters.state && filters.state !== 'all') {
        query = query.eq('state', filters.state);
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.minPrice) {
        query = query.gte('price', parseFloat(filters.minPrice));
      }
      if (filters.maxPrice) {
        query = query.lte('price', parseFloat(filters.maxPrice));
      }
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching listings:', error);
        return;
      }

      // Transform data to ListingCard format
      const transformedListings: ListingCardType[] = (data || []).map((item: any) => {
        const mainPhoto = item.listing_photos?.find((p: any) => p.is_main)?.photo_url 
          || item.listing_photos?.[0]?.photo_url 
          || null;
        
        const hasActiveHighlight = item.highlights?.some(
          (h: any) => h.is_active && new Date(h.expires_at) > new Date()
        ) || false;

        return {
          id: item.id,
          title: item.title,
          city: item.city,
          state: item.state,
          price: item.price,
          age: null,
          is_featured: item.is_featured,
          views_count: item.views_count,
          main_photo_url: mainPhoto,
          advertiser_name: item.advertiser_profiles?.display_name || 'Anônimo',
          is_verified: item.advertiser_profiles?.is_verified || false,
          has_active_highlight: hasActiveHighlight,
        };
      });

      // Sort: highlights first, then featured, then rest
      transformedListings.sort((a, b) => {
        if (a.has_active_highlight && !b.has_active_highlight) return -1;
        if (!a.has_active_highlight && b.has_active_highlight) return 1;
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return 0;
      });

      if (reset) {
        setListings(transformedListings);
      } else {
        setListings(prev => [...prev, ...transformedListings]);
      }

      setHasMore((data?.length || 0) === PAGE_SIZE);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchTags();
  }, []);

  // Reload when filters change
  useEffect(() => {
    setPage(0);
    fetchListings(0, true);
  }, [fetchListings]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchListings(nextPage);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchListings(0, true);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="gradient-hero py-12 md:py-20">
        <div className="container text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold">
            Encontre os melhores
            <span className="gradient-text block">classificados</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Navegue por milhares de anúncios verificados e encontre exatamente o que procura.
          </p>
          
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar anúncios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button type="submit" className="h-12 px-6 gradient-bg">
                Buscar
              </Button>
            </div>
          </form>

          {/* Quick stats */}
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{listings.length}+</span>
              anúncios
            </span>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar filters - desktop */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="sticky top-20">
                <ListingFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableTags={tags}
                />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1">
              {/* Mobile filters */}
              <div className="lg:hidden mb-6">
                <ListingFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableTags={tags}
                />
              </div>

              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {loading ? 'Carregando...' : `${listings.length} anúncios encontrados`}
                </h2>
              </div>

              {/* Listings grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ListingCardSkeleton key={i} />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">
                    Nenhum anúncio encontrado
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Tente ajustar os filtros ou fazer uma nova busca para encontrar o que procura.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => {
                      setFilters({ state: 'all', city: '', minPrice: '', maxPrice: '', tags: [] });
                      setSearchQuery('');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {listings.map((listing, index) => (
                      <div
                        key={listing.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${Math.min(index, 11) * 50}ms` }}
                      >
                        <ListingCard listing={listing} />
                      </div>
                    ))}
                  </div>

                  {/* Infinite scroll trigger */}
                  <div ref={loadMoreRef} className="mt-8 flex justify-center">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Carregando mais anúncios...</span>
                      </div>
                    )}
                    {!hasMore && listings.length > 0 && (
                      <p className="text-muted-foreground text-sm">
                        Você chegou ao fim dos resultados
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
