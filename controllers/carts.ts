import { runQuery } from "../db/db.ts"
import { RouterMiddleware } from "../deps.ts"
import { fetchCartByUserId } from '../db/query.ts';
import { CartDetail } from '../types/types.ts';

export const listCarts: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx

        if (!request.user) {
            ctx.throw(401)
            return
        }
        const result = await runQuery<CartDetail>(fetchCartByUserId(request.user.id))
        const carts = result.rows[0]

        response.body = { carts: carts ? carts : null }
    } catch (error) {
        throw error
    }
}