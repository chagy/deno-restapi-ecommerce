import { listUserAddresses } from '../controllers/addresses.ts';
import { Router } from '../deps.ts'
import { isAuthenticated } from '../middlewares/isAuthenticated.ts';
import { isAuthorized } from '../middlewares/isAuthorized.ts';

export const addressesRouter = new Router({ prefix: '/addresses' })

addressesRouter.get('/', isAuthenticated, isAuthorized(['CLIENT']), listUserAddresses)