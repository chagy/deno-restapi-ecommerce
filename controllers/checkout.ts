import { RouterMiddleware, config } from '../deps.ts'

import { runQuery } from '../db/db.ts'
import {
    fetchShippingAddressById,
    saveShippingAddressToCart,
    fetchCartByOwnerId,
    fetchCartByUserId,
    editUserStripeCustomer,
    fetchUserById,
    savePaymentIntentToCart
} from '../db/query.ts'
import { Address, Cart, CartDetail, User } from '../types/types.ts'
import { calculateCartAmount, calculateCartQuantity } from '../utils/helpers.ts'

const { STRIPE_SECRET_KEY } = config();

export const selectAddress: RouterMiddleware = async ctx => {
    try {
        const { request, response } = ctx;

        if (!request.user) {
            ctx.throw(401)
            return;
        }

        if (!request.hasBody) {
            ctx.throw(400)
        }

        const body = request.body()

        if (body.type !== 'json') {
            ctx.throw(400)
        }

        const { addressId } = await body.value as { addressId: string }

        if (!addressId) {
            ctx.throw(400)
        }

        const fetchAddressResult = await runQuery<Address>(fetchShippingAddressById(addressId))
        const address = fetchAddressResult.rows[0]

        if (!address) {
            ctx.throw(400)
        }

        if (address.owner_id !== request.user.id) {
            ctx.throw(401)
        }

        const fetchCartResult = await runQuery<Cart>(fetchCartByOwnerId(request.user.id));
        const cart = fetchCartResult.rows[0]

        if (!cart) {
            ctx.throw(400)
        }

        if (cart.address_id === addressId) {
            response.body = { cart }
        } else {
            const updateCartResult = await runQuery<Cart>(saveShippingAddressToCart(addressId, cart.id));
            const updateCart = updateCartResult.rows[0]
            if (!updateCart) {
                ctx.throw(500)
            }

            response.body = { cart: updateCart }
        }




    } catch (error) {
        throw error
    }
}

export const checkout: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx

        if (!request.user) {
            ctx.throw(401)
            return;
        }

        if (!request.hasBody) {
            ctx.throw(400)
        }

        const body = request.body();

        if (body.type !== 'json') {
            ctx.throw(400)
        }

        const { amount, cartId } = await body.value as { amount: number; cartId: string }
        if (!amount || !cartId) {
            ctx.throw(400)
        }

        const fetchCartDetailResult = await runQuery<CartDetail>(fetchCartByUserId(request.user.id))
        const cartDetail = fetchCartDetailResult.rows[0]

        if (!cartDetail) {
            ctx.throw(400)
        }

        if (cartDetail.id !== cartId) {
            ctx.throw(400)
        }

        if (!cartDetail.shipping_address) {
            ctx.throw(400, 'Please select the shipping address before proceed to checkout.')
        }

        const confirmedAmount = calculateCartAmount(cartDetail.items);

        if (confirmedAmount === 0) {
            ctx.throw(400);
        }

        if (confirmedAmount !== amount) {
            ctx.throw(400);
        }

        if (!request.user.stripe_id) {
            const createStripeCustomerResult = await fetch('https://api.stripe.com/v1/customers', {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(STRIPE_SECRET_KEY)}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `email=${request.user.email}`
            })

            if (createStripeCustomerResult.status !== 200) {
                ctx.throw(500)
            }

            const customer = await createStripeCustomerResult.json()

            await runQuery<User>(editUserStripeCustomer(request.user.id, customer.id))
        }

        const fetchUserResult = await runQuery<User>(fetchUserById(request.user.id))
        const updatedUser = fetchUserResult.rows[0]

        if (!updatedUser || !updatedUser.stripe_id) {
            ctx.throw(500)
        }

        if (!cartDetail.payment_intent) {
            const createPaymentIntentResult = await fetch(`https://api.stripe.com/v1/payment_intents`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(STRIPE_SECRET_KEY)}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `amount=${confirmedAmount * 100}&currency=usd&customer=${updatedUser.stripe_id}&confirmation_method=manual`
            })

            if (createPaymentIntentResult.status !== 200) {
                ctx.throw(500)
            }

            const paymentIntent = await createPaymentIntentResult.json()

            const updateCartResult = await runQuery<Cart>(savePaymentIntentToCart(cartId, paymentIntent.id))

            const updatedCart = updateCartResult.rows[0]

            if (!updatedCart) {
                ctx.throw(500)
            }

            response.body = {
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id
            }
        } else {
            const updatePaymentIntentResult = await fetch(`https://api.stripe.com/v1/payment_intents/${cartDetail.payment_intent}`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(STRIPE_SECRET_KEY)}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `amount=${confirmedAmount * 100}`
            })

            if (updatePaymentIntentResult.status !== 200) {
                ctx.throw(500)
            }

            const paymentIntent = await updatePaymentIntentResult.json()

            response.body = {
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id
            }
        }
    } catch (error) {
        throw error;
    }
}

