import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  @ViewChild('userin') usernameinput!: ElementRef;
  @ViewChild('passin') passwordinput!: ElementRef;

  username: string = '';
  password: string = '';
  remember: boolean = false;
  remembered: boolean = false;
  LoginBtnText: string = 'Login';
  SentARequest: boolean = false;
  private loginStatusSubscription!: Subscription;
  private progressValueSubscription!: Subscription;

  constructor(
    private servercomm: ServercommService,
    private router: Router,
    private alertcom: CustomAlertComponent
  ) {}

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
        if (!progressvalue) {
          this.router.navigate(['/']);
          this.alertcom.updateAlert(
            'danger',
            'You are logged in and cannot access this page!',
            5000
          );
        }
      }
    }, 500);

    const user = localStorage.getItem('username');
    if (user != null) {
      this.username = user;
      this.remembered = true;
    }
  }

  ngOnDestroy(): void {
    if (this.loginStatusSubscription) {
      this.loginStatusSubscription.unsubscribe();
    }
    if (this.progressValueSubscription) {
      this.progressValueSubscription.unsubscribe();
    }
  }
  @HostListener('document:keyup.enter')
  onEnterKey() {
    this.login();
  }

  navigate(link: string) {
    this.router.navigate([link]);
  }

  forgetme() {
    localStorage.removeItem('username');
    this.username = '';
    this.remembered = false;
  }

  login() {
    const usernameinput = this.usernameinput.nativeElement;
    const passwordinput = this.passwordinput.nativeElement;

    let gooduser = false;
    let goodpassowrd = false;

    if (this.username == '') {
      usernameinput.style.outlineColor = 'red';
      gooduser = false;
    } else {
      usernameinput.style.outlineColor = 'black';
      gooduser = true;
    }
    if (this.password == '') {
      passwordinput.style.outlineColor = 'red';
      goodpassowrd = false;
    } else {
      passwordinput.style.outlineColor = 'black';
      goodpassowrd = true;
    }
    if (gooduser && goodpassowrd && !this.SentARequest) {
      this.LoginBtnText = 'Validating...';
      this.SentARequest = true;

      this.servercomm
        .login(this.username, this.password)
        .then((response) => {
          response = response['message'];
          this.LoginBtnText = 'Login';
          this.SentARequest = false;

          if (response == 'You have been logged in successfully') {
            this.servercomm.checkLoggedInStatus();
            this.alertcom.updateAlert('safe', response, 5000);
            this.router.navigate(['/']);
            if (this.remember) {
              localStorage.setItem('username', this.username);
            }
          } else if (response == 'You entered a wrong password') {
            passwordinput.style.outlineColor = 'red';
            this.alertcom.updateAlert('danger', response, 5000);
          } else if (response == 'This username is not registered') {
            usernameinput.style.outlineColor = 'red';
            this.alertcom.updateAlert('danger', response, 5000);
          }
        })
        .catch((error) => {
          this.LoginBtnText = 'Login';
          this.SentARequest = false;
          this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
        });
    } else {
      if (!this.SentARequest) {
        this.alertcom.updateAlert(
          'danger',
          'Empty fields, please make sure you filled everything!',
          5000
        );
      }
    }
  }
}
