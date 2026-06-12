# Sistema de Reservas de Mesa

Aplicação full stack em **TypeScript** para gerenciar reservas de mesas em um restaurante, desenvolvida para a disciplina **Desenvolvimento Web III**.

O backend usa **Express + Mongoose** com MongoDB. O frontend é **HTML, CSS e JavaScript** puro, com mapa visual das mesas por localização.

## Requisitos

- Node.js 18 ou superior
- MongoDB local ou remoto (Atlas)

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `.env` se necessário:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/reserva
```

## Execução

```bash
# Cadastrar mesas iniciais (obrigatório na primeira execução)
npm run seed:mesas

# Iniciar em modo desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

### Outros comandos

```bash
npm run build   # Compila TypeScript para dist/
npm start       # Executa a versão compilada
```

## Estrutura do projeto

```
src/
  config/database.ts      # Conexão MongoDB (banco: reserva)
  middleware/errorHandler.ts
  models/mesa.model.ts
  models/reserva.model.ts
  routes/mesa.routes.ts
  routes/reserva.routes.ts
  seed/seed-mesas.ts
  app.ts
  server.ts
public/
  index.html
  styles.css
  app.js
```

## Funcionalidades

### Regras de negócio

- Não permite duas reservas na mesma mesa no mesmo horário
- Duração padrão de **1h30** (90 minutos)
- Antecedência mínima de **1 hora** para novas reservas
- Validação de capacidade da mesa
- Status automático: `reservado`, `ocupado`, `finalizado`, `cancelado`

### Mapa visual

- Mesas agrupadas por **localização** (Salão, Varanda, Área interna)
- Cores por status:
  - **Verde** — disponível
  - **Amarelo** — reservada
  - **Vermelho** — ocupada
- Clique em qualquer mesa para ver detalhes ou reservar

### Frontend

- Listagem de reservas com filtros por cliente, mesa, data e status
- Criação, edição e cancelamento de reservas
- Modal de detalhes da mesa para mesas reservadas/ocupadas

## API REST

Base URL: `http://localhost:3000/api`

### Mesas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/mesas` | Lista mesas com status e reserva ativa |
| GET | `/mesas/:numero` | Detalhes de uma mesa |
| POST | `/mesas` | Cadastra nova mesa |

**Exemplo — cadastrar mesa:**

```bash
curl -X POST http://localhost:3000/api/mesas \
  -H "Content-Type: application/json" \
  -d '{"numero": 6, "capacidade": 4, "localizacao": "Varanda"}'
```

### Reservas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/reservas` | Lista reservas (com filtros opcionais) |
| GET | `/reservas/:id` | Busca reserva por ID |
| POST | `/reservas` | Cria nova reserva |
| PUT/PATCH | `/reservas/:id` | Atualiza reserva |
| DELETE | `/reservas/:id` | Cancela reserva |

**Filtros disponíveis (query params):**

- `cliente` — nome do cliente (parcial, case insensitive)
- `mesa` — número da mesa
- `data` — data no formato `YYYY-MM-DD`
- `status` — `reservado`, `ocupado`, `finalizado` ou `cancelado`

**Exemplo — criar reserva:**

```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCliente": "Maria Silva",
    "contatoCliente": "(11) 98765-4321",
    "numeroMesa": 2,
    "quantidadePessoas": 4,
    "dataHoraReserva": "2026-06-15T19:30:00.000Z",
    "observacoes": "Aniversário"
  }'
```

**Exemplo — filtrar reservas:**

```bash
curl "http://localhost:3000/api/reservas?cliente=Maria&status=reservado"
```

### Health check

```bash
curl http://localhost:3000/api/health
```

## Publicação no GitHub

```bash
git init
git add .
git commit -m "Sistema de reservas de mesa - Prova 2 DW III"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/prova-reservas-mesa.git
git push -u origin main
```

Substitua `SEU_USUARIO` pelo seu usuário do GitHub.

## Solução de problemas

| Problema | Solução |
|----------|---------|
| Mapa vazio | Execute `npm run seed:mesas` |
| Erro de conexão MongoDB | Verifique se o MongoDB está rodando e se `MONGODB_URI` está correto |
| Porta em uso | Altere `PORT` no arquivo `.env` |

## Tecnologias

- TypeScript
- Express
- Mongoose
- MongoDB
- HTML / CSS / JavaScript
