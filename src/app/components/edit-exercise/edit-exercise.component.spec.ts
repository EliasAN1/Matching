import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditExerciseComponent } from './edit-exercise.component';

describe('EditExerciseComponent', () => {
  let component: EditExerciseComponent;
  let fixture: ComponentFixture<EditExerciseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditExerciseComponent]
    });
    fixture = TestBed.createComponent(EditExerciseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
