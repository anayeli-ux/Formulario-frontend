import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Usuario } from '../models/usuario.model';
import { UsuarioActualizarRequest, UsuarioRequest } from './usuario.service';

@Injectable({ providedIn: 'root' })
export class UsuarioFormService {
  constructor(private fb: FormBuilder) {}

  crearFormulario(edicion = false): FormGroup {
    return this.fb.group({
      datosPersonales: this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        primer_apellido: ['', [Validators.required, Validators.maxLength(50)]],
        password: ['', edicion
          ? [Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)]
          : [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)]
        ],
        fecha_nacimiento: ['', [Validators.required, this.fechaAdulto]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]]
      }),
      datosContacto: this.fb.group({
        telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        telefonos: this.fb.array([]),
        codigo_postal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        estado: ['', Validators.maxLength(100)],
        municipio: ['', Validators.maxLength(100)],
        direccion: ['', [Validators.required, Validators.maxLength(150)]],
        direcciones: this.fb.array([]),
        correos: this.fb.array([])
      })
    });
  }

  cargarUsuario(form: FormGroup, usuario: Usuario): void {
    const telefonos = usuario.telefonos ?? [];
    const correos = usuario.correos ?? [];
    const direcciones = usuario.direcciones ?? [];
    const telefonoPrincipal = this.seleccionarPrincipal(telefonos);
    const correoPrincipal = this.seleccionarPrincipal(correos);
    const direccionPrincipal = this.seleccionarPrincipal(direcciones);

    form.patchValue({
      datosPersonales: {
        nombre: usuario.nombre,
        primer_apellido: usuario.primerApellido,
        password: '',
        fecha_nacimiento: usuario.fechaNacimiento,
        email: correoPrincipal?.valor ?? ''
      },
      datosContacto: {
        telefono: telefonoPrincipal?.valor ?? '',
        codigo_postal: direccionPrincipal?.codigoPostal ?? '',
        estado: usuario.estado ?? '',
        municipio: usuario.municipio ?? '',
        direccion: direccionPrincipal?.valor ?? ''
      }
    });

    const datosContacto = form.get('datosContacto') as FormGroup;
    this.reemplazarFilas(datosContacto.get('telefonos') as FormArray, this.obtenerAdicionales(telefonos, telefonoPrincipal), 'telefono');
    this.reemplazarFilas(
      datosContacto.get('direcciones') as FormArray,
      this.obtenerAdicionales(direcciones, direccionPrincipal).map(direccion => ({
        ...direccion,
        codigoPostal: direccion.codigoPostal || ''
      })),
      'direccion'
    );
    this.reemplazarFilas(datosContacto.get('correos') as FormArray, this.obtenerAdicionales(correos, correoPrincipal), 'correo');
  }

  crearRequest(form: FormGroup): UsuarioRequest;
  crearRequest(form: FormGroup, incluirPassword: false): UsuarioActualizarRequest;
  crearRequest(form: FormGroup, incluirPassword = true): UsuarioRequest | UsuarioActualizarRequest {
    const { datosPersonales, datosContacto } = form.getRawValue();

    const request: Omit<UsuarioRequest, 'password'> = {
      nombre: datosPersonales.nombre,
      primerApellido: datosPersonales.primer_apellido,
      fechaNacimiento: datosPersonales.fecha_nacimiento,
      telefonos: [
        { tipo: 'PRINCIPAL', valor: datosContacto.telefono },
        ...this.filasConValor(datosContacto.telefonos)
      ],
      direcciones: [
        { tipo: 'PRINCIPAL', valor: datosContacto.direccion, codigoPostal: datosContacto.codigo_postal },
        ...(datosContacto.direcciones ?? [])
          .filter((fila: { valor?: string }) => !!fila?.valor)
          .map((fila: { tipo: string; valor: string; codigoPostal?: string }) => ({
            tipo: (fila.tipo || 'Dirección').toUpperCase(),
            valor: fila.valor,
            codigoPostal: fila.codigoPostal || datosContacto.codigo_postal
          }))
      ],
      correos: [
        { tipo: 'PRINCIPAL', valor: datosPersonales.email },
        ...this.filasConValor(datosContacto.correos)
      ]
    };

    if (incluirPassword) {
      return { ...request, password: datosPersonales.password } as UsuarioRequest;
    }

    return datosPersonales.password ? { ...request, password: datosPersonales.password } : request;
  }

  private seleccionarPrincipal<T extends { tipo: string }>(contactos: T[]): T | undefined {
    return contactos.find(contacto => contacto.tipo === 'PRINCIPAL') ?? contactos[0];
  }

  private obtenerAdicionales<T extends { tipo: string }>(contactos: T[], principal?: T): T[] {
    let principalOmitido = false;
    return contactos.filter(contacto => {
      if (contacto === principal && !principalOmitido) {
        principalOmitido = true;
        return false;
      }
      return true;
    }).map(contacto => contacto.tipo === 'PRINCIPAL'
      ? { ...contacto, tipo: 'Personal' }
      : contacto
    );
  }

  private reemplazarFilas(array: FormArray, filas: Array<{ tipo: string; valor: string; codigoPostal?: string }>, tipoFila: 'telefono' | 'direccion' | 'correo'): void {
    array.clear();
    filas.forEach(fila => array.push(tipoFila === 'direccion'
      ? this.fb.group({
          tipo: [this.tipoVisible(fila.tipo || 'Personal'), Validators.required],
          valor: [fila.valor, [Validators.required, Validators.maxLength(150)]],
          codigoPostal: [fila.codigoPostal ?? '', [Validators.required, Validators.pattern(/^\d{5}$/)]]
        })
      : this.fb.group({
          tipo: [this.tipoVisible(fila.tipo || 'Personal'), Validators.required],
          valor: [fila.valor, tipoFila === 'correo'
            ? [Validators.required, Validators.email, Validators.maxLength(150)]
            : [Validators.required, Validators.pattern(/^\d{10}$/)]
          ]
        })
    ));
  }

  private filasConValor(filas: Array<{ tipo: string; valor: string; codigoPostal?: string }> = []): Array<{ tipo: string; valor: string; codigoPostal?: string }> {
    return filas
      .filter(fila => !!fila?.valor)
      .map(fila => ({ tipo: (fila.tipo || 'Contacto').toUpperCase(), valor: fila.valor }));
  }

  private tipoVisible(tipo: string): string {
    const tipos: Record<string, string> = {
      PERSONAL: 'Personal',
      TRABAJO: 'Trabajo',
      CASA: 'Casa',
      EMERGENCIA: 'Emergencia'
    };
    return tipos[tipo.toUpperCase()] ?? tipo;
  }

  private fechaAdulto(control: import('@angular/forms').AbstractControl): { menorDeEdad: true } | null {
    if (!control.value) return null;
    const nacimiento = new Date(`${control.value}T00:00:00`);
    const hoy = new Date();
    const limite = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    return nacimiento <= limite ? null : { menorDeEdad: true };
  }
}