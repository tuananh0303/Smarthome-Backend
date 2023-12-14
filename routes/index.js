const UserRouter = require("./UserRouter");
// const RoomRouter = require("./RoomRouter");
// const DeviceRouter = require("./DeviceRouter");
// const SensorRouter = require("./SensorRouter");

const routes = (app) => {
  app.use("/api/user", UserRouter);
  // app.use("/api/room", RoomRouter);
  //   app.use("api/device", DeviceRouter);
  //   app.use("api/sensor", SensorRouter);
};

module.exports = routes;
