import {
  HttpInterceptorFn
} from '@angular/common/http';

import {
  catchError,
  throwError,
  timeout
} from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn =
  (req, next) => {

    return next(req).pipe(

      timeout(10000),

      catchError(error => {

        console.error(
          'Error HTTP:',
          error
        );

        return throwError(
          () => error
        );
      })

    );
  };