import { RouterMiddleware } from "../deps.ts";
import { runQuery } from '../db/db.ts'
import { fetchProducts } from '../db/query.ts';

export const listProducts: RouterMiddleware = async (ctx) => {
    const result = await runQuery(fetchProducts())
    const products = result.rows

    ctx.response.body = { products }
}