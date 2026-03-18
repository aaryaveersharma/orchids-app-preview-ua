'use client';

import { useRouter } from 'next/navigation';
import { useAuth, Booking } from '@/lib/auth-context';
import { ArrowLeft, Calendar, Clock, MapPin, X, AlertCircle, Loader2, IndianRupee, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';

function RescheduleModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { rescheduleBooking } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date || !time) {
      toast.error('Select new date and time');
      return;
    }
    setLoading(true);
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    const formattedTime = `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;

    const result = await rescheduleBooking(booking.id, `${date} ${formattedTime}`);
    if (result.success) {
      toast.success('Mission Rescheduled');
      onClose();
    } else {
      toast.error(result.error || 'Failed to reschedule');
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-[3rem] p-10 w-full max-w-sm relative"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">Reschedule</h3>
          <button onClick={onClose} className="p-2 glass-card rounded-full text-white/40 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-6 mb-10">
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">New Launch Date</p>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl glass-card text-white text-xs font-black uppercase outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">New Mission Time</p>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl glass-card text-white text-xs font-black uppercase outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          Update Protocol
        </button>
      </motion.div>
    </div>
  );
}

function BookingItem({ booking, onCancel, onReschedule }: {
  booking: Booking; 
  onCancel: (id: string) => void;
  onReschedule: (booking: Booking) => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const created = new Date(booking.createdAt).getTime();
      const now = new Date().getTime();
      const diff = 60 * 60 * 1000 - (now - created);
      return Math.max(0, diff);
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000 * 60);

    return () => clearInterval(interval);
  }, [booking.createdAt]);

  const minutesLeft = Math.floor(timeLeft / (1000 * 60));
  const canReschedule = timeLeft > 0 && (booking.status === 'Confirmed' || booking.status === 'Rescheduled');

  const isRescheduleConfirmed = booking.status === 'Confirmed' && booking.rescheduledBy !== null && booking.rescheduledBy !== undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Completed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Rescheduled': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-[2rem] p-6 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-black uppercase tracking-tight leading-none mb-2">{booking.serviceName}</h3>
          <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">{booking.vehicleType}</p>
        </div>
        <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border ${getStatusColor(booking.status)}`}>
          {isRescheduleConfirmed ? 'Reschedule Active' : booking.status}
        </span>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 glass-card rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">{booking.preferredDateTime}</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 glass-card rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-relaxed line-clamp-2">{booking.address}</span>
        </div>
        <div className="flex items-center gap-3 pt-2">
            <div className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                {(booking.totalAmount && booking.totalAmount > 0) ? booking.totalAmount.toLocaleString('en-IN') : 'QUOTATION'}
            </div>
            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${booking.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
            </span>
        </div>
      </div>

      {canReschedule && (
        <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest">Protocol open for {minutesLeft}m</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onReschedule(booking)}
              className="flex-1 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-black/5"
            >
              Reschedule
            </button>
            <button
              onClick={() => onCancel(booking.id)}
              className="flex-1 py-3 glass-card text-black/40 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-red-500 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {booking.status === 'Confirmed' && !canReschedule && (
        <button
          onClick={() => onCancel(booking.id)}
          className="w-full py-4 rounded-2xl bg-black/5 border border-black/5 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all mt-4"
        >
          Abort Mission
        </button>
      )}

      {booking.status === 'Cancelled' && (
        <div className="w-full py-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] text-center mt-4">
          Mission Terminated
        </div>
      )}
    </motion.div>
  );
}

export default function BookingsPage() {
  const { user, isLoading, bookings, cancelBooking } = useAuth();
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  useEffect(() => { if (!isLoading && !user) router.replace('/login'); }, [isLoading, user, router]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings]);

  const confirmCancel = async () => {
    if (!cancellingId) return;
    const id = cancellingId; setCancellingId(null);
    const result = await cancelBooking(id);
    if (result?.success) toast.success('Mission Aborted');
    else toast.error(result?.error || 'Abort Failed');
  };

  if (isLoading || !user) return <div className="mobile-container flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="mobile-container min-h-screen safe-bottom pb-24">
      <header className="px-6 pt-10 pb-6 sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-black/5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/home')} className="w-9 h-9 glass-card rounded-full flex items-center justify-center hover:bg-primary group transition-colors">
            <ArrowLeft className="w-4 h-4 text-black group-hover:text-white transition-colors" />
          </button>
          <h1 className="text-lg font-black text-black tracking-tight uppercase">Mission Logs</h1>
        </div>
      </header>

      <div className="px-6 py-8">
        {sortedBookings.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 glass-card rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-dashed">
              <Calendar className="w-10 h-10 text-black/10" />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">No active missions</h3>
            <p className="text-[10px] text-black/30 font-bold uppercase tracking-widest mb-10 px-10">Your operational history is currently empty.</p>
            <button
              onClick={() => router.push('/home')}
              className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-2xl shadow-black/5 flex items-center justify-center gap-3"
            >
              Start Mission <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedBookings.map((booking) => (
              <BookingItem 
                key={booking.id} 
                booking={booking} 
                onCancel={setCancellingId}
                onReschedule={setReschedulingBooking}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {cancellingId && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6" onClick={() => setCancellingId(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-[3rem] p-10 w-full max-w-sm text-center border-red-500/20" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Abort Mission?</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-loose mb-10">
                This action will terminate the scheduled service sequence immediately.
              </p>
              <div className="space-y-3">
                <button onClick={confirmCancel} className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-500/20 transition-all">Confirm Abort</button>
                <button onClick={() => setCancellingId(null)} className="w-full glass-card text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">Maintain Mission</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reschedulingBooking && (
          <RescheduleModal
            booking={reschedulingBooking}
            onClose={() => setReschedulingBooking(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
