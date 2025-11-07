import { DataSource, type EntityTarget, type Repository, type EntitySchema } from 'typeorm';
import { dirname } from 'std/path';
import settings from '@/config/settings.ts';

let dataSource: DataSource | null = null;

type PlainObject = Record<string, unknown>;

export async function initOrm(entities: EntitySchema<PlainObject>[], dbFile: string = settings.dbFile): Promise<DataSource> {
    if (dataSource) return dataSource;

    const dir = dirname(dbFile);
    await Deno.mkdir(dir, { recursive: true });

    let initialDb: Uint8Array | undefined;
    try {
        initialDb = await Deno.readFile(dbFile);
    } catch (_) {
        initialDb = undefined;
    }

    const ds = new DataSource({
        type: 'sqljs',
        database: initialDb,
        autoSave: true,
        autoSaveCallback: async (data: Uint8Array) => {
            await Deno.writeFile(dbFile, data);
        },
        logging: false,
        entities,
    });

    dataSource = await ds.initialize();

    await dataSource.synchronize();
    return dataSource;
}

export function getDataSource(): DataSource {
    if (!dataSource) throw new Error('ORM is not initialized.');
    return dataSource;
}

export function getRepository<T extends PlainObject>(target: EntityTarget<T>): Repository<T> {
    return getDataSource().getRepository<T>(target);
}

export async function closeOrm(): Promise<void> {
    if (dataSource) {
        await dataSource.destroy();
        dataSource = null;
    }
}
