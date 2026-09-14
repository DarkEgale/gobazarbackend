import mongoose from 'mongoose';


const verientSchema = new mongoose.Schema({
    attributes: {
        type: mongoose.Schema.Types.Mixed
    },
    price: {
        type: Number,
        required: [true, 'Variant price is required'],
        min: [0, 'Variant price can not be negative']
    },
    // Variant-level stock — used when the product has variants (hasVariants = true).
    // Product-level stock is used when hasVariants = false.
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Variant stock can not be negative']
    }
})

export default verientSchema;

