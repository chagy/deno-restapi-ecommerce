import { addToCart, listUserCarts, updateCart, deleteCartItem } from '../controllers/cart.ts';
import { Router } from '../deps.ts'
import { isAuthenticated } from '../middlewares/isAuthenticated.ts';
import { isAuthorized } from '../middlewares/isAuthorized.ts';

export const cartRouter = new Router({ prefix: '/cart' })

cartRouter.get('/', isAuthenticated, isAuthorized(['CLIENT']), listUserCarts)
cartRouter.post('/', isAuthenticated, isAuthorized(['CLIENT']), addToCart)
cartRouter.post('/:cartItemId', isAuthenticated, isAuthorized(['CLIENT']), updateCart)
cartRouter.delete('/:cartItemId', isAuthenticated, isAuthorized(['CLIENT']), deleteCartItem)