import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Usuario } from '../models/usuario.model';
import { UsuarioRequest } from './usuario.service';

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
    form.patchValue({
      datosPersonales: {
        nombre: usuario.nombre,
        primer_apellido: usuario.primerApellido,
        password: '',
        fecha_nacimiento: usuario.fechaNacimiento,
        email: usuario.email
      },
      datosContacto: {
        telefono: usuario.telefono,
        codigo_postal: usuario.codigoPostal,
        estado: usuario.estado,
        municipio: usuario.municipio,
        direccion: usuario.direccion
      }
    });

    const datosContacto = form.get('datosContacto') as FormGroup;
    this.reemplazarFilas(datosContacto.get('telefonos') as FormArray, usuario.telefonos ?? [], 'telefono');
    this.reemplazarFilas(
      datosContacto.get('direcciones') as FormArray,
      (usuario.direcciones ?? []).map(direccion => ({
        ...direccion,
        codigoPostal: direccion.codigoPostal || usuario.codigoPostal
      })),
      'direccion'
    );
    this.reemplazarFilas(datosContacto.get('correos') as FormArray, usuario.correos ?? [], 'correo');
  }

  crearRequest(form: FormGroup, incluirPassword = true): UsuarioRequest {
    const { datosPersonales, datosContacto } = form.getRawValue();
    const request: UsuarioRequest = {
      nombre: datosPersonales.nombre,
      primerApellido: datosPersonales.primer_apellido,
      telefono: datosContacto.telefono,
      codigoPostal: datosContacto.codigo_postal,
      direccion: datosContacto.direccion,
      fechaNacimiento: datosPersonales.fecha_nacimiento,
      email: datosPersonales.email,
      telefonos: [
        { tipo: 'Principal', valor: datosContacto.telefono },
        ...this.filasConValor(datosContacto.telefonos)
      ],
      direcciones: [
        { tipo: 'Principal', valor: datosContacto.direccion, codigoPostal: datosContacto.codigo_postal },
        ...(datosContacto.direcciones ?? [])
          .filter((fila: { valor?: string }) => !!fila?.valor)
          .map((fila: { tipo: string; valor: string; codigoPostal?: string }) => ({
            tipo: fila.tipo || 'Dirección',
            valor: fila.valor,
            codigoPostal: fila.codigoPostal || datosContacto.codigo_postal
          }))
      ],
      correos: [
        { tipo: 'Principal', valor: datosPersonales.email },
        ...this.filasConValor(datosContacto.correos)
      ]
    };

    if (incluirPassword) {
      request.password = datosPersonales.password;
    } else if (datosPersonales.password) {
      request.password = datosPersonales.password;
    }

    return request;
  }

  private reemplazarFilas(array: FormArray, filas: Array<{ tipo: string; valor: string; codigoPostal?: string }>, tipoFila: 'telefono' | 'direccion' | 'correo'): void {
    array.clear();
    filas.forEach(fila => array.push(tipoFila === 'direccion'
      ? this.fb.group({
          tipo: [fila.tipo || 'Personal', Validators.required],
          valor: [fila.valor, [Validators.required, Validators.maxLength(150)]],
          codigoPostal: [fila.codigoPostal ?? '', [Validators.required, Validators.pattern(/^\d{5}$/)]]
        })
      : this.fb.group({
          tipo: [fila.tipo || 'Personal', Validators.required],
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
      .map(fila => ({ tipo: fila.tipo || 'Contacto', valor: fila.valor, ...(fila.codigoPostal ? { codigoPostal: fila.codigoPostal } : {}) }));
  }

  private fechaAdulto(control: import('@angular/forms').AbstractControl): { menorDeEdad: true } | null {
    if (!control.value) return null;
    const nacimiento = new Date(`${control.value}T00:00:00`);
    const hoy = new Date();
    const limite = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    return nacimiento <= limite ? null : { menorDeEdad: true };
  }
}