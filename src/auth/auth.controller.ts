import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";

class RegisterDto {
  email!: string;
  password!: string;
}

class LoginDto {
  email!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post("login")
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email);
  }
}
