import { Injectable } from "@nestjs/common";

@Injectable()
export class ReleasesService {
  listReleases() {
    return {
      success: true,
      data: [],
    };
  }
}
