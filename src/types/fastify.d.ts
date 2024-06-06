import type { File } from 'fastify-multer/lib/interfaces';

export declare module 'fastify' {
  declare interface FastifyRequest {
    files: File[];
  }
}
