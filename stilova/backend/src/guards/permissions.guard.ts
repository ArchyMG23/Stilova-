import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequestWithUser } from './jwt-auth.guard';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.permissions) {
      return false;
    }

    // Ultimate wildcard role
    if (user.permissions.includes('*')) {
      return true;
    }

    const hasPermission = requiredPermissions.every((requiredPerm) => {
      return user.permissions.some((userPerm) => {
        if (userPerm === requiredPerm) return true;
        
        if (userPerm.endsWith('.*')) {
          const prefix = userPerm.slice(0, -2);
          if (requiredPerm.startsWith(prefix)) return true;
        }

        return false;
      });
    });

    if (!hasPermission) {
      throw new HttpException({
        success: false,
        message: 'Privilèges insuffisants pour cette opération.',
        error: {
          code: 'FORBIDDEN',
          details: [`Privilege requis obligatoirement : ${requiredPermissions.join(', ')}`]
        }
      }, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
