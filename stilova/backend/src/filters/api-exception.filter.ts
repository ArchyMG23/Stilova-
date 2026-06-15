import { 
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus 
} from '@nestjs/common';

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
      if (exception instanceof Error) {
        details = [exception.message];
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
