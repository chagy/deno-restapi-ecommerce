import { listCarts } from '../controllers/carts.ts';
import { Router } from '../deps.ts'
import { isAuthenticated } from '../middlewares/isAuthenticated.ts';
import { isAuthorized } from '../middlewares/isAuthorized.ts';

export const cartsRouter = new Router({ prefix: '/carts' })

cartsRouter.get('/', isAuthenticated, isAuthorized(['CLIENT']), listCarts)