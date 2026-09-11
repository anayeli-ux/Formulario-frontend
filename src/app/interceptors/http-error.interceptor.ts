import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  catchError,
  throwError
} from 'rxjs';


export const httpErrorInterceptor: HttpInterceptorFn =
  (req, next) => {

    return next(req).pipe(

      catchError(
        (error: HttpErrorResponse) => {

          console.error(
            'Error HTTP global:',
            error.status,
            error.message
          );

          return throwError(
            () => error
          );

        }
      )

    );

  };   