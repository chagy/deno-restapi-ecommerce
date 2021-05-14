import { Router } from '../deps.ts'

export const authRouter = new Router({ prefix: '/auth' })

authRouter.post('/signup', async (ctx) => {
    const { request, response } = ctx

    const hasBody = request.hasBody

    if (!hasBody) {
        ctx.throw(400, 'Please all required information')
        // response.body = 'Please all required information'

    }

    const body = request.body()
    const bodyData = await body.value
    const bodyType = body.type

    console.log('body: ', bodyData)
    console.log('body type: ', bodyType)

    response.body = 'This is the signup route'
})