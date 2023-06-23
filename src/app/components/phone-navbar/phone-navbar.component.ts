import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';

@Component({
  selector: 'app-phone-navbar',
  templateUrl: './phone-navbar.component.html',
  styleUrls: ['./phone-navbar.component.css'],
})
export class PhoneNavbarComponent {
  @Input() currentRoute!: string;
  @ViewChild('hamicon') hamicon!: ElementRef;
  @ViewChild('pages') pages!: ElementRef;
  loggedin: boolean = false;
  username: string = '';
  private subscription!: Subscription;

  constructor(
    private servercomm: ServercommService,
    private router: Router,
    private alertcom: CustomAlertComponent
  ) {}

  ngOnInit() {
    this.subscription = this.servercomm
      .getLoggedInStatusasObservable()
      .subscribe((value) => {
        this.loggedin = value[0];
        this.username = value[1];
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  openNav() {
    const hamicon = this.hamicon.nativeElement;
    const pages = this.pages.nativeElement;
    hamicon.classList.toggle('change');
    pages.classList.toggle('open');
  }
  logout() {
    this.servercomm.logout();
    this.alertcom.updateAlert('safe', 'You logged out successfully', 5000);
    this.navigate('/');
  }

  navigate(link: string) {
    this.router.navigate([link]);
  }
}
