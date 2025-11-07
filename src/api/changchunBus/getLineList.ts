import ChangchunBus from './consts.ts';

type ChangchunBusLineMeta = {
    lineNo: string;
    lineName: string;
    type?: number;
    firstStation?: string;
    lastStation?: string;
    firstTime?: string;
    lastTime?: string;
};

const getLineList = async (): Promise<ChangchunBusLineMeta[]> => {
    const response = await fetch(`${ChangchunBus.host}${ChangchunBus.api.lineList}`);
    const result: { key: string; title: string; lines: ChangchunBusLineMeta[] }[] = await response.json();
    return result.flatMap((t) => t.lines);
};

export { getLineList, type ChangchunBusLineMeta };

if (import.meta.main) {
    console.log(await getLineList());
}
