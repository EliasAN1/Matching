import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoverAuthComponent } from './recover-auth.component';

describe('RecoverAuthComponent', () => {
  let component: RecoverAuthComponent;
  let fixture: ComponentFixture<RecoverAuthComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RecoverAuthComponent]
    });
    fixture = TestBed.createComponent(RecoverAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
