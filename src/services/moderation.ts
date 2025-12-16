/**
 * Service para operações de moderação (admin)
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Listing, 
  ListingStatus, 
  PendingListing,
  VerificationDocument,
  AdvertiserProfile 
} from '@/types/database';

/**
 * Busca anúncios pendentes de aprovação
 */
export async function getPendingListings(): Promise<PendingListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      advertiser_profiles(display_name, is_verified)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as unknown as PendingListing[]) || [];
}

/**
 * Aprova um anúncio
 */
export async function approveListing(listingId: string): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .update({
      status: 'approved' as ListingStatus,
      published_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .select()
    .single();

  if (error) throw error;

  // Registrar ação
  await logAdminAction('approve', 'listing', listingId);

  return data;
}

/**
 * Rejeita um anúncio
 */
export async function rejectListing(
  listingId: string, 
  reason: string
): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .update({
      status: 'rejected' as ListingStatus,
      rejection_reason: reason,
    })
    .eq('id', listingId)
    .select()
    .single();

  if (error) throw error;

  await logAdminAction('reject', 'listing', listingId, { reason });

  return data;
}

/**
 * Suspende um anúncio
 */
export async function suspendListing(
  listingId: string, 
  reason: string
): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .update({
      status: 'suspended' as ListingStatus,
      rejection_reason: reason,
    })
    .eq('id', listingId)
    .select()
    .single();

  if (error) throw error;

  await logAdminAction('suspend', 'listing', listingId, { reason });

  return data;
}

/**
 * Busca verificações pendentes
 */
export async function getPendingVerifications() {
  const { data, error } = await supabase
    .from('advertiser_profiles')
    .select(`
      *,
      verification_documents(id, document_url, selfie_url, created_at)
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Aprova verificação de anunciante
 */
export async function approveVerification(
  advertiserId: string
): Promise<AdvertiserProfile> {
  const { data, error } = await supabase
    .from('advertiser_profiles')
    .update({
      verification_status: 'approved',
      is_verified: true,
    })
    .eq('id', advertiserId)
    .select()
    .single();

  if (error) throw error;

  await logAdminAction('approve_verification', 'advertiser', advertiserId);

  return data;
}

/**
 * Rejeita verificação de anunciante
 */
export async function rejectVerification(
  advertiserId: string,
  notes: string
): Promise<AdvertiserProfile> {
  const { data: { user } } = await supabase.auth.getUser();

  // Atualizar status do anunciante
  const { data, error } = await supabase
    .from('advertiser_profiles')
    .update({
      verification_status: 'rejected',
      is_verified: false,
    })
    .eq('id', advertiserId)
    .select()
    .single();

  if (error) throw error;

  // Atualizar documento com notas
  await supabase
    .from('verification_documents')
    .update({
      notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id || null,
    })
    .eq('advertiser_id', advertiserId);

  await logAdminAction('reject_verification', 'advertiser', advertiserId, { notes });

  return data;
}

/**
 * Registra uma ação administrativa
 */
async function logAdminAction(
  actionType: string,
  targetType: string,
  targetId: string,
  details?: Record<string, any>
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  await supabase.from('admin_action_logs').insert({
    admin_id: user.id,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId,
    details: details || null,
  });
}

/**
 * Busca logs de ações administrativas
 */
export async function getAdminLogs(limit: number = 50) {
  const { data, error } = await supabase
    .from('admin_action_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Busca estatísticas de moderação
 */
export async function getModerationStats() {
  const [listings, reports, verifications] = await Promise.all([
    supabase.from('listings').select('status', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reports').select('status', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('advertiser_profiles').select('verification_status', { count: 'exact', head: true }).eq('verification_status', 'pending'),
  ]);

  return {
    pendingListings: listings.count || 0,
    pendingReports: reports.count || 0,
    pendingVerifications: verifications.count || 0,
  };
}
