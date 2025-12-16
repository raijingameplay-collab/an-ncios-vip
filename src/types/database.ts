/**
 * Tipos TypeScript para o banco de dados
 * Baseados no schema do Supabase com documentação detalhada
 */

import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

// ============================================
// ENUMS
// ============================================

/** Roles disponíveis no sistema */
export type AppRole = Enums<'app_role'>; // 'admin' | 'moderator' | 'advertiser'

/** Status de um anúncio */
export type ListingStatus = Enums<'listing_status'>; // 'pending' | 'approved' | 'rejected' | 'suspended' | 'expired'

/** Status de verificação de anunciante */
export type VerificationStatus = Enums<'verification_status'>; // 'pending' | 'approved' | 'rejected'

/** Motivos de denúncia */
export type ReportReason = Enums<'report_reason'>; // 'misleading' | 'fake' | 'inappropriate' | 'scam' | 'other'

/** Status de uma denúncia */
export type ReportStatus = Enums<'report_status'>; // 'pending' | 'reviewed' | 'resolved' | 'dismissed'

// ============================================
// TABELAS - Tipos de leitura (Row)
// ============================================

/**
 * Perfil básico do usuário
 * Criado automaticamente via trigger quando um usuário se registra
 */
export type Profile = Tables<'profiles'>;

/**
 * Roles do usuário
 * Separado do profile por segurança (evita escalação de privilégios)
 */
export type UserRole = Tables<'user_roles'>;

/**
 * Perfil de anunciante
 * Contém informações de contato e status de verificação
 */
export type AdvertiserProfile = Tables<'advertiser_profiles'>;

/**
 * Anúncio/Listing
 * Representa um item publicado na plataforma
 */
export type Listing = Tables<'listings'>;

/**
 * Foto de um anúncio
 * Cada anúncio pode ter múltiplas fotos
 */
export type ListingPhoto = Tables<'listing_photos'>;

/**
 * Tag de serviço/categoria
 * Lista controlada de categorias disponíveis
 */
export type ServiceTag = Tables<'service_tags'>;

/**
 * Relação entre anúncio e tags
 */
export type ListingTag = Tables<'listing_tags'>;

/**
 * Highlight/Story temporário
 * Conteúdo de destaque com duração limitada (24h)
 */
export type Highlight = Tables<'highlights'>;

/**
 * Plano de publicidade
 * Define limites e benefícios de cada nível
 */
export type Plan = Tables<'plans'>;

/**
 * Assinatura de um anunciante
 * Vincula um anunciante a um plano
 */
export type Subscription = Tables<'subscriptions'>;

/**
 * Denúncia de anúncio
 * Permite que usuários reportem conteúdo problemático
 */
export type Report = Tables<'reports'>;

/**
 * Documento de verificação
 * Armazena referências aos documentos enviados para verificação
 */
export type VerificationDocument = Tables<'verification_documents'>;

/**
 * Log de ações administrativas
 * Registra todas as ações de moderação
 */
export type AdminActionLog = Tables<'admin_action_logs'>;

// ============================================
// TABELAS - Tipos de inserção (Insert)
// ============================================

export type ProfileInsert = TablesInsert<'profiles'>;
export type UserRoleInsert = TablesInsert<'user_roles'>;
export type AdvertiserProfileInsert = TablesInsert<'advertiser_profiles'>;
export type ListingInsert = TablesInsert<'listings'>;
export type ListingPhotoInsert = TablesInsert<'listing_photos'>;
export type ListingTagInsert = TablesInsert<'listing_tags'>;
export type HighlightInsert = TablesInsert<'highlights'>;
export type SubscriptionInsert = TablesInsert<'subscriptions'>;
export type ReportInsert = TablesInsert<'reports'>;
export type VerificationDocumentInsert = TablesInsert<'verification_documents'>;
export type AdminActionLogInsert = TablesInsert<'admin_action_logs'>;

// ============================================
// TABELAS - Tipos de atualização (Update)
// ============================================

export type ProfileUpdate = TablesUpdate<'profiles'>;
export type AdvertiserProfileUpdate = TablesUpdate<'advertiser_profiles'>;
export type ListingUpdate = TablesUpdate<'listings'>;
export type ListingPhotoUpdate = TablesUpdate<'listing_photos'>;
export type HighlightUpdate = TablesUpdate<'highlights'>;
export type ReportUpdate = TablesUpdate<'reports'>;

// ============================================
// TIPOS COMPOSTOS (com relacionamentos)
// ============================================

/**
 * Anúncio com todas as informações relacionadas
 */
export interface ListingWithDetails extends Listing {
  advertiser_profiles: Pick<AdvertiserProfile, 'display_name' | 'is_verified' | 'whatsapp' | 'telegram' | 'instagram'> | null;
  listing_photos: ListingPhoto[];
  listing_tags: Array<{
    service_tags: ServiceTag | null;
  }>;
  highlights?: Highlight[];
}

/**
 * Anúncio para exibição no catálogo (resumido)
 */
export interface ListingCard {
  id: string;
  title: string;
  city: string;
  state: string;
  price: number | null;
  age: number | null;
  is_featured: boolean;
  views_count: number;
  main_photo_url: string | null;
  advertiser_name: string;
  is_verified: boolean;
  has_active_highlight: boolean;
}

/**
 * Denúncia com informações do anúncio
 */
export interface ReportWithListing extends Report {
  listings: Pick<Listing, 'id' | 'title'> | null;
}

/**
 * Anúncio pendente para moderação
 */
export interface PendingListing extends Listing {
  advertiser_profiles: Pick<AdvertiserProfile, 'display_name' | 'is_verified'> | null;
}

/**
 * Estatísticas do anunciante
 */
export interface AdvertiserStats {
  totalViews: number;
  totalClicks: number;
  activeListings: number;
  pendingListings: number;
}

/**
 * Filtros para busca de anúncios
 */
export interface ListingFilters {
  state?: string;
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minAge?: number;
  maxAge?: number;
  tags?: string[];
  status?: ListingStatus;
  isFeatured?: boolean;
}

/**
 * Opções de ordenação
 */
export type ListingSortOption = 
  | 'recent'
  | 'price_asc'
  | 'price_desc'
  | 'views'
  | 'priority';
