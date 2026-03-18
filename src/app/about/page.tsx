'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Shield, Star, Zap, Award, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { getAssetPath } from '@/lib/utils';

export default function AboutPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    { icon: Zap, title: 'High-Pressure Cleaning', desc: 'Advanced machines for deep cleaning' },
    { icon: Shield, title: 'Spray Injection Systems', desc: 'Professional extraction systems' },
    { icon: Star, title: 'Professional Detailing', desc: 'Premium tools & techniques' },
    { icon: Award, title: 'High-Powered Vacuum', desc: 'Industrial grade cleaning' },
  ];

  const highlights = [
    'Premium chemicals & genuine spare parts',
    'Certified technicians with years of experience',
    'Advanced mechanized cleaning technology',
    'Quality at every step of service',
  ];

  return (
    <main className="mobile-container bg-gray-50 min-h-screen safe-bottom">
      <header className="bg-white px-4 py-3 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center -ml-1">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900 uppercase tracking-tight">About Us</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm text-center mb-6"
        >
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                <Image
                src={getAssetPath('/hashtag-logo.png')}
                alt="Hashtag Garage"
                width={70}
                height={70}
                className="invert object-contain"
                />
            </div>

          <h2 className="text-lg font-black text-gray-900 uppercase">
            HASHTAG <span className="text-primary">GARAGE</span>
          </h2>
          <p className="text-sm text-primary font-medium mt-1">
            Designed for Premium Performance
          </p>
          <p className="text-xs text-gray-500 mt-1">Raipur, Chhattisgarh</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-3">Our Story</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Hashtag Garage is Raipur&apos;s premier modern mechanized car care brand that is changing the way people think about vehicle maintenance. We believe that cars are more than just machines; they are an extension of your lifestyle.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Every vehicle at Hashtag Garage is pampered by trained technicians who treat your car with the same care they would their own. From basic cleaning to complex accidental repairs, we ensure quality at every step.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-4">Our Technology</h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-gray-50 rounded-xl p-3"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{feature.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-sm mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-4">Why Choose Us</h3>
          <div className="space-y-3">
            {highlights.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-primary rounded-2xl p-5 text-white"
        >
          <h3 className="font-bold mb-2">Need Help?</h3>
          <p className="text-sm text-white/80 mb-4">
            Contact us anytime for queries or bookings
          </p>
          <button
            onClick={() => router.push('/contact')}
            className="w-full py-3 bg-white text-primary rounded-xl text-sm font-semibold"
          >
            Contact Hashtag Garage
          </button>
        </motion.div>
      </div>
    </main>
  );
}
