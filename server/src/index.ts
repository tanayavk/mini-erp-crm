import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import customerRoutes from './routes/customerRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    connection.release();

    res.status(200).json({
      success: true,
      message: 'Server is healthy and database connection is established',
      data: {
        timestamp: new Date().toISOString(),
        database: 'Connected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server health check failed: Database connection error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;