-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'advertiser');

-- Enum for listing status
CREATE TYPE public.listing_status AS ENUM ('pending', 'approved', 'rejected', 'suspended', 'expired');

-- Enum for verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Enum for report reason
CREATE TYPE public.report_reason AS ENUM ('misleading', 'fake', 'inappropriate', 'scam', 'other');

-- Enum for report status
CREATE TYPE public.report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- User roles table (separate from profiles as required)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Advertiser profiles (extended info for advertisers)
CREATE TABLE public.advertiser_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    whatsapp TEXT,
    telegram TEXT,
    instagram TEXT,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    verification_status verification_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Verification documents (admin-only access)
CREATE TABLE public.verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE NOT NULL,
    document_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Advertising plans
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    max_photos INTEGER DEFAULT 5 NOT NULL,
    max_highlights INTEGER DEFAULT 0 NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    priority_level INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Service tags (controlled list)
CREATE TABLE public.service_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Listings
CREATE TABLE public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2),
    price_info TEXT,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT,
    age INTEGER,
    status listing_status DEFAULT 'pending' NOT NULL,
    rejection_reason TEXT,
    views_count INTEGER DEFAULT 0 NOT NULL,
    contact_clicks INTEGER DEFAULT 0 NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    priority_level INTEGER DEFAULT 0 NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Listing photos
CREATE TABLE public.listing_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT false NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Listing tags junction table
CREATE TABLE public.listing_tags (
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.service_tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (listing_id, tag_id)
);

-- Highlights (temporary visibility boost)
CREATE TABLE public.highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    content_url TEXT,
    content_type TEXT DEFAULT 'image' NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Reports
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    reporter_email TEXT,
    reason report_reason NOT NULL,
    details TEXT,
    status report_status DEFAULT 'pending' NOT NULL,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Admin action logs
CREATE TABLE public.admin_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'moderator')
  )
$$;

-- Function to get advertiser_id for current user
CREATE OR REPLACE FUNCTION public.get_advertiser_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.advertiser_profiles WHERE user_id = _user_id
$$;

-- RLS Policies

-- User roles: only admins can view/manage
CREATE POLICY "Admins can manage user roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.is_admin_or_moderator(auth.uid()));

-- Profiles: users can view/edit their own
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.is_admin_or_moderator(auth.uid()));

-- Advertiser profiles: owners and admins
CREATE POLICY "Advertisers can view own profile" ON public.advertiser_profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Advertisers can update own profile" ON public.advertiser_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Advertisers can insert own profile" ON public.advertiser_profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view verified advertisers" ON public.advertiser_profiles
    FOR SELECT TO anon
    USING (is_verified = true);

-- Verification documents: only admins
CREATE POLICY "Admins can manage verification documents" ON public.verification_documents
    FOR ALL TO authenticated
    USING (public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Advertisers can insert own documents" ON public.verification_documents
    FOR INSERT TO authenticated
    WITH CHECK (advertiser_id = public.get_advertiser_id(auth.uid()));

CREATE POLICY "Advertisers can view own documents" ON public.verification_documents
    FOR SELECT TO authenticated
    USING (advertiser_id = public.get_advertiser_id(auth.uid()));

-- Plans: public read, admin write
CREATE POLICY "Anyone can view active plans" ON public.plans
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.plans
    FOR ALL TO authenticated
    USING (public.is_admin_or_moderator(auth.uid()));

-- Subscriptions: owners and admins
CREATE POLICY "Advertisers can view own subscriptions" ON public.subscriptions
    FOR SELECT TO authenticated
    USING (advertiser_id = public.get_advertiser_id(auth.uid()) OR public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Advertisers can insert own subscriptions" ON public.subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (advertiser_id = public.get_advertiser_id(auth.uid()));

-- Service tags: public read, admin write
CREATE POLICY "Anyone can view active tags" ON public.service_tags
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage tags" ON public.service_tags
    FOR ALL TO authenticated
    USING (public.is_admin_or_moderator(auth.uid()));

-- Listings: complex rules
CREATE POLICY "Anyone can view approved listings" ON public.listings
    FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Advertisers can view own listings" ON public.listings
    FOR SELECT TO authenticated
    USING (advertiser_id = public.get_advertiser_id(auth.uid()));

CREATE POLICY "Advertisers can insert own listings" ON public.listings
    FOR INSERT TO authenticated
    WITH CHECK (advertiser_id = public.get_advertiser_id(auth.uid()));

CREATE POLICY "Advertisers can update own listings" ON public.listings
    FOR UPDATE TO authenticated
    USING (advertiser_id = public.get_advertiser_id(auth.uid()));

CREATE POLICY "Admins can manage all listings" ON public.listings
    FOR ALL TO authenticated
    USING (public.is_admin_or_moderator(auth.uid()));

-- Listing photos
CREATE POLICY "Anyone can view photos of approved listings" ON public.listing_photos
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.listings 
        WHERE listings.id = listing_photos.listing_id 
        AND listings.status = 'approved'
    ));

