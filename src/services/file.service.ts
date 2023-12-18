import multer, { type Options, type Multer, diskStorage } from 'multer';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import { type PrismaClient, type File } from '@prisma/client';
import { createReadStream, unlinkSync } from 'node:fs';
import { caching } from 'cache-manager';
import { CacheService } from './cache.service';
import { PrismaService } from './prisma.service';
import { DriveService } from './drive.service';
import { FileListDto } from '../dtos/FileList.dto';
import { generate as generateString } from 'generate-password';
import env from 'env-var';

export class FileService {
  private static instance: FileService;
  private static defaultMulterOptions: Options = {
    limits: {
      fileSize: env.get('FILE_SIZE_LIMIT').default('0').asInt(),
    },
    storage: diskStorage({
      destination: join(tmpdir(), 'FileService'),
      filename: (_request, file, done) => {
        const extension = extname(file.originalname);

        done(null, `${file.fieldname}-${Date.now()}${extension}`);
      },
    }),
  };

  private constructor(
    private readonly multer: Multer,
    private readonly cacheService: CacheService,
    private readonly prismaClient: PrismaClient,
    private readonly driveService: DriveService,
  ) {}

  public static async getInstance(): Promise<FileService> {
    if (!FileService.instance) {
      FileService.instance = await FileService.createInstance(
        FileService.defaultMulterOptions,
      );
    }

    return FileService.instance;
  }

  public static async createInstance(
    options: Options = {},
  ): Promise<FileService> {
    const prismaService = PrismaService.getInstance();
    const prismaClient = prismaService.getClient();
    const instance = new FileService(
      multer({
        ...FileService.defaultMulterOptions,
        ...options,
      }),
      await CacheService.createInstance(
        caching('memory', {
          ttl: 60 * 1000 * 5,
        }),
      ),
      prismaClient,
      DriveService.getInstance(),
    );

    return instance;
  }

  public getMulter(): Multer {
    return this.multer;
  }

  public async upload(file: Express.Multer.File): Promise<File> {
    const stream = createReadStream(file.path);
    const data = await this.driveService.upload(
      stream,
      file.originalname,
      file.mimetype,
    );
    const result = await this.prismaClient.file.create({
      data: {
        fileId: data.id!,
        name: file.originalname,
        prefix: generateString({
          length: 6,
        }),
        size: file.size,
        mimeType: file.mimetype,
      },
    });

    unlinkSync(file.path);

    await this.resetListCache();

    return result;
  }

  public async getByPrefixAndName(
    prefix: string,
    name: string,
  ): Promise<File | null> {
    const cacheKey = `FileService:getByPrefixAndName[${[
      prefix,
      name,
    ].toString()}]`;

    const cache = await this.cacheService.get<File>(cacheKey);

    if (cache || cache === null) return cache;

    const file = await this.prismaClient.file.findFirst({
      where: {
        prefix,
        name,
      },
    });

    if (file) {
      await this.cacheService.set(cacheKey, file);
    }

    return file;
  }

  public async getStream(file: File) {
    const stream = await this.driveService.getStreamByFileId(file.fileId);

    return stream;
  }

  public async deleteById(id: string): Promise<File> {
    const file = await this.prismaClient.file.delete({
      where: {
        id,
      },
    });

    await this.driveService.deleteFileByfileId(file.fileId);
    await this.cacheService.del(
      `FileService:getByPrefixAndName[${[file.prefix, file.name].toString()}]`,
    );
    await this.resetListCache();

    return file;
  }

  public async getList(fileListDto: FileListDto): Promise<File[]> {
    const cacheKey = `FileService:getList{${JSON.stringify(fileListDto)}}`;
    const cache = await this.cacheService.get<File[]>(cacheKey);

    if (cache) return cache;

    const files = await this.prismaClient.file.findMany({
      where: {
        prefix: {
          startsWith: fileListDto.prefix,
        },
        name: {
          startsWith: fileListDto.name,
        },
        size: {
          gte: fileListDto.size_min,
          lte: fileListDto.size_max,
        },
        mimeType: fileListDto.mimetype,
        createdAt: {
          gte: fileListDto.created_at_from,
          lte: fileListDto.created_at_to,
        },
      },
      skip: fileListDto.skip,
      take: fileListDto.take,
    });

    await this.cacheService.set(cacheKey, files);

    return files;
  }

  private async resetListCache(): Promise<void> {
    const cache = await this.cacheService.getCache();
    const keys = await cache.store.keys();
    const listKeys = keys.filter((key) =>
      key.startsWith('FileService:getList'),
    );

    await Promise.all(listKeys.map((key) => this.cacheService.del(key)));
  }
}
