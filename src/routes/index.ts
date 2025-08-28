
import { Router, Request, Response, NextFunction } from 'express';
import { rabbit, rabbitConfig } from '../configs/rabbit';
import { NotificationController } from '../controllers/notification-controller';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.send('Não contávamos com minha astúcia!');
});
router.post('/api/notificar', NotificationController.enqueue);
router.get('/api/notificacoes', NotificationController.index);

export default router;
