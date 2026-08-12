import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, AppStatus, AppVisibility } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAppDto, ListAppsQueryDto, UpdateAppDto } from "./dto/apps.dto";

const appSelect = {
  id: true,
  publisherId: true,
  name: true,
  packageName: true,
  bundleId: true,
  slug: true,
  description: true,
  longDescription: true,
  category: true,
  subcategory: true,
  tags: true,
  ageRating: true,
  privacyPolicyUrl: true,
  termsUrl: true,
  supportEmail: true,
  supportUrl: true,
  website: true,
  icon: true,
  featureGraphic: true,
  screenshots: true,
  videos: true,
  status: true,
  visibility: true,
  countries: true,
  price: true,
  currency: true,
  pricingModel: true,
  isFree: true,
  version: true,
  buildNumber: true,
  downloads: true,
  installs: true,
  averageRating: true,
  ratingCount: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  publisher: {
    select: { id: true, name: true, slug: true, logo: true, verified: true },
  },
} satisfies Prisma.AppSelect;

@Injectable()
export class AppsService {
  constructor(private readonly prisma: PrismaService) {}

  async listApps(query: ListAppsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.AppWhereInput = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { tags: { has: query.search } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.visibility) where.visibility = query.visibility;

    try {
      const [apps, total] = await this.prisma.$transaction([
        this.prisma.app.findMany({
          where,
          skip,
          take: limit,
          select: appSelect,
          orderBy: { createdAt: "desc" },
          cacheStrategy: { ttl: 60 },
        }),
        this.prisma.app.count({ where }),
      ]);

      return {
        success: true,
        results: apps,
        metadata: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message ?? "Failed to fetch apps",
      );
    }
  }

  async getAppById(appId: string) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, deletedAt: null },
      select: {
        ...appSelect,
        releases: { orderBy: { createdAt: "desc" }, take: 10 },
        reviews: {
          where: { hidden: false, deletedAt: null },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!app) throw new NotFoundException("App not found");
    return { success: true, results: app };
  }

  async createApp(app: CreateAppDto) {
    const slug = app.slug ?? this.slugify(app.name);
    try {
      const created = await this.prisma.app.create({
        data: {
          publisherId: app.publisherId,
          name: app.name,
          slug,
          packageName: app.packageName,
          bundleId: app.bundleId,
          description: app.description,
          longDescription: app.longDescription,
          category: app.category ?? "GAMES",
          subcategory: app.subcategory,
          tags: app.tags ?? [],
          ageRating: app.ageRating ?? "3+",
          privacyPolicyUrl: app.privacyPolicyUrl,
          termsUrl: app.termsUrl,
          supportEmail: app.supportEmail,
          supportUrl: app.supportUrl,
          website: app.website,
          visibility: app.visibility ?? AppVisibility.PRIVATE,
          countries: app.countries ?? ["US"],
          price: app.price,
          currency: app.currency ?? "USD",
          pricingModel: app.pricingModel,
          isFree: app.isFree ?? !app.price,
          status: AppStatus.DRAFT,
        },
        select: appSelect,
      });
      return { success: true, results: created };
    } catch (error) {
      if (error?.code === "P2002")
        throw new ConflictException(
          "App slug already exists for this publisher",
        );
      throw new InternalServerErrorException(
        error?.message ?? "Failed to create app",
      );
    }
  }

  async updateApp(appId: string, app: UpdateAppDto) {
    await this.ensureApp(appId);
    const updated = await this.prisma.app.update({
      where: { id: appId },
      data: app,
      select: appSelect,
    });
    return { success: true, results: updated };
  }

  async publishApp(appId: string) {
    await this.ensureApp(appId);
    const app = await this.prisma.app.update({
      where: { id: appId },
      data: {
        status: AppStatus.PUBLISHED,
        visibility: AppVisibility.PUBLIC,
        publishedAt: new Date(),
      },
      select: appSelect,
    });
    return { success: true, results: app };
  }

  private async ensureApp(appId: string) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, deletedAt: null },
      select: { id: true },
    });
    if (!app) throw new NotFoundException("App not found");
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);
  }
}
