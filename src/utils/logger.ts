import { blue, cyan, green, red, yellow } from 'std/colors';
import { QueryRunner, Logger as TypeOrmLogger } from 'typeorm';

export type Level = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<Level, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const levelColor = (lvl: Level) =>
    ({
        debug: blue,
        info: green,
        warn: yellow,
        error: red,
    }[lvl]);

class LoggerCore {
    private level: Level = 'info';

    private shouldLog(level: Level) {
        return levelOrder[level] >= levelOrder[this.level];
    }

    private formatDateTime(date = new Date()) {
        const pad = (n: unknown) => String(n).padStart(2, '0');
        const pad3 = (n: unknown) => String(n).padStart(3, '0');

        return (
            `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ` +
            `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad3(date.getMilliseconds())}`
        );
    }

    setLevel(level: Level) {
        this.level = level;
    }

    log(level: Level, msg: string, prefix?: string, ...meta: unknown[]) {
        if (!this.shouldLog(level)) return;
        const ts = this.formatDateTime();
        const lvl = level.toUpperCase();
        const label = levelColor(level)(`[${lvl}]`);
        const head = prefix ? `${ts} ${label} ${cyan(prefix)}` : `${ts} ${label}`;
        console[level](`${head} ${msg}`, ...meta.map((item) => (item instanceof Error ? red(`\n${item.stack ?? item.message}\n`) : item)));
    }
}

const core = new LoggerCore();

export type Logger = {
    debug: (msg: string, ...meta: unknown[]) => void;
    info: (msg: string, ...meta: unknown[]) => void;
    warn: (msg: string, ...meta: unknown[]) => void;
    error: (msg: string, ...meta: unknown[]) => void;
    child: (prefix: string) => Logger;
};

const makeScoped = (prefix?: string): Logger => {
    const scoped = (next: string) => (prefix ? `${prefix} > ${next}` : next);
    return {
        debug: (msg, ...meta) => core.log('debug', msg, prefix, ...meta),
        info: (msg, ...meta) => core.log('info', msg, prefix, ...meta),
        warn: (msg, ...meta) => core.log('warn', msg, prefix, ...meta),
        error: (msg, ...meta) => core.log('error', msg, prefix, ...meta),
        child: (pfx: string) => makeScoped(scoped(pfx)),
    };
};

const logger: Logger = makeScoped();

export const getLogger = () => logger;
export const setLogLevel = (level: Level) => core.setLevel(level);

export class CustomTypeOrmLogger implements TypeOrmLogger {
    private static logger = getLogger().child('Database');

    logQuery() {}
    logQuerySlow() {}
    logSchemaBuild() {}
    logMigration() {}

    logQueryError(error: string | Error, query: string, parameters?: unknown[], _queryRunner?: QueryRunner) {
        CustomTypeOrmLogger.logger.error(`Error happened when running ${query}`, error, parameters);
    }

    log(level: 'log' | 'info' | 'warn', message: string, _queryRunner?: QueryRunner) {
        CustomTypeOrmLogger.logger[({ log: 'debug', info: 'info', warn: 'warn' } as const)[level]](message);
    }
}
