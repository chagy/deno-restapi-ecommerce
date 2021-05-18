import { Router } from '../deps.ts'

import { addProduct } from '../controllers/admin.ts'
import { isAuthenticated } from '../middlewares/isAuthenticated.ts';
import { isAuthorized } from '../middlewares/isAuthorized.ts';

export const adminRouter = new Router({ prefix: '/admin' })

adminRouter.post('/products', isAuthenticated, isAuthorized(['ADMIN', 'SUPER_ADMIN']), addProduct)

adminRouter.get('/users', isAuthenticated, isAuthorized(['ADMIN', 'SUPER_ADMIN']), (ctx) => {
    console.log('This is the last middleware')
    ctx.response.body = 'This is the users.get route'
})


