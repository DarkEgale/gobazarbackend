import { getLogs, clearLogs } from '../modules/serviceModule.js';
import { Response } from '../modules/module.js';

// GET logs (admin)
const getLogsController = async (req, res) => {
    try {
        const { page = 1, limit = 100, level = 'all' } = req.query;
        const result = await getLogs({ page, limit, level });
        return Response(res, true, 200, 'Logs fetched', result);
    } catch (error) {
        console.log('[Get Logs]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch logs');
    }
}

// DELETE all logs (admin)
const clearLogsController = async (req, res) => {
    try {
        const result = await clearLogs();
        return Response(res, true, 200, 'Logs cleared', result);
    } catch (error) {
        console.log('[Clear Logs]', error);
        return Response(res, false, 500, error.message || 'Failed to clear logs');
    }
}

export { getLogsController, clearLogsController };