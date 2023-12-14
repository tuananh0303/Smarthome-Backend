const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
