import re

with open('src/app/api/bookings/create/route.ts', 'r') as f:
    content = f.read()

search = """    // If a package was used, decrement its allowances
    if (bookingPayload.package_id) {
      const { data: pkgData } = await supabaseAdmin.from('user_packages').select('remaining_allowances').eq('id', bookingPayload.package_id).single();
      if (pkgData && pkgData.remaining_allowances) {
          const updatedAllowances = { ...pkgData.remaining_allowances };

          // Deduct the services used in this booking
          // We expect bookingPayload.service_name to contain the services used, but a better approach
          // would be to pass the specific services deducted. Since we don't have that easily,
          // we'll parse the service_name string if it's comma separated, or just assume the frontend handled it correctly.
          // For now, to keep it simple and safe from parsing errors, we'll just log that a package was used in the booking notes.

          // A proper implementation would receive the exact services to deduct from the frontend.
      }
    }"""

replace = """    // If a package was used, decrement its allowances
    if (bookingPayload.package_id) {
      const { data: pkgData } = await supabaseAdmin.from('user_packages').select('service_allowances').eq('id', bookingPayload.package_id).single();
      if (pkgData && pkgData.service_allowances) {
          const updatedAllowances = { ...pkgData.service_allowances };
          const serviceName = bookingPayload.service_name || bookingPayload.serviceName;
          if (serviceName && updatedAllowances[serviceName] && updatedAllowances[serviceName] > 0) {
              updatedAllowances[serviceName] -= 1;
              await supabaseAdmin.from('user_packages').update({ service_allowances: updatedAllowances }).eq('id', bookingPayload.package_id);
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
