import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';

interface MyDictItem {
  email: string;
  username: string;
  registered: string;
  lastlogin: string;
  last_pass_update: string;
  last_recovery: string;
  last_recovery_request: string;
  admin: string;
  exercises: string[];
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent {
  constUsersData: MyDictItem[] = [];
  usersData: MyDictItem[] = [];
  searchInput: string = '';
  FoundUser: boolean = true;
  Editing: string = '';
  EditingWhat: string = '';
  UserData: any[] = [];
  state: string = '';
  newpass: string = '';
  newemail: string = '';
  newuser: string = '';
  adminChange: string = '';
  usernameCreation: string = '';
  emailCreation: string = '';
  passwordCreation: string = '';
  createBtn: string = 'Create account';
  status: string = '';
  addingexercise: boolean = false;
  exerciseToAdd: string[] = [];

  constructor(
    private servercomm: ServercommService,
    private router: Router,
    private alertcom: CustomAlertComponent
  ) {}

  async ngOnInit() {
    this.update();
    this.state = 'viewing';
  }

  update() {
    this.constUsersData = [];
    this.UserData = [];
    this.usersData = [];
    this.status = 'Loading...';
    this.servercomm
      .checkAdmin()
      .then((response) => {
        response = response['message'];
        this.status = 'Update';
        if (response == 'False') {
          this.kickout();
        } else {
          try {
            response.forEach((user: any) => {
              if (user[7] == 'true') {
                user[7] = '🟢';
              } else {
                user[7] = '🔴';
              }
              this.constUsersData.push({
                email: user[0],
                username: user[1],
                registered: user[2].slice(0, -3).replace('202', '2'),
                lastlogin: user[3].slice(0, -3).replace('202', '2'),
                last_pass_update: user[4].slice(0, -3).replace('202', '2'),
                last_recovery: user[5].slice(0, -3).replace('202', '2'),
                last_recovery_request: user[6]
                  .slice(0, -3)
                  .replace('2023', '23'),
                admin: user[7],
                exercises: user[8],
              });
            });
            this.usersData = this.constUsersData;
            if (this.Editing != '') {
              this.constUsersData.forEach((user) => {
                if (user.username == this.Editing) {
                  this.edit(user);
                  return;
                }
              });
            }
          } catch (error) {
            this.status = 'Error occured!';
          }
        }
      })
      .catch((error) => {
        this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
      });
  }

  search() {
    setTimeout(() => {
      this.usersData = this.constUsersData;
      if (this.searchInput.length == 0) {
        this.FoundUser = true;
      } else {
        this.usersData = this.usersData.filter((user) =>
          user.username.toLowerCase().includes(this.searchInput.toLowerCase())
        );
        this.FoundUser = false;
        if (this.usersData.length == 0) {
          this.FoundUser = false;
        } else {
          this.FoundUser = true;
        }
      }
    }, 1);
  }

  edit(user: MyDictItem) {
    this.state = 'editing';
    this.Editing = user.username;
    this.newuser = user.username;
    this.newemail = user.email;
    this.UserData.push({
      email: user.email,
      username: user.username,
      registered: user.registered,
      lastlogin: user.lastlogin,
      last_pass_update: user.last_pass_update,
      last_recovery: user.last_recovery,
      last_recovery_request: user.last_recovery_request,
      admin: user.admin,
      exercises: user.exercises,
    });
    if (user.admin == '🟢') {
      this.adminChange = 'Revoke admin premissions';
    } else {
      this.adminChange = 'Add admin premissions';
    }
  }

  editData(kind: string) {
    this.EditingWhat = kind;
  }

  goBack() {
    this.state = 'viewing';
    this.Editing = '';
    this.EditingWhat = '';
    this.UserData = [];
  }

  kickout() {
    this.servercomm.checkLoggedInStatus();
    this.alertcom.updateAlert(
      'danger',
      'You are not premitted to access this page',
      5000
    );
    this.router.navigate(['/']);
  }

  createUser() {
    this.createBtn = 'Creating account...';
    this.servercomm
      .registerUser(
        this.emailCreation,
        this.usernameCreation,
        this.passwordCreation,
        false
      )
      .then((response) => {
        response = response['message'];
        this.createBtn = 'Create account';
        if (response == 'Email and Username already exists') {
          this.alertcom.updateAlert('danger', response, 5000);
        } else if (response == 'Username already exists') {
          this.alertcom.updateAlert('danger', response, 5000);
        } else if (response == 'Email already exists') {
          this.alertcom.updateAlert('danger', response, 5000);
        } else if (response == 'You have been registered successfully') {
          this.alertcom.updateAlert(
            'safe',
            'The account has been created',
            5000
          );
          this.emailCreation = '';
          this.passwordCreation = '';
          this.usernameCreation = '';
          this.update();
        }
      })
      .catch((error) => {
        this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
      });
  }

  QuitAddingExercisesState() {
    this.state = 'viewing';
    this.addingexercise = false;
    this.exerciseToAdd = [];
    this.update();
  }
  AddingExercisesState(exercise: string[]) {
    this.state = 'viewing';
    this.addingexercise = true;
    this.exerciseToAdd = exercise;
  }

  AddExercise(user: string) {
    if (user == this.exerciseToAdd[1]) {
      return this.alertcom.updateAlert(
        'danger',
        'This user already have this exercise',
        5000
      );
    }
    this.servercomm
      .addExerciseToUser(this.exerciseToAdd[1], user, this.exerciseToAdd[0])
      .then((response) => {
        response = response['message'];
        console.log(response);

        if (response == 'False') {
          this.kickout();
        } else if (response == 'The exercise have been added successfully!') {
          this.alertcom.updateAlert('safe', response, 5000);
        } else if (
          response == 'This exercise name already exists for that user'
        ) {
          this.alertcom.updateAlert('danger', response, 5000);
        }
      })
      .catch((error) => {
        this.QuitAddingExercisesState();
        this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
      });
  }

  changeUserData(kind: string, originalValue: string) {
    if (kind == 'cancel') {
      this.EditingWhat = '';
    } else {
      if (kind == 'email') {
        this.servercomm
          .adminmodificaiton(this.Editing, kind, this.newemail)
          .then((response) => {
            response = response['message'];
            if (response == 'This email already exists!') {
              this.alertcom.updateAlert('danger', response, 5000);
            } else if (response == 'False') {
              this.kickout();
            } else {
              this.alertcom.updateAlert('safe', response, 5000);
              this.constUsersData.forEach((user) => {
                if (user.email == originalValue) {
                  user.email = this.newemail;
                  return;
                }
              });
              this.UserData.forEach((user) => {
                user.email = this.newemail;
                return;
              });
              this.EditingWhat = '';
            }
          })
          .catch((error) => {
            this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
          });
      } else if (kind == 'username') {
        this.servercomm
          .adminmodificaiton(this.Editing, kind, this.newuser)
          .then((response) => {
            response = response['message'];
            if (response == 'This username already exists!') {
              this.alertcom.updateAlert('danger', response, 5000);
            } else if (response == 'False') {
              this.kickout();
            } else {
              this.alertcom.updateAlert('safe', response, 5000);
              this.constUsersData.forEach((user) => {
                if (user.username == originalValue) {
                  user.username = this.newuser;
                  return;
                }
              });
              this.UserData.forEach((user) => {
                user.username = this.newuser;
                return;
              });
              this.EditingWhat = '';
            }
          })
          .catch((error) => {
            this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
          });
      } else if (kind == 'password') {
        this.servercomm
          .adminmodificaiton(this.Editing, kind, this.newpass)
          .then((response) => {
            response = response['message'];
            if (response == 'False') {
              this.kickout();
            } else {
              this.alertcom.updateAlert('safe', response, 5000);
              this.newpass = '';
            }
          })
          .catch((error) => {
            this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
          });
      } else if (kind == 'exercise') {
        this.servercomm
          .adminmodificaiton(this.Editing, kind, originalValue)
          .then((response) => {
            response = response['message'];
            if (response == 'False') {
              this.kickout();
            } else if (response == 'This exercise have been deleted') {
              this.alertcom.updateAlert('safe', response, 5000);
            }
            this.constUsersData.forEach((user) => {
              for (let i = 0; i < user.exercises.length; i++) {
                if (user.exercises[i][0] == originalValue) {
                  user.exercises.splice(i, 1);
                  break;
                }
              }
              return;
            });
            this.UserData.forEach((user) => {
              for (let i = 0; i < user.exercises.length; i++) {
                if (user.exercises[i][0] == originalValue) {
                  user.exercises.splice(i, 1);
                  break;
                }
              }
              return;
            });
            console.log(this.constUsersData, this.UserData);
          })
          .catch((error) => {
            this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
          });
      } else if (kind == 'delete') {
        this.servercomm
          .adminmodificaiton(this.Editing, kind, '')
          .then((response) => {
            response = response['message'];
            if (response == 'False') {
              this.kickout();
            } else if (response == 'User deleted successfully') {
              this.alertcom.updateAlert('safe', response, 5000);
              this.constUsersData = this.constUsersData.filter(
                (user: any) => user.email != this.UserData[0]['email']
              );
              this.usersData = this.constUsersData;
              this.UserData = [];
              this.state = 'viewing';
            } else {
              this.alertcom.updateAlert('danger', response, 5000);
            }
          })
          .catch((error) => {
            this.alertcom.updateAlert('danger', 'Unknown error occured!', 5000);
          });
      } else {
        if (this.adminChange == 'Revoke admin premissions') {
          this.servercomm
            .adminmodificaiton(this.Editing, kind, 'false')
            .then((response) => {
              response = response['message'];
              if (response == 'False') {
                this.kickout();
              } else {
                this.alertcom.updateAlert('safe', response, 5000);
                this.constUsersData.forEach((user) => {
                  if (
                    user.admin == originalValue &&
                    user.username == this.Editing
                  ) {
                    user.admin = '🔴';
                    return;
                  }
                });
                this.UserData.forEach((user) => {
                  user.admin = '🔴';
                  return;
                });
                this.adminChange = 'Add admin premissions';
                this.EditingWhat = '';
              }
            })
            .catch((error) => {
              this.alertcom.updateAlert(
                'danger',
                'Unknown error occured!',
                5000
              );
            });
        } else {
          this.servercomm
            .adminmodificaiton(this.Editing, kind, 'true')
            .then((response) => {
              response = response['message'];
              if (response == 'False') {
                this.kickout();
              } else {
                this.alertcom.updateAlert('safe', response, 5000);
                this.constUsersData.forEach((user) => {
                  if (
                    user.admin == originalValue &&
                    user.username == this.Editing
                  ) {
                    user.admin = '🟢';
                    return;
                  }
                });
                this.UserData.forEach((user) => {
                  user.admin = '🟢';
                  return;
                });
                this.adminChange = 'Revoke admin premissions';
                this.EditingWhat = '';
              }
            })
            .catch((error) => {
              this.alertcom.updateAlert(
                'danger',
                'Unknown error occured!',
                5000
              );
            });
        }
      }
    }
  }
}
