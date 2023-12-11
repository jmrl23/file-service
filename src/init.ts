import { join } from 'node:path';
import { loadEnvFiles } from './utils/vars';

const nodeEnvironment = process.env.NODE_ENV ?? 'development';

loadEnvFiles(
  join(__dirname, '../prisma/.env'),
  join(__dirname, '../.env'),
  join(__dirname, `../.env.${nodeEnvironment}`),
  join(__dirname, '../.env.local'),
  join(__dirname, `../.env.${nodeEnvironment}.local`),
);
