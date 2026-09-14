import LOG from '../models/log.model.js';

// Fire-and-forget logger — never throws into the calling flow.
// Every important action should call writeLog(); the Log collection has a
// 30-day TTL index so old documents are deleted automatically.
export const writeLog = (level, action, message, meta = undefined) => {
    LOG.create({ level, action, message, meta }).catch((err) => {
        console.error('[Logger] failed to write log:', err.message);
    });
};

export const logInfo = (action, message, meta) => writeLog('info', action, message, meta);
export const logSuccess = (action, message, meta) => writeLog('success', action, message, meta);
export const logWarn = (action, message, meta) => writeLog('warn', action, message, meta);
export const logError = (action, message, meta) => writeLog('error', action, message, meta);

export default writeLog;