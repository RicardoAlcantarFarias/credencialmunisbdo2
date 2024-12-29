import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubirFotoPage } from './subir-foto.page';

describe('SubirFotoPage', () => {
  let component: SubirFotoPage;
  let fixture: ComponentFixture<SubirFotoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SubirFotoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
