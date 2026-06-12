import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((item) => item.message);
    response.status(400).json({ message: messages.join('. ') });
    return;
  }

  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    response.status(409).json({ message: 'Já existe um registro com esses dados' });
    return;
  }

  console.error('Erro não tratado:', error);
  response.status(500).json({ message: 'Erro interno do servidor' });
};
