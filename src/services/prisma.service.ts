import { PrismaClient } from '@prisma/client';

export class PrismaService {
  private static instance: PrismaService;

  private constructor(private readonly client: PrismaClient) {}

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService(new PrismaClient());
    }

    return PrismaService.instance;
  }

  public getClient() {
    return this.client;
  }
}
