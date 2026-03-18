'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MapPin, Search, Sparkles, Wrench, Settings, ChevronRight, Phone, ArrowRight, Zap } from 'lucide-react';
import { services, serviceCategories, useLivePrices } from '@/lib/services-data';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import AddressForm from '@/components/AddressForm';
import { toast } from 'sonner';
import { getAssetPath } from '@/lib/utils';

const categoryIcons: Record<string, React.ReactNode> = {
  wash: <Wrench className="w-6 h-6" />,
  detailing: <Sparkles className="w-6 h-6" />,
  repair: <Zap className="w-6 h-6" />,
  general: <Settings className="w-6 h-6" />,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function HomePage() {
  const { user, isLoading, isAdmin, updateAddress } = useAuth();
  const router = useRouter();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const { getPrice, loaded: pricesLoaded } = useLivePrices();

    useEffect(() => {
      if (!isLoading && !user) {
        router.replace('/login');
      }
    }, [isLoading, user, router]);

    useEffect(() => {
      if (!isLoading && user && isAdmin) {
        router.replace('/admin');
      }
    }, [isLoading, user, isAdmin, router]);

  if (isLoading || !user) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleAddressSave = async (address: any, coords?: { lat: number; lng: number }) => {
    const result = await updateAddress(address, coords);
    if (result.success) {
      toast.success('Address saved successfully!');
    } else {
      toast.error(result.error || 'Failed to save address');
    }
    return result;
  };

  const featuredServices = services.slice(0, 4);

  return (
    <main className="mobile-container min-h-screen safe-bottom pb-12">
      {/* Dynamic Hero Section */}
      <header className="px-6 pt-12 pb-10 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center mb-8"
          >
            <Image
              src={getAssetPath('/hashtag-logo.png')}
              alt="Hashtag Garage"
              width={180}
              height={70}
              className="object-contain mb-4"
              priority
              unoptimized
            />
            <h1 className="text-2xl font-black tracking-tighter text-black uppercase">
              HASHTAG <span className="text-primary">GARAGE</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full relative group mb-6"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="What does your car need?"
              onClick={() => router.push('/services')}
              readOnly
              className="w-full pl-12 pr-4 py-4 rounded-2xl glass-card text-black text-sm placeholder:text-black/20 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </motion.div>
        </div>
      </header>

      {showAddressForm && (
        <AddressForm
          onSave={handleAddressSave}
          onClose={() => setShowAddressForm(false)}
          initialAddress={user.address}
        />
      )}

      {/* Category Grid */}
      <section className="px-6 -mt-8 relative z-20">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-4 gap-4"
        >
          {serviceCategories.map((category) => (
            <motion.button
              key={category.id}
              variants={item}
              onClick={() => router.push(`/services?category=${category.id}`)}
              className="flex flex-col items-center gap-3"
            >
              <div
                className="w-full aspect-square rounded-full glass-card flex items-center justify-center group hover:bg-primary transition-all duration-500"
              >
                <div className="text-black group-hover:text-white group-hover:scale-110 transition-all">
                  {categoryIcons[category.id] || categoryIcons['general']}
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-black/50">
                {category.name}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Workshop Card */}
      <section className="px-6 mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-[2.5rem] p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                <Image
                  src={getAssetPath('/hashtag-logo.png')}
                  alt="Hashtag Garage Workshop"
                  width={60}
                  height={60}
                  className="rounded-xl"
                  unoptimized
                />
              </div>
              <div>
                <h3 className="text-lg font-black text-black leading-tight uppercase">THE WORKSHOP</h3>
                <p className="text-[10px] text-black/50 mb-3 uppercase tracking-widest">Kota, Raipur</p>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-lg border border-green-500/20 uppercase tracking-tighter">Live & Open</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/services')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-primary transition-colors group/btn shadow-sm"
            >
              <ArrowRight className="w-4 h-4 text-black group-hover/btn:text-white transition-colors" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
            {featuredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => router.push(`/booking?service=${service.id}`)}
                className="flex items-center gap-3 p-2 rounded-full glass-card hover:bg-primary border border-gray-100 transition-all text-left group/item"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden relative grayscale group-hover/item:grayscale-0 transition-all">
                  <Image
                    src={getAssetPath(service.image)}
                    alt={service.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-[9px] font-bold text-black uppercase line-clamp-1 group-hover/item:text-white transition-colors">{service.name}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* All Services Staggered */}
      <section className="px-6 mt-10">
        <h2 className="text-lg font-black text-black mb-4 tracking-tighter uppercase">Our Services</h2>
        <div className="space-y-4">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              onClick={() => router.push(`/booking?service=${service.id}`)}
              className="glass-card rounded-full p-2 pr-6 flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all group"
            >
              <div className="relative w-14 h-14 flex-shrink-0 rounded-full overflow-hidden shadow-2xl">
                <Image
                  src={getAssetPath(service.image)}
                  alt={service.name}
                  fill
                  className="object-cover scale-110 group-hover:scale-100 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-black text-black leading-tight uppercase tracking-tight">{service.name}</h3>
                <p className="text-[9px] text-black/40 font-bold uppercase tracking-widest mb-1">{service.subtitle}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-primary">
                    {!pricesLoaded ? '---' : (() => { const p = getPrice(service.id, service.price); return p > 0 ? `₹${p.toLocaleString('en-IN')}` : service.priceLabel || 'QUOTATION'; })()}
                  </p>
                  <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="h-12" />
    </main>
  );
}
