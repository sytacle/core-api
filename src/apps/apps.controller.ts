import { Controller, Get, Query } from "@nestjs/common";
import { AppsService } from "./apps.service";

@Controller("apps")
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  listApps(@Query("page") page = 1, @Query("limit") limit = 20) {
    return this.appsService.listApps();
  }
}
