'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { services, serviceCategories, useLivePrices } from '@/lib/services-data';
import { ArrowLeft, Search, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import { getAssetPath } from '@/lib/utils';

function ServicesContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const { getPrice, loaded: pricesLoaded } = useLivePrices();

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

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="mobile-container min-h-screen safe-bottom pb-10">
      <header className="px-6 pt-10 pb-6 sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 glass-card rounded-full flex items-center justify-center hover:bg-primary group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-black group-hover:text-white transition-colors" />
          </button>
          <h1 className="text-lg font-black text-black tracking-tight uppercase">Services</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search our expertise..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl glass-card text-black text-sm placeholder:text-black/20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              !selectedCategory 
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'glass-card text-black/50 hover:text-black hover:border-black/20'
            }`}
          >
            All
          </button>
          {serviceCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === category.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'glass-card text-black/50 hover:text-black hover:border-black/20'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">
            Showing {filteredServices.length} Results
          </p>
        </div>

        <div className="grid gap-6">
          <AnimatePresence mode='popLayout'>
            {filteredServices.map((service, index) => (
              <motion.div
                layout
                key={service.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onClick={() => router.push(`/booking?service=${service.id}`)}
                className="glass-card rounded-[2.5rem] overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
              >
                <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={getAssetPath(service.image)}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-4 right-4 px-3 py-1 glass-card rounded-full text-[10px] font-black text-primary uppercase tracking-tighter">
                       {service.category}
                    </div>
                </div>

                <div className="p-5 relative">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-black text-black uppercase tracking-tight leading-none mb-1">{service.name}</h3>
                      <p className="text-[9px] text-black/40 font-bold uppercase tracking-widest">{service.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary leading-none">
                        {!pricesLoaded ? '---' : (() => { const p = getPrice(service.id, service.price); return p > 0 ? `₹${p.toLocaleString('en-IN')}` : service.priceLabel || 'QUOTATION'; })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {service.features.map((feature) => (
                      <span key={feature} className="text-[9px] px-2.5 py-1 bg-black/5 text-black/60 font-bold rounded-lg border border-black/5 uppercase tracking-tighter">
                        {feature}
                      </span>
                    ))}
                  </div>

                  <button className="w-full py-3.5 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest group-hover:bg-primary transition-all flex items-center justify-center gap-2">
                    Book Experience <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-black/5">
              <Zap className="w-8 h-8 text-black/20" />
            </div>
            <p className="text-black/30 text-xs font-black uppercase tracking-widest">No matching services found</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ServicesContent />
    </Suspense>
  );
}
