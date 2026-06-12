import 'dotenv/config';
import { connectDatabase } from '../config/database.js';
import { MesaModel } from '../models/mesa.model.js';

const mesas = [
  { numero: 1, capacidade: 2, localizacao: 'Salão' },
  { numero: 2, capacidade: 4, localizacao: 'Salão' },
  { numero: 3, capacidade: 4, localizacao: 'Varanda' },
  { numero: 4, capacidade: 6, localizacao: 'Área interna' },
  { numero: 5, capacidade: 8, localizacao: 'Área interna' }
];

async function seed() {
  await connectDatabase();
  await MesaModel.deleteMany({});
  await MesaModel.insertMany(mesas);

  console.log('Mesas iniciais cadastradas com sucesso');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Falha ao cadastrar mesas iniciais:', error);
  process.exit(1);
});