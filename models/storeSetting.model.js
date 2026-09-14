import mongoose from 'mongoose';

// Singleton store settings — one document for the whole store.
// Admin edits it from the Settings tab; the order service reads the
// delivery/free-shipping values from here (server-synced).
const storeSettingSchema = new mongoose.Schema({
    storeName: {
        type: String,
        default: 'GoBazar',
        trim: true
    },
    supportEmail: {
        type: String,
        default: 'support@gobazar.com',
        trim: true
    },
    supportPhone: {
        type: String,
        default: '01700000000',
        trim: true
    },
    // free delivery applies when the subtotal crosses this amount
    freeDeliveryThreshold: {
        type: Number,
        default: 2000,
        min: 0
    },
    // fallback per-order delivery charge when a product has none
    defaultDeliveryCharge: {
        type: Number,
        default: 60,
        min: 0
    },
    // low stock threshold used by the Low Stock tab
    lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0
    },
    // printed at the bottom of the thermal receipt
    receiptFooter: {
        type: String,
        default: 'Thank you for shopping with GoBazar!',
        trim: true
    },
    codEnabled: {
        type: Boolean,
        default: true
    },
    notifications: {
        newOrderAlerts: { type: Boolean, default: true },
        lowStockAlerts: { type: Boolean, default: true },
        orderUpdates: { type: Boolean, default: true }
    }
}, { timestamps: true });

storeSettingSchema.statics.getSingleton = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({});
    }
    return doc;
};

const STORESETTING = mongoose.model('StoreSetting', storeSettingSchema);

export default STORESETTING;