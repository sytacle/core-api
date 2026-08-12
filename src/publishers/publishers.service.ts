import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PublishersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublisherOverview() {
    const publishers = await this.prisma.publisher.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        verified: true,
        createdAt: true,
        _count: { select: { apps: true, members: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { success: true, results: publishers };
  }
}
