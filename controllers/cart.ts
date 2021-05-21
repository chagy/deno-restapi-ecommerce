import { runQuery } from "../db/db.ts"
import { RouterMiddleware } from "../deps.ts"
import { fetchCartByUserId, fetchProductById, insertCart, insertCartItem, editCartItem } from '../db/query.ts';
import { CartDetail, Product, Cart, CartItem } from '../types/types.ts';

export const listUserCarts: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx

        if (!request.user) {
            ctx.throw(401)
            return
        }
        const result = await runQuery<CartDetail>(fetchCartByUserId(request.user.id))
        const cart = result.rows[0]

        response.body = { carts: cart ? cart : null }
    } catch (error) {
        throw error
    }
}

export const addToCart: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx
        if (!request.user) {
            ctx.throw(401)
            return
        }

        if (!request.hasBody) {
            ctx.throw(400)
        }

        const body = request.body()

        if (body.type !== 'json') {
            ctx.throw(400)
        }

        const { quantity, productId } = await body.value as { quantity: number, productId: string }

        if (!quantity || !productId) {
            ctx.throw(400)
        }

        if (typeof quantity !== 'number') {
            ctx.throw(400)
        }

        const fetchProductResult = await runQuery<Product>(fetchProductById(productId))
        const product = fetchProductResult.rows[0]

        if (!product) {
            ctx.throw(400)
        }

        if (product.inventory < quantity) {
            ctx.throw(400, 'Not enough inventory')
        }

        const result = await runQuery<CartDetail>(
            fetchCartByUserId(request.user.id)
        )
        const cartDetail = result.rows[0]

        if (!cartDetail) {
            const insertCartResult = await runQuery<Cart>(insertCart(request.user.id))
            const newCart = insertCartResult.rows[0]

            if (!newCart) {
                ctx.throw(500)
            }

            const insertCartItemResult = await runQuery<CartItem>(insertCartItem({
                quantity,
                cart_id: newCart.id,
                owner_id: request.user.id,
                product_id: productId
            }))
            const newCartItem = insertCartItemResult.rows[0]

            if (!newCartItem) {
                ctx.throw(500)
            }

            response.body = { cartItem: newCartItem }
        } else {
            const cartItem = cartDetail.items.find(item => item.product_id === productId)
            if (cartItem) {
                const updatedQuantity = cartItem.quantity + quantity
                if (updatedQuantity > product.inventory) {
                    ctx.throw(400, 'Not enough inventory')
                }

                const updateCartItemResult = await runQuery<CartItem>(editCartItem(updatedQuantity, cartItem.id))
                const updatedCartItem = updateCartItemResult.rows[0]

                if (!updatedCartItem) {
                    ctx.throw(500)
                }

                response.body = { cartItem: updatedCartItem }
            } else {
                const insertCartItemResult = await runQuery<CartItem>(insertCartItem({
                    quantity,
                    cart_id: cartDetail.id,
                    owner_id: request.user.id,
                    product_id: productId
                }))
                const newCartItem = insertCartItemResult.rows[0]

                if (!newCartItem) {
                    ctx.throw(500)
                }

                response.body = { cartItem: newCartItem }
            }
        }

    } catch (error) {
        throw error
    }
}