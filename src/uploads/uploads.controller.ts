import { Body, Controller, Post } from "@nestjs/common";
import { CreateUploadDto } from "./dto/uploads.dto";
import { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  createUpload(@Body() body: CreateUploadDto) {
    return this.uploadsService.createUpload(body);
  }
}
