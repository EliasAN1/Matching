import { Component } from '@angular/core';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { filter } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css'],
})
export class FriendsComponent {
  searchInput: string = '';
  FoundUsers: boolean = true;
  constantListOfUsers: string[][] = [];
  users: string[][] = [];
  pendingAcceptance: string[] = [];
  numberOfPendingAcceptance: string = '';
  boolOfPendingAcceptance: boolean = false;
  filtered: boolean = false;
  requested: boolean = false;
  processingUser: string = '';

  constructor(
    private servercomm: ServercommService,
    private alertcomm: CustomAlertComponent,
    private router: Router
  ) {}

  ngOnInit() {
    this.getUsers();
  }

  navigate(url: string) {
    console.log(url);

    this.router.navigate([url]);
  }

  getUsers() {
    this.servercomm
      .getUsers()
      .then((response) => {
        response = response['message'];
        console.log(response);

        if (response == 'Your session has ended please login again!') {
          this.alertcomm.updateAlert('danger', response, 5000);
        } else {
          this.users = response[0].filter(
            (user: any) =>
              user[0] != this.servercomm.getLoggedInStatusasValue()[1]
          );

          this.users.forEach((user, i) => {
            console.log(response);

            if (response[1].includes(user[0])) {
              this.users.at(i)?.push('friend', `${i}`);
            } else if (response[2].includes(user[0])) {
              this.users.at(i)?.push('requested', `${i}`);
            } else if (response[3].includes(user[0])) {
              this.users.at(i)?.push('pending-acceptance', `${i}`);
            } else {
              this.users.at(i)?.push('not-related', `${i}`);
            }
          });

          this.pendingAcceptance = response[3];
          if (this.pendingAcceptance.length > 0) {
            this.boolOfPendingAcceptance = true;
            this.numberOfPendingAcceptance = String(
              this.pendingAcceptance.length
            );
          }

          this.constantListOfUsers = this.users;
        }
      })
      .catch((err) => {
        this.alertcomm.updateAlert('danger', 'Unknown error occured', 5000);
        this.FoundUsers = false;
      });
  }

  search() {
    setTimeout(() => {
      this.users = this.constantListOfUsers;
      if (this.searchInput.length == 0) {
        this.FoundUsers = true;
      } else {
        this.users = this.users.filter((user) =>
          user[0].toLowerCase().includes(this.searchInput.toLowerCase())
        );
        this.FoundUsers = false;
        if (this.users.length == 0) {
          this.FoundUsers = false;
        } else {
          this.FoundUsers = true;
        }
      }
    }, 1);
  }
  showPending() {
    if (!this.filtered) {
      this.users = this.users.filter(
        (user, i) => user[0] == this.pendingAcceptance[i]
      );
      this.filtered = !this.filtered;
    } else {
      this.users = this.constantListOfUsers;
      this.filtered = !this.filtered;
    }
  }

  FriendMangment(user: string[], state: string = 'accept') {
    const innerFilter = () => {
      this.pendingAcceptance = this.pendingAcceptance.filter(
        (element) => element != user[0]
      );

      this.numberOfPendingAcceptance = String(this.pendingAcceptance.length);
      if (this.pendingAcceptance.length == 0) {
        this.boolOfPendingAcceptance = false;
      }

      if (this.filtered) {
        this.filtered = !this.filtered;
        this.users = this.constantListOfUsers;
      }
    };
    this.requested = true;
    this.processingUser = user[0];

    this.servercomm
      .FriendManagment(user, state)
      .then((response) => {
        response = response['message'];
        console.log(response);
        this.requested = false;
        this.processingUser = '';

        if (response == 'Your session has ended please login again!') {
          this.alertcomm.updateAlert('danger', response, 5000);
          this.servercomm.checkLoggedInStatus();
        } else if (
          response ==
          'You have sent a friend request to this user successfully!'
        ) {
          this.alertcomm.updateAlert('safe', response, 5000);
          this.users[Number(user[3])][2] = 'requested';
        } else if (response == 'You have removed this friend successfully!') {
          this.alertcomm.updateAlert('safe', response, 5000);
          this.users[Number(user[3])][2] = 'not-related';
        } else if (response == 'You have blocked this user successfully!') {
          this.alertcomm.updateAlert('safe', response, 5000);
          this.users = this.users.filter((friend) => friend[0] != user[0]);
        } else if (response == 'You have rejected this user successfully!') {
          this.alertcomm.updateAlert('safe', response, 5000);
          this.users[Number(user[3])][2] = 'not-related';
          innerFilter();
        } else if (
          response ==
          'You have cancelled the request to this user successfully!'
        ) {
          this.alertcomm.updateAlert('safe', response, 5000);
          this.users[Number(user[3])][2] = 'not-related';
        } else if (response == 'You have accepted this friend successfully!') {
          this.alertcomm.updateAlert('safe', response, 5000);
          this.users[Number(user[3])][2] = 'friend';
          innerFilter();
        } else if (response == 'Synchronization error') {
          this.alertcomm.updateAlert(
            'danger',
            response + ' We have refreshed the page for you.',
            5000
          );
          this.getUsers();
        } else if (response == 'Looks like this request has been canceled') {
          this.alertcomm.updateAlert(
            'danger',
            `Looks like ${user[0]} has cancelled his friend request before you accepted it`,
            5000
          );
          this.users[Number(user[3])][2] = 'not-related';
        }
      })
      .catch((err) => {
        this.alertcomm.updateAlert('danger', 'Unknown error occured', 5000);
        this.requested = false;
      });
  }
  block() {}
}
