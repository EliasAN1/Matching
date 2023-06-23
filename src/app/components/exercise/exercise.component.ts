import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';

interface MyDictItem {
  question: string;
  questionOrder: string;
  result: string;
}

@Component({
  selector: 'app-exercise',
  templateUrl: './exercise.component.html',
  styleUrls: ['./exercise.component.css'],
})
export class ExerciseComponent {
  Lines: MyDictItem[] = [];
  results: string[] = [];

  @ViewChildren('question') questionElements!: QueryList<ElementRef>;
  @ViewChildren('answer') answerElements!: QueryList<ElementRef>;

  constructor(private router: Router, private alertcom: CustomAlertComponent) {}

  ngOnInit() {
    this.Lines = JSON.parse(sessionStorage.getItem('exercise') || '{}');
    if (this.Lines.length == undefined) {
      this.router.navigate(['/']);
      this.alertcom.updateAlert(
        'danger',
        'No exercise was found, sorry for inconvenience!',
        5000
      );
    } else {
      this.Lines.forEach((element: MyDictItem) => {
        if (this.options.includes(element.questionOrder)) {
        } else {
          this.options.push(element.questionOrder);
        }
      });
      this.Lines = this.shuffle();
    }
  }

  shuffle() {
    let shuffledObj: any[] = [];
    let already_shuffled: number[] = [];
    let obj_length = this.Lines.length;

    while (obj_length != already_shuffled.length) {
      let first_num: number = Math.floor(Math.random() * obj_length);
      // Check for numbers already shuffled
      while (already_shuffled.includes(first_num)) {
        first_num = Math.floor(Math.random() * obj_length);
      }
      already_shuffled.push(first_num);
      shuffledObj.push(this.Lines[first_num]);
    }

    return shuffledObj;
  }

  options: string[] = [];
  shuffleAgain() {
    this.Lines = this.shuffle();
    this.Lines.forEach((element) => {
      element.result = '';
    });
    this.answerElements.forEach((element) => {
      element.nativeElement.value = '';
    });
  }
  checkAnswers() {
    let index = 0;
    this.answerElements.forEach((element) => {
      let valueSelected = element.nativeElement.value;
      let correctValue = this.Lines[index].questionOrder;
      if (valueSelected == correctValue) {
        this.Lines[index].result = 'Correct answer';
      } else {
        this.Lines[
          index
        ].result = `Wrong answer, the correct answer is ${correctValue}`;
      }
      index++;
    });
  }
}
