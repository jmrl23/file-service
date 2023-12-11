import { Router } from 'express';
import { validate, vendors, wrapper } from '@jmrl23/express-helper';
import { FileService } from '../services/file.service';
import { FileGetDto } from '../dtos/FileGet.dto';
import { FileDeleteDto } from '../dtos/FileDelete.dto';
import { authorizationMiddleware } from '../middlewares/authorization.middleware';
import { FileListDto } from '../dtos/FileList.dto';

export const controller = Router();

controller

  /**
   * @openapi
   *
   * /upload:
   *  post:
   *    summary: upload file
   *    requestBody:
   *      content:
   *        multipart/form-data:
   *          schema:
   *            type: object
   *            properties:
   *              files:
   *                type: array
   *                items:
   *                  type: string
   *                  format: binary
   *    responses:
   *      '200':
   *        description: Successful response
   *        content:
   *          application/json: {}
   */

  .post(
    '/upload',
    authorizationMiddleware,
    wrapper(
      async function (request, response, next) {
        const fileService = await FileService.getInstance();
        const multer = fileService.getMulter();

        multer.array('files')(request, response, next);
      },
      async function (request) {
        if (!Array.isArray(request.files)) {
          return {
            files: [],
          };
        }

        const fileService = await FileService.getInstance();
        const files = await Promise.all(
          request.files.map((file) => fileService.upload(file)),
        );

        return {
          files,
        };
      },
    ),
  )

  /**
   * @openapi
   *
   * /{prefix}/{name}:
   *  get:
   *    summary: get file
   *    parameters:
   *      - name: prefix
   *        in: path
   *        schema:
   *          type: string
   *          pattern: '^[a-zA-Z]{6}$'
   *          required: true
   *      - name: name
   *        in: path
   *        schema:
   *          type: string
   *          required: true
   *    responses:
   *      '200':
   *        description: Successful response
   */

  .get(
    '/:prefix([a-zA-Z]{6})/:name',
    validate('PARAMS', FileGetDto),
    wrapper(async function (request, response) {
      const fileService = await FileService.getInstance();
      const file = await fileService.getByPrefixAndName(
        request.params.prefix,
        request.params.name,
      );

      if (!file) {
        throw vendors.httpErrors.NotFound('File not found');
      }

      const stream = await fileService.getStream(file);

      response.setHeader('Content-Length', file.size);
      response.setHeader('Content-Type', file.mimeType);
      response.setHeader('Cache-Control', 'max-age=3600');

      stream.pipe(response);
    }),
  )

  /**
   * @openapi
   *
   * /list:
   *  post:
   *    summary: get file list
   *    requestBody:
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/FileList'
   *    responses:
   *      '200':
   *        description: Successful response
   *        content:
   *          application/json: {}
   */

  .post(
    '/list',
    authorizationMiddleware,
    validate('BODY', FileListDto),
    wrapper(async function (request) {
      const fileService = await FileService.getInstance();
      const files = await fileService.getList(request.body);

      return {
        files,
      };
    }),
  )

  /**
   * @openapi
   *
   * /delete/{id}:
   *  delete:
   *    summary: delete file by id
   *    parameters:
   *      - name: id
   *        in: path
   *        schema:
   *          type: string
   *          format: uuid
   *          required: true
   *    responses:
   *      '200':
   *        description: Successful response
   */

  .delete(
    '/delete/:id',
    authorizationMiddleware,
    validate('PARAMS', FileDeleteDto),
    wrapper(async function (request) {
      const fileService = await FileService.getInstance();
      const file = await fileService.deleteById(request.params.id);

      return {
        file,
      };
    }),
  );
