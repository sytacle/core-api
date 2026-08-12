import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateUploadDto {
  @IsString()
  @MaxLength(500)
  filename!: string;

  @IsString()
  @MaxLength(100)
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  size!: number;

  @IsIn(["apps", "files", "assets"])
  bucket!: "apps" | "files" | "assets";

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  checksumHash?: string;
}
