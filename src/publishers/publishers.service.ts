import { Injectable } from "@nestjs/common";

@Injectable()
export class PublishersService {
  getPublisherOverview() {
    return {
      success: true,
      results: {
        id: "publisher-1",
        name: "Example Publisher",
        apps: 0,
      },
    };
  }
}
