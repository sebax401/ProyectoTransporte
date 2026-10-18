import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenerarReportePage } from './generar-reporte.page';

describe('GenerarReportePage', () => {
  let component: GenerarReportePage;
  let fixture: ComponentFixture<GenerarReportePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerarReportePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
