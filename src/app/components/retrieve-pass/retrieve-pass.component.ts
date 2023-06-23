import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { Router } from '@angular/router';
import { AppRoutingModule } from 'src/app/app-routing.module';

@Component({
  selector: 'app-retrieve-pass',
  templateUrl: './retrieve-pass.component.html',
  styleUrls: ['./retrieve-pass.component.css'],
})
export class RetrievePassComponent {
  @ViewChild('emailin') emailinput!: ElementRef;
  email: string = '';
  currentseleciton: string = 'username';
  SendEmailBtnText: string = 'Send Email';
  SentARequest: boolean = false;

  constructor(
    private servercomm: ServercommService,
    private alertcom: CustomAlertComponent,
    private router: Router,
    private routingmod: AppRoutingModule
  ) {}

  @HostListener('document:keyup.enter')
  onEnterKey() {
    this.sendEmail();
  }

  retrieveWhat(value: string) {
    this.currentseleciton = value;
  }
  sendEmail() {
    let goodemail = false;
    const emailinput = this.emailinput.nativeElement;
    // Checking email
    if (!this.email.includes('@') || !this.email.slice(-4).includes('.')) {
      emailinput.style.outlineColor = 'red';
      goodemail = false;
    } else {
      emailinput.style.outlineColor = 'black';
      goodemail = true;
    }
    if (goodemail && !this.SentARequest) {
      this.SentARequest = true;
      this.SendEmailBtnText = 'Sending email...';
      this.servercomm
        .retrive(this.currentseleciton, this.email, this.currentseleciton)
        .then((response) => {
          response = response['message'];
          this.SentARequest = false;
          this.SendEmailBtnText = 'Send Email';

          if (response == 'Email has been sent successfully!') {
            this.alertcom.updateAlert('safe', response, 5000);
            let link = this.email.split('@')[0];
            this.routingmod.tempRoute(link);
            this.router.navigate([`/${link}`]);
          } else if (response == 'Already tried') {
            this.alertcom.updateAlert(
              'danger',
              'An email has been already sent to you, please check your email!',
              5000
            );
          } else {
            this.alertcom.updateAlert('danger', 'Something went wrong!', 5000);
          }
        })
        .catch((error) => {
          this.SentARequest = false;
          this.SendEmailBtnText = 'Send Email';
          this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
        });
    }
  }
}
