import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmacionAdminDialogData {
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'app-confirmacion-admin-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './confirmacion-admin-dialog.component.html',
  styleUrl: './confirmacion-admin-dialog.component.css'
})
export class ConfirmacionAdminDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: ConfirmacionAdminDialogData,
    private dialogRef: MatDialogRef<ConfirmacionAdminDialogComponent, boolean>
  ) {}

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}