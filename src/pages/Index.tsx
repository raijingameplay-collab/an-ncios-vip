import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ListingCard } from '@/components/catalog/ListingCard';
import { ListingCardSkeleton } from '@/components/catalog/ListingCardSkeleton';
import { ListingFilters } from '@/components/catalog/ListingFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: number | null;
  price_info: string | null;
  state: string;
  city: string;
  neighborhood: string | null;
  views_count: number;
  is_featured: boolean;
  priority_level: number;
  main_photo_url?: string;
  has_active_highlight?: boolean;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

const PAGE_SIZE = 12;

export default function Index() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    state: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    tags: [] as string[],
  });

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
        priority_level
      `)
      .eq('status', 'approved')
      .order('priority_level', { ascending: false })
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    // Apply filters
    if (filters.state) {
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
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return;
    }

    // Fetch main photos for each listing
    const listingsWithPhotos = await Promise.all(
      (data || []).map(async (listing) => {
        const { data: photos } = await supabase
          .from('listing_photos')
          .select('photo_url')
          .eq('listing_id', listing.id)
          .eq('is_main', true)
          .limit(1);

        // Check for active highlights
        const { data: highlights } = await supabase
          .from('highlights')
          .select('id')
          .eq('listing_id', listing.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .limit(1);

        return {
          ...listing,
          main_photo_url: photos?.[0]?.photo_url,
          has_active_highlight: (highlights?.length || 0) > 0,
        };
      })
    );

    if (reset) {
      setListings(listingsWithPhotos);
    } else {
      setListings(prev => [...prev, ...listingsWithPhotos]);
    }

    setHasMore((data?.length || 0) === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    setPage(0);
    fetchListings(0, true);
  }, [fetchListings]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage);
  };

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
        </div>
      </section>

      {/* Catalog Section */}
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <ListingFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableTags={tags}
              />
            </aside>

            {/* Listings grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ListingCardSkeleton key={i} />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground">
                    Nenhum anúncio encontrado
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Tente ajustar os filtros ou fazer uma nova busca
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {listings.map((listing, index) => (
                      <div
                        key={listing.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <ListingCard listing={listing} />
                      </div>
                    ))}
                  </div>

                  {/* Load more */}
                  {hasMore && (
                    <div className="mt-8 text-center">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Carregar mais
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
