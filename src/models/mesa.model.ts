import { Schema, model } from 'mongoose';

const mesaSchema = new Schema(
  {
    numero: { type: Number, required: true, unique: true, min: 1 },
    capacidade: { type: Number, required: true, min: 1 },
    localizacao: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export const MesaModel = model('Mesa', mesaSchema);