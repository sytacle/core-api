import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listReviews() {
    const reviews = await this.prisma.appReview.findMany({
      where: { deletedAt: null, hidden: false },
      include: {
        user: { select: { id: true, displayName: true, picture: true } },
        app: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { success: true, data: reviews };
  }
}
