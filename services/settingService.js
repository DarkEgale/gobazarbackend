import STORESETTING from '../models/storeSetting.model.js';
import { logInfo } from '../utils/logger.js';

// GET settings (singleton — auto-created on first read)
const getSettings = async () => {
    try {
        return await STORESETTING.getSingleton();
    } catch (error) {
        throw error;
    }
};

// UPDATE settings (admin only)
const updateSettings = async (data) => {
    try {
        const settings = await STORESETTING.getSingleton();

        const allowed = [
            'storeName', 'supportEmail', 'supportPhone',
            'freeDeliveryThreshold', 'defaultDeliveryCharge',
            'lowStockThreshold', 'receiptFooter', 'codEnabled', 'notifications',
        ];

        allowed.forEach((key) => {
            if (data[key] !== undefined) {
                settings[key] = data[key];
            }
        });

        await settings.save();
        logInfo('settings.update', 'Store settings updated');
        return settings;
    } catch (error) {
        throw error;
    }
};

export { getSettings, updateSettings };
export default { getSettings, updateSettings };