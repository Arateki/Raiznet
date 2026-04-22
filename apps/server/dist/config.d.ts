import { z } from 'zod';
declare const schema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PUBLIC_PORT: z.ZodDefault<z.ZodNumber>;
    LOCAL_PORT: z.ZodDefault<z.ZodNumber>;
    DATA_DIR: z.ZodDefault<z.ZodString>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["trace", "debug", "info", "warn", "error"]>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PUBLIC_PORT: number;
    LOCAL_PORT: number;
    DATA_DIR: string;
    LOG_LEVEL: "trace" | "debug" | "info" | "warn" | "error";
}, {
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PUBLIC_PORT?: number | undefined;
    LOCAL_PORT?: number | undefined;
    DATA_DIR?: string | undefined;
    LOG_LEVEL?: "trace" | "debug" | "info" | "warn" | "error" | undefined;
}>;
export type Config = z.infer<typeof schema>;
export declare function loadConfig(): Config;
export {};
//# sourceMappingURL=config.d.ts.map