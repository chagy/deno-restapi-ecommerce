import { RouterMiddleware } from '../deps.ts'
import { Product, ProductCategory } from '../types/types.ts';
import { uploadImage } from '../utils/helpers.ts';
import { runQuery } from '../db/db.ts'
import { insertProduct } from '../db/query.ts';

export const addProduct: RouterMiddleware = async (ctx) => {
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
}