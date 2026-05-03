import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../contexts/AuthContext';

export type AppRole = 'client' | 'manager' | 'admin';

interface RoleState {
  role: AppRole | null;
  isManager: boolean;
  isAdmin: boolean;
  isManagerOrAdmin: boolean;
  loading: boolean;
}

const cache = new Map<string, AppRole>();

export function useUserRole(): RoleState {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(user?.id ? cache.get(user.id) ?? null : null);
  const [loading, setLoading] = useState(!role);

  useEffect(() => {
    if (!user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    const cached = cache.get(user.id);
    if (cached) {
      setRole(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setRole('client');
      } else {
        const r = (data.role as AppRole) ?? 'client';
        cache.set(user.id, r);
        setRole(r);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const isManager = role === 'manager';
  const isAdmin = role === 'admin';
  return { role, isManager, isAdmin, isManagerOrAdmin: isManager || isAdmin, loading };
}
