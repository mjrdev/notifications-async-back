import amqp, { Channel, Connection, Options, ConsumeMessage } from 'amqplib';

export class Rabbit {
  private conn?: Connection;
  private ch?: Channel;

  constructor(private readonly url: string) {}

  async connect() {
    if (this.conn && this.ch) return this.ch;
    this.conn = await amqp.connect(this.url);
    this.conn.on('error', (e: any) => console.error('[AMQP] connection error:', e));
    this.conn.on('close', () => console.warn('[AMQP] connection closed'));
    this.ch = await this.conn.createChannel();
    return this.ch;
  }

  async setup(opts: {
    exchange: string; queue: string; routingKey: string;
    dlx: string; dlq: string;
  }) {
    const ch = await this.connect();
    await ch.assertExchange(opts.exchange, 'direct', { durable: true });
    await ch.assertExchange(opts.dlx, 'direct', { durable: true });

    await ch.assertQueue(opts.dlq, { durable: true });
    await ch.bindQueue(opts.dlq, opts.dlx, opts.routingKey);

    const qOpts: Options.AssertQueue = {
      durable: true,
      deadLetterExchange: opts.dlx,
      deadLetterRoutingKey: opts.routingKey,
    };
    await ch.assertQueue(opts.queue, qOpts);
    await ch.bindQueue(opts.queue, opts.exchange, opts.routingKey);
  }

  async publish(exchange: string, routingKey: string, payload: unknown) {
    const ch = await this.connect();
    const ok = ch.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, contentType: 'application/json' }
    );
    if (!ok) await new Promise(res => ch.once('drain', res));
  }

  async consume(queue: string, handler: (msg: any, raw: ConsumeMessage) => Promise<void>, opts?: { prefetch?: number }) {
    const ch = await this.connect();
    const prefetch = opts?.prefetch ?? 10;
    await ch.prefetch(prefetch);

    const onMessage = async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      try {
        const contentType = msg.properties.contentType || '';
        const rawStr = msg.content.toString('utf8');
        const payload = contentType.includes('json') ? JSON.parse(rawStr) : rawStr;

        await handler(payload, msg);

        ch.ack(msg);
      } catch (err) {
        console.error('[AMQP] handler error:', err);

        ch.nack(msg, false, false);
      }
    };

    const { consumerTag } = await ch.consume(queue, onMessage, { noAck: false });
    return {
      consumerTag,
      cancel: async () => ch.cancel(consumerTag),
    };
  }

  async purge(queue: string) {
    const ch = await this.connect();
    await ch.purgeQueue(queue);
  }

  async deleteQueue(queue: string) {
    const ch = await this.connect();
    await ch.deleteQueue(queue);
  }

  async close() {
    await this.ch?.close().catch(() => {});
    await this.conn?.close().catch(() => {});
  }
}

import 'dotenv/config';
export const rabbit = new Rabbit(process.env.AMQP_URL!);
export const rabbitConfig = {
  exchange: process.env.EXCHANGE!,
  queue: process.env.QUEUE!,
  routingKey: process.env.ROUTING_KEY!,
  dlx: process.env.DLX!,
  dlq: process.env.DLQ!,
};
