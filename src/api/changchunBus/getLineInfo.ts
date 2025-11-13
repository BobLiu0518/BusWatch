import ChangchunBus from './consts.ts';
import { fetchWithParams } from '@/utils/fetch.ts';

type ChangchunBusLineInfo = {
    stationList: ChangchunBusStation[];
    pointPreList: ChangchunBusPoint[];
    firstStation: string;
    lastStation: string;
    lineNo: string;
    isUpDown: '0' | '1';
    speed: number;
    smooth: number;
    speedStatus: string;
    smoothStatus: string;
    comfortStatus: string;
    offLineList: never[];
    lineName: string;
    icinfo: string;
};

type ChangchunBusStation = {
    stationId: number;
    stationName: string;
    lng: string;
    lat: string;
    labelNo: number;
    distance: number;
};

type ChangchunBusPoint = {
    pointNo: number;
    pointLng: number;
    pointLat: number;
};

const getLineInfo = async (lineNo: string): Promise<ChangchunBusLineInfo[]> => {
    const response = await fetchWithParams(`${ChangchunBus.host}${ChangchunBus.api.lineInfo}`, { lineNo });
    const result: ChangchunBusLineInfo[] = await response.json();
    return result;
};

export { getLineInfo, type ChangchunBusLineInfo };

if (import.meta.main) {
    console.log(await getLineInfo('1'));
}
