import { RouterMiddleware, helpers } from '../deps.ts'
import { Product, ProductCategory, OrderDetail, ShipmentStatus, Role, User } from '../types/types.ts';
import { uploadImage, deleteImage } from '../utils/helpers.ts';
import { runQuery } from '../db/db.ts'
import {
    insertProduct,
    fetchProductById,
    editProduct,
    removeProduct,
    fetchAllOrders,
    fetchOrderById,
    editOrderStatus,
    countUsers,
    fetchUsers,
    fetchUserById,
    editUserRole,
    removeUser
} from '../db/query.ts';

export const addProduct: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx

        if (!request.user) {
            ctx.throw(401)
            return
        }

        if (!request.hasBody) {
            ctx.throw(400, 'Bad 1')
            return
        }

        const body = request.body()

        if (body.type !== 'form-data') {
            ctx.throw(400, 'Bad 2')
            return
        }

        const bodyData = await body.value.read({
            // outPath: './images',
            maxSize: 5000000,
        })

        const productImage = bodyData.files && bodyData.files[0]
        const productData = bodyData.fields

        if (!productImage?.content) {
            ctx.throw(400, 'Bad 3')
            return
        }

        const productDataArray = Object.entries(productData)
        console.log(productDataArray.length);
        if (productDataArray.length !== 5) {
            ctx.throw(400, 'Bad 4')
            return
        }

        const isProductDataValid = !productDataArray.map(([k, v]) => {
            const validKey = ['title', 'description', 'price', 'category', 'inventory'].includes(k)

            const validValue = !!v && (k === 'price' || k === 'inventory' ? !isNaN(+v) : typeof v === "string")
            return validKey && validValue

        }).includes(false)

        if (!isProductDataValid) {
            ctx.throw(400)
            return
        }

        const validProductData = productData as Record<keyof Pick<Product, 'title' | 'description' | 'price' | 'category' | 'inventory'>, string>

        const result = await uploadImage(productImage)

        if (!result) {
            ctx.throw(500)
        }

        const insertProductResult = await runQuery<Product>(insertProduct({
            title: validProductData.title,
            description: validProductData.description,
            price: +validProductData.price,
            category: validProductData.category as ProductCategory,
            inventory: +validProductData.inventory,
            image_url: result.secure_url,
            image_file_name: result.original_filename,
            image_public_id: result.public_id,
            creator: request.user.id
        }))

        const newProduct = insertProductResult.rows[0]

        if (!newProduct) {
            ctx.throw(500)
        }

        response.body = { product: newProduct }
    } catch (error) {
        throw error
    }
}

export const updateProduct: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx
        const { productId } = params as { productId: string }

        if (!request.user) {
            ctx.throw(401)
            return
        }

        const fetchProductResult = await runQuery<Product>(fetchProductById(productId))
        const product = fetchProductResult.rows[0]

        if (!product) {
            ctx.throw(400, 'Product not found')
        }

        if (!request.hasBody) {
            ctx.throw(400, 'Bad 1')
            return
        }

        const body = request.body()

        if (body.type !== 'form-data') {
            ctx.throw(400, 'Bad 2')
            return
        }

        const bodyData = await body.value.read({
            // outPath: './images',
            maxSize: 5000000,
        })

        const productImage = bodyData.files && bodyData.files[0]
        const productData = bodyData.fields

        const productDataArray = Object.entries(productData)
        console.log(productDataArray.length);
        if (productDataArray.length !== 5) {
            ctx.throw(400, 'Bad 4')
            return
        }

        const isProductDataValid = !productDataArray.map(([k, v]) => {
            const validKey = ['title', 'description', 'price', 'category', 'inventory'].includes(k)

            const validValue = !!v && (k === 'price' || k === 'inventory' ? !isNaN(+v) : typeof v === "string")
            return validKey && validValue

        }).includes(false)

        if (!isProductDataValid) {
            ctx.throw(400)
            return
        }

        const validProductData = productData as Record<keyof Pick<Product, 'title' | 'description' | 'price' | 'category' | 'inventory'>, string>

        if (!productImage?.content) {
            const isProductDataChanged = productDataArray.map(([k, v]) => {
                const validChanged =
                    (k === 'price' || k === 'inventory'
                        ? +v !== product[k]
                        : v !== product[k as "title" | "description" | "category"])
                return validChanged

            }).includes(true)

            if (!isProductDataChanged) {
                ctx.throw(400, 'test')
                return
            }

            const updateProductResult = await runQuery<Product>(editProduct(productId, {
                title: validProductData.title,
                description: validProductData.description,
                price: +validProductData.price,
                category: validProductData.category as ProductCategory,
                inventory: +validProductData.inventory,
                image_url: product.image_url,
                image_file_name: product.image_file_name,
                image_public_id: product.image_public_id,
            }))

            const updateProduct = updateProductResult.rows[0]

            if (!updateProduct) {
                ctx.throw(500)
            }

            response.body = { product: updateProduct }
        } else {
            const uploadImageResult = await uploadImage(productImage)

            if (!uploadImageResult) {
                ctx.throw(500)
            }

            const updateProductResult = await runQuery<Product>(editProduct(productId, {
                title: validProductData.title,
                description: validProductData.description,
                price: +validProductData.price,
                category: validProductData.category as ProductCategory,
                inventory: +validProductData.inventory,
                image_url: uploadImageResult.secure_url,
                image_file_name: uploadImageResult.original_filename,
                image_public_id: uploadImageResult.public_id,
            }))

            const updatedProduct = updateProductResult.rows[0]

            if (!updatedProduct) {
                ctx.throw(500)
            }

            deleteImage(product.image_public_id)

            response.body = { product: updatedProduct }
        }
    } catch (error) {
        throw error
    }


}

