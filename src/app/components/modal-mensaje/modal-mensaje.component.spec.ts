import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalMensajeComponent } from './modal-mensaje.component';

describe('ModalMensajeComponent', () => {
  let component: ModalMensajeComponent;
  let fixture: ComponentFixture<ModalMensajeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalMensajeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalMensajeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits close when the modal is dismissed', () => {
    spyOn(component.cerrar, 'emit');

    component.cerrarModal();

    expect(component.cerrar.emit).toHaveBeenCalled();
  });

  it('keeps a locked success modal open', () => {
    spyOn(component.cerrar, 'emit');
    component.bloquearCierre = true;

    component.cerrarModal();

    expect(component.cerrar.emit).not.toHaveBeenCalled();
  });
});
