'use client';

import { useState, useCallback, useEffect } from 'react';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export const useNativeNotifications = () => {
  const [status, setStatus] = useState<'prompt' | 'granted' | 'denied' | 'error' | 'loading'>('loading');
  const [token, setToken] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const saveToken = useCallback(async (deviceToken: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: user.id,
          token: deviceToken,
          platform: Capacitor.getPlatform(),
        }, { onConflict: 'token' });

      if (error) console.error('Error saving device token:', error);
    } catch (err) {
      console.error('Failed to save device token', err);
    }
  }, [user]);

  const registerNotifications = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        // 1. Request Permissions
        let permStatus = await PushNotifications.requestPermissions();
        setStatus(permStatus.receive as any);

        if (permStatus.receive !== 'granted') return false;

        // 2. Register
        await PushNotifications.register();

        // 3. Handle Events
        PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push registration success, token: ' + token.value);
          setToken(token.value);
          saveToken(token.value);
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
          setStatus('error');
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push received: ' + JSON.stringify(notification));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
          console.log('Push action performed: ' + JSON.stringify(action));
          const data = action.notification.data;
          if (data.type === 'booking_confirmed' && data.booking_id) {
            router.push('/bookings');
          }
        });

        return true;
      } catch (err) {
        console.error('Error setting up native push notifications', err);
        setStatus('error');
        return false;
      }
    } else {
      // Browser implementation
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setStatus('denied');
        return false;
      }

      try {
        const permission = await Notification.requestPermission();
        setStatus(permission === 'granted' ? 'granted' : 'denied');

        if (permission !== 'granted') return false;

        // We use the Service Worker to get the subscription
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;

          // Note: We need a VAPID key for browser push.
          // Since we only have FCM_API_KEY (server-side), we'll try to
          // use the public VAPID key if available. If not, browser push might fail.
          // For now, we'll try to get an existing subscription or log the need for VAPID.

          let subscription = await registration.pushManager.getSubscription();

          if (!subscription) {
            // Ideally we need: registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })
            console.warn('Browser push subscription requires a VAPID public key.');
          } else {
            const browserToken = JSON.stringify(subscription);
            setToken(browserToken);
            saveToken(browserToken);
          }
          return !!subscription;
        }
      } catch (err) {
        console.error('Error requesting browser notification permission', err);
        setStatus('error');
      }
      return false;
    }
  }, [user, saveToken, router]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      PushNotifications.checkPermissions().then((res) => {
        setStatus(res.receive as any);
        if (res.receive === 'granted') {
          registerNotifications();
        }
      });
    } else {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setStatus(Notification.permission === 'default' ? 'prompt' : (Notification.permission as any));
      } else {
        setStatus('denied');
      }
    }
  }, [registerNotifications]);

  useEffect(() => {
    if (user && token) {
      saveToken(token);
    }
  }, [user, token, saveToken]);

  return { registerNotifications, status, token };
};
