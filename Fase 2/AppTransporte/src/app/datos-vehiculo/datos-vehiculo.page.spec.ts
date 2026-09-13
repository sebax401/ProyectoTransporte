import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatosVehiculoPage } from './datos-vehiculo.page';

describe('DatosVehiculoPage', () => {
  let component: DatosVehiculoPage;
  let fixture: ComponentFixture<DatosVehiculoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DatosVehiculoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
