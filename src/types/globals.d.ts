import type { Prisma } from '@prisma/client';

export declare global {
  export type GoogleOAuth2Client = typeof google.auth.OAuth2;

  export interface IFile
    extends Prisma.FileGetPayload<{
      select: {
        id;
        createdAt;
        prefix;
        name;
        size;
        mimeType;
      };
    }> {
    url?: string;
  }
}
