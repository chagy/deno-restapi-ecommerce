import { runQuery } from '../db/db.ts'
import { Router, helpers, } from '../deps.ts'

export const productsRouter = new Router({ prefix: '/products' })

productsRouter.get('/', async (ctx) => {
    const result = await runQuery(`SELECT * FROM products`)
    const products = result.rows

    console.log('Products : ', products)
    // const query = helpers.getQuery(ctx)
    // console.log('query : ', query)
    ctx.response.body = { products }
})

productsRouter.get('/:productId', (ctx) => {
    const params = ctx.params
    console.log('params: ', params)
    ctx.response.body = 'This is the product.get route'
})