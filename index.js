const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const routes = require("./routes");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIO = require("socket.io");

const mqttService = require("./services/MqttService");
const Sensor = require("./models/SensorModel");
const Device = require("./models/DeviceModel");
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://smarthome-iot-nhom13.netlify.app",
      "https://chic-semifreddo-387257.netlify.app",
      "https://transcendent-banoffee-f698fe.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  },
});

const PORT = process.env.PORT || 8080;
const URI = process.env.mongo_URL;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://smarthome-iot-nhom13.netlify.app",
      "https://chic-semifreddo-387257.netlify.app",
      "https://transcendent-banoffee-f698fe.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // cho phép sử dụng các header như Cookies, Authentication header...
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(bodyParser.json());
app.use(cookieParser());

routes(app);
const topic = "khoitruong9802/feeds/get-temp-humi-light";
const topic3 = "khoitruong9802/feeds/control-door";
const topic4 = "khoitruong9802/feeds/control-fan";
const topic5 = "khoitruong9802/feeds/control-lamp";

const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

mongoose
  .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to DB");
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      mqttService.connectMqtt();
      mqttService.subscribeToTopic(topic);
      // mqttService.subscribeToTopic(topic1);
      // mqttService.subscribeToTopic(topic2);
      mqttService.subscribeToTopic(topic3);
      mqttService.subscribeToTopic(topic4);
      mqttService.subscribeToTopic(topic5);

      io.on("connection", async (socket) => {
        console.log("Client connected");

        const datasensor = await getDataFromSensorModel();
        // console.log("datasensor first 1:", datasensor);
        const formatData = {
          temperature: datasensor.temperature,
          humidity: datasensor.humidity,
          light: datasensor.light,
        };
        socket.emit("sensorData", formatData);

        // gọi dữ liệu đầu tiên của datadevice
        const datadevice = await getDataFromDeviceModel();
        const deviceData = {
          door: datadevice.door,
          fan: datadevice.fan,
          lamp: datadevice.lamp,
        };
        socket.emit("deviceData", deviceData);

        socket.on("controlData", async (data) => {
          const lastDeviceData = await Device.findOne()
            .sort({ _id: -1 })
            .limit(1);
          let doorChanged = false;
          let fanChanged = false;
          let lampChanged = false;
          if (data.door !== (lastDeviceData.door === 1)) {
            lastDeviceData.door = data.door ? 1 : 0;
            doorChanged = true;
          }
          if (data.fan !== (lastDeviceData.fan === 1)) {
            lastDeviceData.fan = data.fan ? 1 : 0;
            fanChanged = true;
          }
          if (data.lamp !== (lastDeviceData.lamp === 1)) {
            lastDeviceData.lamp = data.lamp ? 1 : 0;
            lampChanged = true;
          }
          try {
            const updatedDeviceData = await lastDeviceData.save();
            console.log("lastDeviceData new:", updatedDeviceData);
            if (doorChanged) {
              mqttService.publishToTopic(topic3, updatedDeviceData.door);
              // console.log("published control-door");
            } else if (fanChanged) {
              mqttService.publishToTopic(topic4, updatedDeviceData.fan);
              // console.log("published control-fan");
            } else if (lampChanged) {
              mqttService.publishToTopic(topic5, updatedDeviceData.lamp);
              // console.log("published control-lamp");
            }
          } catch (e) {
            console.error("Error updating device data:", e);
          }
        });
        // Hàm để gửi dữ liệu sensorData mới khi có sự thay đổi
        const sendUpdatedSensorData = async () => {
          const latestSensorData = await getDataFromSensorModel();
          if (latestSensorData) {
            const sensorData = {
              temperature: latestSensorData.temperature,
              humidity: latestSensorData.humidity,
              light: latestSensorData.light,
            };
            socket.emit("sensorData", sensorData);
          }
        };
        // Hàm để theo dõi sự thay đổi trong sensorData
        const watchSensorDataChanges = async () => {
          setInterval(async () => {
            await sendUpdatedSensorData();
          }, 30500); // Thời gian để kiểm tra sự thay đổi
        };
        // Gọi hàm để bắt đầu theo dõi sự thay đổi trong sensorData
        watchSensorDataChanges();

        // hàm xử lý khi có sự thay đổi dữ liệu của deviceData
        // Hàm để gửi dữ liệu deviceData mới khi có sự thay đổi
        const sendUpdatedDeviceData = async () => {
          const latestDeviceData = await getDataFromDeviceModel();
          if (latestDeviceData) {
            const deviceData = {
              door: latestDeviceData.door,
              fan: latestDeviceData.fan,
              lamp: latestDeviceData.lamp,
            };
            socket.emit("deviceData", deviceData);
          }
        };
        // Hàm để theo dõi sự thay đổi trong deviceData
        const watchDeviceDataChanges = async () => {
          let previousDeviceData = await getDataFromDeviceModel();

          setInterval(async () => {
            const latestDeviceData = await getDataFromDeviceModel();
            if (!isEqual(previousDeviceData, latestDeviceData)) {
              await sendUpdatedDeviceData();
              previousDeviceData = latestDeviceData;
            }
          }, 500); // Thời gian để kiểm tra sự thay đổi
        };
        // Gọi hàm để bắt đầu theo dõi sự thay đổi trong deviceData
        watchDeviceDataChanges();
      });
    });
  })
  .catch((err) => {
    console.log("err", err);
  });

const getDataFromSensorModel = async () => {
  try {
    const sensorData = await Sensor.findOne().sort({ _id: -1 }).limit(1); // Lấy dữ liệu mới nhất
    return sensorData; // Trả về dữ liệu cảm biến từ cơ sở dữ liệu
  } catch (error) {
    console.error("Error getting sensor data:", error);
    return null;
  }
};

const getDataFromDeviceModel = async () => {
  try {
    const deviceData = await Device.findOne().sort({ _id: -1 }).limit(1); // Lấy dữ liệu mới nhất
    return deviceData; // Trả về dữ liệu cảm biến từ cơ sở dữ liệu
  } catch (error) {
    console.error("Error getting sensor data:", error);
    return null;
  }
};
