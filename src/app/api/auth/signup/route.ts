import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { formatPinAsPassword } from '@/lib/utils';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const body = await request.text();
    
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { name, email, phone, password } = data;

    if (!email || !name) {
        return NextResponse.json({ error: 'Email and Name are required' }, { status: 400 });
    }

    // Default password for simple auth if not provided
    const finalPassword = password || '1234';
    // Dummy phone if not provided, since schema requires it
    // Use a unique dummy phone based on timestamp to avoid collisions
    const finalPhone = phone || `DUMMY_${Date.now()}`;

    // Create user and auto-confirm email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: formatPinAsPassword(finalPassword),
      email_confirm: true,
      user_metadata: { full_name: name, phone: finalPhone }
    });

    if (userError) {
      if (userError.message.toLowerCase().includes('already registered') || userError.message.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    if (!userData.user) {
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
    }

    // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert([
          {
            id: userData.user.id,
            email,
            full_name: name,
            phone: finalPhone,
            verified: true,
            blocked: false,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'id' });

    if (profileError) {
      console.error('Profile Creation Error:', profileError);
      return NextResponse.json({ error: 'User created but profile setup failed' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: userData.user.id,
        email: email,
        name: name,
        phone: finalPhone
      }
    });
  } catch (error: any) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
