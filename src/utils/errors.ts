export class AppError extends Error {
    code?: string;
    isRetryable?: boolean;
    constructor(message: string, opts?: { code?: string; cause?: unknown; retryable?: boolean }) {
        super(message);
        this.name = 'AppError';
        this.code = opts?.code;
        this.isRetryable = opts?.retryable;
        this.cause = opts?.cause;
    }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export async function safe<T>(p: Promise<T>): Promise<Result<T>> {
    try {
        const value = await p;
        return { ok: true, value };
    } catch (e) {
        const err = e instanceof AppError ? e : new AppError('Unexpected error', { cause: e });
        return { ok: false, error: err };
    }
}

export function wrap<TArgs extends unknown[], TRes>(name: string, fn: (...args: TArgs) => Promise<TRes>) {
    return async (...args: TArgs): Promise<TRes> => {
        try {
            return await fn(...args);
        } catch (e) {
            throw new AppError(name, { cause: e });
        }
    };
}
