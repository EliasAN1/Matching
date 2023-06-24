import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  private subscription!: Subscription;
  constructor(
    private router: Router,
    private servercomm: ServercommService,
    private alertcom: CustomAlertComponent,
    private routingmod: AppRoutingModule
  ) {}
  loggedin: boolean = false;

  ngOnInit(): void {
    this.subscription = this.servercomm
      .getLoggedInStatusasObservable()
      .subscribe((value) => {
        this.loggedin = value[0];
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  navigate() {
    this.router.navigate(['/user']);
  }
}
