module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "Booking",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "events",
          key: "id",
        },
      },
      totalSeats: {
        type: DataTypes.INTEGER,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
      },
      bookingReference: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      ticketId: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: true,
      },
      ticketStatus: {
        type: DataTypes.ENUM("valid", "scanned", "used", "cancelled"),
        defaultValue: "valid",
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "completed", "failed"),
        defaultValue: "pending",
      },
    },
    {
      timestamps: true,
      tableName: "bookings",
      underscored: true,
    }
  );

  return Booking;
};
