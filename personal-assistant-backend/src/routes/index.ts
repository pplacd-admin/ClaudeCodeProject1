import { Router } from 'express';
import voiceRouter from './voice.routes';
import learningRouter from './learning.routes';
import scheduleRouter from './schedule.routes';
import emailRouter from './email.routes';
import ideasRouter from './ideas.routes';
import progressRouter from './progress.routes';

const router = Router();

router.use('/voice', voiceRouter);
router.use('/learning', learningRouter);
router.use('/schedule', scheduleRouter);
router.use('/email', emailRouter);
router.use('/ideas', ideasRouter);
router.use('/progress', progressRouter);

export default router;