CREATE POLICY "Advertisers can manage own listing photos" ON public.listing_photos
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.listings 
        WHERE listings.id = listing_photos.listing_id 
        AND listings.advertiser_id = public.get_advertiser_id(auth.uid())
    ));

CREATE POLICY "Admins can manage all photos" ON public.listing_photos
    FOR ALL TO authenticated
    USING (public.is_admin_or_moderator(auth.uid()));

-- Listing tags
CREATE POLICY "Anyone can view tags of approved listings" ON public.listing_tags
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.listings 
        WHERE listings.id = listing_tags.listing_id 
        AND listings.status = 'approved'
    ));

CREATE POLICY "Advertisers can manage own listing tags" ON public.listing_tags
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.listings 
        WHERE listings.id = listing_tags.listing_id 
        AND listings.advertiser_id = public.get_advertiser_id(auth.uid())
    ));

-- Highlights
CREATE POLICY "Anyone can view active highlights" ON public.highlights
    FOR SELECT
    USING (is_active = true AND expires_at > now());

CREATE POLICY "Advertisers can manage own highlights" ON public.highlights
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.listings 
        WHERE listings.id = highlights.listing_id 
        AND listings.advertiser_id = public.get_advertiser_id(auth.uid())
    ));

-- Reports: anyone can create, admins can manage
CREATE POLICY "Anyone can create reports" ON public.reports
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can manage reports" ON public.reports
    FOR ALL TO authenticated
    USING (public.is_admin_or_moderator(auth.uid()));

-- Admin action logs: only admins
CREATE POLICY "Admins can view action logs" ON public.admin_action_logs
    FOR SELECT TO authenticated
    USING (public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Admins can insert action logs" ON public.admin_action_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin_or_moderator(auth.uid()));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertiser_profiles_updated_at
    BEFORE UPDATE ON public.advertiser_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.plans (name, description, price, duration_days, max_photos, max_highlights, is_featured, priority_level) VALUES
('Básico', 'Plano básico com visibilidade padrão', 29.90, 30, 5, 0, false, 0),
('Destaque', 'Maior visibilidade e prioridade no catálogo', 59.90, 30, 10, 3, true, 10),
('Premium', 'Máxima visibilidade com todos os recursos', 99.90, 30, 15, 10, true, 20);

-- Insert default service tags
INSERT INTO public.service_tags (name, slug) VALUES
('Atendimento 24h', 'atendimento-24h'),
('Aceita cartão', 'aceita-cartao'),
('Local próprio', 'local-proprio'),
('Atende em hotéis', 'atende-hoteis'),
('Atende em domicílio', 'atende-domicilio'),
('Primeira vez', 'primeira-vez'),
('Viagens', 'viagens'),
('Eventos', 'eventos');

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-photos', 'listing-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('highlights', 'highlights', true);

-- Storage policies for listing photos
CREATE POLICY "Anyone can view listing photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'listing-photos');

CREATE POLICY "Authenticated users can upload listing photos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'listing-photos');

CREATE POLICY "Users can update own listing photos" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own listing photos" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for verification docs (admin only)
CREATE POLICY "Admins can view verification docs" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'verification-docs' AND public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Authenticated users can upload verification docs" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'verification-docs');

-- Storage policies for highlights
CREATE POLICY "Anyone can view highlights" ON storage.objects
    FOR SELECT USING (bucket_id = 'highlights');

CREATE POLICY "Authenticated users can upload highlights" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'highlights');

CREATE POLICY "Users can manage own highlights" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'highlights' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own highlights" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'highlights' AND auth.uid()::text = (storage.foldername(name))[1]);