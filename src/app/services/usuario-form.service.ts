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
        correos: this.fb.array([]),
        principalInconsistente: [false]
      }, {
        validators: control => control.get('principalInconsistente')?.value
          ? { principalContactoInconsistente: true }
          : null
      })
    });
  }

  cargarUsuario(form: FormGroup, usuario: Usuario): void {
    const telefonos = usuario.telefonos ?? [];
    const correos = usuario.correos ?? [];
    const direcciones = usuario.direcciones ?? [];
    const telefonosPrincipales = telefonos.filter(contacto => contacto.tipo === 'PRINCIPAL');
    const correosPrincipales = correos.filter(contacto => contacto.tipo === 'PRINCIPAL');
    const direccionesPrincipales = direcciones.filter(direccion => direccion.tipo === 'PRINCIPAL');
    const tienePrincipalesUnicos = [telefonosPrincipales, correosPrincipales, direccionesPrincipales]
      .every(principales => principales.length === 1);

    form.patchValue({
      datosPersonales: {
        nombre: usuario.nombre,
        primer_apellido: usuario.primerApellido,
        password: '',
        fecha_nacimiento: usuario.fechaNacimiento,
        email: correosPrincipales.length === 1 ? correosPrincipales[0].valor : ''
      },
      datosContacto: {
        telefono: telefonosPrincipales.length === 1 ? telefonosPrincipales[0].valor : '',
        codigo_postal: direccionesPrincipales.length === 1 ? direccionesPrincipales[0].codigoPostal : '',
        estado: usuario.estado ?? '',
        municipio: usuario.municipio ?? '',
        direccion: direccionesPrincipales.length === 1 ? direccionesPrincipales[0].valor : '',
        principalInconsistente: !tienePrincipalesUnicos
      }
    });

    const datosContacto = form.get('datosContacto') as FormGroup;
    this.reemplazarFilas(datosContacto.get('telefonos') as FormArray, telefonos.filter(contacto => contacto.tipo !== 'PRINCIPAL'), 'telefono');
    this.reemplazarFilas(
      datosContacto.get('direcciones') as FormArray,
      direcciones.filter(direccion => direccion.tipo !== 'PRINCIPAL').map(direccion => ({
        ...direccion,
        codigoPostal: direccion.codigoPostal || ''
      })),
      'direccion'
    );
    this.reemplazarFilas(datosContacto.get('correos') as FormArray, correos.filter(contacto => contacto.tipo !== 'PRINCIPAL'), 'correo');
  }

  crearRequest(form: FormGroup): UsuarioRequest;
  crearRequest(form: FormGroup, incluirPassword: false): UsuarioActualizarRequest;
  crearRequest(form: FormGroup, incluirPassword = true): UsuarioRequest | UsuarioActualizarRequest {
    const { datosPersonales, datosContacto } = form.getRawValue();
    if (datosContacto.principalInconsistente) {
      throw new Error('No se puede guardar el usuario: sus contactos principales son inconsistentes.');
    }

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