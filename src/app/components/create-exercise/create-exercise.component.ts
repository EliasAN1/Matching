import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';

interface MyDictItem {
  question: string;
  questionOrder: string;
  result: string;
}

@Component({
  selector: 'app-create-exercise',
  templateUrl: './create-exercise.component.html',
  styleUrls: ['./create-exercise.component.css'],
})
export class CreateExerciseComponent {
  @ViewChild('addQuestionFormDiv', { static: false })
  addQuestionFormDiv!: ElementRef;
  @ViewChild('exercise_name_input') exercise_name_input!: ElementRef;

  myList: MyDictItem[] = [];

  inputs = [
    { question: '', questionOrder: '' },
    { question: '', questionOrder: '' },
  ];
  exercise_name: string = '';
  SentARequest: boolean = false;
  public: boolean = false;

  constructor(
    private router: Router,
    private servercomm: ServercommService,
    private alertcom: CustomAlertComponent
  ) {}

  ngOnInit(): void {
    if (sessionStorage.getItem('tried-to-save') == 'true') {
      if (sessionStorage.getItem('came-back?') == 'false') {
        this.inputs = [];
        let i = JSON.parse(sessionStorage.getItem('exercise') || '{}');
        i.forEach((element: any) => {
          this.inputs.push({
            question: element['question'],
            questionOrder: element['questionOrder'],
          });
        });
        this.alertcom.updateAlert(
          'safe',
          'We retrived back your exercise',
          5000
        );
        this.CheckOverFlow();
        sessionStorage.removeItem('exercise');
        sessionStorage.removeItem('tried-to-save');
        sessionStorage.removeItem('came-back?');
      } else {
        sessionStorage.removeItem('exercise');
        sessionStorage.removeItem('tried-to-save');
        sessionStorage.removeItem('came-back?');
      }
    }
  }

  AddNewForm() {
    this.inputs.push({ question: '', questionOrder: '' });
    this.CheckOverFlow();
  }
  DeleteLastForm() {
    if (this.inputs.length > 2) {
      this.inputs.pop();
    }
    this.CheckOverFlow();
  }
  FinishedClick() {
    this.myList = [];
    sessionStorage.removeItem('exercise');
    let emptyinputs = false;
    this.inputs.forEach((element) => {
      if (element['question'] == '' || element['questionOrder'] == '') {
        this.alertcom.updateAlert('danger', 'You have empty inputs', 5000);
        emptyinputs = true;
      } else {
        const item: MyDictItem = {
          question: element.question,
          questionOrder: element.questionOrder,
          result: '',
        };
        this.myList.push(item);
      }
    });
    if (emptyinputs) {
    } else {
      sessionStorage.setItem('exercise', JSON.stringify(this.myList));
      this.router.navigate(['/exercise']);
    }
  }

  async FinishedClickSave() {
    this.myList = [];
    sessionStorage.removeItem('exercise');
    let emptyinputs = false;
    this.inputs.forEach((element) => {
      if (element['question'] == '' || element['questionOrder'] == '') {
        this.alertcom.updateAlert('danger', 'You have empty inputs', 5000);
        emptyinputs = true;
      }
    });

    if (!emptyinputs) {
      let loggedin: boolean = false;
      loggedin = this.servercomm.getLoggedInStatusasValue()[0];
      this.inputs.forEach((element) => {
        const item: MyDictItem = {
          question: element.question,
          questionOrder: element.questionOrder,
          result: '',
        };
        this.myList.push(item);
      });

      if (loggedin) {
        const exercise_name_input = this.exercise_name_input.nativeElement;
        if (this.exercise_name != '' && !this.SentARequest) {
          this.SentARequest = true;
          this.alertcom.updateAlert(
            'safe',
            'Saving exercise please wait...',
            100000
          );
          try {
            let state = 'False';
            if (this.public) {
              state = 'True';
            }
            let response = await this.servercomm.saveExercise(
              state,
              this.exercise_name.replaceAll(' ', '_'),
              this.inputs
            );
            response = response['message'];
            this.SentARequest = false;
            this.alertcom.Closealert();
            if (
              response ==
              'The name of this exercise is already used, choose another one!'
            ) {
              this.alertcom.updateAlert('danger', response, 5000);
              exercise_name_input.style.outlineColor = 'red';
            } else if (response == 'Exercise saved successfully') {
              this.alertcom.updateAlert('safe', response + ', enjoy!', 5000);
              sessionStorage.setItem('exercise', JSON.stringify(this.myList));
              sessionStorage.removeItem('exercises');
              this.router.navigate(['/exercise']);
            } else if (
              response ==
              'Your session has ended please login in again and your data will be saved!'
            ) {
              this.alertcom.updateAlert('danger', response, 5000);
              sessionStorage.setItem('exercise', JSON.stringify(this.myList));
              sessionStorage.setItem('tried-to-save', 'true');
              sessionStorage.setItem('came-back?', 'false');
              this.servercomm.checkLoggedInStatus();
              this.router.navigate(['/login']);
            }
          } catch (error) {
            this.SentARequest = false;
            this.alertcom.updateAlert('danger', 'Something went wrong!', 5000);
          }
        } else {
          exercise_name_input.style.outlineColor = 'red';
          this.alertcom.updateAlert(
            'danger',
            'Please fill the exercise name!',
            5000
          );
        }
      } else {
        this.alertcom.updateAlert(
          'danger',
          'You are not logged in or your session ended, go log in and this will be saved',
          5000
        );
        sessionStorage.setItem('exercise', JSON.stringify(this.myList));
        sessionStorage.setItem('tried-to-save', 'true');
        sessionStorage.setItem('came-back?', 'false');
      }
    }
  }

  CheckOverFlow() {
    const element = this.addQuestionFormDiv.nativeElement;
    if (this.inputs.length >= 4) {
      element.style.overflowY = 'scroll';
    } else {
      element.style.overflowY = 'hidden';
    }
  }
}
