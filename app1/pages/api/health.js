export default function handler(req, res) {
  res.status(200).json({
    service: 'app1',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Hello from App1!'
  });
}
