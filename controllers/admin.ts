import { RouterMiddleware } from '../deps.ts'

export const addProduct: RouterMiddleware = async (ctx) => {
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
        outPath: './images',
        maxSize: 5000000,
    })

    console.log('body: ', bodyData)

    response.body = 'This is the add product route'
}