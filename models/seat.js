module.exports = (sequelize, DataTypes) => {
  const Seat = sequelize.define(
    "Seat",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "events",
          key: "id",
        },
      },
      seatId: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      section: {
        type: DataTypes.STRING(50),
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
      },
      status: {
        type: DataTypes.ENUM("available", "locked", "sold", "checked_in"),
        defaultValue: "available",
      },
      lockedBy: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      lockedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      timestamps: true,
      tableName: "seats",
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["event_id", "seat_id"],
        },
      ],
    }
  );

  return Seat;
};