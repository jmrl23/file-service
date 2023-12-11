import { vendors } from '@jmrl23/express-helper';

export class FileDeleteDto {
  @vendors.classValidator.IsUUID('4')
  id: string;
}
