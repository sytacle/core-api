import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AppsService } from "./apps.service";
import { CreateAppDto, ListAppsQueryDto, UpdateAppDto } from "./dto/apps.dto";

@Controller("apps")
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  listApps(@Query() query: ListAppsQueryDto) {
    return this.appsService.listApps(query);
  }

  @Get(":id")
  getApp(@Param("id") id: string) {
    return this.appsService.getAppById(id);
  }

  @Post()
  createApp(@Body() body: CreateAppDto) {
    return this.appsService.createApp(body);
  }

  @Patch(":id")
  updateApp(@Param("id") id: string, @Body() body: UpdateAppDto) {
    return this.appsService.updateApp(id, body);
  }

  @Post(":id/publish")
  publishApp(@Param("id") id: string) {
    return this.appsService.publishApp(id);
  }
}
