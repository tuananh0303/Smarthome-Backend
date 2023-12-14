const mongoose = require("mongoose");
const deviceSchema = new mongoose.Schema(
  {
    door: { type: Number, require: true },
    fan: { type: Number, require: true },
    lamp: { type: Number, require: true },
  },
  {
    timestamps: true,
  }
);
const DeviceModel = mongoose.model("Device", deviceSchema);
module.exports = DeviceModel;
