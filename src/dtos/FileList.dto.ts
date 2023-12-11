import { vendors } from '@jmrl23/express-helper';

export class FileListDto {
  @vendors.classValidator.IsOptional()
  @vendors.classValidator.MinLength(6)
  @vendors.classValidator.MaxLength(6)
  @vendors.classValidator.IsAlpha()
  prefix: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  name: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsInt()
  size_min: number;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsInt()
  size_max: number;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsMimeType()
  mimetype: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsInt()
  skip: number;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsInt()
  take: number;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsDateString()
  created_at_from: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsDateString()
  created_at_to: string;
}
