import { google, type drive_v3 } from 'googleapis';
import { ReadStream } from 'node:fs';
import { vendors } from '@jmrl23/express-helper';
import env from 'env-var';
import internal from 'node:stream';

export class DriveService {
  private static instance: DriveService;
  private drive: drive_v3.Drive;

  private constructor(private readonly googleOAuth2Client: GoogleOAuth2Client) {
    this.drive = google.drive({
      version: 'v3',
      auth: this.googleOAuth2Client,
    });
  }

  public static getInstance(): DriveService {
    if (!DriveService.instance) {
      const oauth2Client = new google.auth.OAuth2(
        env.get('GOOGLE_CLIENT_ID').asString(),
        env.get('GOOGLE_CLIENT_SECRET').asString(),
        env.get('GOOGLE_PLAYGROUND_URL').asString(),
      );

      oauth2Client.setCredentials({
        refresh_token: env.get('GOOGLE_REFRESH_TOKEN').asString(),
      });

      DriveService.instance = DriveService.createInstance(oauth2Client);
    }

    return DriveService.instance;
  }

  public static createInstance(
    googleOAuth2Client: GoogleOAuth2Client,
  ): DriveService {
    const instance = new DriveService(googleOAuth2Client);

    return instance;
  }

  public async upload(
    stream: ReadStream,
    name: string,
    mimeType: string,
  ): Promise<drive_v3.Schema$File> {
    const response = await this.drive.files.create({
      media: {
        mimeType,
        body: stream,
      },
      requestBody: {
        mimeType,
        name,
        parents: [env.get('DRIVE_FOLDER_ID').default('').asString()],
      },
    });

    if (response.status !== 200) {
      throw vendors.httpErrors.createHttpError(
        response.status ?? 500,
        'DriveServiceError',
      );
    }

    const data = response.data;

    return data;
  }

  public async getStreamByFileId(fileId: string): Promise<internal.Readable> {
    const response = await this.drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      {
        responseType: 'stream',
      },
    );

    if (response.status !== 200) {
      throw vendors.httpErrors.createHttpError(
        response.status,
        response.statusText,
      );
    }

    const stream = response.data;

    return stream;
  }

  public async deleteFileByfileId(fileId: string): Promise<void> {
    await this.drive.files.delete({
      fileId,
    });
  }
}
