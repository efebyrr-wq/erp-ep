import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly ADMIN_USERNAME = 'admin';
  private readonly ADMIN_PASSWORD = 'admin';

  async login(loginDto: LoginDto): Promise<{ success: boolean; message: string }> {
    const { username, password } = loginDto;

    if (username === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD) {
      return {
        success: true,
        message: 'Login successful',
      };
    }

    throw new UnauthorizedException('Invalid username or password');
  }
}






