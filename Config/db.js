const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  ssl: true,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const db = {
  sequelize,
  Sequelize,

  User: require("../models/user")(sequelize, Sequelize.DataTypes),
  Event: require("../models/event")(sequelize, Sequelize.DataTypes),
  Seat: require("../models/seat")(sequelize, Sequelize.DataTypes),
  Booking: require("../models/booking")(sequelize, Sequelize.DataTypes),
  CheckIn: require("../models/checkin")(sequelize, Sequelize.DataTypes),
};

// Define associations
db.User.hasMany(db.Event, { foreignKey: "organizerId", as: "events" });
db.Event.belongsTo(db.User, { foreignKey: "organizerId", as: "organizer" });

db.Event.hasMany(db.Seat, { foreignKey: "eventId", as: "seats" });
db.Seat.belongsTo(db.Event, { foreignKey: "eventId", as: "event" });

db.User.hasMany(db.Booking, { foreignKey: "customerId", as: "bookings" });
db.Booking.belongsTo(db.User, { foreignKey: "customerId", as: "customer" });

db.Event.hasMany(db.Booking, { foreignKey: "eventId", as: "eventBookings" });
db.Booking.belongsTo(db.Event, { foreignKey: "eventId", as: "event" });

db.Booking.belongsToMany(db.Seat, {
  through: "booking_seats",
  as: "bookedSeats",
});
db.Seat.belongsToMany(db.Booking, {
  through: "booking_seats",
  as: "seatBookings",
});

db.User.hasMany(db.CheckIn, { foreignKey: "staffId", as: "checkIns" });
db.CheckIn.belongsTo(db.User, { foreignKey: "staffId", as: "staff" });

db.Booking.hasMany(db.CheckIn, { foreignKey: "bookingId", as: "checkIns" });
db.CheckIn.belongsTo(db.Booking, { foreignKey: "bookingId", as: "booking" });

module.exports = db;
