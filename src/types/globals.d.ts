import type { FromSchema } from 'json-schema-to-ts';
import type { fileSchema } from '../schemas/file.schema';

export declare global {
  declare interface _File extends FromSchema<typeof fileSchema> {}
}
