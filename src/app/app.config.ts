import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideHttpClient, withInterceptors, withXsrfConfiguration} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import {csrfInterceptor} from './interceptors/csrf.interceptor';


export const appConfig: ApplicationConfig = {

  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true
    }),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        csrfInterceptor
      ]),

      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      })
    )
  ]
};