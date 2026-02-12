import winston from 'winston';
import { env } from '../config/env.js';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    // env.LOG_LEVEL is guaranteed to be one of 'error', 'warn', 'info', 'debug' by zod
    return env.LOG_LEVEL || 'info';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

const transports = [
    new winston.transports.Console(),
];

export const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

export const requestLogger = (req: any, res: any, next: any) => {
    logger.http(`${req.method} ${req.url}`);
    next();
};
