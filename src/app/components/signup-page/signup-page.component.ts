import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { ServercommService } from 'src/app/services/servercomm.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css'],
})
export class SignupPageComponent {
  @ViewChild('emailin') emailinput!: ElementRef;
  @ViewChild('userin') usernameinput!: ElementRef;
  @ViewChild('passwordin') passwordinput!: ElementRef;
  @ViewChild('conpasswordin') conPasswordinput!: ElementRef;

  constructor(
    private alertcomp: CustomAlertComponent,
    private servercomm: ServercommService,
    private router: Router
  ) {}

  email: string = '';
  userName: string = '';
  password: string = '';
  conPassword: string = '';
  RegisterBtnText: string = 'Register';
  SentARequest: boolean = false;

  private loginStatusSubscription!: Subscription;
  private progressValueSubscription!: Subscription;

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
          this.alertcomp.updateAlert(
            'danger',
            'You are logged in and cannot access this page!',
            5000
          );
        }
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.loginStatusSubscription) {
      this.loginStatusSubscription.unsubscribe();
    }
    if (this.progressValueSubscription) {
      this.progressValueSubscription.unsubscribe();
    }
  }

  navigate() {
    this.router.navigate(['/login']);
  }

  @HostListener('document:keyup.enter')
  onEnterKey() {
    this.Register();
  }

  Register() {
    let goodemail: Boolean = true;
    let gooduser: Boolean = true;
    let goodpassowrds: Boolean = true;

    const emailinput = this.emailinput.nativeElement;
    const usernameinput = this.usernameinput.nativeElement;
    const passwordinput = this.passwordinput.nativeElement;
    const conPasswordinput = this.conPasswordinput.nativeElement;

    // Checking email
    if (!this.email.includes('@') || !this.email.slice(-4).includes('.')) {
      emailinput.style.outlineColor = 'red';
      goodemail = false;
    } else {
      emailinput.style.outlineColor = 'black';
      goodemail = true;
    }
    // Checking passwords
    if (
      this.password !== this.conPassword ||
      this.password == '' ||
      this.password.includes(' ')
    ) {
      passwordinput.style.outlineColor = 'red';
      conPasswordinput.style.outlineColor = 'red';
      goodpassowrds = false;
    } else {
      passwordinput.style.outlineColor = 'black';
      conPasswordinput.style.outlineColor = 'black';
      goodpassowrds = true;
    }
    // Checking username
    if (this.userName == '' || this.userName.includes(' ')) {
      usernameinput.style.outlineColor = 'red';
      gooduser = false;
      if (goodemail && goodpassowrds && this.userName.includes(' ')) {
        this.alertcomp.updateAlert(
          'danger',
          'Username contain spaces or invalid characters',
          5000
        );
      }
    } else {
      usernameinput.style.outlineColor = 'black';
      gooduser = true;
    }

    if (goodemail && gooduser && goodpassowrds && !this.SentARequest) {
      this.RegisterBtnText = 'Registering...';
      this.SentARequest = true;
      this.servercomm
        .registerUser(this.email, this.userName, this.password)
        .then((response) => {
          response = response['message'];
          this.RegisterBtnText = 'Register';
          this.SentARequest = false;
          if (response == 'Email and Username already exists') {
            usernameinput.style.outlineColor = 'red';
            emailinput.style.outlineColor = 'red';
            this.alertcomp.updateAlert('danger', response, 5000);
          } else if (response == 'Username already exists') {
            usernameinput.style.outlineColor = 'red';
            this.alertcomp.updateAlert('danger', response, 5000);
          } else if (response == 'Email already exists') {
            emailinput.style.outlineColor = 'red';
            this.alertcomp.updateAlert('danger', response, 5000);
          } else if (response == 'You have been registered successfully') {
            this.alertcomp.updateAlert(
              'safe',
              response + ' and logged in!',
              5000
            );
            this.servercomm.checkLoggedInStatus();
            this.router.navigate(['/']);
          }
        })
        .catch((error) => {
          this.RegisterBtnText = 'Register';
          this.SentARequest = false;
          this.alertcomp.updateAlert('danger', 'Unknown error occured!', 5000);
        });
    } else {
    }
  }
}
