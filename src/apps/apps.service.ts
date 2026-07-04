import { Injectable } from "@nestjs/common";

@Injectable()
export class AppsService {
  listApps() {
    return {
      success: true,
      data: [],
      metadata: {
        page: 1,
        limit: 20,
      },
    };
  }
}
