import { Component, ElementRef, ViewChild } from '@angular/core';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { ServercommService } from 'src/app/services/servercomm.service';
import { Router } from '@angular/router';

interface MyDictItem {
  question: string;
  questionOrder: string;
  result: string;
}

@Component({
  selector: 'app-edit-exercise',
  templateUrl: './edit-exercise.component.html',
  styleUrls: ['./edit-exercise.component.css'],
})
export class EditExerciseComponent {
  @ViewChild('addQuestionFormDiv', { static: true })
  addQuestionFormDiv!: ElementRef;

  constructor(
    private alertcom: CustomAlertComponent,
    private servercomm: ServercommService,
    private router: Router
  ) {}

  myList: MyDictItem[] = [];
  exercisename = JSON.parse(sessionStorage.getItem('edit') || '{}')[1];
  inputs = [{ question: '', questionOrder: '' }];
  SentARequest: boolean = false;

  ngOnInit(): void {
    if (JSON.parse(sessionStorage.getItem('edit') || '{}')[0] == 'true') {
      this.inputs = [];
      let i = JSON.parse(sessionStorage.getItem('edit') || '{}')[2];
      i.forEach((element: any) => {
        this.inputs.push({
          question: element['question'],
          questionOrder: element['questionOrder'],
        });
      });
    } else {
      this.router.navigate(['/saved-exercises']);
      this.alertcom.updateAlert(
        'danger',
        'Something went wrong, please try again',
        5000
      );
    }
  }
  ngAfterViewInit(): void {
    this.CheckOverFlow();
  }

  finishAndSave() {
    let emptyinputs = false;
    let notchanged: boolean = true;
    let i: [{ question: string; questionOrder: string }] = JSON.parse(
      sessionStorage.getItem('edit') || '{}'
    )[2];

    this.inputs.forEach((element, index) => {
      if (element['question'] == '' || element['questionOrder'] == '') {
        emptyinputs = true;
      } else {
        const item: MyDictItem = {
          question: element.question,
          questionOrder: element.questionOrder,
          result: '',
        };
        this.myList.push(item);
      }
      if (this.inputs.length != i.length) {
        notchanged = false;
      } else if (
        element['question'] != i[index]['question'] ||
        element['questionOrder'] != i[index]['questionOrder']
      ) {
        notchanged = false;
      }
    });

    if (notchanged) {
      this.alertcom.updateAlert(
        'danger',
        'You have not changed anything yet!',
        5000
      );
      return;
    } else if (emptyinputs) {
      this.alertcom.updateAlert('danger', 'You have empty inputs', 5000);
      return;
    }

    // checking if the user has a session
    let loggedin: boolean = this.servercomm.getLoggedInStatusasValue()[0];

    // if he has:
    if (loggedin && !this.SentARequest) {
      this.SentARequest = true;
      this.alertcom.updateAlert(
        'safe',
        'Saving exercise please wait...',
        100000
      );
      this.servercomm
        .modifyExercise(this.exercisename.replaceAll(' ', '_'), this.inputs)
        .then((response) => {
          response = response['message'];
          this.alertcom.Closealert();
          if (response == 'Exercise modified successfully!') {
            this.alertcom.updateAlert('safe', response, 5000);
            sessionStorage.removeItem('exercises');
            this.router.navigate(['/saved-exercises']);
            sessionStorage.removeItem('edit');
          } else if (
            response == 'Your session has ended please login in again!'
          ) {
            this.alertcom.updateAlert('danger', response, 5000);
            this.servercomm.checkLoggedInStatus();
            this.router.navigate(['/']);
          } else if (response == 'Failed to modify the exercise') {
            this.alertcom.updateAlert('danger', response + ' Try again', 5000);
          }
          this.SentARequest = false;
        })
        .catch((error) => {
          this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
        });
    } else {
    }
  }
  finish(message: string = 'Canceled changes') {
    this.alertcom.updateAlert('safe', message, 5000);
    this.router.navigate(['/saved-exercises']);
    sessionStorage.removeItem('edit');
  }
  addInput() {
    this.inputs.push({ question: '', questionOrder: '' });
    this.CheckOverFlow();
  }
  deleteInput(input_: { question: string; questionOrder: string }) {
    if (this.inputs.length > 2) {
      this.inputs = this.inputs.filter((input) => input != input_);
      this.CheckOverFlow();
    } else {
      this.alertcom.updateAlert(
        'danger',
        'You cannot have less than two fields',
        5000
      );
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
