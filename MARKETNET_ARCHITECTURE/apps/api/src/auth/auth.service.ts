import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { DEFAULT_PERMISSIONS, JWT_ACCESS_TTL, JWT_REFRESH_TTL } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'marketnet-dev-secret';
  }

  private async ensureDefaultRoles(): Promise<void> {
    const definitions = [
      { name: 'Merchant', slug: 'merchant', description: 'Shop owner' },
      { name: 'Admin', slug: 'admin', description: 'Platform administrator' },
    ];

    for (const definition of definitions) {
      await this.prisma.role.upsert({
        where: { slug: definition.slug },
        update: { name: definition.name, description: definition.description },
        create: definition,
      });
    }
  }

  private async getPermissionsForRoles(roleSlugs: string[]): Promise<string[]> {
    const permissionSet = new Set<string>();

    for (const slug of roleSlugs) {
      const fallback = (DEFAULT_PERMISSIONS as Record<string, readonly string[]>)[slug];
      if (fallback) {
        fallback.forEach((item) => permissionSet.add(item));
      }
    }

    const roles = await this.prisma.role.findMany({
      where: { slug: { in: roleSlugs } },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    roles.forEach((role) => {
      role.permissions.forEach((relation) => {
        permissionSet.add(relation.permission.key);
      });
    });

    return [...permissionSet];
  }

  private async issueTokenPair(user: { id: string; email: string; fullName: string }) {
    const roleSlugs = await this.getRoleSlugsForUser(user.id);
    const permissions = await this.getPermissionsForRoles(roleSlugs);

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: roleSlugs,
        permissions,
      },
      this.getJwtSecret(),
      { expiresIn: JWT_ACCESS_TTL },
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      this.getJwtSecret(),
      { expiresIn: JWT_REFRESH_TTL },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private async getRoleSlugsForUser(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return [];
    }

    return user.roles.map((relation) => relation.role.slug);
  }

  async register(dto: RegisterDto) {
    await this.ensureDefaultRoles();

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      throw new ConflictException('An account already exists for this email address.');
    }

    const role = await this.prisma.role.findUnique({ where: { slug: 'merchant' } });

    if (!role) {
      throw new NotFoundException('The merchant role does not exist.');
    }

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(dto.password, 10),
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
        roles: {
          create: {
            role: {
              connect: { id: role.id },
            },
          },
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    const session = await this.issueTokenPair({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    return {
      user: this.sanitizeUser(user),
      ...session,
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const hasBackOfficeRole = user.roles.some(({ role }) => ['merchant', 'admin'].includes(role.slug));
    if (!hasBackOfficeRole) {
      throw new UnauthorizedException('Only merchant and administrator accounts can sign in.');
    }

    const session = await this.issueTokenPair({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    return {
      user: this.sanitizeUser(user),
      ...session,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const records = await this.prisma.refreshToken.findMany({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      });

      for (const record of records) {
        const matches = await bcrypt.compare(refreshToken, record.tokenHash);
        if (matches) {
          await this.prisma.refreshToken.update({
            where: { id: record.id },
            data: { revokedAt: new Date() },
          });
          return { success: true };
        }
      }
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const secret = this.getJwtSecret();
    let payload: jwt.JwtPayload; 

    try {
      payload = jwt.verify(dto.refreshToken, secret) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    if (!payload.sub || payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token payload is invalid.');
    }

    const userId = String(payload.sub);
    const activeTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    const validToken = await Promise.all(
      activeTokens.map(async (tokenRecord) => {
        const matches = await bcrypt.compare(dto.refreshToken, tokenRecord.tokenHash);
        return matches ? tokenRecord : null;
      }),
    );

    const matchedToken = validToken.find(Boolean);
    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token was not found or has been revoked.');
    }

    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    const session = await this.issueTokenPair({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    return session;
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const payload: Record<string, string | null> = {};

    if (dto.fullName) payload.fullName = dto.fullName.trim();
    if (dto.email) payload.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) payload.phone = dto.phone?.trim() || null;
    if (dto.avatarUrl !== undefined) payload.avatarUrl = dto.avatarUrl || null;

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('No profile fields were provided for update.');
    }

    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException('User not found.');
    }

    if (dto.email && dto.email !== existing.email) {
      const duplicate = await this.prisma.user.findUnique({ where: { email: payload.email as string } });
      if (duplicate) {
        throw new ConflictException('This email address is already attached to another account.');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: payload,
      include: { roles: { include: { role: true } } },
    });

    return this.sanitizeUser(updatedUser);
  }

  async getUserContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const roles = user.roles.map((relation) => relation.role.slug);
    const permissions = await this.getPermissionsForRoles(roles);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      roles,
      permissions,
    };
  }

  private sanitizeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: (user.roles ?? []).map((relation: any) => relation.role.slug),
    };
  }
}
