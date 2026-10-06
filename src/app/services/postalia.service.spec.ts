import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PostaliaService } from './postalia.service';
import { PostaliaResponse } from '../models/postalia.model';
import { environment } from '../../environments/environment';

describe('PostaliaService', () => {
  let service: PostaliaService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(PostaliaService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('shares one request for concurrent lookups of the same postal code', () => {
    const respuesta: PostaliaResponse = {
      codigo_postal: '42000',
      estado: 'Hidalgo',
      municipio: 'Pachuca',
      zona: 'Urbana',
      colonias: []
    };
    const resultados: PostaliaResponse[] = [];

    service.buscarCodigoPostal('42000').subscribe(valor => resultados.push(valor));
    service.buscarCodigoPostal('42000').subscribe(valor => resultados.push(valor));

    const solicitud = httpTestingController.expectOne(`${environment.apiUrl}/postalia/42000`);
    solicitud.flush(respuesta);

    expect(resultados).toEqual([respuesta, respuesta]);
    httpTestingController.expectNone(`${environment.apiUrl}/postalia/42000`);
  });

    it('requests fresh location data after the previous request completes', () => {
      const respuesta: PostaliaResponse = {
        codigo_postal: '42000',
        estado: 'Hidalgo',
        municipio: 'Pachuca',
        zona: 'Urbana',
        colonias: []
      };

      service.buscarCodigoPostal('42000').subscribe();
      httpTestingController
        .expectOne(`${environment.apiUrl}/postalia/42000`)
        .flush(respuesta);

      service.buscarCodigoPostal('42000').subscribe();
      httpTestingController
        .expectOne(`${environment.apiUrl}/postalia/42000`)
        .flush({ ...respuesta, municipio: 'Mineral de la Reforma' });
    });
});