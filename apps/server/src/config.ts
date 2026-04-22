import { z } from 'zod'

const schema = z.object({
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  PUBLIC_PORT:  z.coerce.number().int().min(1).max(65535).default(3000),
  LOCAL_PORT:   z.coerce.number().int().min(1).max(65535).default(3001),
  DATA_DIR:     z.string().min(1).default('./data'),
  LOG_LEVEL:    z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
})

export type Config = z.infer<typeof schema>

export function loadConfig(): Config {
  return schema.parse(process.env)
}
