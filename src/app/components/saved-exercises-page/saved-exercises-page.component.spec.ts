import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedExercisesPageComponent } from './saved-exercises-page.component';

describe('SavedExercisesPageComponent', () => {
  let component: SavedExercisesPageComponent;
  let fixture: ComponentFixture<SavedExercisesPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SavedExercisesPageComponent]
    });
    fixture = TestBed.createComponent(SavedExercisesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
