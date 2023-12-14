const mqtt = require("mqtt");
const Sensor = require("../models/SensorModel");
const Device = require("../models/DeviceModel");

let mqttClient = null;
const subscribedTopics = [];

const connectMqtt = () => {
  mqttClient = mqtt.connect("mqtt://io.adafruit.com", {
    port: 1883,
    username: "khoitruong9802",
    password: process.env.KEY,
  });

  mqttClient.on("connect", () => {
    console.log("Connected to MQTT broker");
  });
  mqttClient.on("message", (topic, message) => {
    // console.log(`Received message on topic ${topic}: ${message.toString()}`);
    // Xử lý tin nhắn nhận được
    handleMessageSensor(topic, message);
    handleMessageDevice(topic, message);
  });
};

const subscribeToTopic = (topic) => {
  if (!mqttClient) {
    connectMqtt();
  }
  if (!subscribedTopics.includes(topic)) {
    mqttClient.subscribe(topic, (err) => {
      if (err) {
        console.error("Error subscribing to topic:", err);
      } else {
        console.log("Subscribed to topic:", topic);
        subscribedTopics.push(topic);
      }
    });
  } else {
    console.log("Already subscribed to topic:", topic);
  }
};

const publishToTopic = (topic, data) => {
  if (!mqttClient) {
    connectMqtt();
  }

  mqttClient.publish(topic, JSON.stringify(data), (err) => {
    if (err) {
      console.error("Error publishing to topic:", err);
    } else {
      console.log(`Published to topic ${topic}: ${JSON.stringify(data)}`);
    }
  });
};
// Các hàm khác như publish, unsubscribe có thể được thêm vào đây
const handleMessageSensor = (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message.toString()}`);
  // Xử lý tin nhắn nhận được và cập nhật dữ liệu
  const data = JSON.parse(message.toString());
  let fieldToUpdate;
  switch (topic) {
    case "khoitruong9802/feeds/get-temp":
      fieldToUpdate = "temperature";
      break;
    case "khoitruong9802/feeds/get-light":
      fieldToUpdate = "light";
      break;
    case "khoitruong9802/feeds/get-humi":
      fieldToUpdate = "humidity";
      break;
    default:
      console.log("Unknown topic:", topic);
      return;
  }
  Sensor.findOneAndUpdate(
    {},
    { $set: { [fieldToUpdate]: data } },
    { upsert: true, new: true },
    (err, result) => {
      if (err) {
        console.error("Error updating data in SensorModel:", err);
      } else {
        console.log("Data updated in SensorModel:", result);
        // Cập nhật giao diện người dùng hoặc thực hiện các tác vụ khác ở đây nếu cần
      }
    }
  );
  // Hoặc gửi dữ liệu tới giao diện người dùng
};

const handleMessageDevice = (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message.toString()}`);
  // Xử lý tin nhắn nhận được và cập nhật dữ liệu
  const data = JSON.parse(message.toString());
  let fieldToUpdate;
  switch (topic) {
    case "khoitruong9802/feeds/control-door":
      fieldToUpdate = "door";
      break;
    case "khoitruong9802/feeds/control-fan":
      fieldToUpdate = "fan";
      break;
    case "khoitruong9802/feeds/control-lamp":
      fieldToUpdate = "lamp";
      break;
    default:
      console.log("Unknown topic:", topic);
      return;
  }
  Device.findOneAndUpdate(
    {},
    { $set: { [fieldToUpdate]: data } },
    { upsert: true, new: true },
    (err, result) => {
      if (err) {
        console.error("Error updating data in DeviceModel:", err);
      } else {
        console.log("Data updated in DeviceModel:", result);
        // Cập nhật giao diện người dùng hoặc thực hiện các tác vụ khác ở đây nếu cần
      }
    }
  );
  // Hoặc gửi dữ liệu tới giao diện người dùng
};

module.exports = {
  connectMqtt,
  subscribeToTopic,
  publishToTopic,
};
