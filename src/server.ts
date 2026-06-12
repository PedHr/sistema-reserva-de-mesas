import 'dotenv/config';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT ?? 3000);

async function bootstrap() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Falha ao iniciar o servidor:', error);
  process.exit(1);
});