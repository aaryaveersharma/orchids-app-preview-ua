import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { formatPinAsPassword } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json();

    if (email?.toLowerCase() === 'theurbanauto@gmail.com') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const adminPin = '1234';

      // If the admin uses the target PIN, ensure the user exists and has it
      if (pin === adminPin) {
        const hashedPassword = formatPinAsPassword(adminPin);
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const adminUser = users.find(u => u.email === email);
        if (adminUser) {
          await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
            password: hashedPassword,
            email_confirm: true
          });
        } else {
          await supabaseAdmin.auth.admin.createUser({
            email,
            password: hashedPassword,
            email_confirm: true,
            user_metadata: { full_name: 'Admin' }
          });
        }
      }
    }

    return NextResponse.json({ email });
  } catch (error: any) {
    console.error('Admin pre-login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
