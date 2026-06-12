import { Router } from 'express';
import { ReservaModel } from '../models/reserva.model.js';
import { MesaModel } from '../models/mesa.model.js';

export const reservaRouter = Router();

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000`);
}

function getReservaStatus(dataHoraReserva: Date, duracaoMinutos: number, statusAtual: string) {
  if (statusAtual === 'cancelado') {
    return 'cancelado';
  }

  const agora = new Date();
  const inicio = new Date(dataHoraReserva);
  const fim = new Date(inicio.getTime() + duracaoMinutos * 60000);

  if (agora >= fim) {
    return 'finalizado';
  }

  if (agora >= inicio && agora < fim) {
    return 'ocupado';
  }

  return 'reservado';
}

async function syncReservaStatus(reserva: any) {
  const novoStatus = getReservaStatus(reserva.dataHoraReserva, reserva.duracaoMinutos, reserva.status);

  if (novoStatus !== reserva.status) {
    reserva.status = novoStatus;
    await reserva.save();
  }

  return reserva;
}

reservaRouter.get('/', async (request, response, next) => {
  try {
    const filtro: Record<string, unknown> = {};

    if (request.query.status) {
      filtro.status = request.query.status;
    }

    if (request.query.cliente) {
      filtro.nomeCliente = new RegExp(String(request.query.cliente), 'i');
    }

    if (request.query.mesa) {
      filtro.numeroMesa = Number(request.query.mesa);
    }

    if (request.query.data) {
      const inicio = toDateOnly(String(request.query.data));
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 1);

      filtro.dataHoraReserva = { $gte: inicio, $lt: fim };
    }

    const reservas = await ReservaModel.find(filtro).sort({ dataHoraReserva: 1 });
    const atualizadas = await Promise.all(reservas.map(syncReservaStatus));
    response.json(atualizadas);
  } catch (error) {
    next(error);
  }
});

reservaRouter.get('/:id', async (request, response, next) => {
  try {
    const reserva = await ReservaModel.findById(request.params.id);

    if (!reserva) {
      response.status(404).json({ message: 'Reserva não encontrada' });
      return;
    }

    response.json(await syncReservaStatus(reserva));
  } catch (error) {
    next(error);
  }
});

reservaRouter.post('/', async (request, response, next) => {
  try {
    const {
      nomeCliente,
      contatoCliente,
      numeroMesa,
      quantidadePessoas,
      dataHoraReserva,
      duracaoMinutos = 90,
      observacoes = ''
    } = request.body;

    const mesa = await MesaModel.findOne({ numero: numeroMesa });

    if (!mesa) {
      response.status(400).json({ message: 'Mesa não encontrada' });
      return;
    }

    if (quantidadePessoas > mesa.capacidade) {
      response.status(400).json({ message: 'A mesa não comporta a quantidade informada' });
      return;
    }

    const inicio = new Date(dataHoraReserva);
    const agora = new Date();
    const antecedenciaMinima = 60 * 60 * 1000;

    if (Number.isNaN(inicio.getTime())) {
      response.status(400).json({ message: 'Data e hora da reserva inválidas' });
      return;
    }

    if (inicio.getTime() - agora.getTime() < antecedenciaMinima) {
      response.status(400).json({ message: 'A reserva precisa ser feita com antecedência mínima de 1 hora' });
      return;
    }

    const fim = new Date(inicio.getTime() + Number(duracaoMinutos) * 60000);
    const conflito = await ReservaModel.findOne({
      numeroMesa,
      status: { $in: ['reservado', 'ocupado'] },
      dataHoraReserva: { $lt: fim },
      $expr: {
        $gt: [{ $add: ['$dataHoraReserva', { $multiply: ['$duracaoMinutos', 60000] }] }, inicio]
      }
    });

    if (conflito) {
      response.status(409).json({ message: 'Já existe uma reserva para esta mesa nesse horário' });
      return;
    }

    const reserva = await ReservaModel.create({
      nomeCliente,
      contatoCliente,
      mesa: mesa._id,
      numeroMesa,
      quantidadePessoas,
      dataHoraReserva: inicio,
      duracaoMinutos,
      observacoes,
      status: 'reservado'
    });

    console.log(`Reserva criada para a mesa ${numeroMesa}`);
    response.status(201).json({ message: 'Reserva criada com sucesso', reserva });
  } catch (error) {
    next(error);
  }
});

async function updateReservaById(request: any, response: any, next: any) {
  try {
    const reservaExistente = await ReservaModel.findById(request.params.id);

    if (!reservaExistente) {
      response.status(404).json({ message: 'Reserva não encontrada' });
      return;
    }

    const dadosAtualizados = {
      nomeCliente: request.body.nomeCliente ?? reservaExistente.nomeCliente,
      contatoCliente: request.body.contatoCliente ?? reservaExistente.contatoCliente,
      numeroMesa: request.body.numeroMesa ?? reservaExistente.numeroMesa,
      quantidadePessoas: request.body.quantidadePessoas ?? reservaExistente.quantidadePessoas,
      dataHoraReserva: request.body.dataHoraReserva ?? reservaExistente.dataHoraReserva,
      duracaoMinutos: request.body.duracaoMinutos ?? reservaExistente.duracaoMinutos,
      observacoes: request.body.observacoes ?? reservaExistente.observacoes,
      status: request.body.status ?? reservaExistente.status
    };

    const mesa = await MesaModel.findOne({ numero: dadosAtualizados.numeroMesa });

    if (!mesa) {
      response.status(400).json({ message: 'Mesa não encontrada' });
      return;
    }

    if (dadosAtualizados.quantidadePessoas > mesa.capacidade) {
      response.status(400).json({ message: 'A mesa não comporta a quantidade informada' });
      return;
    }

    const inicio = new Date(dadosAtualizados.dataHoraReserva);
    if (Number.isNaN(inicio.getTime())) {
      response.status(400).json({ message: 'Data e hora da reserva inválidas' });
      return;
    }

    if (dadosAtualizados.status !== 'cancelado') {
      const fim = new Date(inicio.getTime() + Number(dadosAtualizados.duracaoMinutos) * 60000);
      const conflito = await ReservaModel.findOne({
        _id: { $ne: reservaExistente._id },
        numeroMesa: dadosAtualizados.numeroMesa,
        status: { $in: ['reservado', 'ocupado'] },
        dataHoraReserva: { $lt: fim },
        $expr: {
          $gt: [{ $add: ['$dataHoraReserva', { $multiply: ['$duracaoMinutos', 60000] }] }, inicio]
        }
      });

      if (conflito) {
        response.status(409).json({ message: 'Já existe uma reserva para esta mesa nesse horário' });
        return;
      }

      const agora = new Date();
      if (inicio.getTime() - agora.getTime() < 60 * 60 * 1000) {
        response.status(400).json({ message: 'A reserva precisa ser feita com antecedência mínima de 1 hora' });
        return;
      }
    }

    reservaExistente.nomeCliente = dadosAtualizados.nomeCliente;
    reservaExistente.contatoCliente = dadosAtualizados.contatoCliente;
    reservaExistente.mesa = mesa._id;
    reservaExistente.numeroMesa = dadosAtualizados.numeroMesa;
    reservaExistente.quantidadePessoas = dadosAtualizados.quantidadePessoas;
    reservaExistente.dataHoraReserva = inicio;
    reservaExistente.duracaoMinutos = dadosAtualizados.duracaoMinutos;
    reservaExistente.observacoes = dadosAtualizados.observacoes;
    reservaExistente.status = dadosAtualizados.status;

    const reserva = await reservaExistente.save();

    console.log(`Reserva atualizada: ${request.params.id}`);
    response.json({ message: 'Reserva atualizada com sucesso', reserva });
  } catch (error) {
    next(error);
  }
}

reservaRouter.put('/:id', updateReservaById);
reservaRouter.patch('/:id', updateReservaById);

reservaRouter.delete('/:id', async (request, response, next) => {
  try {
    const reserva = await ReservaModel.findById(request.params.id);

    if (!reserva) {
      response.status(404).json({ message: 'Reserva não encontrada' });
      return;
    }

    reserva.status = 'cancelado';
    await reserva.save();

    console.log(`Reserva cancelada: ${request.params.id}`);
    response.json({ message: 'Reserva cancelada com sucesso', reserva });
  } catch (error) {
    next(error);
  }
});