import { google, type drive_v3 } from 'googleapis';
import createHttpError from 'http-errors';
import fs from 'node:fs';
import type stream from 'node:stream';

export default class DriveService {
  private constructor(
    private readonly drive: drive_v3.Drive,
    private readonly folderId: string,
  ) {}

  public static async createInstance(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
    folderId: string,
  ): Promise<DriveService> {
    const oauth2Client = new google.auth.OAuth2({
      clientId,
      clientSecret,
    });
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    const drive = google.drive({
      version: 'v3',
      auth: oauth2Client,
    });
    const instance = new DriveService(drive, folderId);
    return instance;
  }

  public async createFile(
    stream: fs.ReadStream,
    mimeType: string,
    name: string,
  ): Promise<drive_v3.Schema$File> {
    const response = await this.drive.files.create({
      media: { mimeType, body: stream },
      requestBody: {
        mimeType,
        name,
        parents: [this.folderId],
      },
    });
    if (response.status !== 200) {
      throw createHttpError(response.status ?? 500, response.statusText);
    }
    const data = response.data;
    return data;
  }

  public async getFileStreamById(fileId: string): Promise<stream.Readable> {
    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' },
    );
    if (response.status !== 200) {
      throw createHttpError(response.status ?? 500, response.statusText);
    }
    const data = response.data;
    return data;
  }

  public async deleteFileById(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId });
  }
}
