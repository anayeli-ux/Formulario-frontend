import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import { finalize, Observable, shareReplay } from 'rxjs';

import {
  PostaliaResponse
} from '../models/postalia.model';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class PostaliaService {

  private apiUrl =
    `${environment.apiUrl}/postalia`;

  private solicitudes = new Map<string, Observable<PostaliaResponse>>();


  constructor(
    private http: HttpClient
  ) {}


  buscarCodigoPostal(
    cp: string
  ): Observable<PostaliaResponse> {

    const codigoPostal = cp.trim();
    const solicitudExistente = this.solicitudes.get(codigoPostal);

    if (solicitudExistente) {
      return solicitudExistente;
    }

    const solicitud = this.http.get<PostaliaResponse>(
      `${this.apiUrl}/${codigoPostal}`
    ).pipe(
      finalize(() => this.solicitudes.delete(codigoPostal)),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.solicitudes.set(codigoPostal, solicitud);
    return solicitud;
  }

}