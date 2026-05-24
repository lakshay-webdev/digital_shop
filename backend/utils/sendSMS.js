const sendSMS = async (phone, message) => {
  console.log(`SMS skipped - Twilio not configured. To: ${phone}`);
};

module.exports = sendSMS;