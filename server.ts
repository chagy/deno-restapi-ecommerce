import { Application, isHttpError, config } from './deps.ts'
import { productsRouter } from './router/productsRouter.ts'
import { authRouter } from './router/authRouter.ts'
import { adminRouter } from './router/adminRouter.ts'

const { PORT } = config();

const app = new Application()

app.use(async (ctx, next) => {
    try {
        await next()
    } catch (error) {
        if (isHttpError(error)) {
            switch (error.status) {
                case 400:
                    ctx.response.status = 400
                    ctx.response.body = error.message || 'Bad Request'
                    break;
                case 401:
                    ctx.response.status = 401
                    ctx.response.body = error.message || 'Unauthorized'
                    break;
                case 403:
                    ctx.response.status = 403
                    ctx.response.body = error.message || 'Forbidden'
                    break;
                case 404:
                    ctx.response.status = 404
                    ctx.response.body = error.message || 'Not Found'
                    break;
            }
        } else {
            ctx.response.status = 500
            ctx.response.body = 'Internal Server Error'
        }
    }

})

app.use(async (ctx, next) => {
    await next()
})

app.use(async (ctx, next) => {
    console.log('leg1: Middleware 3')
    await next()
})

//Route products
app.use(productsRouter.routes())
app.use(productsRouter.allowedMethods())

//Auth routes
// /auth/signup
app.use(authRouter.routes())
app.use(authRouter.allowedMethods())

//Route users
app.use(adminRouter.routes())
app.use(adminRouter.allowedMethods())

app.use(ctx => {
    ctx.response.status = 404;
    ctx.response.body = 'Not found'
})

console.log(`The server is staring up at port: ${PORT}`)
await app.listen({ port: +PORT })