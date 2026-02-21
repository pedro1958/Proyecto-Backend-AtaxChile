import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'

@Injectable()
export class SelfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const usuarioLogueado = req.user
    const idParam = +req.params.id

    if (usuarioLogueado?.id !== idParam) {
      throw new ForbiddenException('No puedes modificar datos de otro usuario')
    }
    return true
  }
}
