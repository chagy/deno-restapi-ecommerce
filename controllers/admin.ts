import { RouterMiddleware } from '../deps.ts'
import { Product, ProductCategory } from '../types/types.ts';
import { uploadImage, deleteImage } from '../utils/helpers.ts';
import { runQuery } from '../db/db.ts'
import { insertProduct, fetchProductById, editProduct, removeProduct } from '../db/query.ts';

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