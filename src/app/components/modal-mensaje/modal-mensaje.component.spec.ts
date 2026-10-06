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
});
