import { Router } from '../deps.ts'
import { listProducts } from '../controllers/product.ts'

export const productsRouter = new Router({ prefix: '/products' })

productsRouter.get('/', listProducts)

productsRouter.get('/:productId', (ctx) => {
    const params = ctx.params
    console.log('params: ', params)
    ctx.response.body = 'This is the product.get route'
})