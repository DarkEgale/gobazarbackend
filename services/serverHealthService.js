import mongoose from 'mongoose';
import os from 'os';
import ORDER from '../models/order.model.js';
import Products from '../models/products.model.js';
import User from '../models/user.model.js';
import LOG from '../models/log.model.js';

// Real server health snapshot + simple problem analysis
const getServerHealth = async () => {
    try {
        const memory = process.memoryUsage();

        // mongo connection state: 0=disconnected 1=connected 2=connecting 3=disconnecting
        const mongoState = mongoose.connection.readyState;

        // measure DB ping
        let dbPingMs = null;
        if (mongoState === 1) {
            const start = Date.now();
            await mongoose.connection.db.admin().command({ ping: 1 });
            dbPingMs = Date.now() - start;
        }

        const [totalOrders, totalProducts, totalUsers] = await Promise.all([
            ORDER.countDocuments({}),
            Products.countDocuments({}),
            User.countDocuments({}),
        ]);

        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const errorsLast24h = await LOG.countDocuments({
            level: 'error',
            createdAt: { $gte: since24h },
        });
        const logsLast24h = await LOG.countDocuments({
            createdAt: { $gte: since24h },
        });

        /* ---------- problem analysis ---------- */
        const issues = [];

        if (mongoState !== 1) {
            issues.push({
                severity: 'critical',
                message: `Database is ${
                    ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoState] || 'unknown'
                } — orders and product APIs will fail`,
            });
        } else if (dbPingMs !== null && dbPingMs > 200) {
            issues.push({
                severity: 'warn',
                message: `Database is slow (ping ${dbPingMs}ms > 200ms)`,
            });
        }

        const rssMb = Math.round(memory.rss / 1024 / 1024);
        if (rssMb > 512) {
            issues.push({
                severity: 'warn',
                message: `High memory usage: ${rssMb} MB RSS — consider restarting the server`,
            });
        }

        if (errorsLast24h > 10) {
            issues.push({
                severity: 'warn',
                message: `${errorsLast24h} error logs in the last 24h — check the Logs tab`,
            });
        }

        if (issues.length === 0) {
            issues.push({ severity: 'ok', message: 'All systems healthy' });
        }

        return {
            status: mongoState === 1 ? 'healthy' : 'degraded',
            uptimeSeconds: Math.round(process.uptime()),
            serverTime: new Date(),
            process: {
                platform: `${os.platform()} ${os.arch()}`,
                nodeVersion: process.version,
                pid: process.pid,
            },
            memory: {
                rssMb,
                heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
                heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
            },
            cpu: {
                cores: os.cpus().length,
                loadAvg: os.loadavg().map((n) => Math.round(n * 100) / 100),
            },
            database: {
                state: mongoState,
                stateLabel:
                    ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoState] ||
                    'unknown',
                pingMs: dbPingMs,
            },
            counts: {
                orders: totalOrders,
                products: totalProducts,
                users: totalUsers,
            },
            logs: {
                last24h: logsLast24h,
                errorsLast24h,
            },
            issues,
        };
    } catch (error) {
        throw error;
    }
};

export { getServerHealth };
export default { getServerHealth };