import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  @Input() currentRoute!: string;

  @ViewChild('profileWrapper', { static: false }) profileWrapper!: ElementRef;
  @ViewChild('pointerContainer', { static: false })
  pointerContainer!: ElementRef;
  active: string = 'active';
  loggedin: boolean = false;
  username: string = '';
  totalNoty: string = '';
  friendsNoty: string = '';
  msgNoty: string = '';

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
        this.friendsNoty = value[2];
        this.msgNoty = value[3];
        this.totalNoty = String(
          Number(this.friendsNoty) + Number(this.msgNoty)
        );
        this.totalNoty == '0' ? (this.totalNoty = '') : '';
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  displayList() {
    if (this.profileWrapper && this.profileWrapper.nativeElement) {
      const profileWrapper = this.profileWrapper.nativeElement;
      const pointerContainer = this.pointerContainer.nativeElement;

      profileWrapper.classList.toggle('show');
      pointerContainer.classList.toggle('opened');
    } else {
    }
  }

  logout() {
    this.servercomm.logout();
    this.alertcom.updateAlert('safe', 'You logged out successfully', 5000);
    this.navigate('/');
  }
  navigate(link: string) {
    if (this.profileWrapper) {
      this.profileWrapper.nativeElement.classList.contains('show')
        ? this.displayList()
        : '';
    }

    this.router.navigate([link]);
  }
}
