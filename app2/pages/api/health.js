export default function handler(req, res) {
  res.status(200).json({
    service: 'app2',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Hello from App2!'
  });
}
