import { getSettings, updateSettings } from '../modules/serviceModule.js';
import { Response } from '../modules/module.js';

// any logged-in user can READ the settings (store info for receipts etc.)
const getSettingsController = async (req, res) => {
    try {
        const settings = await getSettings();
        return Response(res, true, 200, 'Settings fetched', settings);
    } catch (error) {
        console.log('[Get Settings]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch settings');
    }
}

// admin only
const updateSettingsController = async (req, res) => {
    try {
        const settings = await updateSettings(req.body);
        return Response(res, true, 200, 'Settings updated successfully', settings);
    } catch (error) {
        console.log('[Update Settings]', error);
        return Response(res, false, 400, error.message || 'Failed to update settings');
    }
}

export { getSettingsController, updateSettingsController };