import { Component, HostListener } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ServercommService } from './services/servercomm.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Matching';
  currentRoute_: string = '';
  displayalert: string = '';
  Type = '';
  message = '';
  isPhone = false;
  private routersubscription!: Subscription;

  constructor(private router: Router, private servercomm: ServercommService) {}

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any): void {
    this.isPhone = window.innerWidth < 768;
  }
  ngOnInit() {
    this.isPhone = window.innerWidth < 768;
    this.routersubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute_ = event.url;
      }
    });
    this.servercomm.checkLoggedInStatus();
  }

  ngOnDestroy(): void {
    if (this.routersubscription) {
      this.routersubscription.unsubscribe();
    }
  }
  alertswtich(status: string, type: string = '', message: string = '') {
    this.Type = type;
    this.message = message;
    this.displayalert = status;
  }
}
