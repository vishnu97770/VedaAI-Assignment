import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import connectDB from './config/db';
import assignmentRoutes from './routes/assignment';
import { initWebSocket } from './websocket/wsManager';
import './workers/assignmentWorker';


const app = express();
const server = createServer(app);

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/assignments', assignmentRoutes);

// health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'VedaAI server is running' });
});

// init websocket
initWebSocket(server);

// init mongodb
connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;