import Products, { CATEGORY_MAP } from '../models/products.model.js';
import productThumbUpload from '../utils/productThumbnilUpload.js';
import productImagesUpload from '../utils/productImagesUpload.js';
import deleteProductImage from '../utils/productImageDelete.js';

// category / subCategory pair validation (frontend dropdown-এর সাথে synced)
const validateCategoryPair = (category, subCategory) => {
    if (category && !CATEGORY_MAP[category]) {
        throw new Error(
            `Invalid category: ${category}. Allowed: ${Object.keys(CATEGORY_MAP).join(', ')}`
        );
    }
    if (subCategory && category && !(CATEGORY_MAP[category] || []).includes(subCategory)) {
        throw new Error(
            `Invalid sub category "${subCategory}" for category "${category}". Allowed: ${(CATEGORY_MAP[category] || []).join(', ')}`
        );
    }
};

const createProduct = async (userId, data, files) => {
    console.log('\n========== CREATE PRODUCT START ==========');

    try {
        console.log('[1] userId:', userId);
        console.log('[2] incoming data:', data);
        console.log('[3] files exists:', !!files);

        // ---------------- VALIDATION ----------------

        if (!userId) {
            console.error('[VALIDATION ERROR] userId missing');
            throw new Error('User Id is required');
        }

        console.log('[4] userId validation: OK');

        if (!data.title) {
            console.error('[VALIDATION ERROR] title missing');
            throw new Error('title is required');
        }

        console.log('[5] title validation: OK');

        if (!data.price) {
            console.error('[VALIDATION ERROR] price missing');
            throw new Error('Price is required');
        }

        console.log('[6] price validation: OK');

        if (!files) {
            console.error('[VALIDATION ERROR] files missing');
            throw new Error('Please provide product images');
        }

        console.log('[7] files validation: OK');

        if (!files.thumbnil) {
            console.error('[VALIDATION ERROR] thumbnail missing');
            throw new Error('Thumbnail is required');
        }

        console.log('[8] thumbnail validation: OK');

        if (!files.photos || files.photos.length < 1) {
            console.error('[VALIDATION ERROR] photos missing');
            throw new Error('Please provide product photos');
        }

        console.log('[9] photos validation: OK');
        console.log('[10] number of photos:', files.photos.length);


        // ---------------- THUMBNAIL UPLOAD ----------------

        console.log('[11] Starting thumbnail upload...');

        const thumbnilImage = await productThumbUpload(
            files.thumbnil[0]
        );

        console.log('[12] Thumbnail upload SUCCESS');
        console.log('[12] Thumbnail response:', thumbnilImage);

        data.thumbnil = thumbnilImage.secure_url;

        console.log('[13] data.thumbnil:', data.thumbnil);


        // ---------------- PHOTOS UPLOAD ----------------

        console.log('[14] Starting product photos upload...');

        const uploadedImages = await productImagesUpload(files.photos);

        console.log('[15] Product photos upload SUCCESS');
        console.log('[15] Uploaded images:', uploadedImages);

        data.photos = uploadedImages.map(
            image => image.secure_url
        );

        console.log('[16] data.photos:', data.photos);


        // ---------------- USER ID ----------------

        data.userId = userId;

        console.log('[17] data.userId:', data.userId);

        if (!data.userId) {
            console.error('[VALIDATION ERROR] data.userId missing');

            throw new Error(
                'No user id provide in document'
            );
        }

        console.log('[18] userId document validation: OK');


        // ---------------- FINAL DATA ----------------

        // category / subCategory validation
        validateCategoryPair(data.category, data.subCategory);

        console.log('\n========== DATA BEFORE MONGODB ==========');
        console.dir(data, {
            depth: null,
            colors: true
        });
        console.log('=========================================\n');


        // ---------------- MONGODB ----------------

        console.log('[19] Creating MongoDB product...');

        const product = await Products.create(data);

        console.log('[20] MongoDB CREATE SUCCESS');
        console.log('product:', product);

        if (!product) {
            console.error('[21] Products.create returned null/undefined');

            throw new Error(
                'Failed to Upload Products'
            );
        }

        console.log('[22] CREATE PRODUCT SUCCESS');
        console.log('========== CREATE PRODUCT END ==========\n');

        return product;

    } catch (error) {

        console.log('\n\n========== CREATE PRODUCT ERROR ==========');

        console.error('ERROR NAME:', error.name);
        console.error('ERROR MESSAGE:', error.message);
        console.error('ERROR CODE:', error.code);

        console.error('\nFULL ERROR:');
        console.error(error);

        console.error('\nERROR STACK:');
        console.error(error.stack);

        // Mongoose ValidationError হলে
        if (error.name === 'ValidationError') {
            console.error('\n========== MONGOOSE VALIDATION ERRORS ==========');

            for (const field in error.errors) {
                console.error(`Field: ${field}`);
                console.error(`Message: ${error.errors[field].message}`);
                console.error(`Value: ${error.errors[field].value}`);
                console.error(`Kind: ${error.errors[field].kind}`);
                console.error('--------------------------------');
            }
        }

        // MongoDB duplicate key error
        if (error.code === 11000) {
            console.error('\n========== DUPLICATE KEY ERROR ==========');
            console.error('Duplicate fields:', error.keyValue);
        }

        console.log('===========================================\n');

        throw error;
    }
};

