import net from "net";
import dns from "dns/promises";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { target, startPort, endPort } = req.body;

    let ip = target;

    if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target)) {
      const result = await dns.lookup(target);
      ip = result.address;
    }

    const results = [];

    for (let port = startPort; port <= endPort; port++) {

      const open = await scanPort(ip, port);

      if (open) {
        results.push({
          port,
          status: "open"
        });
      }

    }

    res.status(200).json({
      target: ip,
      results
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

}

function scanPort(ip, port) {

  return new Promise((resolve) => {

    const socket = new net.Socket();

    socket.setTimeout(1500);

    socket.connect(port, ip, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

  });

}
