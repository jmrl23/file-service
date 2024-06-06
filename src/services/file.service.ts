import type { Store } from 'cache-manager';
import CacheService from './cache.service';
import type DriveService from './drive.service';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { File } from 'fastify-multer/lib/interfaces';
import fs from 'node:fs';
import { BadRequest, NotFound } from 'http-errors';
import rs from 'random-string';
import { FromSchema } from 'json-schema-to-ts';
import { fileGetListSchema } from '../schemas/file.schema';
import type stream from 'node:stream';

export default class FileService {
  private constructor(
    private readonly prismaClient: PrismaClient,
    private readonly driveService: DriveService,
    private readonly cacheService: CacheService,
    private readonly serverUrl: string | undefined,
  ) {}

  public static async createInstance(
    prismaClient: PrismaClient,
    driveService: DriveService,
    serverUrl?: string,
    store?: Store | Promise<Store>,
  ): Promise<FileService> {
    const cacheService = await CacheService.createInstance(store);
    const instance = new FileService(
      prismaClient,
      driveService,
      cacheService,
      serverUrl,
    );
    return instance;
  }

  public async uploadFile(file: File): Promise<_File> {
    const requiredProps = ['path', 'size', 'filename'];
    for (const prop of requiredProps) {
      if (!(prop in file)) throw new BadRequest('Invalid file detected');
    }
    const stream = fs.createReadStream(file.path!);
    const data = await this.driveService.createFile(
      stream,
      file.mimetype,
      file.originalname,
    );
    const prefix = rs({ length: 6 });
    const _file = await this.prismaClient.file.create({
      data: {
        fileId: data.id!,
        name: file.originalname,
        prefix,
        size: file.size!,
        mimeType: file.mimetype,
      },
    });
    fs.unlinkSync(file.path!);
    const result = this.validateFileResult(_file);
    return result;
  }

  public async getFileStreamByPrefixAndName(
    prefix: string,
    name: string,
  ): Promise<stream.Readable> {
    const file = await this.getFileByPrefixAndName(prefix, name);
    const stream = await this.driveService.getFileStreamById(file.fileId);
    return stream;
  }

  public async getFileByPrefixAndName(
    prefix: string,
    name: string,
  ): Promise<_File> {
    const cacheKey = `file:refPN:${prefix}:${name}`;
    const cachedFile = await this.cacheService.get<_File>(cacheKey);
    if (cachedFile) return cachedFile;
    const cacheKeyBl = `file:refBl:${prefix}:${name}`;
    const cachedBl = await this.cacheService.get<boolean>(cacheKeyBl);
    if (cachedBl) throw new NotFound('File not found');
    const file = await this.prismaClient.file.findFirst({
      where: { prefix, name },
    });
    if (!file) {
      await this.cacheService.set(cacheKeyBl, true);
      throw new NotFound('File not found');
    }
    return this.validateFileResult(file);
  }

  public async getFiles(
    payload: FromSchema<typeof fileGetListSchema>,
  ): Promise<_File[]> {
    const payloadCopy = { ...payload };
    delete payloadCopy.revalidate;
    const cacheKey = `file:list:${JSON.stringify(payloadCopy)}`;
    if (payload.revalidate) await this.cacheService.del(cacheKey);
    const cachedFiles = await this.cacheService.get<_File[]>(cacheKey);
    if (cachedFiles) return cachedFiles;
    const files = await this.prismaClient.file.findMany({
      where: {
        id: payload.id,
        fileId: payload.fileId,
        createdAt: {
          gte: payload.createdAtFrom && new Date(payload.createdAtFrom),
          lte: payload.createdAtTo && new Date(payload.createdAtTo),
        },
        prefix: {
          startsWith: payload.prefix,
        },
        name: {
          startsWith: payload.name,
        },
        size: {
          gte: payload.minSize,
          lte: payload.maxSize,
        },
        mimeType: payload.mimeType,
      },
    });
    const validatedFiles = files.map(this.validateFileResult.bind(this));
    await this.cacheService.set(cacheKey, validatedFiles);
    return validatedFiles;
  }

  public async deleteFileById(id: string): Promise<_File> {
    const file = await this.prismaClient.file.findUnique({
      where: {
        id,
      },
    });
    if (!file) throw new NotFound('File not found');
    await this.driveService.deleteFileById(file.fileId);
    await this.prismaClient.file.delete({
      where: {
        id,
      },
    });
    return this.validateFileResult(file);
  }

  private validateFileResult(file: Prisma.FileGetPayload<{}>): _File {
    const result: _File = {
      ...file,
      createdAt: file.createdAt.toDateString(),
    };
    if (this.serverUrl) {
      result.url = `${this.serverUrl}/${file.prefix}/${encodeURIComponent(file.name)}`;
    }
    return result;
  }
}
