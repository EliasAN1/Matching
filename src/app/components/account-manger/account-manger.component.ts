import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';

@Component({
  selector: 'app-account-manger',
  templateUrl: './account-manger.component.html',
  styleUrls: ['./account-manger.component.css'],
})
export class AccountMangerComponent {
  @ViewChild('oldpasswordin') oldPasswordinput!: ElementRef;

  oldpass: string = '';
  sumbitBtnText: string = 'Sumbit';
  SentARequest: boolean = false;
  constructor(
    private servercomm: ServercommService,
    private alertcom: CustomAlertComponent
  ) {}

  @HostListener('document:keyup.enter')
  onEnterKey() {
    this.sendemail();
  }

  sendemail() {
    const oldPasswordinput = this.oldPasswordinput.nativeElement;

    if (this.oldpass == '' || this.oldpass.includes(' ')) {
      oldPasswordinput.style.outlineColor = 'red';
      return this.alertcom.updateAlert(
        'danger',
        'The input either empty or contain spaces',
        5000
      );
    } else {
      oldPasswordinput.style.outlineColor = 'black';
    }
    if (!this.SentARequest) {
      this.SentARequest = true;
      this.sumbitBtnText = 'Validating...';
      this.servercomm
        .resetPass(this.oldpass)
        .then((response) => {
          this.sumbitBtnText = 'Sumbit';
          this.SentARequest = false;
          response = response['message'];
          if (response == 'Not logged in') {
            this.alertcom.updateAlert(
              'danger',
              'Your session has ended please login again!',
              5000
            );
            this.servercomm.checkLoggedInStatus();
          } else if (response == 'You have entered a wrong password') {
            this.alertcom.updateAlert('danger', response, 5000);
            oldPasswordinput.style.outlineColor = 'red';
          } else if (response == 'Already tried') {
            this.alertcom.updateAlert(
              'danger',
              'An email is sent to you already, please check your email!',
              5000
            );
          } else if (response == 'Email has been sent successfully!') {
            this.alertcom.updateAlert('safe', response, 5000);
          } else {
            this.alertcom.updateAlert('danger', response, 5000);
          }
        })
        .catch((error) => {
          this.sumbitBtnText = 'Sumbit';
          this.SentARequest = false;
          this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
        });
    }
  }
}
