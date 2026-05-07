const mqtt = require("mqtt");


const client = mqtt.connect(
  "mqtts://a29bd1e5390a430bb32d4bcddf1dcbc8.s1.eu.hivemq.cloud:8883",
  {
    username: "admin",
    password: "Admin123",
    rejectUnauthorized: false
  }
);

//  Simulated devices
const devices = ["node-1", "node-2"];

client.on("connect", () => {
  console.log(" Connected to HiveMQ Cloud");

  setInterval(() => {
    devices.forEach((deviceId) => {
      const payload = {
        device_id: deviceId,
        temperature: Number((60 + Math.random() * 20).toFixed(2)),
        humidity: Number((40 + Math.random() * 20).toFixed(2)),
        air_quality: Math.floor(80 + Math.random() * 100),

        //  node-2 more likely to trigger fire
        flame: deviceId === "node-2"
          ? Math.random() > 0.5
          : Math.random() > 0.8,

        timestamp: new Date().toISOString()
      };

      const topic = `enviraLog/${deviceId}/data`;

      client.publish(topic, JSON.stringify(payload), (err) => {
        if (err) {
          console.error(` Failed for ${deviceId}:`, err);
        } else {
          console.log(` ${deviceId} `, payload);
        }
      });
    });
  }, 2000); // send data every 2 seconds
});

client.on("error", (err) => {
  console.error(" Error:", err.message);
});

client.on("reconnect", () => {
  console.log(" Reconnecting...");
});