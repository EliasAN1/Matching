import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitUserPageComponent } from './visit-user-page.component';

describe('VisitUserPageComponent', () => {
  let component: VisitUserPageComponent;
  let fixture: ComponentFixture<VisitUserPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisitUserPageComponent]
    });
    fixture = TestBed.createComponent(VisitUserPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