export const confirmPayment: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx

        if (!request.user) {
            ctx.throw(401)
            return;
        }

        if (!request.hasBody) {
            ctx.throw(400, 'TEST 2')
        }

        const body = request.body();

        if (body.type !== 'json') {
            ctx.throw(400, 'TEST 2')
        }

        const {
            paymentIntentId,
            cardNumber,
            cardExpMonth,
            cardExpYear,
            cardCvc,
            save
        } = await body.value as {
            paymentIntentId: string,
            cardNumber: number,
            cardExpMonth: number,
            cardExpYear: number,
            cardCvc: number,
            save?: boolean
        }
        if (!paymentIntentId || !cardNumber || !cardExpMonth || !cardExpYear || !cardCvc) {
            ctx.throw(400, 'TEST 1')
        }

        const fetchCartDetailResult = await runQuery<CartDetail>(fetchCartByUserId(request.user.id))
        const cartDetail = fetchCartDetailResult.rows[0]

        if (!cartDetail) {
            ctx.throw(400, 'TEST 2')
        }

        if (!cartDetail.payment_intent || cartDetail.payment_intent !== paymentIntentId) {
            ctx.throw(400, 'TEST 3')
        }

        if (!cartDetail.shipping_address) {
            ctx.throw(400, 'Please select the shipping address before proceed to checkout.')
        }

        const confirmedAmount = calculateCartAmount(cartDetail.items);

        if (confirmedAmount === 0) {
            ctx.throw(400, 'TEST 4');
        }

        const createPaymentMethodResult = await fetch(
            `https://api.stripe.com/v1/payment_methods`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(STRIPE_SECRET_KEY)}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `type=card&card[number]=${cardNumber}&card[exp_month]=${cardExpMonth}&card[exp_year]=${cardExpYear}&card[cvc]=${cardCvc}`,
            }
        )

        console.log(createPaymentMethodResult.status);

        if (createPaymentMethodResult.status !== 200) {
            ctx.throw(500)
        }

        const paymentMethod = await createPaymentMethodResult.json()

        const confirmPaymentResult = await fetch(
            `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(STRIPE_SECRET_KEY)}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `payment_method=${paymentMethod.id}&save_payment_method=${!!save}`,
            }
        )

        if (confirmPaymentResult.status !== 200) {
            ctx.throw(500)
        }

        response.body = { message: 'You have successfully paid.' }
    } catch (error) {
        throw error;
    }
}

export const listCards: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx

        if (!request.user || !request.user.stripe_id) {
            ctx.throw(401)
            return
        }

        // Fetch the payment methods from Stripe
        const fetchPaymentMethodsResult = await fetch(
            `https://api.stripe.com/v1/payment_methods`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${btoa(STRIPE_SECRET_KEY)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `customer=${request.user.stripe_id}&type=card`,
            }
        )

        if (fetchPaymentMethodsResult.status !== 200) {
            ctx.throw(500, 'test')
        }

        const paymentMethods = await fetchPaymentMethodsResult.json()

        // Fetch Stripe customer
        const fetchStripeCustomerResult = await fetch(
            `https://api.stripe.com/v1/customers/${request.user.stripe_id}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${btoa(STRIPE_SECRET_KEY)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        )

        if (fetchStripeCustomerResult.status !== 200) {
            ctx.throw(500, 'test')
        }

        const customer = await fetchStripeCustomerResult.json()

        response.body = { paymentMethods: paymentMethods.data, customer }
    } catch (error) {
        throw error
    }
}

export const setDefaultCard: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx;

        if (!request.user || !request.user.stripe_id) {
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

        const { paymentMethodId } = await body.value as { paymentMethodId: string }

        if (!paymentMethodId) {
            ctx.throw(400)
        }

        const updateStripeCustomerResult = await fetch(
            `https://api.stripe.com/v1/customers/${request.user.stripe_id}`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(STRIPE_SECRET_KEY)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `invoice_settings[default_payment_method]=${paymentMethodId}`
            }
        )

        if (updateStripeCustomerResult.status !== 200) {
            ctx.throw(500)
        }

        await updateStripeCustomerResult.json()

        response.body = {
            message: `The card id : ${paymentMethodId} has been set as the default card.`
        }

    } catch (error) {
        throw error
    }
}

export const removeCard: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx;

        if (!request.user || !request.user.stripe_id) {
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

        const { paymentMethodId } = await body.value as { paymentMethodId: string }

        if (!paymentMethodId) {
            ctx.throw(400)
        }

        const deletePaymentMethodResult = await fetch(
            `https://api.stripe.com/v1/payment_methods/${paymentMethodId}/detach`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(STRIPE_SECRET_KEY)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        )

        if (deletePaymentMethodResult.status !== 200) {
            ctx.throw(500)
        }

        const paymentMethod = await deletePaymentMethodResult.json()

        response.body = {
            message: `The card : ${paymentMethod.card.brand} - ${paymentMethod.card.last4} has been remove`
        }

    } catch (error) {
        throw error
    }
}