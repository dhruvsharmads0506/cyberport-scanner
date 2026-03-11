// api/scan.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    // Example: pretend to scan something
    res.status(200).json({ message: "Scan completed successfully!" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
