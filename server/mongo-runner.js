import net from "net";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { MongoMemoryServer } from "mongodb-memory-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 27017;
const DB_DIR = path.join(__dirname, "data", "db");

export function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

export async function ensureMongo() {
  const inUse = await isPortOpen(PORT);
  if (inUse) {
    return;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  console.log(`Starting MongoDB engine on port ${PORT}...`);
  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: PORT,
        ip: "127.0.0.1",
        dbPath: DB_DIR,
        storageEngine: "wiredTiger",
      },
    });

    console.log(`MongoDB connected on port ${PORT}`);
    process.on("SIGINT", async () => {
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.warn("Notice: could not start embedded Mongo:", err.message);
  }
}
