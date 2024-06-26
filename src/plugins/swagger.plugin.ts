import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyPlugin from 'fastify-plugin';
import type { OpenAPIV3_1 } from 'openapi-types';
import { SERVER_URL } from '../lib/constant/environment';

export default fastifyPlugin(async function swaggerPlugin(app) {
  const servers: OpenAPIV3_1.ServerObject[] = [
    {
      url: 'http://localhost:3001',
      description: 'Default local development server',
    },
  ];

  if (SERVER_URL) {
    servers.unshift({
      url: SERVER_URL,
      description: 'Production server',
    });
  }

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'File API',
        version: '1.0.0',
      },
      servers,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    hideUntagged: true,
  });

  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });
});