const getProducts = async (page, limit) => {
    try {
        if (!page) {
            throw new Error('Page not provide')
        }
        if (!limit) {
            throw new Error('limit not providen')
        }
        if (limit < 1) {
            throw new Error('Please Enter a valid product limit')
        }
        if (limit > 50) {
            limit = 50;
        }
        const products = await Products.find({}).skip((page - 1) * limit)
        if (!products) {
            throw new Error('No products found')
        }
        return products;
    } catch (error) {
        throw error
    }
}

const searchProducts = async (query, page, limit) => {
    try {
        if (!query) {
            throw new Error('Please Search Something')
        }
        if (!page) {
            throw new Error('Please provide a valid page number')
        }
        if (!limit) {
            throw new Error('Please provide a valid products limit')
        }
        if (limit < 1) {
            throw new Error('Please provide a valid Limit')
        }
        if (limit > 50) {
            limit = 50;
        }
        const product = await Products.find({
            $or: [
                { title: { $regex: query.search, $options: 'i' } },
                { category: { $regex: query.category, $options: 'i' } },
                { subCategory: { $regex: query.subCategory, $options: 'i' } },
                { searchTags: { $regex: query.search, $options: 'i' } },
                { price: { $gte: query.minPrice, $lte: query.maxPrice, $options: 'i' } }
            ]
        }).skip((page - 1) * limit).limit(limit)
        return product;
    } catch (error) {
        throw error;
    }
}

/**
 * Get paginated products with filters
 * Filters: category, subCategory, brand, minPrice, maxPrice, search
 */
const getPaginatedProducts = async ({ page = 1, limit = 12, category, subCategory, brand, minPrice, maxPrice, search } = {}) => {
    try {
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 12;

        if (limit < 1) {
            throw new Error('Please provide a valid products limit');
        }
        if (limit > 50) {
            limit = 50;
        }

        const filter = {};

        // Category filter
        if (category && category !== 'all') {
            filter.category = { $regex: category, $options: 'i' };
        }

        // Sub-category filter
        if (subCategory && subCategory !== 'all') {
            filter.subCategory = { $regex: subCategory, $options: 'i' };
        }

        // Brand filter (searches against notes, searchTags, and title since no dedicated brand field)
        if (brand && brand !== 'all') {
            filter.$or = [
                { notes: { $regex: brand, $options: 'i' } },
                { searchTags: { $regex: brand, $options: 'i' } },
                { title: { $regex: brand, $options: 'i' } },
                { category: { $regex: brand, $options: 'i' } }
            ];
        }

        // Price range filter
        if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
            filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
        }
        if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
            filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
        }

        // Free text search
        if (search && search.trim()) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            const searchClause = [
                { title: searchRegex },
                { category: searchRegex },
                { subCategory: searchRegex },
                { searchTags: searchRegex },
                { notes: searchRegex }
            ];
            if (filter.$or) {
                filter.$and = [{ $or: filter.$or }, { $or: searchClause }];
                delete filter.$or;
            } else {
                filter.$or = searchClause;
            }
        }

        const totalProducts = await Products.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit) || 1;

        const products = await Products.find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        return {
            products,
            totalProducts,
            totalPages,
            page,
            limit
        };
    } catch (error) {
        throw error;
    }
}

// Get single product by id
const getProductById = async (id) => {
    try {
        if (!id) {
            throw new Error('Product id is required');
        }
        const product = await Products.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    } catch (error) {
        throw error;
    }
}

// Update করার সময় শুধু এই fields গুলো client থেকে নেওয়া হবে (mass-assignment প্রতিরোধ)
const PRODUCT_UPDATE_FIELDS = [
    'title', 'description', 'category', 'subCategory',
    'price', 'discount', 'notes', 'delivary', 'paymentMethod'
];

