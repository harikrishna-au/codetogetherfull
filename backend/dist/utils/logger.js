import winston from 'winston';
import { env } from '@/config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../../logs');
try {
    mkdirSync(logsDir, { recursive: true });
}
catch (error) {
}
const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.json(), winston.format.prettyPrint());
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: 'HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
export const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: logFormat,
    defaultMeta: { service: 'codetogether-backend' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});
if (env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
    }));
}
export const logError = (message, error, meta) => {
    logger.error(message, {
        error: error?.message,
        stack: error?.stack,
        ...meta,
    });
};
export const logInfo = (message, meta) => {
    logger.info(message, meta);
};
export const logWarn = (message, meta) => {
    logger.warn(message, meta);
};
export const logDebug = (message, meta) => {
    logger.debug(message, meta);
};
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user?.userId,
        };
        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        }
        else {
            logger.info('HTTP Request', logData);
        }
    });
    next();
};
//# sourceMappingURL=logger.js.map