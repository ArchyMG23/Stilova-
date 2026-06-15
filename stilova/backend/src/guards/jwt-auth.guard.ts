import { 
  Injectable, CanActivate, ExecutionContext, SetMetadata, 
  HttpException, HttpStatus 
} from '@nestjs/common';

// ==========================================
// CUSTOM DECORATORS FOR RBAC / ABAC
// ==========================================
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export interface RequestWithUser extends Request {
  user: {
    uid: string;
    email: string;
    role: string;
    permissions: string[];
  };
  headers: Headers & {
    authorization?: string;
  };
}

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
    
    // In production, verify JWT using secret keys
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
