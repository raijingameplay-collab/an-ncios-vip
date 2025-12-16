/**
 * Services centralizados para integração com Supabase
 * 
 * Arquitetura do banco de dados:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        USUÁRIOS E AUTH                         │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ auth.users (Supabase)    → Autenticação                        │
 * │ profiles                 → Dados básicos do usuário            │
 * │ user_roles               → Roles (admin/moderator/advertiser)  │
 * │ advertiser_profiles      → Perfil de anunciante                │
 * │ verification_documents   → Documentos para verificação         │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                         ANÚNCIOS                               │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ listings                 → Anúncios principais                 │
 * │ listing_photos           → Fotos dos anúncios                  │
 * │ listing_tags             → Tags/categorias dos anúncios        │
 * │ service_tags             → Lista de tags disponíveis           │
 * │ highlights               → Stories/destaques temporários       │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    PLANOS E ASSINATURAS                        │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ plans                    → Planos de publicidade               │
 * │ subscriptions            → Assinaturas ativas                  │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        MODERAÇÃO                               │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ reports                  → Denúncias de usuários               │
 * │ admin_action_logs        → Log de ações administrativas        │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * Storage Buckets:
 * - listing-photos (público)     → Fotos dos anúncios
 * - verification-docs (privado)  → Documentos de verificação
 * - highlights (público)         → Stories/destaques
 * 
 * Segurança:
 * - Todas as tabelas têm RLS habilitado
 * - Roles são verificadas via função has_role()
 * - Documentos de verificação acessíveis apenas por admins
 */

// Re-export all services
export * from './listings';
export * from './reports';
export * from './moderation';
export * from './storage';

// Re-export types
export * from '@/types/database';
