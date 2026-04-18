import re

with open('src/app/booking/summary/page.tsx', 'r') as f:
    content = f.read()

# I missed appending package_id to addBooking args in my previous change. Let's fix that.
# I need to add `packageId: appliedPackage?.id || null` to the `addBooking` call.

add_booking_wallet_replace = """const result = await addBooking({
            serviceName: summaryData.serviceName,
            vehicleType: summaryData.vehicleType,
            vehicleNumber: summaryData.vehicleNumber,
            vehicleMakeModel: summaryData.vehicleMakeModel,
            serviceMode: summaryData.serviceMode,
            address: user.locationAddress || '',
            locationCoords: user.locationCoords,
            preferredDateTime: `${summaryData.date} ${summaryData.time}`,
            time: summaryData.time,
            notes: summaryData.notes,
            totalAmount: finalAmount,
            paymentMethod: 'wallet',
            paymentStatus: 'paid',
            couponCode: appliedCoupon?.code || null,
            discountAmount,
            packageId: appliedPackage?.id || null,
          });"""

add_booking_wallet_search = """const result = await addBooking({
            serviceName: summaryData.serviceName,
            vehicleType: summaryData.vehicleType,
            vehicleNumber: summaryData.vehicleNumber,
            vehicleMakeModel: summaryData.vehicleMakeModel,
            serviceMode: summaryData.serviceMode,
            address: user.locationAddress || '',
            locationCoords: user.locationCoords,
            preferredDateTime: `${summaryData.date} ${summaryData.time}`,
            time: summaryData.time,
            notes: summaryData.notes,
            totalAmount: finalAmount,
            paymentMethod: 'wallet',
            paymentStatus: 'paid',
            couponCode: appliedCoupon?.code || null,
            discountAmount,
          });"""

add_booking_cash_replace = """const result = await addBooking({
        serviceName: summaryData.serviceName,
        vehicleType: summaryData.vehicleType,
        vehicleNumber: summaryData.vehicleNumber,
        vehicleMakeModel: summaryData.vehicleMakeModel,
        serviceMode: summaryData.serviceMode,
        address: user.locationAddress || '',
        locationCoords: user.locationCoords,
        preferredDateTime: `${summaryData.date} ${summaryData.time}`,
        time: summaryData.time,
        notes: summaryData.notes,
        totalAmount: finalAmount,
        paymentMethod: 'pay_later',
        paymentStatus: 'unpaid',
        couponCode: appliedCoupon?.code || null,
        discountAmount,
        packageId: appliedPackage?.id || null,
      });"""

add_booking_cash_search = """const result = await addBooking({
        serviceName: summaryData.serviceName,
        vehicleType: summaryData.vehicleType,
        vehicleNumber: summaryData.vehicleNumber,
        vehicleMakeModel: summaryData.vehicleMakeModel,
        serviceMode: summaryData.serviceMode,
        address: user.locationAddress || '',
        locationCoords: user.locationCoords,
        preferredDateTime: `${summaryData.date} ${summaryData.time}`,
        time: summaryData.time,
        notes: summaryData.notes,
        totalAmount: finalAmount,
        paymentMethod: 'pay_later',
        paymentStatus: 'unpaid',
        couponCode: appliedCoupon?.code || null,
        discountAmount,
      });"""

content = content.replace(add_booking_wallet_search, add_booking_wallet_replace)
content = content.replace(add_booking_cash_search, add_booking_cash_replace)

with open('src/app/booking/summary/page.tsx', 'w') as f:
    f.write(content)
