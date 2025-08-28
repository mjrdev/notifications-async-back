import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { rabbit, rabbitConfig } from './configs/rabbit';
import routes from './routes';
import { notifyConsumerHandler } from './consumers/notify-consumer-handle';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use('/', routes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'internal_error';
  res.status(500).json({ error: 'internal_error', detail: message });
});

let cancelConsumer: (() => Promise<void>) | undefined;

async function bootstrap() {
  await rabbit.setup({
    exchange: rabbitConfig.exchange,
    queue: rabbitConfig.queue,
    routingKey: rabbitConfig.routingKey,
    dlx: rabbitConfig.dlx,
    dlq: rabbitConfig.dlq,
  });

  const c = await rabbit.consume(rabbitConfig.queue, notifyConsumerHandler, { prefetch: 20 });
  cancelConsumer = c.cancel;

  app.listen(PORT, () => {
    console.log(`Server rodando em http://localhost:${PORT}`);
  });
}

['SIGINT','SIGTERM'].forEach(sig => {
  process.on(sig as NodeJS.Signals, async () => {
    await rabbit.close();
    process.exit(0);
  });
});

bootstrap().catch(err => {
  console.error('Falha no bootstrap:', err);
  process.exit(1);
});
