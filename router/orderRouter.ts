import { Router } from '../deps.ts'

import { isAuthenticated } from '../middlewares/isAuthenticated.ts'
import { isAuthorized } from '../middlewares/isAuthorized.ts'
import { createOrder, listUserOrders, getOrder } from '../controllers/order.ts'

export const orderRouter = new Router({ prefix: '/orders' })

orderRouter.post('/', isAuthenticated, isAuthorized(['CLIENT']), createOrder)
orderRouter.get('/', isAuthenticated, isAuthorized(['CLIENT']), listUserOrders)
orderRouter.get('/:orderId', isAuthenticated, isAuthorized(['CLIENT']), getOrder)