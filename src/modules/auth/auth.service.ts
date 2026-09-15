import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../../shared/mail/mail.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { SystemRoles } from '../../shared/enums/system-roles.enum';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) { }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // TypeORM with cascade: true will save the profile automatically
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      profile: {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      },
    });

    await this.userRepository.save(user);
    return { message: 'Registration successful. Please log in.' };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: {
        id: true,
        email: true,
        password: true,
        isActive: true,
        profile: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      relations: { roles: { permissions: true }, profile: true },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this.generateTokens(user);
    const { password: _, ...safeUser } = user;

    return { ...tokens, user: safeUser };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email }, relations: { profile: true } });
    if (!user) {
      return { message: 'If an account with that email exists, we have sent a password reset link.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    user.resetPasswordToken = hashedToke
    user.resetPasswordExpires = expirationDate;
    await this.userRepository.save(user);

    const firstName = user.profile?.firstName || 'User';
    await this.mailService.sendPasswordResetEmail(user.email, firstName, resetToken);

    return { message: 'If an account with that email exists, we have sent a password reset link.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Password reset token is invalid or has expired.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    user.resetPasswordToken = null as unknown as string;
    user.resetPasswordExpires = null as unknown as Date;

    await this.userRepository.save(user);

    return { message: 'Your password has been successfully reset. You can now login.' };
  }

  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const { googleId, email, firstName, lastName } = profile;

    // Try to find an existing user by email
    let user = await this.userRepository.findOne({
      where: { email },
      relations: { roles: true },
    });

    if (user) {
      // Link googleId if not already linked (e.g. existing email/password user)
      if (!user.googleId) {
        user.googleId = googleId;
        await this.userRepository.save(user);
      }
    } else {
      // New user — find the CLIENT role from DB
      const clientRole = await this.roleRepository.findOne({
        where: { name: SystemRoles.CLIENT },
      });

      user = this.userRepository.create({
        email,
        googleId,
        isActive: true,
        password: null as unknown as string, // Google users have no password
        roles: clientRole ? [clientRole] : [],
        profile: { firstName, lastName },
      });

      await this.userRepository.save(user);
    }

    const tokens = await this.generateTokens(user);

    // Persist refresh token
    user.refreshToken = tokens.refreshToken;
    await this.userRepository.save(user);

    return tokens;
  }

  async getMe(userId: string): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { id: userId } });
  }


  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const jwtSecret = this.configService.get<string>('JWT_SECRET') as string;
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') as string;
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') as string;
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as string;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn,
      } as any),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      } as any),
    ]);

    return { accessToken, refreshToken };
  }
}
