import authorizationPreHandler from '../handlers/authorization.prehandler';
import {
  DRIVE_FOLDER_ID,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  SERVER_URL,
} from '../lib/constant/environment';
import { asJsonSchema, asRoute } from '../lib/util/typings';
import upload from '../lib/upload';
import DriveService from '../services/drive.service';
import FileService from '../services/file.service';
import multer from 'fastify-multer';
import prismaClient from '../lib/prismaClient';
import {
  fileDeleteSchema,
  fileGetListSchema,
  fileGetSchema,
  fileSchema,
  fileUploadSchema,
} from '../schemas/file.schema';
import { memoryStore } from 'cache-manager';
import type { FromSchema } from 'json-schema-to-ts';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import rs from 'random-string';

export default asRoute(async function appRoute(app) {
  const driveService = await DriveService.createInstance(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    DRIVE_FOLDER_ID,
  );
  const cacheStore = memoryStore({ ttl: 30 * 1000 });
  const fileService = await FileService.createInstance(
    prismaClient,
    driveService,
    SERVER_URL,
    cacheStore,
  );

  await app.register(multer.contentParser);

  app

    .route({
      method: 'POST',
      url: '/upload',
      preValidation: [
        async (request) => {
          request.body = {
            files: [],
          };
        },
      ],
      preHandler: [authorizationPreHandler, upload.array('files')],
      schema: {
        description: fileUploadSchema.description,
        tags: ['file'],
        consumes: ['multipart/form-data'],
        body: fileUploadSchema,
        response: {
          '200': asJsonSchema({
            type: 'object',
            additionalProperties: false,
            required: ['files'],
            properties: {
              files: {
                type: 'array',
                items: fileSchema,
              },
            },
          } as const),
        },
      },
      async handler(request) {
        const files = await Promise.all(
          request.files.map(fileService.uploadFile.bind(fileService)),
        );
        return {
          files,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/:prefix/:name',
      schema: {
        description: fileGetSchema.description,
        tags: ['file'],
        security: [],
        params: fileGetSchema,
      },
      async handler(request, reply) {
        const { prefix, name } = request.params as FromSchema<
          typeof fileGetSchema
        >;
        const file = await fileService.getFileByPrefixAndName(prefix, name);
        const stream = await fileService.getFileStreamByPrefixAndName(
          prefix,
          name,
        );
        const tmpPath = path.resolve(
          os.tmpdir(),
          `${rs({ length: 20 })}-${Date.now()}`,
        );
        const writeStream = fs.createWriteStream(tmpPath);
        stream.pipe(writeStream);
        const data = await new Promise<fs.ReadStream>(function (resolve) {
          stream.on('end', () => {
            resolve(fs.createReadStream(tmpPath));
          });
          stream.on('error', (error) => {
            fs.unlinkSync(tmpPath);
            throw error;
          });
        });
        reply.then(
          () => {
            fs.unlinkSync(tmpPath);
          },
          (error) => {
            fs.unlinkSync(tmpPath);
            throw error;
          },
        );
        reply.headers({
          'content-length': file.size,
          'content-type': file.mimeType,
          'cache-control': 'max-age=3600',
        });
        return data;
      },
    })

    .route({
      method: 'GET',
      url: '/list',
      preHandler: [authorizationPreHandler],
      schema: {
        description: fileGetListSchema.description,
        tags: ['file'],
        querystring: fileGetListSchema,
        response: {
          '200': asJsonSchema({
            type: 'object',
            additionalProperties: false,
            required: ['files'],
            properties: {
              files: {
                type: 'array',
                items: fileSchema,
              },
            },
          } as const),
        },
      },
      async handler(request) {
        const payload = request.query as FromSchema<typeof fileGetListSchema>;
        const files = await fileService.getFiles(payload);
        return {
          files,
        };
      },
    })

    .route({
      method: 'DELETE',
      url: '/delete/:id',
      preHandler: [authorizationPreHandler],
      schema: {
        description: fileDeleteSchema.description,
        tags: ['file'],
        params: fileDeleteSchema,
        response: {
          '200': asJsonSchema({
            type: 'object',
            additionalProperties: false,
            required: ['file'],
            properties: {
              file: fileSchema,
            },
          } as const),
        },
      },
      async handler(request) {
        const { id } = request.params as FromSchema<typeof fileDeleteSchema>;
        const file = await fileService.deleteFileById(id);
        return {
          file,
        };
      },
    });
});
