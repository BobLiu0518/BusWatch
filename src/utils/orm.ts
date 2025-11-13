import { DataSource, type EntityTarget, type Repository, type EntitySchema } from 'typeorm';
import settings from './settings.ts';
import { CustomTypeOrmLogger } from './logger.ts';

let dataSource: DataSource | null = null;

type PlainObject = Record<string, unknown>;

export async function initOrm(entities: EntitySchema<PlainObject>[], connectionString: string = settings.database): Promise<DataSource> {
    if (dataSource) return dataSource;

    const ds = new DataSource({
        type: 'postgres',
        url: connectionString,
        logging: ['warn', 'error'],
        logger: new CustomTypeOrmLogger(),
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
