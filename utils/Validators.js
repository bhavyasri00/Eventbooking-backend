const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateBookingData = (data) => {
  const errors = [];

  if (!data.customerId || !Number.isInteger(data.customerId)) {
    errors.push("Invalid customerId");
  }

  if (!data.eventId || !Number.isInteger(data.eventId)) {
    errors.push("Invalid eventId");
  }

  if (!Array.isArray(data.seats) || data.seats.length === 0) {
    errors.push("At least one seat must be selected");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword,
  validateBookingData,
};
