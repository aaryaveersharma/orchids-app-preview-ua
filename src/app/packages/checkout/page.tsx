'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Package as PackageIcon, Check, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function PackageCheckout() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/packages/checkout');
      return;
    }
    const d = localStorage.getItem('ua_booking_draft');
    if (d) {
      setDraft(JSON.parse(d));
    } else {
      router.replace('/packages');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
     // Fetch the latest user profile details (including wallet_balance)
     // so we don't display a stale cached value of 0.
     if (user && refreshUser) {
         refreshUser();
     }
  }, []);

  if (isLoading || !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handlePayWallet = async () => {
    if (!user) return;
    if ((user.walletBalance || user.wallet_balance || 0) < draft.package_price) {
      toast.error('Insufficient wallet balance');
      router.push('/wallet');
      return;
    }

    setPaying(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, packageId: draft.package_id, price: draft.package_price })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Package purchased successfully!');
      localStorage.removeItem('ua_booking_draft');
      router.replace('/packages');
    } catch (e: any) {
      toast.error(e.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mobile-container bg-gray-50 min-h-screen pb-20">
      <header className="bg-white px-4 py-4 flex items-center gap-4 border-b sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <PackageIcon className="w-5 h-5 text-primary" />
          Checkout Package
        </h1>
      </header>

      <main className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{draft.package_name}</h2>
          <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-4">
            <span className="text-gray-500 font-medium">Total Amount</span>
            <span className="text-2xl font-black text-primary">₹{draft.package_price}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Payment Method</h3>
          <button
            onClick={handlePayWallet}
            disabled={paying}
            className="w-full p-4 rounded-xl border-2 border-primary/20 bg-primary/5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 text-sm">Pay from Wallet</p>
                <p className="text-xs text-gray-500">Balance: ₹{user?.walletBalance || user?.wallet_balance || 0}</p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              {paying ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Check className="w-4 h-4 text-white" />}
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
