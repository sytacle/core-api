import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReleasesService {
  constructor(private readonly prisma: PrismaService) {}

  async listReleases() {
    const releases = await this.prisma.release.findMany({
      include: {
        app: { select: { id: true, name: true, slug: true, icon: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { success: true, data: releases };
  }
}
