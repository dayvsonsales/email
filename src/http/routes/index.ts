import { Router } from 'express';

import emailRouter from './email.routes';

const routes = Router();

routes.use('/email', emailRouter);

export default routes;
