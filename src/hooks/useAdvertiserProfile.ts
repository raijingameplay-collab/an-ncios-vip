import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface AdvertiserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  whatsapp: string | null;
  telegram: string | null;
  instagram: string | null;
  is_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export function useAdvertiserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AdvertiserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('advertiser_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching advertiser profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user]);

  const createProfile = async (displayName: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('advertiser_profiles')
      .insert({
        user_id: user.id,
        display_name: displayName,
      })
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      
      // Also add advertiser role
      await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'advertiser',
        });
    }

    return { data, error };
  };

  const updateProfile = async (updates: Partial<AdvertiserProfile>) => {
    if (!user || !profile) return { error: new Error('No profile to update') };

    const { data, error } = await supabase
      .from('advertiser_profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  return { profile, loading, createProfile, updateProfile };
}
