import { Schema, model, Types } from 'mongoose';

export type StatusReserva = 'reservado' | 'ocupado' | 'finalizado' | 'cancelado';

const reservaSchema = new Schema(
  {
    nomeCliente: { type: String, required: true, trim: true },
    contatoCliente: { type: String, required: true, trim: true },
    mesa: { type: Schema.Types.ObjectId, ref: 'Mesa', required: true },
    numeroMesa: { type: Number, required: true },
    quantidadePessoas: { type: Number, required: true, min: 1 },
    dataHoraReserva: { type: Date, required: true },
    duracaoMinutos: { type: Number, required: true, default: 90 },
    observacoes: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['reservado', 'ocupado', 'finalizado', 'cancelado'],
      default: 'reservado'
    }
  },
  { timestamps: true }
);

export type ReservaDocument = {
  _id: Types.ObjectId;
  nomeCliente: string;
  contatoCliente: string;
  mesa: Types.ObjectId;
  numeroMesa: number;
  quantidadePessoas: number;
  dataHoraReserva: Date;
  duracaoMinutos: number;
  observacoes: string;
  status: StatusReserva;
};

export const ReservaModel = model('Reserva', reservaSchema);