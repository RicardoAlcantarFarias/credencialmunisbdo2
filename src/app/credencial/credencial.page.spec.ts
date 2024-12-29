import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CredencialPage } from './credencial.page';

describe('CredencialPage', () => {
  let component: CredencialPage;
  let fixture: ComponentFixture<CredencialPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CredencialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
