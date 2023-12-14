const mongoose = require("mongoose");
const sensorSchema = new mongoose.Schema(
  {
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    light: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);
const SensorModel = mongoose.model("Sensor", sensorSchema);
module.exports = SensorModel;
