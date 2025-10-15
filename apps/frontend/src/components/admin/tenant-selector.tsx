'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/api-client';
import { useQueryClient } from '@tanstack/react-query';

type TenantOption = {
  id: string;
  slug?: string;
  name?: string;
};

export default function TenantSelector() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [options, setOptions] = useState<TenantOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const currentUser = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('auth-user') : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const existingTenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant-id') : null;
      const existingTenantSlug = typeof window !== 'undefined' ? localStorage.getItem('tenant-slug') : null;
      const userRole = currentUser?.role;

      // Determine default selection from existing localStorage or user tenant relation
      const defaultId = existingTenantId || currentUser?.tenantId || currentUser?.tenant?.id;
      const defaultSlug = existingTenantSlug || currentUser?.tenant?.subdomain;

      setLoading(true);
      try {
        let resultOptions: TenantOption[] = [];
        // Super admin can fetch all tenants
        if (userRole === 'super_admin') {
          const tenants = await api.get<any[]>('/tenants');
          const mapped: TenantOption[] = (tenants || []).map((t) => ({
            id: t.id,
            slug: t.subdomain || t.slug || undefined,
            name: t.name,
          }));
          resultOptions = mapped;
        } else {
          // Other roles: fetch current tenant if available
          try {
            const tenant = await api.get<any>('/tenants/current');
            if (tenant?.id) {
              resultOptions = [{ id: tenant.id, slug: tenant.subdomain || tenant.slug, name: tenant.name }];
            } else {
              // Fallback to user tenant info
              if (defaultId) {
                resultOptions = [{ id: defaultId, slug: defaultSlug || undefined, name: currentUser?.tenant?.name }];
              }
            }
          } catch {
            // If endpoint not accessible, fallback to defaults
            if (defaultId) {
              resultOptions = [{ id: defaultId, slug: defaultSlug || undefined, name: currentUser?.tenant?.name }];
            }
          }
        }
        setOptions(resultOptions);
        // Initialize selected value based on computed options
        if (defaultId) {
          setSelectedId(defaultId);
        } else if (resultOptions.length > 0) {
          const first = resultOptions[0];
          if (first && first.id) setSelectedId(first.id);
        }
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    const selected = options.find((opt) => opt.id === newId);
    setSelectedId(newId);

    try {
      localStorage.setItem('tenant-id', newId);
      const slug = selected?.slug;
      if (slug) {
        localStorage.setItem('tenant-slug', slug);
      } else {
        localStorage.removeItem('tenant-slug');
      }

      toast({
        title: 'Tenant switched',
        description: selected?.name ? `Now in ${selected.name}` : `Tenant ID: ${newId}`,
      });

      // Invalidate relevant queries to refresh panels without full reload
      try {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['services'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      } catch (_err) {
        // Swallow invalidation errors; UI will still use updated headers on next fetch
      }
    } catch (err) {
      toast({ title: 'Failed to switch tenant', description: 'Please try again.' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="tenant-selector" className="sr-only">Tenant</label>
      <select
        id="tenant-selector"
        value={selectedId || ''}
        onChange={handleChange}
        disabled={loading || options.length === 0}
        className="glass-effect border border-border/10 rounded-md px-3 py-2 text-sm min-w-[180px] bg-transparent focus:outline-none"
      >
        {options.length === 0 ? (
          <option value="" disabled>
            {loading ? 'Loading tenants...' : 'No tenant'}
          </option>
        ) : (
          options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name || opt.slug || opt.id}
            </option>
          ))
        )}
      </select>
    </div>
  );
}