import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';

interface MyFullExercisesItem {
  exerciseName: string;
  questions: { question: string; questionOrder: string };
}
interface MyExerciseItem {
  question: string;
  questionOrder: string;
  result: string;
}

@Component({
  selector: 'app-visit-user-page',
  templateUrl: './visit-user-page.component.html',
  styleUrls: ['./visit-user-page.component.css'],
})
export class VisitUserPageComponent {
  imageUrl: string = 'https://i.imgur.com/tdi3NGa.png';
  user: string = '';
  Registered: string = '';
  Lastlogin: string = '';
  friends: any[][] = [];
  exercises: MyFullExercisesItem[] = [];
  myList: MyExerciseItem[] = [];
  loggedin: boolean = false;
  loggedUser: string = '';
  stateWithTheLoggedUser: string = '';
  requested: boolean = false;
  processingUser: string = '';
  constructor(
    private servercomm: ServercommService,
    private router: Router,
    private alertcom: CustomAlertComponent
  ) {}

  ngOnInit() {
    this.servercomm
      .getLoggedInStatusasObservable()
      .subscribe(([bool, username]) => {
        this.loggedUser = username;
        this.loggedin = bool;
      });

    this.initation('');
  }
  ngOnDestroy() {}

  initation(user: string) {
    if (!user) {
      this.user = this.router.url.slice(6);
    } else {
      this.user = user;
    }
    if (this.user == this.loggedUser) {
      this.navigate('user');
    }

    this.servercomm.getVisitProfileData(this.user).then((response) => {
      response = response['message'];

      if (response == 'No such user') {
        this.alertcom.updateAlert('danger', response, 5000);
        this.router.navigate(['/']);
      } else if (
        response ==
        'You have blocked this user, you can go to your account and unblock him!'
      ) {
        this.alertcom.updateAlert('safe', response, Infinity);
      } else if (response == 'This user have blocked you!') {
        this.alertcom.updateAlert('danger', response, Infinity);
      } else {
        let temporary_user_list = response[0];
        this.Registered = temporary_user_list[1];
        this.Lastlogin = temporary_user_list[2];
        this.imageUrl = temporary_user_list[3];
        this.friends = response[1];
        this.exercises = [];
        response[2].forEach((exercise: any[]) => {
          this.exercises.push({
            exerciseName: exercise[0][0].replaceAll('_', ' '),
            questions: exercise[1],
          });
        });

        // this.exercises.forEach((exercise: string[]) => {
        //   exercise[0] = exercise[0].replaceAll('_', ' ');
        // });

        let TheUserIsFound = false;

        this.friends.forEach((friend, i) => {
          if (friend[0] == this.loggedUser && friend[2] == 'friend') {
            TheUserIsFound = true;
            this.stateWithTheLoggedUser = friend[2];
          } else if (friend[0] == this.loggedUser) {
            TheUserIsFound = true;
            this.stateWithTheLoggedUser = friend[2];
            this.friends = this.friends.filter((user) => user != friend);
          }
          TheUserIsFound && this.stateWithTheLoggedUser != 'friend'
            ? friend.push(i - 1)
            : friend.push(i);
        });
        if (!TheUserIsFound) {
          this.stateWithTheLoggedUser = 'not-relatable';
        }
      }
    });
  }

  navigate(url: string) {
    this.router.navigate([url]);
    url.startsWith('/user/') ? this.initation(url.slice(6)) : '';
  }

  FriendMangment(
    user: any[],
    state: string = 'accept',
    visitedUser: boolean = false
  ) {
    this.requested = true;
    this.processingUser = user[0];
    visitedUser
      ? (user = [this.user, this.imageUrl, this.stateWithTheLoggedUser])
      : '';

    user[2] == 'pending_request' ? (user[2] = 'requested') : '';
    user[2] == 'pending_acceptance' ? (user[2] = 'pending-acceptance') : '';
    user[2] == 'not-relatable' ? (user[2] = 'not-related') : '';

    this.servercomm
      .FriendManagment(user, state)
      .then((response) => {
        response = response['message'];
        this.requested = false;

        this.processingUser = '';

        if (response == 'Your session has ended please login again!') {
          this.alertcom.updateAlert('danger', response, 5000);
          this.servercomm.checkLoggedInStatus();
        } else if (
          response ==
          'You have sent a friend request to this user successfully!'
        ) {
          this.alertcom.updateAlert('safe', response, 5000);

          !visitedUser
            ? (this.friends[user[3]][2] = 'pending_request')
            : (this.stateWithTheLoggedUser = 'pending_request');
        } else if (response == 'You have blocked this user successfully!') {
          this.alertcom.updateAlert('safe', response, 5000);
          if (visitedUser) {
            this.navigate('/user/' + user);
          } else {
            this.friends = this.friends.filter(
              (friend) => friend[0] != user[0]
            );
          }
        } else if (response == 'You have removed this friend successfully!') {
          this.alertcom.updateAlert('safe', response, 5000);
          !visitedUser
            ? (this.friends[user[3]][2] = 'not-relatable')
            : (this.stateWithTheLoggedUser = 'not-relatable');
        } else if (response == 'You have rejected this user successfully!') {
          this.alertcom.updateAlert('safe', response, 5000);
          !visitedUser
            ? (this.friends[user[3]][2] = 'not-relatable')
            : (this.stateWithTheLoggedUser = 'not-relatable');
        } else if (
          response ==
          'You have cancelled the request to this user successfully!'
        ) {
          this.alertcom.updateAlert('safe', response, 5000);

          !visitedUser
            ? (this.friends[user[3]][2] = 'not-relatable')
            : (this.stateWithTheLoggedUser = 'not-relatable');
        } else if (response == 'You have accepted this friend successfully!') {
          this.alertcom.updateAlert('safe', response, 5000);
          !visitedUser
            ? (this.friends[user[3]][2] = 'friend')
            : (this.stateWithTheLoggedUser = 'friend');
        } else if (response == 'Synchronization error') {
          this.alertcom.updateAlert(
            'danger',
            response + ', we have refreshed the page for you.',
            5000
          );
          this.initation('');
        } else if (response == 'Looks like this request has been canceled') {
          this.alertcom.updateAlert(
            'danger',
            `Looks like ${user[0]} has cancelled his friend request before you accepted it`,
            5000
          );
          !visitedUser
            ? (this.friends[user[3]][2] = 'not-relatable')
            : (this.stateWithTheLoggedUser = 'not-relatable');
        }
      })
      .catch((err) => {
        this.alertcom.updateAlert('danger', 'Unknown error occured', 5000);
        this.requested = false;
      });
  }

  loadPublicExercise(exerciseName: string) {
    sessionStorage.removeItem('exercise');
    this.exercises.forEach((element: any) => {
      if (element.exerciseName.replaceAll('_', ' ') == exerciseName) {
        const exercise_list: string[] = element.questions;
        exercise_list.forEach((element) => {
          const item: MyExerciseItem = {
            question: element[0],
            questionOrder: element[1],
            result: '',
          };
          this.myList.push(item);
        });
        sessionStorage.setItem('exercise', JSON.stringify(this.myList));
        return this.router.navigate(['/exercise']);
      }
      return;
    });
  }
}
