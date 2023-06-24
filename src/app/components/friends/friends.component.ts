import { Component } from '@angular/core';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { filter } from 'rxjs';

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

  constructor(
    private servercomm: ServercommService,
    private alertcomm: CustomAlertComponent
  ) {}

  ngOnInit() {
    this.servercomm
      .getUsers()
      .then((response) => {
        response = response['message'];

        if (response == 'Your session has ended please login again!') {
          this.alertcomm.updateAlert('danger', response, 5000);
        } else {
          this.users = response[0].filter(
            (user: any) =>
              user[0] != this.servercomm.getLoggedInStatusasValue()[1]
          );
          this.users.forEach((user, i) => {
            if (user[0] == response[1][i]) {
              this.users.at(i)?.push('friend', `${i}`);
            } else if (user[0] == response[2][i]) {
              this.users.at(i)?.push('requested', `${i}`);
            } else if (user[0] == response[3][i]) {
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

  visitProfile() {}

  chat() {}

  FriendMangment(user: string[], state: string = 'accept') {
    this.servercomm.FriendManagment(user, state).then((response) => {
      response = response['message'];
      if (response == 'Your session has ended please login again!') {
        this.alertcomm.updateAlert('danger', response, 5000);
      } else if (
        response == 'You have sent a friend request to this user successfully!'
      ) {
        this.alertcomm.updateAlert('safe', response, 5000);
        this.users[Number(user[3])][2] = 'requested';
      } else if (response == 'You have removed this friend successfully!') {
        this.alertcomm.updateAlert('safe', response, 5000);
        this.users[Number(user[3])][2] = 'not-related';
      } else if (response == 'You have rejected this user successfully!') {
        this.alertcomm.updateAlert('safe', response, 5000);
        this.users[Number(user[3])][2] = 'not-related';
        this.pendingAcceptance = this.pendingAcceptance.filter(
          (element) => element[0] != user[0]
        );
        this.numberOfPendingAcceptance = String(this.pendingAcceptance.length);
        if (this.pendingAcceptance.length == 0) {
          this.boolOfPendingAcceptance = false;
        }
        if (this.filtered) {
          this.filtered = !this.filtered;
          this.users = this.constantListOfUsers;
        }
      } else if (
        response == 'You have cancelled the request to this user successfully!'
      ) {
        this.alertcomm.updateAlert('safe', response, 5000);
        this.users[Number(user[3])][2] = 'not-related';
      } else if (response == 'You have accepted this friend successfully!') {
        this.alertcomm.updateAlert('safe', response, 5000);
        this.users[Number(user[3])][2] = 'friend';
      }
    });
  }
  block() {}
}
