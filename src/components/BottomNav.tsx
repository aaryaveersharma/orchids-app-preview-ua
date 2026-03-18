'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Wrench, CalendarDays, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'home', label: 'Home', icon: Home, href: '/home' },
  { id: 'services', label: 'Expertise', icon: Wrench, href: '/services' },
  { id: 'bookings', label: 'Logs', icon: CalendarDays, href: '/bookings' },
  { id: 'profile', label: 'Pilot', icon: User, href: '/profile' },
];

export default function BottomNav() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user || isAdmin) return null;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[380px] z-[45]">
      <div className="glass-card rounded-[2rem] p-2 shadow-2xl shadow-black/10 border border-black/5">
        <div className="flex items-center justify-around h-16 relative">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.href)}
                className={`relative flex flex-col items-center justify-center w-16 h-full transition-all duration-500 group`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-primary/10 rounded-2xl blur-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <tab.icon 
                  className={`w-5 h-5 mb-1 transition-all duration-500 relative z-10 ${isActive ? 'text-primary scale-110' : 'text-black/20 group-hover:text-black/40'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[8px] font-black uppercase tracking-widest relative z-10 transition-all duration-500 ${isActive ? 'text-black' : 'text-black/20 group-hover:text-black/40'}`}>
                  {tab.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(255,87,34,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
