'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useNativeNotifications } from '@/hooks/useNativeNotifications';
import { ArrowLeft, User, Mail, Phone, LogOut, ChevronRight, HelpCircle, Info, KeyRound, Eye, EyeOff, X, Loader2, Wallet, Shield, Trash2, Bell, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { getAssetPath } from '@/lib/utils';
import NotificationModal from '@/components/NotificationModal';

function NotificationToggle() {
  const { registerNotifications, status } = useNativeNotifications();
  const [showModal, setShowModal] = useState(false);
  if (status === 'granted') return null;
  const handleEnable = async () => { await registerNotifications(); setShowModal(false); };
  return (
    <>
      <button onClick={() => setShowModal(true)} className="w-full flex items-center gap-4 p-5 glass-card rounded-2xl hover:bg-black/5 transition-all">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-[10px] font-black text-black uppercase tracking-widest">Enable Notifications</span>
          <p className="text-[8px] text-black/30 font-bold uppercase tracking-tighter">Stay updated with your bookings</p>
        </div>
        <ChevronRight className="w-4 h-4 text-black/20" />
      </button>
      <NotificationModal isOpen={showModal} onClose={() => setShowModal(false)} onEnable={handleEnable} />
    </>
  );
}

export default function ProfilePage() {
  const { user, isLoading, logout, updatePin } = useAuth();
  const router = useRouter();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStep, setPinStep] = useState<'otp' | 'reset'>('otp');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (!isLoading && !user) router.replace('/login'); }, [isLoading, user?.id]);
  useEffect(() => { if (resendTimer > 0) { const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000); return () => clearTimeout(t); } }, [resendTimer]);

  if (isLoading || !user) return <div className="mobile-container flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const handleLogout = async () => { await logout(); toast.success('Logged out successfully'); router.replace('/login'); };

  const openPinModal = async () => {
    setShowPinModal(true); setPinStep('otp'); setOtp(['', '', '', '', '', '']); setNewPin(''); setConfirmNewPin('');
    if (user.phone) {
      setOtpSending(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: user.phone }), });
        const data = await res.json(); if (!res.ok) throw new Error(data.error);
        toast.success('OTP sent to +91' + user.phone); setResendTimer(30); setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } catch (err: any) { toast.error(err.message || 'Failed to send OTP'); } finally { setOtpSending(false); }
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join(''); if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setOtpVerifying(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: user.phone, code }), });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      toast.success('OTP verified!'); setPinStep('reset');
    } catch (err: any) { toast.error(err.message || 'Invalid OTP'); } finally { setOtpVerifying(false); }
  };

  const handlePinReset = async () => {
    if (!newPin || !/^\d{4}$/.test(newPin)) { toast.error('Pin must be 4 digits'); return; }
    if (newPin !== confirmNewPin) { toast.error('Pins do not match'); return; }
    setPinLoading(true);
    const result = await updatePin(newPin);
    if (result.success) { toast.success('Pin updated'); setShowPinModal(false); } else { toast.error(result.error || 'Failed'); }
    setPinLoading(false);
  };

  const walletBalance = user.walletBalance ?? 0;

  return (
    <div className="mobile-container min-h-screen safe-bottom pb-12">
      <header className="px-6 pt-10 pb-6 sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-black/5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/home')} className="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:bg-primary group transition-colors">
            <ArrowLeft className="w-5 h-5 text-black group-hover:text-white transition-colors" />
          </button>
          <h1 className="text-2xl font-black text-black tracking-tight uppercase">Pilot Profile</h1>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 group-hover:rotate-6 transition-transform">
                <span className="text-3xl font-black text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-black uppercase tracking-tight leading-none mb-2">{user.name}</h2>
                <div className="inline-flex items-center gap-2 px-2 py-1 bg-black/5 rounded-lg border border-black/5">
                    <span className="text-[8px] font-black text-black/30 uppercase tracking-widest">User ID:</span>
                    <span className="text-[8px] font-black text-primary tracking-widest">{user.displayId}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-black/5 space-y-6 relative z-10">
              <div className="flex items-center gap-4 group/item cursor-pointer" onClick={() => router.push('/wallet')}>
                <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center group-hover/item:bg-primary transition-all">
                  <Wallet className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">Balance Reservoir</p>
                  <p className="text-sm font-black text-primary tracking-tighter">₹{walletBalance.toLocaleString('en-IN')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-black/10 ml-auto group-hover/item:text-primary transition-colors" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">Comms Interface</p>
                  <p className="text-xs font-black text-black/60 tracking-tight lowercase">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-black/30 uppercase tracking-widest">Mobile Link</p>
                  <p className="text-xs font-black text-black/60 tracking-tight">+91 {user.phone}</p>
                </div>
              </div>
            </div>
          </motion.div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] px-1">Control Center</h3>
          <div className="space-y-3">
            <button onClick={() => toast.info('System update pending')} className="w-full flex items-center gap-4 p-5 glass-card rounded-2xl hover:bg-white/5 transition-all group">
              <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center group-hover:bg-primary transition-all">
                <User className="w-5 h-5 text-black group-hover:text-white transition-colors" />
              </div>
              <span className="flex-1 text-left text-[10px] font-black text-black uppercase tracking-widest">Edit Manifest</span>
              <ChevronRight className="w-4 h-4 text-black/20" />
            </button>
            <button onClick={openPinModal} className="w-full flex items-center gap-4 p-5 glass-card rounded-2xl hover:bg-white/5 transition-all group">
              <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center group-hover:bg-primary transition-all">
                <KeyRound className="w-5 h-5 text-black group-hover:text-white transition-colors" />
              </div>
              <span className="flex-1 text-left text-[10px] font-black text-black uppercase tracking-widest">Reset Pin Code</span>
              <ChevronRight className="w-4 h-4 text-black/20" />
            </button>
            <NotificationToggle />
            <button onClick={handleLogout} className="w-full flex items-center gap-4 p-5 glass-card rounded-2xl hover:bg-red-500/10 transition-all group">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-all">
                <LogOut className="w-5 h-5 text-red-500 group-hover:text-white" />
              </div>
              <span className="flex-1 text-left text-[10px] font-black text-red-500 uppercase tracking-widest">Abort Session</span>
              <ChevronRight className="w-4 h-4 text-red-500/20" />
            </button>
            <button onClick={() => router.push('/profile/delete-account')} className="w-full flex items-center gap-4 p-5 glass-card rounded-2xl hover:bg-red-500/10 transition-all group border-dashed border-red-500/20">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-all">
                <Trash2 className="w-5 h-5 text-red-500 group-hover:text-white" />
              </div>
              <span className="flex-1 text-left text-[10px] font-black text-red-500 uppercase tracking-widest">Purge Account</span>
              <ChevronRight className="w-4 h-4 text-red-500/20" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] px-1">Intelligence</h3>
          <div className="space-y-3">
            <button onClick={() => router.push('/contact')} className="w-full flex items-center gap-4 p-5 glass-card rounded-2xl hover:bg-white/5 transition-all group">
              <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center group-hover:bg-primary transition-all">
                <HelpCircle className="w-5 h-5 text-black group-hover:text-white transition-colors" />
              </div>
              <span className="flex-1 text-left text-[10px] font-black text-black uppercase tracking-widest">Help Desk</span>
              <ChevronRight className="w-4 h-4 text-black/20" />
            </button>
            <button onClick={() => router.push('/about')} className="w-full flex items-center gap-4 p-5 glass-card rounded-2xl hover:bg-white/5 transition-all group">
              <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center group-hover:bg-primary transition-all">
                <Info className="w-5 h-5 text-black group-hover:text-white transition-colors" />
              </div>
              <span className="flex-1 text-left text-[10px] font-black text-black uppercase tracking-widest">Mission Info</span>
              <ChevronRight className="w-4 h-4 text-black/20" />
            </button>
            <button onClick={() => router.push('/privacy-policy')} className="w-full flex items-center gap-4 p-5 glass-card rounded-2xl hover:bg-white/5 transition-all group">
              <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center group-hover:bg-primary transition-all">
                <Shield className="w-5 h-5 text-black group-hover:text-white transition-colors" />
              </div>
              <span className="flex-1 text-left text-[10px] font-black text-black uppercase tracking-widest">Security Protocol</span>
              <ChevronRight className="w-4 h-4 text-black/20" />
            </button>
          </div>
        </div>

        <div className="mt-12 text-center pb-10">
          <Image src={getAssetPath('/hashtag-logo.png')} alt="Hashtag Garage" width={50} height={50} className="rounded-2xl mx-auto mb-4 invert opacity-20" unoptimized />
          <p className="text-[10px] text-black/10 font-black uppercase tracking-[0.4em]">HASHTAG GARAGE V1.0.0</p>
        </div>
      </div>

      <AnimatePresence>
        {showPinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6" onClick={() => setShowPinModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-[3rem] p-10 w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowPinModal(false)} className="absolute top-8 right-8 w-10 h-10 glass-card rounded-full flex items-center justify-center hover:bg-red-500 transition-colors group">
                  <X className="w-5 h-5 text-white/40 group-hover:text-white" />
                </button>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-8">Pin Reset</h3>

              {pinStep === 'otp' && (
                <div className="space-y-8">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest text-center leading-loose">
                    AUTHENTICATION TOKEN SENT TO<br/><span className="text-white">+91 {user.phone}</span>
                  </p>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="tel" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => { if (!/^\d*$/.test(e.target.value)) return; const n = [...otp]; n[i] = e.target.value.slice(-1); setOtp(n); if (e.target.value && i < 5) otpRefs.current[i+1]?.focus(); }} onKeyDown={(e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus(); }} className="w-10 h-14 text-center text-lg font-black bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-primary transition-all" />
                    ))}
                  </div>
                  <button onClick={handleVerifyOtp} disabled={otpVerifying || otp.join('').length !== 6} className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3">
                    {otpVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    Verify Protocol
                  </button>
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em]">Signal recovery in {resendTimer}s</p>
                    ) : (
                      <button onClick={() => {}} className="text-[8px] text-primary font-black uppercase tracking-[0.2em] hover:underline">Re-broadcast Signal</button>
                    )}
                  </div>
                </div>
              )}

              {pinStep === 'reset' && (
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Target Pin *</p>
                    <div className="relative">
                      <input type={showNewPin ? 'text' : 'password'} inputMode="numeric" pattern="[0-9]*" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4-DIGIT CODE" className="w-full px-6 py-4 rounded-2xl glass-card text-white text-lg font-black tracking-[0.5em] text-center outline-none focus:ring-1 focus:ring-primary/50" />
                      <button type="button" onClick={() => setShowNewPin(!showNewPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                        {showNewPin ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Confirm Target</p>
                    <input type={showNewPin ? 'text' : 'password'} inputMode="numeric" pattern="[0-9]*" maxLength={4} value={confirmNewPin} onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="RE-ENTER CODE" className="w-full px-6 py-4 rounded-2xl glass-card text-white text-lg font-black tracking-[0.5em] text-center outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                  <button onClick={handlePinReset} disabled={pinLoading || newPin.length !== 4 || confirmNewPin.length !== 4} className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3">
                    {pinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                    Arm Security
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
