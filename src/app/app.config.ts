import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideHttpClient, withInterceptors, withXsrfConfiguration} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import { routes } from './app.routes';
import {jwtInterceptor} from './interceptors/jwt.interceptor';
import {csrfInterceptor} from './interceptors/csrf.interceptor';


export const appConfig: ApplicationConfig = {

  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true
    }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        jwtInterceptor,
        csrfInterceptor
      ]),

      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      })
    )
  ]
};