import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { createHmac, createHash, randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUploadDto } from "./dto/uploads.dto";

const bucketEnv = {
  apps: process.env.R2_APPS_BUCKET ?? process.env.R2_BUCKET,
  files: process.env.R2_FILES_BUCKET ?? process.env.R2_BUCKET,
  assets: process.env.R2_ASSETS_BUCKET ?? process.env.R2_BUCKET,
};

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  async createUpload(body: CreateUploadDto) {
    const bucket = bucketEnv[body.bucket];
    if (!bucket)
      throw new BadRequestException(
        `R2 bucket is not configured for ${body.bucket}`,
      );
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY)
      throw new BadRequestException("R2 credentials are not configured");

    const safeFilename = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${body.bucket}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeFilename}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      const signedUrl = this.presignPutUrl(bucket, key, body.mimeType, 15 * 60);
      const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
      const upload = await this.prisma.upload.create({
        data: {
          userId: body.userId,
          key,
          filename: body.filename,
          mimeType: body.mimeType,
          size: body.size,
          checksumHash: body.checksumHash,
          url: publicBaseUrl
            ? `${publicBaseUrl.replace(/\/$/, "")}/${key}`
            : undefined,
          expiresAt,
        },
      });
      return {
        success: true,
        results: {
          uploadId: upload.id,
          key,
          bucket,
          signedUrl,
          method: "PUT",
          headers: { "content-type": body.mimeType },
          url: upload.url,
          expiresAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message ?? "Failed to create R2 upload URL",
      );
    }
  }

  private presignPutUrl(
    bucket: string,
    key: string,
    contentType: string,
    expiresIn: number,
  ) {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
    const endpoint =
      process.env.R2_ENDPOINT ??
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const endpointUrl = new URL(endpoint);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const path = `/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
    const host = endpointUrl.host;
    const query = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(expiresIn),
      "X-Amz-SignedHeaders": "content-type;host",
    });
    const canonicalQuery = [...query.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
    const canonicalRequest = [
      "PUT",
      path,
      canonicalQuery,
      canonicalHeaders,
      "content-type;host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");
    const signature = createHmac(
      "sha256",
      this.signingKey(secretAccessKey, dateStamp),
    )
      .update(stringToSign)
      .digest("hex");
    return `${endpointUrl.origin}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  }

  private signingKey(secret: string, dateStamp: string) {
    const dateKey = createHmac("sha256", `AWS4${secret}`)
      .update(dateStamp)
      .digest();
    const regionKey = createHmac("sha256", dateKey).update("auto").digest();
    const serviceKey = createHmac("sha256", regionKey).update("s3").digest();
    return createHmac("sha256", serviceKey).update("aws4_request").digest();
  }
}
