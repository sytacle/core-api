import { Injectable } from "@nestjs/common";

@Injectable()
export class PublishersService {
  getPublisherOverview() {
    return {
      success: true,
      data: {
        id: "publisher-1",
        name: "Example Publisher",
        apps: 0,
      },
    };
  }
}
