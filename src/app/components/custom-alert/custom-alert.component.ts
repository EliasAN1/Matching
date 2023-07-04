import { Component, Injectable, Input } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-custom-alert',
  templateUrl: './custom-alert.component.html',
  styleUrls: ['./custom-alert.component.css'],
})
export class CustomAlertComponent {
  @Input() alertType!: string;
  @Input() message!: string;
  timeoutID!: any;
  constructor(private appcommp: AppComponent) {}

  timeOut(period_: number) {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout(() => {
      this.appcommp.alertswtich('');
    }, period_);
  }

  updateAlert(type_: string, message_: string, period_: number) {
    this.appcommp.alertswtich('display', type_, message_);
    period_ == Infinity ? '' : this.timeOut(period_);
  }
  Closealert() {
    this.appcommp.alertswtich('');
  }
}
