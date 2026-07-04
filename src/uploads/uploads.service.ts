import { Injectable } from "@nestjs/common";

@Injectable()
export class UploadsService {
  createUpload() {
    return {
      success: true,
      data: {
        uploadId: "upload-1",
        signedUrl: "https://example.test/upload",
      },
    };
  }
}
