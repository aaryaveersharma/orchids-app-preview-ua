import re

with open('src/app/api/bookings/create/route.ts', 'r') as f:
    content = f.read()

search = """    // If a package was used, decrement its allowances
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

replace = """    // If a package was used, decrement its allowances
    if (bookingPayload.package_id) {
      const { data: pkgData } = await supabaseAdmin.from('user_packages').select('remaining_allowances').eq('id', bookingPayload.package_id).single();
      if (pkgData && pkgData.remaining_allowances) {
          const updatedAllowances = { ...pkgData.remaining_allowances };
          const serviceName = bookingPayload.service_name || bookingPayload.serviceName;
          if (serviceName && updatedAllowances[serviceName] && updatedAllowances[serviceName] > 0) {
              updatedAllowances[serviceName] -= 1;
              await supabaseAdmin.from('user_packages').update({ remaining_allowances: updatedAllowances }).eq('id', bookingPayload.package_id);
          }
      }
    }"""

if search in content:
    content = content.replace(search, replace)
    with open('src/app/api/bookings/create/route.ts', 'w') as f:
        f.write(content)
    print("Fixed api create route")
else:
    print("Insertion point not found")
