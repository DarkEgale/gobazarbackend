import mongoose from 'mongoose';
import verientSchema from './productVerients.model.js'

// Category → Sub Category map (must stay in sync with the frontend ProductForm dropdown)
export const CATEGORY_MAP = {
    Electronics: ["Headphones", "Smart Watch", "Camera", "Keyboard", "Speaker", "Mobile", "Laptop", "Accessories"],
    Fashion: ["Men", "Women", "Kids", "Shoes", "Bags", "Accessories"],
    "Home & Living": ["Furniture", "Kitchen", "Decor", "Bedding", "Lighting"],
    Beauty: ["Skincare", "Makeup", "Hair Care", "Fragrance"],
    Sports: ["Fitness", "Outdoor", "Cycling", "Team Sports"],
    Books: ["Fiction", "Non-Fiction", "Academic", "Comics"],
    Toys: ["Kids Toys", "Board Games", "Action Figures", "Puzzles"],
    Grocery: ["Snacks", "Beverages", "Staples"],
    Others: ["General"],
};

const productSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: [true, 'user Id is required']
    },
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    description: {
        type: String
    },
    specifications: {
        type: mongoose.Schema.Types.Mixed
    },
    hasVariants: {
        type: Boolean,
        default: false
    },
    // Product-level stock — used when the product has NO variants (hasVariants = false).
    // When hasVariants = true, each variant holds its own stock and this value
    // is kept as the SUM of all variant stocks (for display / filtering).
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Stock can not be negative']
    },
    verients: {
        type: [verientSchema],
        default: []
    },
    category: {
        type: String,
        enum: {
            values: Object.keys(CATEGORY_MAP),
            message: '{VALUE} is not a valid category'
        }
    },
    subCategory: {
        type: String
    },
    thumbnil: {
        type: String,
        required: [true, 'Select a thumbnail']
    },
    photos: {
        type: [String]
    },
    price: {
        type: Number,
        required: [true, 'Price are Required']
    },
    discount: {
        type: Number
    },
    notes: {
        type: String
    },
    delivary: {
        type: Number
    },
    paymentMethod: {
        type: String
    },
    searchTags: {
        type: [String]
    },
    // Rating summary — recomputed by the review service (avg rating + total review),
    // so ProductCard / ProductDetails can display the real rating directly
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true })

productSchema.index({ title: 'text' })
productSchema.index({ searchTags: 'text' })
productSchema.index({ category: 'text' })
productSchema.index({ subCategory: 'text' })
productSchema.index({ price: 1 })


const Products = mongoose.model('Products', productSchema)

export default Products;