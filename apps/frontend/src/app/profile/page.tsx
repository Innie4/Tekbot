'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/api-client';
import { useToast } from '@/components/ui/use-toast';
import { User } from 'lucide-react';

interface UserInfo {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  tenantId?: string;
  tenantSlug?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingUser(true);
      setError(null);
      try {
        // Try localStorage first
        let fromStorage: UserInfo | null = null;
        try {
          const raw = localStorage.getItem('auth-user');
          if (raw) fromStorage = JSON.parse(raw);
        } catch {
          /* empty */
        }

        if (fromStorage) {
          setUser(fromStorage);
        } else {
          const profile = await api.get<UserInfo>('/auth/profile');
          setUser(profile);
        }
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : typeof e === 'string' ? e : 'Failed to load profile';
        setError(message);
      } finally {
        setLoadingUser(false);
      }
    };

    loadProfile();
  }, []);

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setChanging(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h1 className="text-2xl font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" /> Profile
          </h1>
          {loadingUser ? (
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4">
              {error}
            </div>
          ) : user ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm">
                  {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
              {user.tenantId && (
                <div>
                  <p className="text-xs text-muted-foreground">Tenant ID</p>
                  <p className="text-sm">{user.tenantId}</p>
                </div>
              )}
              {user.tenantSlug && (
                <div>
                  <p className="text-xs text-muted-foreground">Tenant Slug</p>
                  <p className="text-sm">{user.tenantSlug}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No profile information available.</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={onChangePassword} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm mb-1">
                Current Password
              </label>
              <GlassInput
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm mb-1">
                New Password
              </label>
              <GlassInput
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm mb-1">
                Confirm New Password
              </label>
              <GlassInput
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </div>
            <Button type="submit" disabled={changing} className="w-full">
              {changing ? 'Updating...' : 'Change Password'}
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
