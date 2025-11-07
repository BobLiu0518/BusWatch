import { EntitySchema } from 'typeorm';
import { Service } from '@/utils/service.ts';
import getDemo from '@/api/demo/getDemo.ts';
import { getRepository } from '@/utils/orm.ts';

type DemoRecord = { id: number; double: number; foo: string };
const demoEntity = new EntitySchema<DemoRecord>({
    name: 'demo',
    columns: {
        id: { type: 'integer', primary: true },
        double: { type: 'integer' },
        foo: { type: 'text' },
    },
});

export default class DemoService extends Service {
    static override disabled = true;
    static override entities = [demoEntity];

    async run() {
        const demoData = await getDemo();
        const records: DemoRecord[] = demoData.map((data) => ({ double: data.id * 2, ...data }));

        const repo = getRepository(demoEntity);
        await repo.save(records);
        this.logger.info(`Upserted ${records.length} items`, demoData[0]);
    }
}
