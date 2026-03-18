import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Service {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  category: 'wash' | 'detailing' | 'repair' | 'general';
  features: string[];
  price: number;
  priceLabel?: string;
  homeServiceAvailable: boolean;
}

export const HOME_SERVICE_IDS = ['car-servicing', 'car-detailing', 'car-coating'];

export const services: Service[] = [
    {
      id: 'car-servicing',
      name: 'Car Servicing',
      subtitle: 'Complete Mechanical & Fluid Check',
      image: '/oil-change.jpg',
      category: 'wash',
      features: ['Oil Change', 'Filter Clean', 'Brake Check', 'Fluid Top-up', 'Engine Scan'],
      price: 499,
      priceLabel: 'Starting at',
      homeServiceAvailable: true
    },
    {
      id: 'denting-painting',
      name: 'Denting & Painting',
      subtitle: 'Premium Body Work & Finish',
      image: '/denting-painting.jpg',
      category: 'repair',
      features: ['Dent Removal', 'Scratch Repair', 'Color Matching', 'Factory Finish', 'Full Body Paint'],
      price: 2499,
      priceLabel: 'Starting at',
      homeServiceAvailable: false
    },
    {
      id: 'buy-sale-used-car',
      name: 'Buy/Sale Used Car',
      subtitle: 'Verified Vehicles & Fair Pricing',
      image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=1000&auto=format&fit=crop',
      category: 'general',
      features: ['100+ Points Check', 'RC Transfer', 'Best Price Guarantee', 'Instant Payment', 'Verified Sellers'],
      price: 0,
      priceLabel: 'Contact Us',
      homeServiceAvailable: false
    },
    {
      id: 'car-detailing',
      name: 'Car Detailing',
      subtitle: 'Deep Interior & Exterior Rejuvenation',
      image: '/interior-detailing.jpg',
      category: 'detailing',
      features: ['Steam Cleaning', 'Odor Removal', 'Leather Conditioning', 'Clay Bar Treatment', 'Machine Polish'],
      price: 2999,
      priceLabel: 'Starting at',
      homeServiceAvailable: true
    },
    {
      id: 'car-coating',
      name: 'Car Coating',
      subtitle: 'Ceramic & Graphene Protection',
      image: '/exterior-detailing.png',
      category: 'detailing',
      features: ['9H Ceramic', 'Hydrophobic Finish', 'UV Protection', 'Ultra Gloss', 'Long-lasting'],
      price: 9999,
      priceLabel: 'Starting at',
      homeServiceAvailable: true
    },
    {
      id: 'paint-protection-film',
      name: 'Paint Protection Film (PPF)',
      subtitle: 'Ultimate Shield Against Scratches',
      image: '/periodic-service.png',
      category: 'detailing',
      features: ['Self-healing', 'Anti-Yellowing', 'Impact Resistant', 'Clear Gloss/Matte', 'Warranty'],
      price: 19999,
      priceLabel: 'Starting at',
      homeServiceAvailable: false
    },
    {
      id: 'other-services',
      name: 'Other Car Services',
      subtitle: 'Miscellaneous Automotive Solutions',
      image: '/roadside.jpg',
      category: 'general',
      features: ['Battery Jumpstart', 'Tire Replacement', 'AC Repair', 'Electrical Works', 'Custom Jobs'],
      price: 0,
      priceLabel: 'Get Quote',
      homeServiceAvailable: false
    }
];

export const serviceCategories = [
  { id: 'wash', name: 'Servicing', icon: 'sparkles', color: '#FF5722' },
  { id: 'detailing', name: 'Detailing', icon: 'sparkles', color: '#FF7043' },
  { id: 'repair', name: 'Painting', icon: 'wrench', color: '#FF8A65' },
  { id: 'general', name: 'General', icon: 'settings', color: '#FFAB91' }
];

export const getServicesByCategory = (category: string) => {
  return services.filter(service => service.category === category);
};

export const getServiceById = (id: string) => {
  return services.find(service => service.id === id);
};

let cachedPrices: Record<string, number> | null = null;
let fetchPromise: Promise<Record<string, number>> | null = null;

async function fetchAllPrices(): Promise<Record<string, number>> {
    try {
        const { data, error } = await supabase
            .from('service_prices')
            .select('service_id, price_hatchback');

        if (error) throw error;

        const map: Record<string, number> = {};
        if (data) {
            data.forEach((row: any) => { map[row.service_id] = Number(row.price_hatchback) || 0; });
        }
        cachedPrices = map;
        return map;
    } catch (err) {
        console.error('Failed to fetch live prices', err);
        return {};
    }
}

export function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, number>>(cachedPrices || {});
  const [loaded, setLoaded] = useState(!!cachedPrices);

  useEffect(() => {
    if (cachedPrices) {
      setPrices(cachedPrices);
      setLoaded(true);
      return;
    }

    if (!fetchPromise) {
        fetchPromise = fetchAllPrices();
    }

    fetchPromise.then(res => {
        setPrices(res);
        setLoaded(true);
    });
  }, []);

  const getPrice = (serviceId: string, fallback: number) => {
    if (!loaded) return null;
    return prices[serviceId] ?? fallback;
  };

  return { prices, getPrice, loaded };
}

export function invalidatePriceCache() {
  cachedPrices = null;
  fetchPromise = null;
}
