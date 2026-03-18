'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAssetPath } from '@/lib/utils';
import Carousel, { CarouselItem } from '@/components/Carousel';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [redirecting, setRedirecting] = useState(false);

  const { signup, user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [carouselImages, setCarouselImages] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin?resource=app-config`)
      .then(res => res.json())
      .then(data => {
        if (data.data?.signup_carousel?.images) {
          setCarouselImages(data.data.signup_carousel.images);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoading && user && !redirecting) {
      setRedirecting(true);
      router.replace(isAdmin ? '/admin' : '/home');
    }
  }, [isLoading, user, isAdmin, redirecting, router]);

  const carouselItems: CarouselItem[] = useMemo(() => {
    return carouselImages.map((img, i) => ({
      id: i,
      image: img
    }));
  }, [carouselImages]);

  if (isLoading || redirecting) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen bg-white text-black">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) newErrors.email = 'Email is required';
    else if (!emailRegex.test(email)) newErrors.email = 'Please enter a valid email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;

    setLoading(true);
    try {
      // For instant redirect simple auth, we use email as phone placeholder or just handle it in signup
      // Since phone is required in current schema, we'll use a dummy or just use email prefix
      const dummyPhone = email.split('@')[0].replace(/\D/g, '').slice(0, 10).padEnd(10, '0');

      const result = await signup(name, email, dummyPhone, pin);

      if (result.success) {
        setRedirecting(true);
        toast.success('Welcome to Hashtag Garage!');
        router.replace('/home');
      } else {
        // If user already exists, try logging in
        if (result.error?.includes('already exists')) {
            toast.info('Email already exists. Logging you in...');
            router.push(`/login?email=${encodeURIComponent(email)}`);
        } else {
            toast.error(result.error || 'Failed to create account');
        }
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const Logo = () => (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-[70px] h-[70px] flex items-center justify-center">
        <div className="absolute inset-0 bg-primary rounded-full" />
        <Image
          src={getAssetPath('/hashtag-logo.png')}
          alt="Hashtag Garage"
          width={60}
          height={60}
          className="rounded-full shadow-md object-cover relative z-10 invert"
          priority
          unoptimized
        />
      </div>
      <h1 className="text-lg font-bold text-black mt-3">
        HASHTAG <span className="text-primary">GARAGE</span>
      </h1>
    </div>
  );

  const SignupCarousel = () => {
    if (carouselItems.length === 0) return null;
    return (
      <div className="mt-4 mb-6" style={{ height: '210px', position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Carousel
          items={carouselItems}
          baseWidth={320}
          autoplay={true}
          autoplayDelay={3000}
          pauseOnHover={false}
          loop={true}
          round={false}
        />
      </div>
    );
  };

  return (
    <div className="mobile-container bg-white text-black min-h-screen flex flex-col px-6 py-8">
      <Logo />
      <SignupCarousel />

      <h2 className="text-xl font-bold text-black mb-1">Join Hashtag Garage</h2>
      <p className="text-gray-500 text-xs mb-6 uppercase tracking-widest font-bold">Enter your email to get started instantly</p>

      <form onSubmit={handleCreateAccount} className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-400' : 'border-gray-200'} bg-gray-50 text-black focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-400' : 'border-gray-200'} bg-gray-50 text-black focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-sm mt-2 hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Processing...' : 'Get Started'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Login
        </Link>
      </p>

      <p className="text-center text-xs text-gray-400 mt-4">
        By continuing, you agree to our{' '}
        <Link href="/privacy-policy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
