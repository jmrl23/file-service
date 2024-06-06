import type { FastifyRequest } from 'fastify';
import { Unauthorized, HttpError } from 'http-errors';
import { authorizationApi } from '../lib/api';
import { AxiosError } from 'axios';

export default async function authorizationPreHandler(request: FastifyRequest) {
  const authorizationHeader = request.headers.authorization;
  if (!authorizationHeader) throw new Unauthorized();
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer') throw new Unauthorized();
  try {
    const response = await authorizationApi.get<ApiResponseData>(
      `/authenticate?token=${encodeURIComponent(token)}`,
    );
    const data = response.data;
    if (!data.status.valid)
      throw new Unauthorized(authErrorMessage(data.status.message));
    return;
  } catch (error) {
    if (error instanceof AxiosError) {
      const response = error.response;
      if (response) {
        const data = response.data as ApiResponseError;
        throw new Unauthorized(authErrorMessage(data.message));
      }
    }
    if (error instanceof HttpError) throw error;
  }
  throw new Unauthorized(authErrorMessage());
}

const authErrorMessage = apiErrorMessage('authentication');

function apiErrorMessage(apiName: string): (message?: string) => string {
  return function (message) {
    return `[API_ERROR: ${apiName}] ${message ?? 'An error occurs'}`;
  };
}

interface ApiResponseData {
  status: {
    valid: boolean;
    message?: string;
  };
}

interface ApiResponseError {
  statusCode: number;
  error: string;
  message: string;
}
