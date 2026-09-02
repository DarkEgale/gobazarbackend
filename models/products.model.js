import mongoose from 'mongoose';

// Category → Sub Category map (frontend ProductForm dropdown-এর সাথে synced রাখতে হবে)
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
        required: [true, 'Selecet a thumbnil']
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
    // Rating summary — review service নিজে থেকেই recompute করে (avg rating + total review)
    // ফলে ProductCard / ProductDetails-এ সরাসরি সত্যিকারের rating দেখা যায়
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