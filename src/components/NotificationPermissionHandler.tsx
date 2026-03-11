'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNativeNotifications } from '@/hooks/useNativeNotifications';
import NotificationModal from './NotificationModal';

export default function NotificationPermissionHandler() {
  const { user } = useAuth();
  const { registerNotifications, status } = useNativeNotifications();
  const [showModal, setShowModal] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      // Reset when user logs out so new users get the prompt
      setShowModal(false);
      lastUserIdRef.current = null;
      return;
    }

    // Only show if notification permission hasn't been decided yet
    if (status !== 'prompt') return;

    // Use a per-user key so different users on the same device each get prompted
    const storageKey = `ua_notif_prompted_${user.id}`;
    const alreadyPrompted = localStorage.getItem(storageKey);

    if (!alreadyPrompted) {
      // Delay slightly for better UX after login/signup redirect
      const timer = setTimeout(() => setShowModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user?.id, status]);

  const handleEnable = async () => {
    await registerNotifications();
    if (user?.id) {
      localStorage.setItem(`ua_notif_prompted_${user.id}`, 'true');
    }
    setShowModal(false);
  };

  const handleNoThanks = () => {
    if (user?.id) {
      localStorage.setItem(`ua_notif_prompted_${user.id}`, 'true');
    }
    setShowModal(false);
  };

  return (
    <NotificationModal
      isOpen={showModal}
      onClose={handleNoThanks}
      onEnable={handleEnable}
    />
  );
}
