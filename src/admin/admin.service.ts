import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [users, publishers, apps, releases, reviews, uploads] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { blocked: false } }),
        this.prisma.publisher.count({ where: { deletedAt: null } }),
        this.prisma.app.count({ where: { deletedAt: null } }),
        this.prisma.release.count(),
        this.prisma.appReview.count({ where: { deletedAt: null } }),
        this.prisma.upload.count(),
      ]);
    return {
      success: true,
      data: { users, publishers, apps, releases, reviews, uploads },
    };
  }
}