const updateProduct = async (id, data, files) => {
    try {
        if (!id) {
            throw new Error('Please provide a product id')
        }
        const existing = await Products.findById(id);
        if (!existing) {
            throw new Error('Products not found')
        }

        const update = {};

        // Whitelist fields (userId বা অন্য কিছু client থেকে override হতে পারবে না)
        for (const key of PRODUCT_UPDATE_FIELDS) {
            if (data[key] !== undefined && data[key] !== '') {
                update[key] = data[key];
            }
        }

        // searchTags FormData-তে comma-separated string হিসেবে আসে
        if (typeof update.searchTags === 'string' && update.searchTags.trim()) {
            update.searchTags = update.searchTags.split(',').map(t => t.trim()).filter(Boolean);
        } else {
            delete update.searchTags;
        }

        // category / subCategory validation — শুধু নতুন পাঠানো value validate হবে
        // (পুরনো product-এ custom category থাকলেও শুধু price edit করা যাবে)
        if (update.category !== undefined && !CATEGORY_MAP[update.category]) {
            throw new Error(
                `Invalid category: ${update.category}. Allowed: ${Object.keys(CATEGORY_MAP).join(', ')}`
            );
        }
        if (update.subCategory !== undefined) {
            const effectiveCategory = update.category ?? existing.category;
            if (effectiveCategory && !(CATEGORY_MAP[effectiveCategory] || []).includes(update.subCategory)) {
                throw new Error(
                    `Invalid sub category "${update.subCategory}" for category "${effectiveCategory}". Allowed: ${(CATEGORY_MAP[effectiveCategory] || []).join(', ')}`
                );
            }
        }

        // ---- THUMBNAIL: নতুন ফাইল দেওয়া হলে তবেই replace হবে ----
        if (files && files.thumbnil && files.thumbnil[0]) {
            const thumbnilImage = await productThumbUpload(files.thumbnil[0]);
            update.thumbnil = thumbnilImage.secure_url;
            // পুরনো thumbnail Cloudinary থেকে delete (orphan image যেন না থাকে)
            if (existing.thumbnil) {
                await deleteProductImage(existing.thumbnil).catch(() => {});
            }
        }

        // ---- PHOTOS: partial update ----
        // data.photos = যেগুলো রাখতে চায় (JSON array of URLs)
        // data.removedPhotos = যেগুলো delete করতে চায় (JSON array of URLs)
        // files.photos = নতুন files (append হবে)
        let keptPhotos = Array.isArray(existing.photos) ? [...existing.photos] : [];

        if (data.photos !== undefined && data.photos !== '') {
            try {
                const parsed = typeof data.photos === 'string' ? JSON.parse(data.photos) : data.photos;
                if (Array.isArray(parsed)) {
                    keptPhotos = parsed.filter(u => typeof u === 'string' && u.startsWith('http'));
                }
            } catch {
                // malformed JSON হলে existing photos-ই থাকবে
            }
        }

        if (data.removedPhotos !== undefined && data.removedPhotos !== '') {
            try {
                const removed = typeof data.removedPhotos === 'string' ? JSON.parse(data.removedPhotos) : data.removedPhotos;
                if (Array.isArray(removed) && removed.length) {
                    await Promise.all(
                        removed
                            .filter(u => typeof u === 'string' && u.startsWith('http'))
                            .map(u => deleteProductImage(u).catch(() => {}))
                    );
                }
            } catch {
                // malformed JSON ignore
            }
        }

        if (files && files.photos && files.photos.length >= 1) {
            const uploadedImages = await productImagesUpload(files.photos);
            keptPhotos = [...keptPhotos, ...uploadedImages.map(image => image.secure_url)];
        }
        update.photos = keptPhotos;

        const product = await Products.findByIdAndUpdate(id, update, { new: true })
        if (!product) {
            throw new Error('Products not found')
        }
        return product;
    } catch (error) {
        throw error;
    }
}

const deleteProduct = async (id) => {
    try {
        if (!id) {
            throw new Error('Please provide a product id')
        }
        const product = await Products.findById(id);
        if (!product) {
            throw new Error('Products not found')
        }

        // Delete thumbnil from cloudinary
        if (product.thumbnil) {
            await deleteProductImage(product.thumbnil);
        }

        // Delete photos from cloudinary
        if (product.photos && product.photos.length >= 1) {
            await Promise.all(
                product.photos.map(async (image) => {
                    await deleteProductImage(image);
                })
            );
        }

        const deletedProduct = await Products.findByIdAndDelete(id);
        if (!deletedProduct) {
            throw new Error('Failed to delete Products')
        }
        return deletedProduct;
    } catch (error) {
        throw error;
    }
}

export { createProduct, getProducts, searchProducts, getPaginatedProducts, getProductById, updateProduct, deleteProduct };
export default { createProduct, getProducts, searchProducts, getPaginatedProducts, getProductById, updateProduct, deleteProduct };