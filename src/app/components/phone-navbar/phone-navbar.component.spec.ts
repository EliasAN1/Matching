import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneNavbarComponent } from './phone-navbar.component';

describe('PhoneNavbarComponent', () => {
  let component: PhoneNavbarComponent;
  let fixture: ComponentFixture<PhoneNavbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PhoneNavbarComponent]
    });
    fixture = TestBed.createComponent(PhoneNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
