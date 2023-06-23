import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicexercisesComponent } from './publicexercises.component';

describe('PublicexercisesComponent', () => {
  let component: PublicexercisesComponent;
  let fixture: ComponentFixture<PublicexercisesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PublicexercisesComponent]
    });
    fixture = TestBed.createComponent(PublicexercisesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
