import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Usuario } from '../../models/usuario.model';
import { obtenerContactoPrincipal } from '../../utils/contactos.util';
import { AdminIconsService } from '../../services/admin-icons.service';

type ColumnaOpcionalUsuarios = 'telefono' | 'codigoPostal' | 'correo';

interface OpcionColumnaUsuarios {
  id: ColumnaOpcionalUsuarios;
  etiqueta: string;
}

const COLUMNAS_OPCIONALES: OpcionColumnaUsuarios[] = [
  { id: 'telefono', etiqueta: 'Teléfono' },
  { id: 'codigoPostal', etiqueta: 'Código postal' },
  { id: 'correo', etiqueta: 'Correo electrónico' }
];

@Component({
  selector: 'app-usuarios-tabla',
  standalone: true,
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule
  ],
  templateUrl: './usuarios-tabla.component.html',
  styleUrl: './usuarios-tabla.component.css'
})
export class UsuariosTablaComponent implements OnChanges {
  @Input() usuarios: Usuario[] = [];
  @Input() busqueda = '';
  @Input() total = 0;
  @Input() cargando = false;
  @Input() inactivos = false;
  @Input() set columnasOpcionalesSeleccionadas(columnas: string[] | null | undefined) {
    this.columnasActivas = new Set(columnas ?? ['telefono', 'correo']);
  }

  @Output() busquedaChange = new EventEmitter<string>();
  @Output() columnasOpcionalesChange = new EventEmitter<string[]>();
  @Output() registrar = new EventEmitter<void>();
  @Output() ver = new EventEmitter<Usuario>();
  @Output() editar = new EventEmitter<Usuario>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() reactivar = new EventEmitter<number>();

  pageIndex = 0;
  pageSize = 10;
  private columnasActivas = new Set<string>(['telefono', 'correo']);

  constructor(adminIcons: AdminIconsService) {
    adminIcons.registrar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuarios'] || changes['busqueda']) {
      this.pageIndex = 0;
    }
  }

  get columnasVisibles(): string[] {
    const opcionalesVisibles = this.columnasConfigurables
      .filter(columna => this.columnasActivas.has(columna.id))
      .map(columna => columna.id);

    return [
      'id',
      'nombre',
      ...opcionalesVisibles,
      'informacion',
      'acciones'
    ];
  }

  get columnasConfigurables(): OpcionColumnaUsuarios[] {
    return this.inactivos
      ? COLUMNAS_OPCIONALES.filter(columna => columna.id !== 'correo')
      : COLUMNAS_OPCIONALES;
  }

  columnaSeleccionada(columna: ColumnaOpcionalUsuarios): boolean {
    return this.columnasActivas.has(columna);
  }

  cambiarVisibilidadColumna(columna: ColumnaOpcionalUsuarios, cambio: MatCheckboxChange): void {
    if (!this.columnasConfigurables.some(opcion => opcion.id === columna)) return;

    if (cambio.checked) {
      this.columnasActivas.add(columna);
    } else {
      this.columnasActivas.delete(columna);
    }

    this.columnasOpcionalesChange.emit([...this.columnasActivas]);
  }

  get usuariosPaginados(): Usuario[] {
    const start = this.pageIndex * this.pageSize;
    return this.usuarios.slice(start, start + this.pageSize);
  }

  get sugerencias(): Usuario[] {
    return this.busqueda.trim() ? this.usuarios.slice(0, 8) : [];
  }

  actualizarBusqueda(event: Event): void {
    this.busquedaChange.emit((event.target as HTMLInputElement).value);
  }

  seleccionarSugerencia(event: MatAutocompleteSelectedEvent): void {
    this.busquedaChange.emit(String(event.option.value));
  }

  cambiarPagina(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  nombreCompleto(usuario: Usuario): string {
    return `${usuario.nombre} ${usuario.primerApellido}`.trim();
  }

  valorSugerencia(usuario: Usuario): string {
    return String(usuario.id ?? usuario.nombre);
  }

  obtenerTelefonoPrincipal(usuario: Usuario): string {
    return obtenerContactoPrincipal(usuario.telefonos)?.valor ?? '';
  }

  obtenerCorreoPrincipal(usuario: Usuario): string {
    return obtenerContactoPrincipal(usuario.correos)?.valor ?? '';
  }

  obtenerCodigoPostalPrincipal(usuario: Usuario): string {
    return obtenerContactoPrincipal(usuario.direcciones)?.codigoPostal ?? '';
  }
}