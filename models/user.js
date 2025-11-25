module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("customer", "organizer", "staff", "admin"),
        defaultValue: "customer",
      },
      phone: {
        type: DataTypes.STRING(20),
      },
    },
    {
      timestamps: true,
      tableName: "users",
      underscored: true,
    }
  );

  return User;
};
