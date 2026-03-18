'use client';
export const dynamic = 'force-dynamic'

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAssetPath } from '@/lib/utils';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [redirecting, setRedirecting] = useState(false);

  const { login, user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !redirecting) {
      setRedirecting(true);
      router.replace(isAdmin ? '/admin' : '/home');
    }
  }, [isLoading, user, isAdmin, redirecting, router]);

  if (isLoading || redirecting) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen bg-white">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!identifier.trim()) newErrors.identifier = 'Email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Use fixed pin for all users for simple auth
      const pin = '1234';
      const result = await login(identifier, pin);

      if (result.success) {
        setRedirecting(true);
        toast.success('Welcome back!');
        const dest = result.isAdmin ? '/admin' : '/home';
        router.replace(dest);
      } else {
        // If login fails, user might not exist, but we keep it simple
        toast.error('Account not found or invalid email');
        setLoading(false);
      }
    } catch (err: any) {
      toast.error('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container bg-white text-black min-h-screen flex flex-col px-6 py-8">
      <div className="flex flex-col items-center mb-10 mt-10">
        <div className="relative w-[100px] h-[100px] flex items-center justify-center">
          <Image
            src={getAssetPath('/hashtag-logo.png')}
            alt="Hashtag Garage"
            width={100}
            height={100}
            className="rounded-2xl shadow-md object-cover"
            priority
            unoptimized
          />
        </div>
        <h1 className="text-2xl font-black text-black mt-6 tracking-tighter">
          HASHTAG <span className="text-primary">GARAGE</span>
        </h1>
      </div>

      <h2 className="text-3xl font-black text-black mb-2 text-center uppercase tracking-tight">Login</h2>
      <p className="text-gray-500 text-sm mb-10 text-center font-medium">Access your garage dashboard</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">
            Email Address
          </label>
          <input
            type="email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="pilot@hashtaggarage.in"
            className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-black focus:bg-white focus:border-primary transition-all outline-none text-sm font-bold placeholder:text-gray-300"
          />
          {errors.identifier && (
            <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{errors.identifier}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] mt-4 hover:bg-primary transition-all shadow-xl shadow-black/5 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Authenticating...' : 'Enter Garage'}
        </button>
      </form>

      <p className="text-center text-xs font-bold text-gray-400 mt-10">
        New to the garage?{' '}
        <Link href="/signup" className="text-primary font-black uppercase tracking-widest hover:underline">
          Join Now
        </Link>
      </p>
    </div>
  );
}
