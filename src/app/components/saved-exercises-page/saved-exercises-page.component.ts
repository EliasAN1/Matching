import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { Subscription } from 'rxjs';

interface MyDictItem {
  exercise: string;
  public: string;
}
interface MyFullExercisesItem {
  exerciseName: string;
  questions: { question: string; questionOrder: string };
  state: string;
}
interface MyExerciseItem {
  question: string;
  questionOrder: string;
  result: string;
}

@Component({
  selector: 'app-saved-exercises-page',
  templateUrl: './saved-exercises-page.component.html',
  styleUrls: ['./saved-exercises-page.component.css'],
})
export class SavedExercisesPageComponent {
  status!: string;
  noexercises: boolean = true;
  SavedExercisesText: string = 'Retreiving your exercises';
  searchInput: string = '';
  FoundExercises: boolean = true;
  private loginStatusSubscription!: Subscription;
  private progressValueSubscription!: Subscription;

  constructor(
    private servercomm: ServercommService,
    private alertcom: CustomAlertComponent,
    private router: Router
  ) {}

  full_exercises: MyFullExercisesItem[] = [];
  exercises: MyDictItem[] = [];
  ConstExercisesName: MyDictItem[] = [];
  myList: MyExerciseItem[] = [];
  ExercisesInDeletingProgress: string[] = [];

  ngOnInit(): void {
    setTimeout(() => {
      let loginstatus: boolean = false;
      let progressvalue: boolean = false;

      this.loginStatusSubscription = this.servercomm
        .getLoggedInStatusasObservable()
        .subscribe((value) => {
          loginstatus = value[0];
        });
      this.progressValueSubscription = this.servercomm
        .getlogInOutinprogressasObservable()
        .subscribe((value) => {
          progressvalue = value;
        });

      if (loginstatus) {
        this.getSavedData();
      } else {
        if (!progressvalue) {
          this.router.navigate(['/']);
          this.alertcom.updateAlert(
            'danger',
            'You are not logged in to access this page!',
            5000
          );
        }
      }
    }, 10);
  }

  ngOnDestroy(): void {
    if (this.loginStatusSubscription) {
      this.loginStatusSubscription.unsubscribe();
    }
    if (this.progressValueSubscription) {
      this.progressValueSubscription.unsubscribe();
    }
  }

  search() {
    setTimeout(() => {
      this.exercises = this.ConstExercisesName;
      if (this.searchInput.length == 0) {
        this.FoundExercises = true;
      } else {
        this.exercises = this.exercises.filter((exercise) =>
          exercise.exercise
            .toLowerCase()
            .includes(this.searchInput.toLowerCase())
        );
        this.FoundExercises = false;
        if (this.exercises.length == 0) {
          this.FoundExercises = false;
        } else {
          this.FoundExercises = true;
        }
      }
    }, 1);
  }

  loadExercise(exercise_name: string) {
    sessionStorage.removeItem('exercise');
    this.full_exercises.forEach((element: any) => {
      if (element.exerciseName.replaceAll('_', ' ') == exercise_name) {
        const exercise_list: string[] = element.questions;
        exercise_list.forEach((element) => {
          const item: MyExerciseItem = {
            question: element[0],
            questionOrder: element[1],
            result: '',
          };
          this.myList.push(item);
        });
        sessionStorage.setItem('exercise', JSON.stringify(this.myList));
        return this.router.navigate(['/exercise']);
      }
      return;
    });
  }

