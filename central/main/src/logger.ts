import { createLogger as winstonCreateLogger, transports, format } from 'winston';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const logDir = path.join(os.homedir(), '.xeroscout', 'logs');
fs.mkdirSync(logDir, { recursive: true });

const isDev = process.env.NODE_ENV !== 'production' ||
              process.execPath.includes('cygwin64') ||
              !!process.env.XERODEVELOP;

export function createLogger(component: string) {
    const logFile = path.join(
        logDir,
        isDev ? `central-dev.log` : `central-${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
    );

    return winstonCreateLogger({
        level: isDev ? 'silly' : 'info',
        format: format.combine(
            format.timestamp(),
            format.json(),
        ),
        defaultMeta: { component },
        transports: [
            new transports.File({ filename: logFile }),
            ...(isDev ? [new transports.Console({ format: format.simple() })] : []),
        ],
    });
}
