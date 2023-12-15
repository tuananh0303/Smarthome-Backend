const mqtt = require("mqtt");
const Sensor = require("../models/SensorModel");
const Device = require("../models/DeviceModel");

let mqttClient = null;
// const subscribedTopics = [];

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
    handleMessageSensor(topic, message);
    handleMessageDevice(topic, message);
  });
};

const subscribeToTopic = (topic) => {
  if (!mqttClient) {
    connectMqtt();
  }
  // if (!subscribedTopics.includes(topic)) {
  mqttClient.subscribe(topic, (err) => {
    if (err) {
      console.error("Error subscribing to topic:", err);
    } else {
      console.log("Subscribed to topic:", topic);
      subscribedTopics.push(topic);
    }
  });
  // } else {
  //   console.log("Already subscribed to topic:", topic);
  // }
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

const handleMessageSensor = async (topic, message) => {
  if (topic === "khoitruong9802/feeds/get-temp-humi-light") {
    const data = message.toString();
    const datasensor = data.split("-");
    const newData = {
      temperature: parseFloat(datasensor[0]), // Chuyển đổi sang số nếu cần thiết
      humidity: parseFloat(datasensor[1]),
      light: parseFloat(datasensor[2]),
    };
    console.log("newData:", newData);
    try {
      const compareDataold = await getDataFromSensorModel();
      if (
        compareDataold.temperature !== newData.temperature ||
        compareDataold.humidity !== newData.humidity ||
        compareDataold.light !== newData.light
      ) {
        Sensor.create(newData, (err, result) => {
          if (err) {
            console.error("Error creating new Sensor data:", err);
          } else {
            console.log("New Sensor data created:", result);
          }
        });
      } else {
        console.log("error data is duplicated");
      }
    } catch (error) {
      console.error("Error comparing sensor data:", error);
    }
  }
};

const getDataFromSensorModel = async () => {
  try {
    const sensorData = await Sensor.findOne().sort({ _id: -1 }).limit(1); // Lấy dữ liệu mới nhất
    return sensorData; // Trả về dữ liệu cảm biến từ cơ sở dữ liệu
  } catch (error) {
    console.error("Error getting sensor data:", error);
    return null;
  }
};

const handleMessageDevice = (topic, message) => {
  const data = message.toString();
  const deviceData = parseInt(data);
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
    { $set: { [fieldToUpdate]: deviceData } },
    { upsert: true, new: true },
    (err, result) => {
      if (err) {
        console.error("Error updating data in DeviceModel:", err);
      } else {
        console.log("Data updated in DeviceModel:", result);
      }
    }
  );
};

module.exports = {
  connectMqtt,
  subscribeToTopic,
  publishToTopic,
};
