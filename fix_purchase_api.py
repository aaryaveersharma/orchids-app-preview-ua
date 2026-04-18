import re

with open('src/app/api/packages/purchase/route.ts', 'r') as f:
    content = f.read()

search = """    const { userId, packageId, price } = body;
    if (!userId || !packageId || price === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { data: profile, error: profileErr } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
    if (profileErr || !profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (profile.wallet_balance < price) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    const { data: pkg, error: pkgErr } = await supabase.from('packages').select('*').eq('id', packageId).single();
    if (pkgErr || !pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });"""

replace = """    const { userId, packageId } = body;
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
    }"""

if search in content:
    content = content.replace(search, replace)
    with open('src/app/api/packages/purchase/route.ts', 'w') as f:
        f.write(content)
    print("Fixed purchase API")
else:
    print("Could not find insertion point")
