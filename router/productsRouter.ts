import { Router } from '../deps.ts'
import { listProducts, listProduct } from '../controllers/product.ts'

export const productsRouter = new Router({ prefix: '/products' })

productsRouter.get('/', listProducts)

productsRouter.get('/:productId', listProduct)