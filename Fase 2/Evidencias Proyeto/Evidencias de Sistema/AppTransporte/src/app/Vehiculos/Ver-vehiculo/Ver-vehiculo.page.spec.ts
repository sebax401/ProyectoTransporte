import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerVehiculoPage } from './Ver-vehiculo.page';

describe('VerVehiculoPage', () => {
  let component: VerVehiculoPage;
  let fixture: ComponentFixture<VerVehiculoPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(VerVehiculoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});