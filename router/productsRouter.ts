import { Router, helpers, } from 'https://deno.land/x/oak@v6.5.0/mod.ts'

export const productsRouter = new Router({ prefix: '/products' })

productsRouter.get('/', (ctx) => {
    const query = helpers.getQuery(ctx)
    console.log('query : ', query)
    ctx.response.body = 'This is the products.get route'
})

productsRouter.get('/:productId', (ctx) => {
    const params = ctx.params
    console.log('params: ', params)
    ctx.response.body = 'This is the product.get route'
})