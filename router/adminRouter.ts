import { Router } from '../deps.ts'

export const adminRouter = new Router({ prefix: '/admin' })

adminRouter.get('/users', async (ctx, next) => {
    console.log('Authorization checking')
    await next()
}, (ctx) => {
    console.log('This is the last middleware')
    ctx.response.body = 'This is the users.get route'
})

adminRouter.post('/products', async (ctx) => {
    const { request, response } = ctx
    if (!request.hasBody) {
        ctx.throw(400)
        return
    }

    const body = request.body()

    if (body.type !== 'form-data') {
        ctx.throw(400)
        return
    }

    const bodyData = await body.value.read({
        // outPath: './images'
        maxSize: 5000000,
    })

    console.log('body: ', bodyData)

    response.body = 'This is the add product route'
})
