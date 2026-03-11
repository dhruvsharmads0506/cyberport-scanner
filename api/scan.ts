export default function handler(req: any, res: any) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { target, startPort, endPort } = req.body;

  if (!target || !startPort || !endPort) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const results = [
    { port: 80, status: "open", banner: "HTTP Server" },
    { port: 443, status: "open", banner: "HTTPS Server" }
  ];

  return res.status(200).json({ results });
}
