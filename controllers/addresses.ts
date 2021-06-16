import { RouterMiddleware } from "../deps.ts";

import { runQuery } from '../db/db.ts'
import { fetchShippingAddressesByUserId, insertShippingAddress, fetchShippingAddressById, editShippingAddress, removeShippingAddress } from '../db/query.ts';
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
        throw error;
    }
}

export const getAddress: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx;
        const { addressId } = params as { addressId: string }

        if (!request.user) {
            ctx.throw(401)
            return
        }

        const fetchAddressesResult = await runQuery<Address>(fetchShippingAddressesByUserId(request.user.id))
        const addresses = fetchAddressesResult.rows

        const address = addresses.find(item => item.id === addressId)

        if (!address) {
            ctx.throw(404)
        }

        response.body = { shipping_address: addresses }
    } catch (error) {
        throw error;
    }
}

export const addAddress: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx;

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

        const addressData = (await body.value) as Pick<Address, 'fullname' | 'address1' | 'address2' | 'city' | 'zip_code' | 'phone'>

        if (!addressData.fullname || !addressData.address1 || !addressData.city || !addressData.zip_code || !addressData.phone) {
            ctx.throw(400)
        }

        const insertAddressResult = await runQuery<Address>(insertShippingAddress({ ...addressData, owner_id: request.user.id }))
        const newAddress = insertAddressResult.rows[0]

        if (!newAddress) {
            ctx.throw(500)
        }

        response.body = { shipping_address: newAddress }
    } catch (error) {
        throw error;
    }
}

export const updateAddress: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx;
        const { addressId } = params as { addressId: string }


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

        const addressData = (await body.value) as Pick<Address, 'fullname' | 'address1' | 'address2' | 'city' | 'zip_code' | 'phone'>

        if (!addressData.fullname || !addressData.address1 || !addressData.city || !addressData.zip_code || !addressData.phone) {
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

        if (address.fullname === addressData.fullname && address.address1 === addressData.address1 && address.city === addressData.city && address.zip_code === addressData.zip_code && address.phone === addressData.phone && (!address.address2 ? !addressData.address2 : address.address2 === addressData.address2)) {
            ctx.throw(400, 'Nothing changed')
        }

        const updateAddressResult = await runQuery<Address>(editShippingAddress(addressId, addressData))
        const updateAddress = updateAddressResult.rows[0]

        if (!updateAddress) {
            ctx.throw(500)
        }

        response.body = { shipping_address: updateAddress }
    } catch (error) {
        throw error;
    }
}

export const deleteAddress: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx;
        const { addressId } = params as { addressId: string }

        if (!request.user) {
            ctx.throw(401)
            return
        }

        const fetchAddressResult = await runQuery<Address>(fetchShippingAddressById(addressId));
        const address = fetchAddressResult.rows[0]

        if (!address) {
            ctx.throw(404)
        }

        if (address.owner_id !== request.user.id) {
            ctx.throw(401)
        }

        await runQuery(removeShippingAddress(addressId))

        response.body = { message: `The shipping address ID: ${address.id} has been remove` }
    } catch (error) {
        throw error;
    }
}