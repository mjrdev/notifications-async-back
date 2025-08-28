import { Request, Response, NextFunction } from 'express';
import { rabbit, rabbitConfig } from '../configs/rabbit';
import { messageStatus } from '../status-store';

export class NotificationController {
  static async enqueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId, body } = req.body ?? {};
      if (!messageId || !body) {
        return res.status(400).json({ error: 'messageId e body são obrigatórios' });
      }

      // Definir messageId explicitamente nas propriedades da mensagem
      await rabbit.publish(
        rabbitConfig.exchange, 
        rabbitConfig.routingKey, 
        { messageId, body }
      );
      
      return res.status(202).json({ enqueued: true, messageId });
    } catch (err) {
      next(err);
    }
  }

  static async index(req: Request, res: Response, next: NextFunction)
  {
    try {
        const notifications = Array.from(messageStatus.entries()).map(([messageId, status]) => ({
            messageId,
            status,
        }));
        return res.status(200).json({ notifications });
    } catch (err) {
      next(err);
    }
  }
}
