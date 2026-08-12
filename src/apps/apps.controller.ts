/*
 * Copyright 2026 Sytacle LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Controller, Get, Query } from "@nestjs/common";
import { AppsService } from "./apps.service";
import { ListAppsQueryDto } from "./dto/apps.dto";

@Controller("apps")
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  async listApps(@Query() query: ListAppsQueryDto) {
    try {
      return await this.appsService.listApps(query.page, query.limit);
    } catch (error) {
      return {
        success: false,
        error: error?.message ?? "Something went wrong",
      };
    }
  }
}
