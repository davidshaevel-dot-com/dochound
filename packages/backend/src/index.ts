import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { healthRouter, tenantsRouter, chatRouter } from './routes/index.js';
import { tenantService } from './tenants/index.js';

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
app.use('/api/tenants', tenantsRouter);
app.use('/api/tenants', chatRouter);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

// Initialize services and start server
async function start() {
  try {
    // Initialize tenant service (discovers tenants from filesystem)
    await tenantService.initialize();

    app.listen(PORT, () => {
      console.log(`DocHound backend running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Tenants API: http://localhost:${PORT}/api/tenants`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();
