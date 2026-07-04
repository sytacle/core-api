import { Injectable } from "@nestjs/common";

@Injectable()
export class AdminService {
  getDashboard() {
    return {
      success: true,
      data: {
        users: 0,
        publishers: 0,
        apps: 0,
      },
    };
  }
}
