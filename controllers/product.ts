import { RouterMiddleware, helpers } from "../deps.ts";
import { runQuery } from '../db/db.ts'
import { fetchProducts, countProducts } from '../db/query.ts';

export const listProducts: RouterMiddleware = async (ctx) => {
    try {
        const { l, q } = helpers.getQuery(ctx) as { l?: string; q?: string }


        const countResult = await runQuery<{ count: bigint }>(countProducts())
        const countData = countResult.rows[0]
        const count = Number(countData.count)

        const limit = l ? +l : 3

        const currentQuery = q ? +q : 1
        const skip = (currentQuery - 1) * limit

        const result = await runQuery(fetchProducts(limit, skip))
        const products = result.rows

        const totalQueries = Math.ceil(count / limit)

        const hasMore = currentQuery + 1 <= totalQueries

        ctx.response.body = { products, totalQueries, hasMore }
    } catch (error) {
        throw error
    }
}