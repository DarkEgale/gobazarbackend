import mongoose from 'mongoose';

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
        type: String
    },
    subCategory: {
        type: String
    }
    ,
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