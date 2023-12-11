import { wrapper } from '@jmrl23/express-helper';
import { Router } from 'express';
import { serve, setup } from 'swagger-ui-express';
import swaggerJsDoc, { type OAS3Options } from 'swagger-jsdoc';

export const controller = Router();

const swaggerSpec = swaggerJsDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'File service',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
      schemas: {
        FileList: {
          type: 'object',
          properties: {
            prefix: {
              type: 'string',
              pattern: '^[a-zA-Z]{6}$',
            },
            name: {
              type: 'string',
            },
            size_min: {
              type: 'integer',
            },
            size_max: {
              type: 'integer',
            },
            mimetype: {
              type: 'string',
            },
            skip: {
              type: 'integer',
            },
            take: {
              type: 'integer',
            },
            created_at_from: {
              type: 'string',
              format: 'date-time',
            },
            created_at_to: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/controllers/**/*.controller.ts'],
} satisfies OAS3Options);

controller

  .use(serve)

  .get('/', setup(swaggerSpec))

  .get(
    '/data',
    wrapper(() => swaggerSpec),
  );
