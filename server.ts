import express from "express";
import { createServer as createViteServer } from "vite";
import net from "net";
import dns from "dns";
import { promisify } from "util";

const lookup = promisify(dns.lookup);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for port scanning
  app.post("/api/scan", async (req, res) => {
    const { target, startPort, endPort } = req.body;

    if (!target || isNaN(startPort) || isNaN(endPort)) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    try {
      // Resolve hostname if it's a URL
      let ip = target;
      if (target.includes("://")) {
        const url = new URL(target);
        ip = url.hostname;
      } else if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target)) {
        const result = await lookup(target);
        ip = result.address;
      }

      const results = [];
      const scanPromises = [];

      for (let port = startPort; port <= endPort; port++) {
        scanPromises.push(scanPort(ip, port));
      }

      const scanResults = await Promise.all(scanPromises);
      res.json({ target: ip, results: scanResults.filter(r => r !== null) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  function scanPort(ip: string, port: number): Promise<{ port: number; status: string; banner?: string } | null> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let banner = "";

      socket.setTimeout(2000);

      socket.on("connect", () => {
        // Try to grab banner for common ports or if it sends something
        socket.write("HEAD / HTTP/1.1\r\n\r\n"); // Send a generic probe
      });

      socket.on("data", (data) => {
        banner += data.toString();
        socket.destroy();
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve(null);
      });

      socket.on("error", () => {
        socket.destroy();
        resolve(null);
      });

      socket.on("close", (hadError) => {
        if (!hadError || banner) {
          resolve({ 
            port, 
            status: "open", 
            banner: banner.trim().substring(0, 200) || "No banner response" 
          });
        } else {
          resolve(null);
        }
      });

      socket.connect(port, ip);
    });
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
