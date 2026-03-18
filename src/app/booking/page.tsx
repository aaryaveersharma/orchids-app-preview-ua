'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { services, HOME_SERVICE_IDS } from '@/lib/services-data';
import { ArrowLeft, Calendar, Car, FileText, Loader2, X, Plus, Home, Truck, ChevronRight, Zap, MapPin } from 'lucide-react';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { toast } from 'sonner';
import { getAssetPath, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const vehicleTypes = ['Sedan', 'Hatchback', 'SUV', 'Luxury'];

function BookingContent() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const serviceIdFromUrl = searchParams.get('service');

    const getISTDate = () => {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    };

    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [showServiceList, setShowServiceList] = useState(false);
    const [vehicleType, setVehicleType] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleMakeModel, setVehicleMakeModel] = useState('');
    const [serviceMode, setServiceMode] = useState<'Home Service' | 'Pickup & Drop'>('Pickup & Drop');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dbPrices, setDbPrices] = useState<Record<string, any>>({});
    const [pricesLoaded, setPricesLoaded] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const today = getISTDate();
        setDate(today);

        const draft = localStorage.getItem('ua_booking_draft');
        if (draft) {
            try {
                const data = JSON.parse(draft);
                if (data.selectedServices?.length) setSelectedServices(data.selectedServices);
                if (data.vehicleType) setVehicleType(data.vehicleType);
                if (data.vehicleNumber) setVehicleNumber(data.vehicleNumber);
                if (data.vehicleMakeModel) setVehicleMakeModel(data.vehicleMakeModel);
                if (data.serviceMode) setServiceMode(data.serviceMode);

                if (data.date && data.date >= today) {
                    setDate(data.date);
                    if (data.time) setTime(data.time);
                }
                if (data.notes) setNotes(data.notes);
            } catch (e) {
                console.error('Failed to parse draft', e);
            }
        } else if (user) {
            if (user.vehicleType) setVehicleType(user.vehicleType);
            if (user.vehicleNumber) setVehicleNumber(user.vehicleNumber);
            if (user.vehicleMakeModel) setVehicleMakeModel(user.vehicleMakeModel);
        }

        if (serviceIdFromUrl && selectedServices.length === 0) {
            setSelectedServices([serviceIdFromUrl]);
        }
    }, [user, serviceIdFromUrl]);

    useEffect(() => {
        if (!mounted) return;
        const data = { selectedServices, vehicleType, vehicleNumber, vehicleMakeModel, serviceMode, date, time, notes };
        localStorage.setItem('ua_booking_draft', JSON.stringify(data));
    }, [selectedServices, vehicleType, vehicleNumber, vehicleMakeModel, serviceMode, date, time, notes, mounted]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [isLoading, user, router]);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data, error } = await supabase.from('app_config').select('*').eq('key', 'booking_slots').single();
                if (!error && data?.value?.slots) {
                    setAvailableSlots(data.value.slots);
                }
            } catch {}
        };
        fetchConfig();

        const fetchPrices = async () => {
            try {
                const { data, error } = await supabase.from('service_prices').select('*');
                if (error) throw error;
                if (data) {
                    const map: Record<string, any> = {};
                    data.forEach((row: any) => { map[row.service_id] = row; });
                    setDbPrices(map);
                    setPricesLoaded(true);
                }
            } catch (e) {
                console.error('Fetch prices failed', e);
                setPricesLoaded(true);
            }
        };
        fetchPrices();
    }, []);

    const fetchOccupiedSlots = useCallback(async () => {
        if (!date) return;
        setLoadingSlots(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('preferred_time')
                .in('status', ['Confirmed', 'Rescheduled', 'Completed'])
                .like('preferred_date_time', `${date}%`);

            if (!error && data) {
                setOccupiedSlots(data.map(b => b.preferred_time).filter(Boolean));
            }
        } catch {
        } finally {
            setLoadingSlots(false);
        }
    }, [date]);

    useEffect(() => {
        if (!mounted) return;
        fetchOccupiedSlots();
        const channel = supabase.channel('slots-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => { fetchOccupiedSlots(); }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [date, fetchOccupiedSlots, mounted]);

    const getPrice = (serviceId: string) => {
        const priceRow = dbPrices[serviceId];
        if (!priceRow) return 0;
        const type = vehicleType || 'Hatchback';
        const key = `price_${type.toLowerCase()}`;
        return Number(priceRow[key]) || 0;
    };

    const getPriceLabel = (serviceId: string) => {
        if (!pricesLoaded) return '---';
        const price = getPrice(serviceId);
        const s = services.find(sv => sv.id === serviceId);
        if (price > 0) return `₹${price.toLocaleString('en-IN')}`;
        return s?.priceLabel || 'QUOTATION';
    };

    const canHomeService = selectedServices.some(id => HOME_SERVICE_IDS.includes(id));
    useEffect(() => { if (!canHomeService && serviceMode === 'Home Service') setServiceMode('Pickup & Drop'); }, [canHomeService, serviceMode]);

    const toggleService = (id: string) => {
        setSelectedServices(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(s => s !== id) : prev) : [...prev, id]);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (selectedServices.length === 0) newErrors.service = 'Select at least one service';
        if (!vehicleType) newErrors.vehicleType = 'Select vehicle type';
        if (!vehicleMakeModel.trim()) newErrors.vehicleMakeModel = 'Enter vehicle model';
        if (!date) newErrors.date = 'Select date';
        if (!time) newErrors.time = 'Select time';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const totalAmount = selectedServices.reduce((sum, id) => sum + getPrice(id), 0);

    const handleProceed = () => {
        if (!pricesLoaded) { toast.error('Loading prices...'); return; }
        if (!validate()) { toast.error('Incomplete details'); return; }
        const selectedServiceNames = selectedServices.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ');
        const summaryData = { selectedServices, serviceName: selectedServiceNames || 'Car Service', vehicleType, vehicleNumber, vehicleMakeModel, serviceMode, date, time, notes, totalAmount, servicePrices: Object.fromEntries(selectedServices.map(id => [id, getPrice(id)])), };
        localStorage.setItem('ua_booking_draft', JSON.stringify(summaryData));
        router.push('/booking/summary');
    };

    if (isLoading || !mounted) {
        return (
            <div className="mobile-container flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const mainServiceId = selectedServices[0] || serviceIdFromUrl;
    const mainService = services.find(s => s.id === mainServiceId);
    const otherSelectedServices = selectedServices.filter(id => id !== mainServiceId);

    return (
        <div className="mobile-container min-h-screen safe-bottom pb-12">
            <header className="px-6 pt-10 pb-6 sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 glass-card rounded-xl flex items-center justify-center hover:bg-primary transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">Reservation</h1>
                </div>
            </header>

            <div className="px-6 py-6 space-y-8">
                {mainService && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2rem] overflow-hidden">
                        <div className="relative h-44 w-full">
                            <Image src={getAssetPath(mainService.image)} alt={mainService.name} fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{mainService.name}</h2>
                                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">{mainService.subtitle}</p>
                            </div>
                        </div>
                        <div className="p-6 flex flex-wrap gap-2">
                            {mainService.features.map((f, i) => (
                                <span key={i} className="px-2.5 py-1 bg-white/5 text-white/40 text-[9px] font-black rounded-lg border border-white/5 uppercase tracking-tighter">{f}</span>
                            ))}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {otherSelectedServices.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Added Expertise</h3>
                            {otherSelectedServices.map(id => {
                                const s = services.find(srv => srv.id === id);
                                if (!s) return null;
                                return (
                                    <motion.div layout key={id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card rounded-3xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden relative">
                                                <Image src={getAssetPath(s.image)} alt={s.name} fill className="object-cover" unoptimized />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-tight">{s.name}</h4>
                                                <p className="text-[10px] font-black text-primary uppercase">{getPriceLabel(s.id)}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleService(id)} className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>

                <div className="glass-card rounded-[2rem] p-6 space-y-6">
                    <div onClick={() => setShowServiceList(!showServiceList)} className="flex items-center justify-between cursor-pointer group">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">Scale your service</h3>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Select additional expert modules</p>
                        </div>
                        <div className={cn("w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center transition-all group-hover:bg-primary", showServiceList && "bg-primary rotate-45")}>
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <AnimatePresence>
                        {showServiceList && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="grid grid-cols-2 gap-3 pt-4">
                                    {services.filter(s => !selectedServices.includes(s.id)).map((s) => (
                                        <button key={s.id} onClick={() => toggleService(s.id)} className="p-4 rounded-[1.5rem] glass-card text-left hover:border-primary/50 transition-all group/s">
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight mb-1">{s.name}</p>
                                            <p className="text-[9px] font-black text-primary uppercase">{getPriceLabel(s.id)}</p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="glass-card rounded-[2rem] p-8 space-y-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Car className="w-6 h-6 text-primary" /> Vehicle Config
                    </h3>

                    <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Segment *</p>
                        <div className="grid grid-cols-2 gap-3">
                            {vehicleTypes.map((type) => (
                                <button key={type} onClick={() => setVehicleType(type)} className={cn("py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", vehicleType === type ? "bg-primary text-white shadow-xl shadow-primary/20" : "glass-card text-white/40 hover:text-white")}>
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="relative">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Make & Model *</p>
                            <input type="text" value={vehicleMakeModel} onChange={(e) => setVehicleMakeModel(e.target.value)} placeholder="E.G. BMW M3 GTR" className="w-full px-6 py-4 rounded-2xl glass-card text-white text-sm font-black uppercase placeholder:text-white/10 outline-none focus:ring-1 focus:ring-primary/50 transition-all" />
                        </div>
                        <div className="relative">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Identity Tag</p>
                            <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="E.G. CG 04 AB 1234" className="w-full px-6 py-4 rounded-2xl glass-card text-white text-sm font-black uppercase placeholder:text-white/10 outline-none focus:ring-1 focus:ring-primary/50 transition-all" />
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-[2rem] p-8 space-y-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Truck className="w-6 h-6 text-primary" /> Service Mode
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setServiceMode('Pickup & Drop')} className={cn("p-6 rounded-[2rem] flex flex-col items-center gap-4 transition-all", serviceMode === 'Pickup & Drop' ? "bg-primary text-white shadow-2xl shadow-primary/20" : "glass-card text-white/40 hover:text-white hover:bg-white/5")}>
                            <Truck className="w-8 h-8" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Pickup & Drop</p>
                        </button>
                        <button onClick={() => canHomeService ? setServiceMode('Home Service') : toast.error('Only for Detailing/Servicing')} className={cn("p-6 rounded-[2rem] flex flex-col items-center gap-4 transition-all", serviceMode === 'Home Service' ? "bg-primary text-white shadow-2xl shadow-primary/20" : "glass-card text-white/40 hover:text-white hover:bg-white/5", !canHomeService && "opacity-20 grayscale cursor-not-allowed")}>
                            <Home className="w-8 h-8" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Home Service</p>
                        </button>
                    </div>
                    {!canHomeService && <p className="text-[10px] text-white/20 font-bold text-center uppercase tracking-tighter">Home service restricted to specific categories</p>}
                </div>

                <div className="glass-card rounded-[2rem] p-8 space-y-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-primary" /> Scheduling
                    </h3>

                    <div className="relative">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Launch Date *</p>
                        <input type="date" value={date} min={getISTDate()} onChange={(e) => { setDate(e.target.value); setTime(''); }} className="w-full px-6 py-4 rounded-2xl glass-card text-white text-sm font-black outline-none focus:ring-1 focus:ring-primary/50 transition-all" />
                    </div>

                    <AnimatePresence>
                        {date && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Select Mission Window</p>
                                {loadingSlots ? (
                                    <div className="flex justify-center py-10"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                                ) : (
                                    <div className="space-y-8">
                                        {['Morning', 'Afternoon', 'Evening'].map(group => {
                                            const groupSlots = availableSlots.filter(s => {
                                                const h = parseInt(s.split(':')[0]);
                                                const isPm = s.toLowerCase().includes('pm');
                                                if (group === 'Morning') return !isPm && h < 12;
                                                if (group === 'Afternoon') return (isPm && (h === 12 || h < 4)) || (!isPm && h === 12);
                                                return isPm && h >= 4 && h !== 12;
                                            });
                                            if (groupSlots.length === 0) return null;
                                            return (
                                                <div key={group}>
                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 border-l-2 border-primary/20 pl-3">{group}</p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {groupSlots.map(slot => {
                                                            const isOccupied = occupiedSlots.includes(slot);
                                                            return (
                                                                <button key={slot} disabled={isOccupied} onClick={() => setTime(slot)} className={cn("py-4 rounded-2xl text-[10px] font-black uppercase transition-all", time === slot ? "bg-primary text-white shadow-xl shadow-primary/20" : isOccupied ? "opacity-10 cursor-not-allowed" : "glass-card text-white/40 hover:text-white")}>
                                                                    {slot}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="glass-card rounded-[2rem] p-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 mb-6">
                        <FileText className="w-6 h-6 text-primary" /> Flight Notes
                    </h3>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="SPECIFIC MODULE REQUIREMENTS..." rows={3} className="w-full px-6 py-4 rounded-2xl glass-card text-white text-sm font-black uppercase placeholder:text-white/10 outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none" />
                </div>

                {selectedServices.length > 0 && vehicleType && (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-3xl p-6 flex items-center justify-between border-primary/20">
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Total Estimation</span>
                        {!pricesLoaded ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <span className="text-2xl font-black text-primary tracking-tighter">{totalAmount > 0 ? `₹${totalAmount.toLocaleString('en-IN')}` : 'QUOTATION'}</span>}
                    </motion.div>
                )}

                <button onClick={handleProceed} className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-primary hover:text-white shadow-2xl shadow-white/5 transition-all flex items-center justify-center gap-3 group">
                    Next Phase <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="mobile-container flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <BookingContent />
        </Suspense>
    );
}
