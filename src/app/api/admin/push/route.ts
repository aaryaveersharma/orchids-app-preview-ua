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

    // 1. Fetch all device tokens
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('device_tokens')
      .select('token');

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
        successCount: 0,
      });
    }

    // 2. Separate plain FCM tokens from JSON web push subscriptions
    const plainTokens: string[] = [];
    const webSubTokens: string[] = [];

    for (const t of tokenList) {
      try {
        const parsed = JSON.parse(t);
        if (parsed.endpoint) {
          webSubTokens.push(t);
        } else {
          plainTokens.push(t);
        }
      } catch {
        plainTokens.push(t);
      }
    }

    let successCount = 0;

    // 3. Send to plain FCM tokens via Firebase Admin SDK
    if (plainTokens.length > 0) {
      const failedTokens = await sendPushNotification(
        plainTokens,
        title,
        content,
        { url: 'https://urbanauto.in' }
      );

      // Clean up invalid tokens
      for (const bad of failedTokens) {
        await supabaseAdmin.from('device_tokens').delete().eq('token', bad);
      }

      successCount += plainTokens.length - failedTokens.length;
    }

    // 4. Send to web push JSON subscriptions via FCM Legacy HTTP API
    const fcmApiKey = process.env.FCM_API_KEY;
    if (fcmApiKey && webSubTokens.length > 0) {
      const fcmUrl = 'https://fcm.googleapis.com/fcm/send';

      const results = await Promise.all(webSubTokens.map(async (subJson) => {
        try {
          const sub = JSON.parse(subJson);
          const endpoint = sub.endpoint as string;

          // Extract FCM token from endpoint URL
          if (endpoint.includes('fcm.googleapis.com')) {
            const fcmToken = endpoint.split('/').pop();
            const response = await fetch(fcmUrl, {
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
                  icon: 'https://urbanauto.in/icon-192.png',
                  click_action: 'https://urbanauto.in',
                },
                data: { url: 'https://urbanauto.in' },
              }),
            });

            if (!response.ok) {
              const errText = await response.text();
              if (errText.includes('NotRegistered') || errText.includes('InvalidRegistration')) {
                await supabaseAdmin.from('device_tokens').delete().eq('token', subJson);
              }
              return false;
            }
            return true;
          }
          return false;
        } catch (err) {
          console.error('Web sub send error:', err);
          return false;
        }
      }));

      successCount += results.filter(Boolean).length;
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
