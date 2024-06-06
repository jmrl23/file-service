import env from 'env-var';

export const NODE_ENV = env.get('NODE_ENV').default('development').asString();

export const SERVER_HOST = env.get('SERVER_HOST').default('0.0.0.0').asString();

export const PORT = env.get('PORT').default(3001).asPortNumber();

export const SERVER_URL = env.get('SERVER_URL').asString();

export const AUTHORIZATION_SERVICE_URL = env
  .get('AUTHORIZATION_SERVICE_URL')
  .required()
  .asUrlString();

export const GOOGLE_CLIENT_ID = env
  .get('GOOGLE_CLIENT_ID')
  .required()
  .asString();

export const GOOGLE_CLIENT_SECRET = env
  .get('GOOGLE_CLIENT_SECRET')
  .required()
  .asString();

export const GOOGLE_REFRESH_TOKEN = env
  .get('GOOGLE_REFRESH_TOKEN')
  .required()
  .asString();

export const DRIVE_FOLDER_ID = env.get('DRIVE_FOLDER_ID').required().asString();
