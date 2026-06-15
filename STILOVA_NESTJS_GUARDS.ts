import { 
  Injectable, CanActivate, ExecutionContext, SetMetadata, 
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

// ==========================================
// 1. CUSTOM DECORATORS FOR RBAC / ABAC
// ==========================================
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// ==========================================
// INTERFACES & CONTEXT DEFINITION
// ==========================================
export interface RequestWithUser extends Request {
  user: {
    uid: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

// ==========================================
// 2. JWT IDENTIFICATION GUARD (MOCK AUTHENTICATION BRIDGE)
// ==========================================
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException({
        success: false,
        message: 'Jeton de session absent ou déformé.',
        error: {
          code: 'UNAUTHORIZED',
          details: ['L\'en-tête Authorization Bearer <token> est requis.']
        }
      }, HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    
    // In production, verify JWT using secret keys or Firebase token verifiers.
    // Here we seed a realistic customer profile for testing or simulation.
    if (token === 'super-admin-token') {
      request.user = {
        uid: 'sys_000',
        email: 'superadmin@stilova.com',
        role: 'SUPER_ADMIN',
        permissions: ['*']
      };
    } else if (token === 'admin-token') {
      request.user = {
        uid: 'adm_123',
        email: 'yombivictor@gmail.com',
        role: 'ADMIN',
        permissions: ['admin.*', 'moderation.*', 'story.create', 'story.publish']
      };
    } else if (token === 'author-token') {
      request.user = {
        uid: 'aut_456',
        email: 'griot.mali@stilova.com',
        role: 'AUTHOR',
        permissions: ['story.create', 'story.publish', 'chapter.create']
      };
    } else {
      // Default standard guest or reader account
      request.user = {
        uid: 'usr_789',
        email: 'reader.novice@stilova.com',
        role: 'READER',
        permissions: ['comment.create', 'rating.create']
      };
    }

    return true;
  }
}

// ==========================================
// 3. ROLES BASED CONTROLLER GUARD (RBAC)
// ==========================================
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles enforced, dynamic public access
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return false;
    }

    // "SUPER_ADMIN" is the supreme node bypass, bypasses all typical check-steps
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new HttpException({
        success: false,
        message: 'Accès interdit.',
        error: {
          code: 'FORBIDDEN',
          details: [`Rôle(s) exigé(s) : ${requiredRoles.join(', ')}. Vous possédez : ${user.role}.`]
        }
      }, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}

// ==========================================
// 4. GRANULAR PERMISSION GUARD
// ==========================================
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

    // Supreme Wildcard match for System or Super Admin
    if (user.permissions.includes('*')) {
      return true;
    }

    // Check if user has all required permissions or matching wildcards
    const hasPermission = requiredPermissions.every((requiredPerm) => {
      return user.permissions.some((userPerm) => {
        // Direct exact match
        if (userPerm === requiredPerm) return true;
        
        // Multi-level Wilcard resolution, e.g., 'moderation.*' matches 'moderation.reports.dismiss'
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

// ==========================================
// 5. GLOBAL ADAPTIVE EXCEPTION FILTER
// ==========================================
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur système inattendue est survenue.';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resPayload: any = exception.getResponse();

      if (typeof resPayload === 'object') {
        message = resPayload.message || message;
        if (resPayload.error && typeof resPayload.error === 'object') {
          errorCode = resPayload.error.code || errorCode;
          details = resPayload.error.details || details;
        } else {
          // Fallback mapping standard Nest Validation messages (class-validator lists)
          if (Array.isArray(resPayload.message)) {
            errorCode = 'VALIDATION_ERROR';
            details = resPayload.message;
            message = 'Le formulaire de saisie contient des erreurs.';
          } else {
            errorCode = this.mapHttpStatusToCode(status);
            details = [exception.message];
          }
        }
      } else {
        message = resPayload;
        errorCode = this.mapHttpStatusToCode(status);
        details = [exception.message];
      }
    } else {
      // General native Node/JS unexpected stack failures
      if (exception instanceof Error) {
        details = [exception.message];
        // If Database lock, lock exception triggers
        if (exception.name === 'QueryFailedError' || exception.name === 'ValidationError') {
          status = HttpStatus.BAD_REQUEST;
          errorCode = 'VALIDATION_ERROR';
          message = 'Contrainte de base de données transgressée.';
        }
      }
    }

    response.status(status).json({
      success: false,
      message,
      error: {
        code: errorCode,
        details
      }
    });
  }

  private mapHttpStatusToCode(status: number): string {
    switch (status) {
      case 400: return 'VALIDATION_ERROR';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'BUSINESS_RULE_VIOLATION';
      case 429: return 'RATE_LIMIT_EXCEEDED';
      case 503: return 'SERVICE_UNAVAILABLE';
      default: return 'INTERNAL_SERVER_ERROR';
    }
  }
}