  deleteExercise(name: string) {
    if (!this.ExercisesInDeletingProgress.includes(name)) {
      this.alertcom.updateAlert('safe', `Deleting ${name}...`, 100000);
      this.ExercisesInDeletingProgress.push(name);
      this.servercomm
        .deleteExercise(name.replaceAll(' ', '_'))
        .then((response) => {
          this.ExercisesInDeletingProgress.filter((names) => names != name);
          this.alertcom.Closealert();
          if (response['message'] == 'This exercise have been deleted') {
            let temporarydic: MyDictItem[] = [];
            this.exercises.forEach((exercise) => {
              Object.values(exercise)[0] == name
                ? null
                : temporarydic.push({
                    exercise: exercise.exercise,
                    public: exercise.public,
                  });
            });

            this.exercises = temporarydic;
            if (this.exercises.length == 0) {
              this.SavedExercisesText = 'You have no saved exercises';
              this.noexercises = true;
            }
          } else if (response == 'Your session has ended please login again!') {
            this.alertcom.updateAlert('danger', response, 5000);
            this.router.navigate(['/login']);
            this.servercomm.checkLoggedInStatus();
          } else {
            this.alertcom.updateAlert(
              'danger',
              'Something went wrong, try again',
              5000
            );
          }
        })
        .catch((error) => {
          this.ExercisesInDeletingProgress.filter((names) => names != name);
          this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
        });
    } else {
      this.alertcom.updateAlert(
        'danger',
        'You have already marked this exercise for deletion!',
        5000
      );
    }
  }

  getSavedData() {
    if (sessionStorage.getItem('exercises')) {
      this.noexercises = false;
      this.full_exercises = JSON.parse(
        sessionStorage.getItem('exercises') || ''
      );

      this.full_exercises.forEach((exerciseA: any) => {
        this.exercises.push({
          exercise: exerciseA[0].replaceAll('_', ' '),
          public: exerciseA[2],
        });
      });
      this.ConstExercisesName = this.exercises;
    } else {
      this.servercomm
        .getData()
        .then((response) => {
          response = response['message'];
          if (response == 'Your session has ended please login in again!') {
            this.alertcom.updateAlert('danger', response, 5000);
            this.servercomm.checkLoggedInStatus();
            this.router.navigate(['/']);
          } else if (response.length != 0) {
            this.noexercises = false;
            response.forEach((exerciseA: any[]) => {
              this.exercises.push({
                exercise: exerciseA[0].replaceAll('_', ' '),
                public: exerciseA[2],
              });
              this.full_exercises.push({
                exerciseName: exerciseA[0],
                questions: exerciseA[1],
                state: exerciseA[2],
              });
            });

            console.log(this.full_exercises);

            this.ConstExercisesName = this.exercises;
          } else {
            this.SavedExercisesText = 'You have no saved exercises';
            this.noexercises = true;
          }
        })
        .catch((error) => {
          this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
        });
    }
  }

  editExercise(exercise_name: string) {
    this.full_exercises.forEach((element: any) => {
      if (element.exerciseName.replaceAll('_', ' ') == exercise_name) {
        const exercise_list: string[] = element.questions;
        exercise_list.forEach((element) => {
          const item: MyExerciseItem = {
            question: element[0],
            questionOrder: element[1],
            result: '',
          };
          this.myList.push(item);
        });
        sessionStorage.setItem(
          'edit',
          JSON.stringify(['true', exercise_name, this.myList])
        );
        return this.router.navigate(['/edit']);
      }
      return;
    });
  }

  changeExercisePrivacy(exerciseName: string, state: string) {
    this.servercomm
      .modifyExercisePrivacy(exerciseName.replaceAll(' ', '_'), state)
      .then((response) => {
        response = response['message'];
        if (response == 'The exercise got modified successfully!') {
          this.alertcom.updateAlert('safe', response, 5000);
          this.full_exercises.forEach((exercise, index) => {
            if (exercise.exerciseName.replaceAll('_', ' ') == exerciseName) {
              if (state == 'Make public') {
                this.exercises[index].public = 'Make private';
                exercise.state = 'Make private';
              } else {
                this.exercises[index].public = 'Make public';
                exercise.state = 'Make public';
              }
            }
          });
        } else if (response == 'Your session has ended please login again!') {
          this.alertcom.updateAlert('danger', response, 5000);
          this.router.navigate(['/']);
        }
      })
      .catch((err) => {
        this.alertcom.updateAlert('danger', 'Unknown error occurred', 5000);
      });
  }
}
