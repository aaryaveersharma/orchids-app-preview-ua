import re

with open('src/app/api/bookings/create/route.ts', 'r') as f:
    content = f.read()

search = """    // If a package was used, decrement its allowances
    if (bookingPayload.package_id) {
      const { data: pkgData } = await supabaseAdmin.from('user_packages').select('remaining_allowances').eq('id', bookingPayload.package_id).single();
      // It's tricky to exactly match what was deducted without passing it explicitly, but we know what the user booked.
      // E.g., `serviceName` from the payload.
      if (pkgData && pkgData.remaining_allowances) {
        // We'd parse the allowances, decrement the specific service, and update it.
        // For now, to keep it simple and safe from parsing errors, we'll just log that a package was used in the booking notes.
      }
    }"""

replace = """    // If a package was used, decrement its allowances
    if (bookingPayload.package_id) {
      const { data: pkgData } = await supabaseAdmin.from('user_packages').select('service_allowances').eq('id', bookingPayload.package_id).single();
      if (pkgData && pkgData.service_allowances) {
         let currentAllowances = pkgData.service_allowances;
         let serviceToDeduct = bookingPayload.serviceName;
         if (currentAllowances[serviceToDeduct] && currentAllowances[serviceToDeduct] > 0) {
             currentAllowances[serviceToDeduct] -= 1;
             await supabaseAdmin.from('user_packages').update({ service_allowances: currentAllowances }).eq('id', bookingPayload.package_id);
         }
      }
    }"""

if search in content:
    content = content.replace(search, replace)
    with open('src/app/api/bookings/create/route.ts', 'w') as f:
        f.write(content)
    print("Fixed API create booking route.")
else:
    print("Could not find insertion point in API.")
