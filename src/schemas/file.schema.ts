import { asJsonSchema } from '../lib/util/typings';

export const fileSchema = asJsonSchema({
  type: 'object',
  description: 'File',
  additionalProperties: false,
  required: ['id', 'createdAt', 'fileId', 'prefix', 'size', 'mimeType'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    fileId: {
      type: 'string',
    },
    prefix: {
      type: 'string',
      minLength: 6,
      maxLength: 6,
    },
    name: {
      type: 'string',
      minLength: 0,
    },
    size: {
      type: 'integer',
      minimum: 0,
    },
    mimeType: {
      type: 'string',
    },
    url: {
      type: 'string',
      format: 'uri',
    },
  },
} as const);

export const fileUploadSchema = asJsonSchema({
  type: 'object',
  description: 'Upload files',
  additionalProperties: false,
  required: ['files'],
  properties: {
    files: {
      type: 'array',
      items: {
        type: 'string',
        format: 'binary',
      },
    },
  },
} as const);

export const fileGetSchema = asJsonSchema({
  type: 'object',
  description: 'Get file',
  additionalProperties: false,
  required: ['prefix', 'name'],
  properties: {
    prefix: {
      type: 'string',
      minLength: 6,
      maxLength: 6,
    },
    name: {
      type: 'string',
      minLength: 1,
    },
  },
} as const);

export const fileGetListSchema = asJsonSchema({
  type: 'object',
  description: 'Get file list',
  additionalProperties: false,
  required: [],
  properties: {
    revalidate: {
      type: 'boolean',
    },
    id: {
      type: 'string',
      format: 'uuid',
    },
    createdAtFrom: {
      type: 'string',
      format: 'date',
    },
    createdAtTo: {
      type: 'string',
      format: 'date',
    },
    fileId: {
      type: 'string',
      minLength: 1,
    },
    prefix: {
      type: 'string',
      minLength: 1,
    },
    name: {
      type: 'string',
      minLength: 1,
    },
    minSize: {
      type: 'integer',
      minimum: 0,
    },
    maxSize: {
      type: 'integer',
      minimum: 0,
    },
    mimeType: {
      type: 'string',
      minLength: 0,
    },
  },
} as const);

export const fileDeleteSchema = asJsonSchema({
  type: 'object',
  description: 'Delete file',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
  },
} as const);
