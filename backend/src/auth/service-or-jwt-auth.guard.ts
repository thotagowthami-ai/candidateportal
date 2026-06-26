import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class ServiceOrJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(ServiceOrJwtAuthGuard.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const configuredKey = (
      process.env.RECRUITING_BACKEND_API_KEY ??
      this.configService.get<string>('RECRUITING_BACKEND_API_KEY') ??
      ''
    ).trim();
    const suppliedHeader = request.headers['x-api-key'];
    const suppliedKey = (
      Array.isArray(suppliedHeader) ? suppliedHeader[0] : suppliedHeader ?? ''
    ).trim();

    if (configuredKey && suppliedKey) {
      const expected = Buffer.from(configuredKey);
      const supplied = Buffer.from(suppliedKey);

      if (
        expected.length === supplied.length &&
        timingSafeEqual(expected, supplied)
      ) {
        this.logger.log('Recruiting backend authenticated with service API key');
        request.user = {
          role: 'recruiter',
          authType: 'service-api-key',
        };
        return true;
      }

      this.logger.warn('Rejected mismatched recruiting backend API key');
      throw new UnauthorizedException('Invalid service API key');
    }

    if (suppliedKey && !configuredKey) {
      this.logger.error(
        'RECRUITING_BACKEND_API_KEY is missing from Candidate Portal environment',
      );
      throw new UnauthorizedException(
        'Service authentication is not configured',
      );
    }

    return super.canActivate(context);
  }
}
