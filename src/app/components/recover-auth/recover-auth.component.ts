import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';

@Component({
  selector: 'app-recover-auth',
  templateUrl: './recover-auth.component.html',
  styleUrls: ['./recover-auth.component.css'],
})
export class RecoverAuthComponent {
  code: string = '';
  user: string = '';
  newpassword: string = '';
  conpass: string = '';
  dataModKind: string = '';
  SumbitBtnText: string = 'Sumbit';
  SumbitPassChangeBtnText: string = 'Sumbit';
  SentARequest: boolean = false;
  phase: string = 'checkcode';

  @ViewChild('codein') codeinput!: ElementRef;
  @ViewChild('passwordin') passwordinput!: ElementRef;
  @ViewChild('conpasswordin') conPasswordinput!: ElementRef;

  constructor(
    private servercomm: ServercommService,
    private router: Router,
    private alertcom: CustomAlertComponent
  ) {}

  ngOnInit(): void {
    const route = this.router.url.slice(1);

    if (!route.startsWith('user/')) {
      if (route.endsWith('notme')) {
        this.servercomm
          .notme(route.replace('notme', ''))
          .then((response) => {
            response = response['message'];

            if (response == 'The recovery canceled successfully!') {
              this.alertcom.updateAlert('safe', response, 5000);
              this.router.navigate(['/']);
            } else {
              this.alertcom.updateAlert(
                'danger',
                'Something went wrong, contact us immediately!',
                5000
              );
              this.router.navigate(['/']);
            }
          })
          .catch((error) => {
            this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
          });
      } else {
        this.servercomm
          .checkPath(route)
          .then((respone) => {
            respone = respone['message'];
            if (respone == 'No such recovery') {
              this.router.navigate(['/']);
              this.alertcom.updateAlert(
                'danger',
                'The route you are trying to access does not exists!',
                5000
              );
            }
          })
          .catch((error) => {
            this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
          });
      }
    }
  }

  @HostListener('document:keyup.enter')
  onEnterKey() {
    this.phase == 'checkcode' ? this.checkCode() : this.sendchanges();
  }

  checkCode() {
    if (!this.SentARequest) {
      const codeinput = this.codeinput.nativeElement;
      this.SumbitBtnText = 'Validating...';
      this.SentARequest = true;
      this.servercomm
        .codeCheck(this.code, this.router.url.slice(1))
        .then((response) => {
          this.SumbitBtnText = 'Sumbit';
          this.SentARequest = false;

          response = response['message'];
          if (response == 'User entered correct code') {
            this.phase = 'modifyingdata';
            this.alertcom.updateAlert(
              'safe',
              'Now you can modify your data',
              5000
            );
            this.dataModKind = 'password';
          } else if (response == 'User entered wrong code') {
            codeinput.style.outlineColor = 'red';
            this.alertcom.updateAlert('danger', 'Code is incorrect!', 5000);
          } else if (response == 'Something went wrong') {
            this.alertcom.updateAlert('danger', response, 5000);
          } else {
            this.dataModKind = 'user';
            this.user = response;
          }
        })
        .catch((error) => {
          this.SumbitBtnText = 'Sumbit';
          this.SentARequest = false;
          this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
        });
    }
  }

  sendchanges() {
    const passwordinput = this.passwordinput.nativeElement;
    const conPasswordinput = this.conPasswordinput.nativeElement;
    let goodpassowrds = false;
    if (
      this.newpassword !== this.conpass ||
      this.newpassword == '' ||
      this.newpassword.includes(' ')
    ) {
      passwordinput.style.outlineColor = 'red';
      conPasswordinput.style.outlineColor = 'red';
      goodpassowrds = false;
    } else {
      passwordinput.style.outlineColor = 'black';
      conPasswordinput.style.outlineColor = 'black';
      goodpassowrds = true;
    }
    if (goodpassowrds && !this.SentARequest) {
      this.SumbitPassChangeBtnText = 'Updating...';
      this.SentARequest = true;
      this.servercomm.updatepass(this.newpassword).then((response) => {
        response = response['message'];
        this.SumbitPassChangeBtnText = 'Sumbit';
        if (response == 'Password is updated!') {
          this.alertcom.updateAlert('safe', response, 5000);
          this.router.navigate(['/']);
        } else {
          this.alertcom.updateAlert('danger', response, 5000);
          this.router.navigate(['/']);
        }
      });
    }
  }
}
