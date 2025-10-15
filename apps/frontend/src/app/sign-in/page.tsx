"use client";
import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/api-client';
import { useToast } from '@/components/ui/use-toast';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isValidEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
  const isValidPassword = (value: string) => value.length >= 8;

  const onEmailChange = (value: string) => {
    setEmail(value);
    if (!value) {
      setEmailError('Email is required');
    } else if (!isValidEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    if (!value) {
      setPasswordError('Password is required');
    } else if (!isValidPassword(value)) {
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordError(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{ user: any; accessToken: string; refreshToken: string }>(
        '/auth/login',
        { email, password }
      );

      // Store tokens, user, and tenant context
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', result.accessToken);
        localStorage.setItem('refresh-token', result.refreshToken);
        localStorage.setItem('auth-user', JSON.stringify(result.user));
        if (result.user?.tenantId) {
          localStorage.setItem('tenant-id', result.user.tenantId);
        }
        if (result.user?.tenantSlug) {
          localStorage.setItem('tenant-slug', result.user.tenantSlug);
        }
      }

      toast({ title: 'Signed in', description: 'Welcome back!' });
      window.location.href = '/admin';
    } catch (err: any) {
      const message = err?.message || 'Sign in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <GlassCard className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Sign In</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Welcome back. Enter your credentials to continue.
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <GlassInput
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              required
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <GlassInput
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              required
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-600">{passwordError}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading || !!emailError || !!passwordError}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
        <div className="text-sm mt-4 text-center">
          Don’t have an account? <a href="/sign-up" className="text-primary">Sign up</a>
        </div>
      </GlassCard>
    </div>
  );
}