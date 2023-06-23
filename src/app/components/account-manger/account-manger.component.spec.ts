import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountMangerComponent } from './account-manger.component';

describe('AccountMangerComponent', () => {
  let component: AccountMangerComponent;
  let fixture: ComponentFixture<AccountMangerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountMangerComponent]
    });
    fixture = TestBed.createComponent(AccountMangerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
