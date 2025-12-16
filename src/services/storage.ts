/**
 * Service para operações de storage (upload de arquivos)
 */

import { supabase } from '@/integrations/supabase/client';

const BUCKETS = {
  LISTING_PHOTOS: 'listing-photos',
  VERIFICATION_DOCS: 'verification-docs',
  HIGHLIGHTS: 'highlights',
} as const;

/**
 * Faz upload de uma foto de anúncio
 */
export async function uploadListingPhoto(
  file: File,
  listingId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${listingId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.LISTING_PHOTOS)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(BUCKETS.LISTING_PHOTOS)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Faz upload de múltiplas fotos
 */
export async function uploadMultiplePhotos(
  files: File[],
  listingId: string
): Promise<string[]> {
  const uploads = files.map(file => uploadListingPhoto(file, listingId));
  return Promise.all(uploads);
}

/**
 * Remove uma foto de anúncio
 */
export async function deleteListingPhoto(photoUrl: string): Promise<void> {
  // Extrair path da URL
  const url = new URL(photoUrl);
  const pathParts = url.pathname.split('/');
  const bucketIndex = pathParts.findIndex(p => p === BUCKETS.LISTING_PHOTOS);
  const filePath = pathParts.slice(bucketIndex + 1).join('/');

  const { error } = await supabase.storage
    .from(BUCKETS.LISTING_PHOTOS)
    .remove([filePath]);

  if (error) throw error;
}

/**
 * Faz upload de documento de verificação
 */
export async function uploadVerificationDocument(
  file: File,
  advertiserId: string,
  type: 'document' | 'selfie'
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${advertiserId}/${type}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.VERIFICATION_DOCS)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Bucket privado - retornar path para gerar URL assinada depois
  return fileName;
}

/**
 * Gera URL assinada para documento de verificação (admin only)
 */
export async function getVerificationDocUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKETS.VERIFICATION_DOCS)
    .createSignedUrl(filePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Faz upload de highlight/story
 */
export async function uploadHighlight(
  file: File,
  listingId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${listingId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.HIGHLIGHTS)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(BUCKETS.HIGHLIGHTS)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Valida tipo de arquivo para upload
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Valida tamanho de arquivo
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number
): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Constantes de validação
 */
export const FILE_LIMITS = {
  PHOTO: {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  DOCUMENT: {
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },
  HIGHLIGHT: {
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  },
};
