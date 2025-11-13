type Settings = {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    dbFile: string;
};

const defaults: Settings = {
    logLevel: 'info',
    dbFile: 'data/app.db',
};

type RawSettings = Partial<Settings>;

const loadJsonConfig = (): RawSettings => {
    try {
        const url = new URL(import.meta.resolve('~/settings.json'));
        const txt = Deno.readTextFileSync(url);
        const obj: RawSettings = JSON.parse(txt);
        return obj ?? {};
    } catch (_) {
        return {};
    }
};

const raw = loadJsonConfig();

const isLogLevel = (v: unknown): v is Settings['logLevel'] => v === 'debug' || v === 'info' || v === 'warn' || v === 'error';

const settings: Settings = {
    logLevel: isLogLevel(raw.logLevel) ? raw.logLevel : defaults.logLevel,
    dbFile: typeof raw.dbFile === 'string' ? raw.dbFile : defaults.dbFile,
};

export default settings;