export const deleteProduct: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx
        const { productId } = params as { productId: string }

        if (!request.user) {
            ctx.throw(401)
            return
        }

        const fetchProductResult = await runQuery<Product>(fetchProductById(productId))
        const product = fetchProductResult.rows[0]

        if (!product) {
            ctx.throw(400, 'Product not found')
        }

        await runQuery(removeProduct(productId))

        deleteImage(product.image_public_id)

        response.body = {
            message: `The product: ${product.title} has been removed`
        }

    } catch (error) {
        throw error
    }


}

export const listOrders: RouterMiddleware = async (ctx) => {
    try {
        const { request, response } = ctx

        if (!request.user) {
            ctx.throw(401)
        }

        const fetchOrdersResult = await runQuery<OrderDetail>(fetchAllOrders())
        const orders = fetchOrdersResult.rows

        response.body = { orders }
    } catch (error) {
        throw error
    }
}

export const getOrder: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx
        const { orderId } = params as { orderId: string }

        if (!request.user) {
            ctx.throw(401)
        }

        const fetchOrderResult = await runQuery<OrderDetail>(fetchOrderById(orderId))
        const order = fetchOrderResult.rows[0]

        if (!order) {
            ctx.throw(404)
        }

        response.body = { order }
    } catch (error) {
        throw error
    }
}

export const updateOrder: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx
        const { orderId } = params as { orderId: string }

        if (!request.user) {
            ctx.throw(401)
        }

        if (!request.hasBody) {
            ctx.throw(400)
        }

        const body = request.body()

        if (body.type !== 'json') {
            ctx.throw(400)
        }

        const { shipmentStatus } = await body.value as { shipmentStatus: string }

        if (!shipmentStatus) {
            ctx.throw(400)
        }

        const shipmentStatuses: ShipmentStatus[] = ["New", "Preparing", "Shipped", "Delivered", "Canceled"];

        if (!shipmentStatuses.includes(shipmentStatus as ShipmentStatus)) {
            ctx.throw(400)
        }

        const fetchOrderResult = await runQuery<OrderDetail>(fetchOrderById(orderId))
        const order = fetchOrderResult.rows[0]

        if (!order) {
            ctx.throw(404)
        }

        if (order.shipment_status === shipmentStatus) {
            ctx.throw(400)
        }

        const updateOrderResult = await runQuery(editOrderStatus(orderId, shipmentStatus));
        const updatedOrder = updateOrderResult.rows[0]

        if (!updatedOrder) {
            ctx.throw(500);
        }

        response.body = { order: updatedOrder }
    } catch (error) {
        throw error
    }
}

export const listUsers: RouterMiddleware = async (ctx) => {
    try {
        const { l, q } = helpers.getQuery(ctx) as { l?: string; q?: string }


        const countResult = await runQuery<{ count: bigint }>(countUsers())
        const countData = countResult.rows[0]
        const count = Number(countData.count)

        const limit = l ? +l : 3

        const currentQuery = q ? +q : 1
        const skip = (currentQuery - 1) * limit

        const result = await runQuery(fetchUsers(limit, skip))
        const users = result.rows

        const totalQueries = Math.ceil(count / limit)

        const hasMore = currentQuery + 1 <= totalQueries

        ctx.response.body = { users, totalQueries, hasMore }
    } catch (error) {
        throw error
    }
}

export const getUser: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx;
        const { userId } = params as { userId: string }

        const fetchUserResult = await runQuery(fetchUserById(userId))
        const user = fetchUserResult.rows[0]

        if (!user) {
            ctx.throw(400)
        }

        response.body = { user }
    } catch (error) {
        throw error
    }
}

export const updateUser: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx
        const { userId } = params as { userId: string }

        if (!request.user) {
            ctx.throw(401)
        }

        if (userId === request.user.id) {
            ctx.throw(400);
        }

        if (!request.hasBody) {
            ctx.throw(400);
        }

        const body = request.body();

        if (body.type !== 'json') {
            ctx.throw(400)
        }

        const { role } = await body.value;

        if (!role) {
            ctx.throw(400)
        }

        const roles: Role[] = ['CLIENT', "ADMIN", "SUPER_ADMIN"];
        if (!roles.includes(role)) {
            ctx.throw(400)
        }

        const fetchUserResult = await runQuery<User>(fetchUserById(userId));
        const user = fetchUserResult.rows[0]

        if (!user) {
            ctx.throw(404)
        }

        if (user.role === role) {
            ctx.throw(400)
        }

        const updateUserResult = await runQuery(editUserRole(userId, role))
        const updatedUser = updateUserResult.rows[0]

        if (!updatedUser) {
            ctx.throw(500)
        }

        response.body = { user: updatedUser }
    } catch (error) {
        throw error;
    }
}

export const deleteUser: RouterMiddleware = async (ctx) => {
    try {
        const { request, response, params } = ctx
        const { userId } = params as { userId: string }

        if (!request.user) {
            ctx.throw(401)
        }

        const fetchUserResult = await runQuery<User>(fetchUserById(userId))
        const user = fetchUserResult.rows[0]

        if (!user) {
            ctx.throw(404)
        }

        await runQuery(removeUser(userId))

        response.body = { message: `The user: ${user.username} ` }
    } catch (error) {
        throw error
    }
}