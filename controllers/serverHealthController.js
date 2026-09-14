import { getServerHealth } from '../modules/serviceModule.js';
import { Response } from '../modules/module.js';

// GET real server health + problem analysis (admin)
const getServerHealthController = async (req, res) => {
    try {
        const health = await getServerHealth();
        return Response(res, true, 200, 'Server health fetched', health);
    } catch (error) {
        console.log('[Server Health]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch server health');
    }
}

export { getServerHealthController };