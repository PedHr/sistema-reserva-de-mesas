import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reservaRouter } from './routes/reserva.routes.js';
import { mesaRouter } from './routes/mesa.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, message: 'API funcionando' });
});

app.use('/api/reservas', reservaRouter);
app.use('/api/mesas', mesaRouter);

app.use((_request, response) => {
  response.status(404).json({ message: 'Rota não encontrada' });
});

app.use(errorHandler);