import LOG from '../models/log.model.js';

// GET logs (admin) — newest first, optional level filter
const getLogs = async ({ page = 1, limit = 100, level } = {}) => {
    try {
        page = Math.max(1, Number(page));
        limit = Math.min(200, Math.max(1, Number(limit)));

        const filter = level && level !== 'all' ? { level } : {};

        const totalLogs = await LOG.countDocuments(filter);
        const totalPages = Math.ceil(totalLogs / limit) || 1;

        const logs = await LOG.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return { logs, totalLogs, totalPages, page, limit };
    } catch (error) {
        throw error;
    }
};

// DELETE all logs (admin)
const clearLogs = async () => {
    try {
        const result = await LOG.deleteMany({});
        return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
        throw error;
    }
};

export { getLogs, clearLogs };
export default { getLogs, clearLogs };