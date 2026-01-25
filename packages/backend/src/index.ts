import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = process.env.CORS_ORIGIN
  ? { origin: process.env.CORS_ORIGIN }
  : {}; // Allow all origins in development when CORS_ORIGIN is not set
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api', healthRouter);

// Start server
app.listen(PORT, () => {
  console.log(`DocHound backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
