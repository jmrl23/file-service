import { vendors } from '@jmrl23/express-helper';

export class FileGetDto {
  @vendors.classValidator.Length(6, 6)
  @vendors.classValidator.IsAlpha()
  prefix: string;

  @vendors.classValidator.IsNotEmpty()
  name: string;
}
