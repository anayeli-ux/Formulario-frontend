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
import { UsuarioResumen } from '../../models/usuario.model';
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
  @Input() usuarios: UsuarioResumen[] = [];
  @Input() busqueda = '';
  @Input() totalPages = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 5;
  @Input() cargando = false;
  @Input() inactivos = false;
  @Input() entidad: 'usuarios' | 'administradores' = 'usuarios';
  @Input() set columnasOpcionalesSeleccionadas(columnas: string[] | null | undefined) {
    this.columnasActivas = new Set(columnas ?? ['telefono', 'codigoPostal', 'correo']);
  }

  @Output() busquedaChange = new EventEmitter<string>();
  @Output() columnasOpcionalesChange = new EventEmitter<string[]>();
  @Output() registrar = new EventEmitter<void>();
  @Output() ver = new EventEmitter<UsuarioResumen>();
  @Output() editar = new EventEmitter<UsuarioResumen>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() reactivar = new EventEmitter<number>();

  private columnasActivas = new Set<string>(['telefono', 'codigoPostal', 'correo']);

  constructor(adminIcons: AdminIconsService) {
    adminIcons.registrar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['busqueda']) {
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
    return COLUMNAS_OPCIONALES;
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

  get usuariosPaginados(): UsuarioResumen[] {
    return this.usuarios;
  }

  get paginatorLength(): number {
    return this.totalPages * this.pageSize;
  }

  get sugerencias(): UsuarioResumen[] {
    return this.busqueda.trim() ? this.usuarios.slice(0, 8) : [];
  }

  actualizarBusqueda(event: Event): void {
    this.busquedaChange.emit((event.target as HTMLInputElement).value);
  }

  seleccionarSugerencia(event: MatAutocompleteSelectedEvent): void {
    this.busquedaChange.emit(String(event.option.value));
  }

  cambiarPagina(event: PageEvent): void {
    this.paginaChange.emit(event);
  }

  nombreCompleto(usuario: UsuarioResumen): string {
    return `${usuario.nombre} ${usuario.primerApellido}`.trim();
  }

  valorSugerencia(usuario: UsuarioResumen): string {
    return String(usuario.id ?? usuario.nombre);
  }

  obtenerTelefonoPrincipal(usuario: UsuarioResumen): string {
    return usuario.telefono ?? '';
  }

  obtenerCorreoPrincipal(usuario: UsuarioResumen): string {
    return usuario.correo ?? '';
  }

  obtenerCodigoPostalPrincipal(usuario: UsuarioResumen): string {
    return usuario.codigoPostal ?? '';
  }

  @Output() paginaChange = new EventEmitter<PageEvent>();
}