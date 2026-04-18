import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  );

  try {
    const body = await req.json();
    const { userId, packageId } = body;
    if (!userId || !packageId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { data: pkg, error: pkgErr } = await supabase.from('packages').select('*').eq('id', packageId).single();
    if (pkgErr || !pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

    const price = pkg.price; // Trust DB price, not client payload

    const { data: profile, error: profileErr } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
    if (profileErr || !profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (profile.wallet_balance < price) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    const newBalance = profile.wallet_balance - price;
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId);

    const { error: insertErr } = await supabase.from('user_packages').insert([{
      user_id: userId,
      package_id: packageId,
      package_name: pkg.name,
      remaining_allowances: pkg.service_allowances,
      status: 'active'
    }]);

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    await supabase.from('wallet_transactions').insert([{
      user_id: userId,
      amount: price,
      type: 'debit',
      description: `Purchased Package: ${pkg.name}`
    }]);

    return NextResponse.json({ success: true, newBalance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
