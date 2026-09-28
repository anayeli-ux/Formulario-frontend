import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

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


  constructor(
    private http: HttpClient
  ) {}


  buscarCodigoPostal(
    cp: string
  ): Observable<PostaliaResponse> {

    return this.http.get<PostaliaResponse>(
      `${this.apiUrl}/${cp}`
    );
  }

}