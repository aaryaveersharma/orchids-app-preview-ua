import re

with open('src/app/api/bookings/create/route.ts', 'r') as f:
    content = f.read()

# We need to add the backend logic to deduct package allowance.
# It should look something like this in the `if (bookingPayload.packageId)` block:
search = """if (bookingPayload.packageId) {
      console.log(`[Create Booking] Need to deduct allowance from package ${bookingPayload.packageId}`);
      // TODO: Implement actual deduction from user_packages.service_allowances
      // A proper implementation would receive the exact services to deduct from the frontend.
    }"""

replace = """if (bookingPayload.packageId) {
      console.log(`[Create Booking] Need to deduct allowance from package ${bookingPayload.packageId}`);
      // Fetch the package
      const { data: pkgData } = await supabaseAdmin
        .from('user_packages')
        .select('service_allowances')
        .eq('id', bookingPayload.packageId)
        .single();

      if (pkgData && pkgData.service_allowances && pkgData.service_allowances[bookingPayload.serviceName] > 0) {
         const newAllowances = { ...pkgData.service_allowances };
         newAllowances[bookingPayload.serviceName] -= 1;

         await supabaseAdmin
           .from('user_packages')
           .update({ service_allowances: newAllowances })
           .eq('id', bookingPayload.packageId);

         console.log(`[Create Booking] Deducted allowance for ${bookingPayload.serviceName} from package ${bookingPayload.packageId}`);
      }
    }"""

if search in content:
    content = content.replace(search, replace)
    with open('src/app/api/bookings/create/route.ts', 'w') as f:
        f.write(content)
    print("Fixed API create booking route.")
else:
    print("Could not find insertion point in API.")
