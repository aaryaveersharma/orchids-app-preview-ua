'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { services } from '@/lib/services-data';
import { ArrowLeft, Loader2, Ticket, Check, X, Edit3, Clock, Copy, ChevronLeft, ChevronRight, Wallet, Zap, ShieldCheck } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import AddressForm from '@/components/AddressForm';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface OfferCoupon {
  id: string;
  code: string;
  discount_percent: number;
  user_id: string | null;
}

export default function BookingSummaryPage() {
  const { user, isLoading, addBooking, updateAddress, refreshUser } = useAuth();
  const router = useRouter();

  const [summaryData, setSummaryData] = useState<any>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editName, setEditName] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percent: number } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [showInsufficientPopup, setShowInsufficientPopup] = useState(false);

    const [offers, setOffers] = useState<OfferCoupon[]>([]);
    const [offersLoading, setOffersLoading] = useState(true);
    const offersRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }
    if (bookingDone) return;
    const stored = localStorage.getItem('ua_booking_draft');
    if (!stored) {
      router.replace('/booking');
      return;
    }
    try {
      setSummaryData(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to parse booking draft', e);
      router.replace('/booking');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      fetchOffers();
    }
  }, [user?.id]);

  const fetchOffers = async () => {
    if (!user) return;
    setOffersLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/coupons/offers?userId=${user.id}`);
      const data = await res.json();
      if (data.offers) setOffers(data.offers);
    } catch {}
    setOffersLoading(false);
  };

  const checkScroll = useCallback(() => {
    const el = offersRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = offersRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    return () => el.removeEventListener('scroll', checkScroll);
  }, [offers, checkScroll]);

  const scrollOffers = (dir: 'left' | 'right') => {
    const el = offersRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  if (isLoading || !user || !summaryData) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const servicePrices: { id: string; name: string; price: number }[] = summaryData.selectedServices.map((id: string) => {
    const s = services.find(sv => sv.id === id);
    const price = summaryData.servicePrices?.[id] || s?.price || 0;
    return { id, name: s?.name || id, price };
  });

  const totalAmount = summaryData.totalAmount || 0;
  const discountAmount = appliedCoupon
    ? Math.round((totalAmount * appliedCoupon.discount_percent) / 100)
    : 0;
  const finalAmount = totalAmount - discountAmount;
    const walletBalance = user.walletBalance ?? 0;
  const canPayWithWallet = walletBalance >= finalAmount && finalAmount > 0;

  const handleApplyCoupon = async (code?: string) => {
    const codeToApply = code || couponCode.trim();
    if (!codeToApply) {
      toast.error('Enter a coupon code');
      return;
    }
    setCouponLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/coupons/validate`,  {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToApply, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid coupon');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code, discount_percent: data.discount_percent });
        setCouponCode(data.code);
        toast.success(`Coupon applied! ${data.discount_percent}% off`);
      }
    } catch {
      toast.error('Failed to validate coupon');
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleAddressSave = async (address: any, coords?: { lat: number; lng: number }) => {
    const result = await updateAddress(address, coords);
    if (result.success) toast.success('Address saved!');
    else toast.error(result.error || 'Failed to save address');
    return result;
  };

  const handleSaveDetails = () => setEditingDetails(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success('Code copied!'));
    setCouponCode(code);
  };



  const submitBooking = async (paymentMethod: 'pay_later' | 'wallet') => {
    if (submitting || bookingDone) return;
    if (!user?.locationAddress) {
      toast.error('Please set your service address');
      return;
    }

      if (paymentMethod === 'wallet') {
        if (!canPayWithWallet) {
          setShowInsufficientPopup(true);
          return;
        }
        setSubmitting(true);
        try {
          const { data: freshProfile } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', user.id)
            .single();
          const freshBalance = freshProfile?.wallet_balance ?? 0;
          if (freshBalance < finalAmount) {
            setShowInsufficientPopup(true);
            setSubmitting(false);
            return;
          }

          const { error: walletError } = await supabase
            .from('profiles')
            .update({ wallet_balance: freshBalance - finalAmount })
            .eq('id', user.id);
          if (walletError) throw walletError;

          await supabase.from('wallet_transactions').insert([{
            user_id: user.id,
            amount: finalAmount,
            type: 'debit',
            description: `Payment for ${summaryData.serviceName}`,
          }]);

          const result = await addBooking({
            serviceName: summaryData.serviceName,
            vehicleType: summaryData.vehicleType,
            vehicleNumber: summaryData.vehicleNumber,
            vehicleMakeModel: summaryData.vehicleMakeModel,
            serviceMode: summaryData.serviceMode,
            address: user.locationAddress || '',
            locationCoords: user.locationCoords,
            preferredDateTime: `${summaryData.date} ${summaryData.time}`,
            time: summaryData.time,
            notes: summaryData.notes,
            totalAmount: finalAmount,
            paymentMethod: 'wallet',
            paymentStatus: 'paid',
            couponCode: appliedCoupon?.code || null,
            discountAmount,
          });

          if (result.success) {
            setBookingDone(true);
            localStorage.removeItem('ua_booking_draft');
            await refreshUser();

            toast.success('Payment successful! Booking confirmed.');
            router.replace('/bookings');
          } else {
            await supabase.from('profiles').update({ wallet_balance: freshBalance }).eq('id', user.id);
            toast.error(result.error || 'Booking failed');
          }
        } catch {
          toast.error('Payment failed');
        } finally {
          setSubmitting(false);
        }
        return;
      }

    setSubmitting(true);
    try {
      const result = await addBooking({
        serviceName: summaryData.serviceName,
        vehicleType: summaryData.vehicleType,
        vehicleNumber: summaryData.vehicleNumber,
        vehicleMakeModel: summaryData.vehicleMakeModel,
        serviceMode: summaryData.serviceMode,
        address: user.locationAddress || '',
        locationCoords: user.locationCoords,
        preferredDateTime: `${summaryData.date} ${summaryData.time}`,
        time: summaryData.time,
        notes: summaryData.notes,
        totalAmount: finalAmount,
        paymentMethod: 'pay_later',
        paymentStatus: 'unpaid',
        couponCode: appliedCoupon?.code || null,
        discountAmount,
      });

        if (result.success) {
          setBookingDone(true);
          localStorage.removeItem('ua_booking_draft');
          toast.success('Booking confirmed!');
          router.replace('/bookings');
      } else {
        toast.error(result.error || 'Failed to create booking');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mobile-container min-h-screen safe-bottom pb-12">
      <header className="px-6 pt-10 pb-6 sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-black/5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:bg-primary group transition-colors">
            <ArrowLeft className="w-5 h-5 text-black group-hover:text-white transition-colors" />
          </button>
          <h1 className="text-2xl font-black text-black tracking-tight uppercase">Final Phase</h1>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">

        {/* Payment Summary */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <h3 className="text-sm font-black text-black/30 uppercase tracking-[0.2em] px-8 pt-8 pb-4">Mission Manifest</h3>
          <div className="px-8 space-y-4 pb-6">
            {servicePrices.map((sp) => (
              <div key={sp.id} className="flex items-center justify-between">
                <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">{sp.name}</span>
                <span className="text-sm font-black text-black tracking-tighter">
                  {sp.price > 0 ? `₹${sp.price.toLocaleString('en-IN')}` : 'QUOTATION'}
                </span>
              </div>
            ))}
          </div>

          <div className="mx-8 flex flex-wrap gap-2 text-[9px] font-black text-black/30 uppercase tracking-widest pb-6 border-b border-black/5">
            <span className="px-2 py-1 bg-black/5 rounded-lg">{summaryData.vehicleType}</span>
            <span className="px-2 py-1 bg-black/5 rounded-lg">{summaryData.vehicleMakeModel}</span>
            <span className="px-2 py-1 bg-black/5 rounded-lg">{summaryData.date}</span>
            <span className="px-2 py-1 bg-black/5 rounded-lg">{summaryData.time}</span>
          </div>

          {appliedCoupon && discountAmount > 0 && (
            <div className="px-8 py-4 flex items-center justify-between bg-green-500/5">
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Incentive Applied ({appliedCoupon.code})</span>
              <span className="text-sm font-black text-green-500">-₹{discountAmount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="px-8 py-8 flex items-center justify-between">
            <span className="text-xs font-black text-black uppercase tracking-[0.3em]">Total Value</span>
            <span className="text-3xl font-black text-primary tracking-tighter">
              {finalAmount > 0 ? `₹${finalAmount.toLocaleString('en-IN')}` : 'QUOTATION'}
            </span>
          </div>
        </motion.div>

        {/* User Details */}
        <div className="glass-card rounded-[2rem] p-8 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Pilot Details</h3>
            <button
              onClick={() => {
                if (editingDetails) handleSaveDetails();
                else setEditingDetails(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary transition-all hover:text-white"
            >
              {editingDetails ? <><Check className="w-3 h-3" /> Lock</> : <><Edit3 className="w-3 h-3" /> Modify</>}
            </button>
          </div>

          {editingDetails ? (
            <div className="space-y-6">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Pilot Name"
                  className="w-full px-6 py-4 rounded-2xl glass-card text-black text-xs font-black uppercase outline-none focus:ring-1 focus:ring-primary/50"
                />
                <div
                  onClick={() => setShowAddressForm(true)}
                  className="w-full px-6 py-4 rounded-2xl glass-card text-black text-xs font-black uppercase cursor-pointer min-h-[56px] flex items-center"
                >
                  {user.locationAddress ? user.locationAddress : <span className="text-black/20">Set Mission Coordinates</span>}
                </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg font-black text-black uppercase tracking-tight leading-none">{editName || user.name || 'ANONYMOUS'}</p>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-black/50 font-bold uppercase tracking-widest leading-relaxed">{user.locationAddress || 'NO COORDINATES SET'}</p>
              </div>
            </div>
          )}
          <p className="text-[9px] text-primary font-black uppercase tracking-tighter mt-6 opacity-50 text-center">Operational region: Raipur, Chhattisgarh</p>
        </div>

        {showAddressForm && (
          <AddressForm
            onSave={handleAddressSave}
            onClose={() => setShowAddressForm(false)}
            initialAddress={user?.address}
          />
        )}


        {/* Offers for you */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] px-1">Available Incentives</h3>
          {offersLoading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : offers.length === 0 ? (
            <div className="glass-card rounded-[2rem] p-8 text-center border-dashed">
              <p className="text-[10px] text-black/20 font-black uppercase tracking-widest">No active incentives</p>
            </div>
          ) : (
            <div className="relative">
              <div
                ref={offersRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className={`flex-shrink-0 w-[300px] snap-start glass-card rounded-[2rem] p-6 relative overflow-hidden group ${
                      appliedCoupon?.code === offer.code ? 'border-green-500/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{offer.user_id ? 'EXCUSIVE' : 'GLOBAL'}</span>
                    </div>
                    <p className="text-2xl font-black text-black tracking-widest mb-1">{offer.code}</p>
                    <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mb-6">{offer.discount_percent}% REDUCTION RATIO</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyCode(offer.code)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 glass-card rounded-xl text-[10px] font-black uppercase tracking-widest text-black/60 hover:text-black hover:border-black/20 transition-all"
                      >
                        <Copy className="w-4 h-4" /> Copy
                      </button>
                      {appliedCoupon?.code === offer.code ? (
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500 text-white">
                          <Check className="w-6 h-6" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApplyCoupon(offer.code)}
                          disabled={couponLoading}
                          className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-30"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coupon Input */}
        <div className="glass-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Ticket className="w-5 h-5 text-primary" />
            <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Manual Override</h3>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4">
              <div>
                <p className="text-sm font-black text-black tracking-widest">{appliedCoupon.code}</p>
                <p className="text-[9px] text-green-500 font-black uppercase tracking-tighter">PROTOCOL ENGAGED: {appliedCoupon.discount_percent}% OFF</p>
              </div>
              <button onClick={removeCoupon} className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center hover:bg-green-500 transition-colors group">
                <X className="w-5 h-5 text-green-500 group-hover:text-white" />
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
              className="flex-1 px-6 py-4 rounded-2xl glass-card text-black text-xs font-black uppercase placeholder:text-black/10 outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                onClick={() => handleApplyCoupon()}
                disabled={couponLoading}
                className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-30"
              >
                {couponLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>

        {/* Payment Options */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] px-1">Engagement Protocol</h3>

          <button
            onClick={() => submitBooking('pay_later')}
            disabled={submitting || bookingDone}
            className="w-full glass-card border-none py-5 rounded-[2rem] text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-black/5 transition-all disabled:opacity-30 flex items-center justify-center gap-4"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5 text-primary" />}
            Pay After Execution
          </button>

          <button
            onClick={() => submitBooking('wallet')}
            disabled={submitting || bookingDone}
            className={`w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30 flex items-center justify-center gap-4 ${
              canPayWithWallet
                ? 'bg-primary text-white shadow-2xl shadow-primary/20'
                : 'bg-black/5 text-black/20 border border-black/5'
            }`}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className={canPayWithWallet ? "w-5 h-5" : "w-5 h-5 text-black/20"} />}
            Pilot Wallet (₹{walletBalance.toLocaleString('en-IN')})
          </button>
          {!canPayWithWallet && finalAmount > 0 && (
            <p className="text-[9px] text-primary font-black uppercase text-center tracking-widest">Insufficient Credits in Reservoir</p>
          )}
        </div>

        <div className="h-12" />
      </div>

        {/* Insufficient Balance Popup */}
        <AnimatePresence>
          {showInsufficientPopup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6" onClick={() => setShowInsufficientPopup(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-[3rem] p-10 w-full max-w-sm text-center border-primary/20" onClick={(e) => e.stopPropagation()}>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20">
                  <Wallet className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Refuel Required</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-loose mb-10">
                  Reservoir: <span className="text-white">₹{walletBalance.toLocaleString('en-IN')}</span><br/>
                  Required: <span className="text-white">₹{finalAmount.toLocaleString('en-IN')}</span>
                </p>
                <div className="space-y-3">
                  <button onClick={() => { setShowInsufficientPopup(false); router.push('/wallet/add-money'); }} className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all">Add Credits</button>
                  <button onClick={() => setShowInsufficientPopup(false)} className="w-full glass-card text-white/50 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:text-white transition-all">Abort Protocol</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  