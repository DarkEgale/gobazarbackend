import { Response } from '../modules/module.js';
import {
    createProduct,
    getProducts,
    searchProducts,
    getPaginatedProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from '../modules/productServiceModule.js';

// Create a new product
const createProductController = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const product = await createProduct(userId, req.body, req.files);
        console.log(product)
        return Response(res, true, 201, 'Product created successfully', { product });
    } catch (error) {
        console.error(error.message)
        return Response(res, false, 400, error.message);
    }
};

// Get all products (simple pagination)
const getAllProducts = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 12;
        const products = await getProducts(page, limit);
        return Response(res, true, 200, 'Products fetched successfully', { products });
    } catch (error) {
        return Response(res, false, 400, error.message);
    }
};

// Get paginated products with filters
const getFilteredProducts = async (req, res) => {
    try {
        const { page, limit, category, subCategory, brand, minPrice, maxPrice, search } = req.query;
        const result = await getPaginatedProducts({ page, limit, category, subCategory, brand, minPrice, maxPrice, search });
        return Response(res, true, 200, 'Products fetched successfully', result);
    } catch (error) {
        return Response(res, false, 400, error.message);
    }
};

// Get single product by id
const getSingleProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return Response(res, false, 400, 'Product id is required');
        }
        const product = await getProductById(id);
        return Response(res, true, 200, 'Product fetched successfully', { product });
    } catch (error) {
        return Response(res, false, 404, error.message);
    }
};

// Search products
const searchProductsController = async (req, res) => {
    try {
        const { search, category, subCategory, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
        const products = await searchProducts(
            { search, category, subCategory, minPrice, maxPrice },
            page,
            limit
        );
        return Response(res, true, 200, 'Products searched successfully', { products });
    } catch (error) {
        return Response(res, false, 400, error.message);
    }
};

// Update product
const updateProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await updateProduct(id, req.body, req.files);
        return Response(res, true, 200, 'Product updated successfully', { product });
    } catch (error) {
        return Response(res, false, 400, error.message);
    }
};

// Delete product
const deleteProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await deleteProduct(id);
        return Response(res, true, 200, 'Product deleted successfully', { product });
    } catch (error) {
        return Response(res, false, 400, error.message);
    }
};

export {
    createProductController,
    getAllProducts,
    getFilteredProducts,
    getSingleProduct,
    searchProductsController,
    updateProductController,
    deleteProductController
};
