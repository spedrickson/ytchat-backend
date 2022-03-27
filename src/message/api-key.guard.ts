import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from '../user/user.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class KeyGuard implements CanActivate {
  constructor(
    @Inject(UserService) private userService: UserService,
    private reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const permissions = this.reflector.get<string[]>(
      'permission',
      context.getHandler(),
    );
    const permission = permissions[0];
    const request = context.switchToHttp().getRequest();
    const key = request.query.key;
    if (!key) {
      throw new UnauthorizedException(
        null,
        'no `key` parameter provided in request',
      );
    }
    const user = this.userService.cachedUsers[key];
    if (!user) {
      throw new UnauthorizedException(null, 'invalid api key');
    }
    if (user.isAdmin || user.perms[permission] === true) {
      request.authenticatedUser = user;
      return true;
    } else {
      throw new UnauthorizedException(null, 'insufficient permissions');
    }
  }
}
