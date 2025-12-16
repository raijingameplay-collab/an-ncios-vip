/**
 * Service para operações com anúncios (listings)
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Listing, 
  ListingInsert, 
  ListingUpdate,
  ListingWithDetails,
  ListingCard,
  ListingFilters,
  ListingSortOption 
} from '@/types/database';

const PAGE_SIZE = 12;

/**
 * Busca anúncios aprovados com filtros e paginação
 */
export async function getApprovedListings(
  page: number = 0,
  filters: ListingFilters = {},
  sort: ListingSortOption = 'priority',
  search?: string
) {
  let query = supabase
    .from('listings')
    .select(`
      id, title, city, state, price, age, is_featured, views_count, priority_level,
      advertiser_profiles!inner(display_name, is_verified),
      listing_photos(photo_url, is_main),
      highlights(id, is_active, expires_at)
    `)
    .eq('status', 'approved');

  // Aplicar filtros
  if (filters.state && filters.state !== 'all') {
    query = query.eq('state', filters.state);
  }
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  if (filters.minPrice) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }

  // Busca por texto
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Ordenação
  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true, nullsFirst: false });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'views':
      query = query.order('views_count', { ascending: false });
      break;
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    default: // priority
      query = query
        .order('is_featured', { ascending: false })
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false });
  }

  // Paginação
  query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  // Transformar para ListingCard
  const listings: ListingCard[] = (data || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    city: item.city,
    state: item.state,
    price: item.price,
    age: item.age,
    is_featured: item.is_featured,
    views_count: item.views_count,
    main_photo_url: item.listing_photos?.find((p: any) => p.is_main)?.photo_url 
      || item.listing_photos?.[0]?.photo_url 
      || null,
    advertiser_name: item.advertiser_profiles?.display_name || 'Anônimo',
    is_verified: item.advertiser_profiles?.is_verified || false,
    has_active_highlight: item.highlights?.some(
      (h: any) => h.is_active && new Date(h.expires_at) > new Date()
    ) || false,
  }));

  return { listings, hasMore: (data?.length || 0) === PAGE_SIZE };
}

/**
 * Busca um anúncio por ID com todos os detalhes
 */
export async function getListingById(id: string): Promise<ListingWithDetails | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      advertiser_profiles(display_name, is_verified, whatsapp, telegram, instagram),
      listing_photos(id, photo_url, is_main, display_order),
      listing_tags(service_tags(id, name, slug)),
      highlights(id, content_url, content_type, is_active, expires_at)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as ListingWithDetails | null;
}

/**
 * Incrementa visualizações de um anúncio
 */
export async function incrementViews(id: string): Promise<void> {
  const { data: listing } = await supabase
    .from('listings')
    .select('views_count')
    .eq('id', id)
    .single();

  if (listing) {
    await supabase
      .from('listings')
      .update({ views_count: (listing.views_count || 0) + 1 })
      .eq('id', id);
  }
}

/**
 * Incrementa cliques de contato
 */
export async function incrementContactClicks(id: string): Promise<void> {
  const { data: listing } = await supabase
    .from('listings')
    .select('contact_clicks')
    .eq('id', id)
    .single();

  if (listing) {
    await supabase
      .from('listings')
      .update({ contact_clicks: (listing.contact_clicks || 0) + 1 })
      .eq('id', id);
  }
}

/**
 * Cria um novo anúncio
 */
export async function createListing(data: ListingInsert): Promise<Listing> {
  const { data: listing, error } = await supabase
    .from('listings')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return listing;
}

/**
 * Atualiza um anúncio existente
 */
export async function updateListing(id: string, data: ListingUpdate): Promise<Listing> {
  const { data: listing, error } = await supabase
    .from('listings')
    .update({ ...data, status: 'pending' }) // Re-submete para moderação
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return listing;
}

/**
 * Busca anúncios de um anunciante
 */
export async function getAdvertiserListings(advertiserId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, title, city, state, status, views_count, contact_clicks, created_at,
      listing_photos(photo_url, is_main)
    `)
    .eq('advertiser_id', advertiserId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Busca estatísticas do anunciante
 */
export async function getAdvertiserStats(advertiserId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('status, views_count, contact_clicks')
    .eq('advertiser_id', advertiserId);

  if (error) throw error;

  return {
    totalViews: data?.reduce((sum, l) => sum + (l.views_count || 0), 0) || 0,
    totalClicks: data?.reduce((sum, l) => sum + (l.contact_clicks || 0), 0) || 0,
    activeListings: data?.filter(l => l.status === 'approved').length || 0,
    pendingListings: data?.filter(l => l.status === 'pending').length || 0,
  };
}
