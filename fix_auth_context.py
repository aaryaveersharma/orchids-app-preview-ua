import re

with open('src/lib/auth-context.tsx', 'r') as f:
    content = f.read()

search = """function mapProfileToUser(profile: any): User {
  return {
    id: profile.id,
    displayId: profile.display_id,
    name: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: (profile.address_line1 || profile.state || profile.city || profile.pincode) ? {
      line1: profile.address_line1 || '',
      line2: profile.address_line2 || '',
      state: profile.state || '',
      city: profile.city || '',
      pincode: profile.pincode || '',
    } : undefined,
    locationAddress: profile.location_address,
    locationCoords: profile.location_coords,
    vehicleType: profile.vehicle_type,
    vehicleNumber: profile.vehicle_number,
    vehicleMakeModel: profile.vehicle_make_model,
  };
}"""

replace = """function mapProfileToUser(profile: any): User {
  return {
    id: profile.id,
    displayId: profile.display_id,
    name: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    wallet_balance: profile.wallet_balance || 0, // Add wallet_balance to User
    address: (profile.address_line1 || profile.state || profile.city || profile.pincode) ? {
      line1: profile.address_line1 || '',
      line2: profile.address_line2 || '',
      state: profile.state || '',
      city: profile.city || '',
      pincode: profile.pincode || '',
    } : undefined,
    locationAddress: profile.location_address,
    locationCoords: profile.location_coords,
    vehicleType: profile.vehicle_type,
    vehicleNumber: profile.vehicle_number,
    vehicleMakeModel: profile.vehicle_make_model,
  };
}"""

if search in content:
    content = content.replace(search, replace)
    with open('src/lib/auth-context.tsx', 'w') as f:
        f.write(content)
    print("Fixed mapProfileToUser to include wallet_balance")
else:
    print("Could not find mapProfileToUser")
