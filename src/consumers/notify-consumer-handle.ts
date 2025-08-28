// src/consumers/notify-consumer.ts
import { ConsumeMessage } from 'amqplib';
import { rabbit } from '../configs/rabbit';
import { messageStatus, MsgStatus } from '../status-store';

const STATUS_QUEUE = `fila.notificacao.status.manoel`;

export async function notifyConsumerHandler(payload: any, raw: ConsumeMessage) {
  const messageId: string =
    payload?.messageId ||
    raw.properties.messageId ||
    `${raw.fields.deliveryTag}`;

  // delay simulado (1s ~ 2s)
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  const randomNumber = Math.floor(Math.random() * 10) + 1;
  const status: MsgStatus = randomNumber <= 2 ? 'FALHA_PROCESSAMENTO' : 'PROCESSADO_SUCESSO';

  messageStatus.set(messageId, {
    body: payload?.body || '',
    status,
  });

  await rabbit.publish('', STATUS_QUEUE, {
    messageId,
    status,
    originalRoutingKey: raw.fields.routingKey,
    at: new Date().toISOString(),
  });
}
