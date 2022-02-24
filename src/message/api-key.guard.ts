import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from '../user/user.service';

@Injectable()
export class KeyGuard implements CanActivate {
  constructor(@Inject(UserService) private userService: UserService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.query.key;
    if (!key) {
      throw new UnauthorizedException(
        null,
        'no `key` parameter provided in request',
      );
    }
    if (!this.userService.cachedKeys.has(key)) {
      throw new UnauthorizedException(null, 'invalid api key');
    }
    return true;
  }
}
