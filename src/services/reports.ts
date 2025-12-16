/**
 * Service para operações com denúncias (reports)
 */

import { supabase } from '@/integrations/supabase/client';
import type { Report, ReportInsert, ReportWithListing, ReportReason, ReportStatus } from '@/types/database';

/**
 * Cria uma nova denúncia
 */
export async function createReport(data: {
  listingId: string;
  reason: ReportReason;
  details?: string;
  reporterEmail?: string;
}): Promise<Report> {
  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      listing_id: data.listingId,
      reason: data.reason,
      details: data.details || null,
      reporter_email: data.reporterEmail || null,
    })
    .select()
    .single();

  if (error) throw error;
  return report;
}

/**
 * Busca denúncias pendentes (admin)
 */
export async function getPendingReports(): Promise<ReportWithListing[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      listings(id, title)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as unknown as ReportWithListing[]) || [];
}

/**
 * Atualiza status de uma denúncia (admin)
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminNotes?: string
): Promise<Report> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: report, error } = await supabase
    .from('reports')
    .update({
      status,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id || null,
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return report;
}

/**
 * Busca todas as denúncias com filtros (admin)
 */
export async function getReports(filters?: {
  status?: ReportStatus;
  reason?: ReportReason;
}) {
  let query = supabase
    .from('reports')
    .select(`
      *,
      listings(id, title, status)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.reason) {
    query = query.eq('reason', filters.reason);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
