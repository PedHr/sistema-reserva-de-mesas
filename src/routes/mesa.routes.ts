import { Router } from 'express';
import { MesaModel } from '../models/mesa.model.js';
import { ReservaModel } from '../models/reserva.model.js';
import type { ReservaDocument } from '../models/reserva.model.js';

export const mesaRouter = Router();

type ReservaResumo = Pick<ReservaDocument, 'dataHoraReserva' | 'duracaoMinutos' | 'status'>;

function calcularStatusMesa(reservas: ReservaResumo[]) {
  const agora = new Date();

  const ocupada = reservas.some((reserva) => {
    if (reserva.status === 'cancelado' || reserva.status === 'finalizado') {
      return false;
    }

    const inicio = new Date(reserva.dataHoraReserva);
    const fim = new Date(inicio.getTime() + reserva.duracaoMinutos * 60000);
    return agora >= inicio && agora < fim;
  });

  if (ocupada) {
    return 'ocupado';
  }

  const reservada = reservas.some((reserva) => {
    if (reserva.status === 'cancelado' || reserva.status === 'finalizado') {
      return false;
    }

    const inicio = new Date(reserva.dataHoraReserva);
    return agora < inicio;
  });

  if (reservada) {
    return 'reservado';
  }

  return 'available';
}

function getReservaAtiva<T extends ReservaResumo>(reservas: T[]) {
  const agora = new Date();

  return reservas.find((reserva) => {
    if (reserva.status === 'cancelado' || reserva.status === 'finalizado') {
      return false;
    }

    const inicio = new Date(reserva.dataHoraReserva);
    const fim = new Date(inicio.getTime() + reserva.duracaoMinutos * 60000);

    if (agora >= inicio && agora < fim) {
      return true;
    }

    return agora < inicio;
  });
}

mesaRouter.get('/', async (_request, response, next) => {
  try {
    const mesas = await MesaModel.find().sort({ numero: 1 });
    const reservas = await ReservaModel.find({ status: { $nin: ['cancelado', 'finalizado'] } });

    const mesasComStatus = mesas.map((mesa) => {
      const reservasDaMesa = reservas.filter((reserva) => reserva.numeroMesa === mesa.numero);
      const reservaAtiva = getReservaAtiva(reservasDaMesa);

      return {
        ...mesa.toObject(),
        status: calcularStatusMesa(reservasDaMesa),
        reservaAtiva: reservaAtiva ? reservaAtiva.toObject() : null
      };
    });

    response.json(mesasComStatus);
  } catch (error) {
    next(error);
  }
});

mesaRouter.get('/:numero', async (request, response, next) => {
  try {
    const numero = Number(request.params.numero);
    const mesa = await MesaModel.findOne({ numero });

    if (!mesa) {
      response.status(404).json({ message: 'Mesa não encontrada' });
      return;
    }

    const reservas = await ReservaModel.find({
      numeroMesa: numero,
      status: { $nin: ['cancelado', 'finalizado'] }
    }).sort({ dataHoraReserva: 1 });

    const reservaAtiva = getReservaAtiva(reservas);

    response.json({
      ...mesa.toObject(),
      status: calcularStatusMesa(reservas),
      reservaAtiva: reservaAtiva ? reservaAtiva.toObject() : null,
      proximasReservas: reservas
        .filter((reserva) => {
          if (!reservaAtiva) {
            return true;
          }

          return String(reserva._id) !== String(reservaAtiva._id);
        })
        .map((reserva) => reserva.toObject())
    });
  } catch (error) {
    next(error);
  }
});

mesaRouter.post('/', async (request, response, next) => {
  try {
    const mesa = await MesaModel.create(request.body);
    console.log(`Mesa cadastrada: ${mesa.numero}`);
    response.status(201).json({ message: 'Mesa cadastrada com sucesso', mesa });
  } catch (error) {
    next(error);
  }
});
