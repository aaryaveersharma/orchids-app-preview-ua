'use client';

import { useState, useCallback, useEffect } from 'react';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
    // For Web Browser: Call requestPermission immediately to preserve user gesture
    if (typeof window !== 'undefined' && 'Notification' in window && !Capacitor.isNativePlatform()) {
      const permission = await Notification.requestPermission();
      setStatus(permission as any);

      if (permission !== 'granted') {
        if (permission === 'denied') {
          toast.error('Notification permission denied. Please enable it in browser settings.');
        }
        return false;
      }

      // Permission granted — try Firebase JS SDK for proper FCM token
      try {
        const { initializeApp, getApps } = await import('firebase/app');
        const { getMessaging, getToken } = await import('firebase/messaging');

        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        if (firebaseConfig.projectId && firebaseConfig.messagingSenderId) {
          const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
          const messaging = getMessaging(app);

          // Register firebase-messaging-sw.js for background message handling
          let fcmSwReg: ServiceWorkerRegistration | undefined;
          try {
            fcmSwReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            await navigator.serviceWorker.ready;
          } catch {
            // fall through — will use default SW
          }

          const swReg = fcmSwReg || (await navigator.serviceWorker.ready);
          const fcmToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: swReg,
          });

          if (fcmToken) {
            setToken(fcmToken);
            await saveToken(fcmToken);
            toast.success('Notifications enabled successfully!');
            return true;
          }
        }
      } catch (sdkErr) {
        console.warn('Firebase SDK token fetch failed, trying web push fallback:', sdkErr);
      }

      // Fallback: standard Web Push subscription with VAPID key
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          let subscription = await registration.pushManager.getSubscription();

          if (!subscription) {
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            const subscribeOptions: PushSubscriptionOptionsInit = { userVisibleOnly: true };

            if (vapidKey) {
              // Convert base64url VAPID key to Uint8Array
              const padding = '='.repeat((4 - vapidKey.length % 4) % 4);
              const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
              const rawData = window.atob(base64);
              const keyArray = new Uint8Array(rawData.length);
              for (let i = 0; i < rawData.length; i++) {
                keyArray[i] = rawData.charCodeAt(i);
              }
              subscribeOptions.applicationServerKey = keyArray;
            }

            try {
              subscription = await registration.pushManager.subscribe(subscribeOptions);
            } catch (subErr) {
              console.error('Browser push subscription failed:', subErr);
            }
          }

          if (subscription) {
            const endpoint = subscription.endpoint;
            let browserToken: string;

            if (endpoint.includes('fcm.googleapis.com')) {
              const segments = endpoint.split('/');
              browserToken = segments[segments.length - 1];
            } else {
              browserToken = JSON.stringify(subscription);
            }

            setToken(browserToken);
            await saveToken(browserToken);
            toast.success('Notifications enabled successfully!');
            return true;
          }
        }
      } catch (err) {
        console.error('Web push fallback error:', err);
      }

      // Permission was granted even if token registration failed
      toast.success('Notifications enabled!');
      return true;
    }

    // NATIVE PATH
    try {
      const permStatus = await PushNotifications.requestPermissions();
      const newStatus = permStatus.receive as any;
      setStatus(newStatus);

      if (newStatus !== 'granted') return false;

      await PushNotifications.register();

      // Clear existing listeners to avoid duplicates
      PushNotifications.removeAllListeners();

      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Native push token received:', token.value);
        setToken(token.value);
        saveToken(token.value);
        setStatus('granted');
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Native registration error:', error);
        setStatus('error');
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Foreground push received:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push action performed:', action);
        const data = action.notification.data;
        if (data.type === 'booking_confirmed' && data.booking_id) {
          router.push('/bookings');
        }
      });

      return true;
    } catch (err) {
      console.error('Native push setup error:', err);
      setStatus('error');
      return false;
    }
  }, [user?.id, saveToken, router]);

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
        const browserPerm = Notification.permission;
        if (browserPerm === 'default') setStatus('prompt');
        else if (browserPerm === 'granted') {
          setStatus('granted');
          // Re-sync token if already granted
          registerNotifications();
        }
        else setStatus('denied');
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
