'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable: () => void;
}

export default function NotificationModal({ isOpen, onClose, onEnable }: NotificationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Design elements to match Urban Auto */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Stay tuned for future updates
              </h2>

              <p className="text-gray-600 text-sm leading-relaxed mb-8">
                Stay tuned for future updates by enabling notifications
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={onEnable}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  Enable
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3 text-gray-400 font-semibold text-sm hover:text-gray-600 transition-all"
                >
                  no thanks
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
