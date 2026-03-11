import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/fcm';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // 1. Get all device tokens from Supabase
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('device_tokens')
      .select('id, token');

    if (tokenError) {
      console.error('Error fetching device tokens:', tokenError);
      return NextResponse.json({ error: 'Failed to fetch device tokens' }, { status: 500 });
    }

    const tokenList = tokens?.map(t => t.token).filter(Boolean) || [];

    if (tokenList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No devices registered for notifications',
        deviceCount: 0,
        successCount: 0
      });
    }

    // 2. Try Firebase Admin SDK first (most reliable, handles both native and web tokens)
    const failedTokens = await sendPushNotification(tokenList, title, content, {
      url: 'https://urbanauto.in',
    });

    // 3. Clean up invalid tokens reported by Firebase Admin SDK
    if (failedTokens.length > 0) {
      console.log(`Removing ${failedTokens.length} invalid tokens`);
      for (const badToken of failedTokens) {
        await supabaseAdmin.from('device_tokens').delete().eq('token', badToken);
      }
    }

    const successCount = tokenList.length - failedTokens.length;

    // 4. Fallback: Also try FCM Legacy HTTP API for any web push subscriptions (JSON format)
    //    These are stored as JSON strings and aren't handled by Firebase Admin SDK
    const fcmApiKey = process.env.FCM_API_KEY;
    if (fcmApiKey) {
      const webSubscriptions = tokenList.filter(t => {
        try {
          const parsed = JSON.parse(t);
          return parsed.endpoint && typeof parsed.endpoint === 'string';
        } catch {
          return false;
        }
      });

      if (webSubscriptions.length > 0) {
        const fcmUrl = 'https://fcm.googleapis.com/fcm/send';
        await Promise.all(webSubscriptions.map(async (subJson) => {
          try {
            const sub = JSON.parse(subJson);
            const endpoint = sub.endpoint;
            // Extract FCM token from endpoint if it's an FCM endpoint
            if (endpoint.includes('fcm.googleapis.com')) {
              const segments = endpoint.split('/');
              const fcmToken = segments[segments.length - 1];
              await fetch(fcmUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `key=${fcmApiKey}`,
                },
                body: JSON.stringify({
                  to: fcmToken,
                  notification: {
                    title,
                    body: content,
                    icon: '/icon-192.png',
                    click_action: 'https://urbanauto.in',
                  },
                  data: { url: 'https://urbanauto.in' },
                }),
              });
            }
          } catch (err) {
            console.error('Web sub FCM send error:', err);
          }
        }));
      }
    }

    return NextResponse.json({
      success: true,
      deviceCount: tokenList.length,
      successCount,
    });

  } catch (error: any) {
    console.error('Push Notification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
