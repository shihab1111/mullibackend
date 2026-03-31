import mongoose from "mongoose";
import http from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import { connectRedis } from "./app/config/redis.config";
// import { initFirebase } from "./app/config/firebase.config";


// initFirebase();
let server: http.Server;

server = http.createServer(app);

const startServer = async () => {
  try {
    await connectRedis();
    await mongoose.connect(envVars.DB_URL);
    console.log("Connected to Database");
    server.listen(envVars.PORT, () => {
      console.log(`Server is listening on port ${envVars.PORT}`);
    });

  } catch (error) {
    console.log(error);
  }
};

(async () => {
  await startServer();
})();
