export type DemoApiRes = { id: number; foo: 'bar' }[];

export default async (): Promise<DemoApiRes> => {
    await Promise.resolve();
    const nums = Array.from({ length: Math.ceil(Math.random() * 10) }, () => Math.ceil(Math.random() * 128));
    return [...new Set(nums)].map((num) => ({ id: num, foo: 'bar' }));
};
