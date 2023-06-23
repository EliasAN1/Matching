import { Component } from '@angular/core';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { Router } from '@angular/router';

interface MyExerciseItem {
  question: string;
  questionOrder: string;
  result: string;
}

interface MyExercisesItem {
  user: string;
  exerciseName: string;
  questions: string[];
}

@Component({
  selector: 'app-publicexercises',
  templateUrl: './publicexercises.component.html',
  styleUrls: ['./publicexercises.component.css'],
})
export class PublicexercisesComponent {
  PublicExercisesText: string = '';
  searchInput: string = '';
  FoundExercises: boolean = false;
  searchResultFound: boolean = true;
  currentseleciton: string = 'Exercise name';

  constPublicExercises: MyExercisesItem[] = [];
  publicExercises: MyExercisesItem[] = [];
  myList: MyExerciseItem[] = [];

  constructor(
    private servercomm: ServercommService,
    private alertcom: CustomAlertComponent,
    private router: Router
  ) {}

  ngOnInit() {
    this.servercomm
      .getAllPublicData()
      .then((response) => {
        response = response['message'];
        if (response == 'Unknown error occurred') {
          this.alertcom.updateAlert('danger', response, 5000);
        } else {
          response.forEach((exericse: any) => {
            this.constPublicExercises.push({
              user: exericse[0],
              exerciseName: exericse[1].replaceAll('_', ' '),
              questions: exericse[2],
            });
          });
          this.publicExercises = this.constPublicExercises;
          console.log(this.publicExercises.length);

          if (this.publicExercises.length == 0) {
            this.FoundExercises = false;
            this.PublicExercisesText = 'No exercises are public at the moment';
          } else {
            this.FoundExercises = true;
            this.PublicExercisesText = '';
          }
        }
      })
      .catch((err) => {
        console.log(this.publicExercises.length);
        this.alertcom.updateAlert('danger', 'Unknown error occurred', 5000);
      });
  }

  search(change: string = '') {
    if (change != '' && this.currentseleciton == 'Exercise name') {
      this.currentseleciton = 'Username';
    } else if (change != '' && this.currentseleciton == 'Username') {
      this.currentseleciton = 'Exercise name';
    }
    setTimeout(() => {
      this.publicExercises = this.constPublicExercises;
      if (this.searchInput.length == 0) {
        this.searchResultFound = true;
      } else {
        if (this.currentseleciton == 'Exercise name') {
          this.publicExercises = this.publicExercises.filter((exercise) =>
            exercise.exerciseName
              .toLowerCase()
              .includes(this.searchInput.toLowerCase())
          );
        } else {
          this.publicExercises = this.publicExercises.filter((exercise) =>
            exercise.user.includes(this.searchInput)
          );
        }

        this.searchResultFound = true;
        if (this.publicExercises.length == 0) {
          this.searchResultFound = false;
        } else {
          this.searchResultFound = true;
        }
      }
    }, 1);
  }

  loadExercise(exercise: any) {
    sessionStorage.removeItem('exercise');
    exercise.questions.forEach((element: any) => {
      const item: MyExerciseItem = {
        question: element[0],
        questionOrder: element[1],
        result: '',
      };
      this.myList.push(item);
    });
    console.log(this.myList);

    sessionStorage.setItem('exercise', JSON.stringify(this.myList));
    return this.router.navigate(['/exercise']);
  }

  hideExercise(exerciseName: string, username: string) {}
}
