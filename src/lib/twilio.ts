import twilio from 'twilio';

/**
 * Sends a WhatsApp notification to the garage owner when a new booking is created.
 *
 * @param bookingData The details of the new booking.
 */
export async function sendBookingWhatsAppNotification(bookingData: {
  name: string;
  phone: string;
  service: string;
  vehicle: string;
  date: string;
  time: string;
  address: string;
  payment: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const ownerNumber = process.env.GARAGE_OWNER_NUMBER;

  if (!accountSid || !authToken || !whatsappNumber || !ownerNumber) {
    console.error('Missing Twilio or Garage Owner environment variables. WhatsApp notification skipped.');
    return;
  }

  try {
    const client = twilio(accountSid, authToken);

    const message = `
🚗 NEW GARAGE BOOKING

Name: ${bookingData.name}
Phone: ${bookingData.phone}
Service: ${bookingData.service}
Vehicle: ${bookingData.vehicle}
Date: ${bookingData.date}
Time: ${bookingData.time}
Address: ${bookingData.address}
Payment: ${bookingData.payment}
`;

    await client.messages.create({
      from: whatsappNumber.startsWith('whatsapp:') ? whatsappNumber : `whatsapp:${whatsappNumber}`,
      to: ownerNumber.startsWith('whatsapp:') ? ownerNumber : `whatsapp:${ownerNumber}`,
      body: message,
    });

    console.log('WhatsApp notification sent successfully to garage owner.');
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
  }
}
