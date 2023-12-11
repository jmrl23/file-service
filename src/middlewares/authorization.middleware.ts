import { vendors, wrapper } from '@jmrl23/express-helper';
import env from 'env-var';

export const [authorizationMiddleware] = wrapper(
  function (request, _response, next) {
    const [scheme, token] = request.header('authorization')?.split(' ') ?? [];

    if (
      scheme !== 'Bearer' ||
      token !== env.get('AUTHORIZATION_KEY').asString()
    ) {
      throw new vendors.httpErrors.Unauthorized();
    }

    next();
  },
);
