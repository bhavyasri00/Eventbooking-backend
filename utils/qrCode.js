// QR Code generation utility
const generateQRCode = async (data) => {
  try {
    // For now, return a mock QR code URL
    // In production, use a library like 'qrcode' or QR code API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      JSON.stringify(data)
    )}`;
    return qrCodeUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

module.exports = { generateQRCode };
