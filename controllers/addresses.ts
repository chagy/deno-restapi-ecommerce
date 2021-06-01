import { RouterMiddleware } from "../deps.ts";

import { runQuery } from '../db/db.ts'
import { fetchShippingAddressesByUserId } from '../db/query.ts';
import { Address } from '../types/types.ts';

export const listUserAddresses: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx;

        if (!request.user) {
            ctx.throw(401)
            return
        }

        const fetchAddressesResult = await runQuery<Address>(fetchShippingAddressesByUserId(request.user.id))
        const addresses = fetchAddressesResult.rows

        response.body = { shipping_addresses: addresses }
    } catch (error) {

    }
}