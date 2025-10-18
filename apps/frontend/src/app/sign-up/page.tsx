"use client";
import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/api-client';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Chrome } from 'lucide-react';

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isValidEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
  const isValidPassword = (value: string) => value.length >= 8;
  const isValidName = (value: string) => value.trim().length > 0;

  const onFirstNameChange = (value: string) => {
    setFirstName(value);
    setFirstNameError(!value ? 'First name is required' : null);
  };

  const onLastNameChange = (value: string) => {
    setLastName(value);
    setLastNameError(!value ? 'Last name is required' : null);
  };

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
    if (!isValidName(firstName)) {
      setError('Please enter your first name.');
      return;
    }
    if (!isValidName(lastName)) {
      setError('Please enter your last name.');
      return;
    }
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
        '/auth/register',
        { firstName, lastName, email, password }
      );

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', result.accessToken);
        localStorage.setItem('refresh-token', result.refreshToken);
        localStorage.setItem('auth-user', JSON.stringify(result.user));
        localStorage.setItem('has-onboarded', 'false');
        if ((result.user as any)?.tenantId) {
          localStorage.setItem('tenant-id', (result.user as any).tenantId);
        }
        if ((result.user as any)?.tenantSlug) {
          localStorage.setItem('tenant-slug', (result.user as any).tenantSlug);
        }
      }

      toast({ title: 'Account created', description: 'Welcome to TekAssist!' });
      window.location.href = '/onboarding';
    } catch (err: any) {
      const message = err?.message || 'Sign up failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const startGoogleSignIn = () => {
    try {
      // If backend Google OAuth is configured, this route should exist
      window.location.href = '/api/v1/auth/google';
    } catch (e) {
      toast({ title: 'Google Sign-In unavailable', description: 'OAuth not configured yet.' });
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <GlassCard className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Create Account</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Join TekAssist and start managing conversations effortlessly.
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4">
            {error}
          </div>
        )}
        <Button type="button" variant="outline" className="w-full mb-4" onClick={startGoogleSignIn}>
          <Chrome className="mr-2 h-4 w-4" /> Continue with Google
        </Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-background text-muted-foreground">or</span>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">First Name</label>
            <GlassInput
              type="text"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              placeholder="John"
              required
            />
            {firstNameError && (
              <p className="mt-1 text-xs text-red-600">{firstNameError}</p>
            )}
            </div>
            <div>
              <label className="block text-sm mb-1">Last Name</label>
            <GlassInput
              type="text"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              placeholder="Doe"
              required
            />
            {lastNameError && (
              <p className="mt-1 text-xs text-red-600">{lastNameError}</p>
            )}
            </div>
          </div>
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
          <Button type="submit" className="w-full" disabled={
            loading || !!firstNameError || !!lastNameError || !!emailError || !!passwordError
          }>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>
        <div className="text-sm mt-4 text-center">
          Already have an account? <a href="/sign-in" className="text-primary">Sign in</a>
        </div>
      </GlassCard>
    </div>
  );
}