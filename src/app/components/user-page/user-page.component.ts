import { Component, ElementRef, ViewChild } from '@angular/core';
import { ServercommService } from 'src/app/services/servercomm.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-page',
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.css'],
})
export class UserPageComponent {
  @ViewChild('editImg') editImg!: ElementRef;
  @ViewChild('imageuploader') imageUploader!: ElementRef;
  @ViewChild('image') image!: ElementRef;

  email: string = '';
  user: string = '';
  Registered: string = '';
  Lastlogin: string = '';
  Lastupdatedpassword: string = '';
  lastsuccessrecovery: string = '';
  Lastrecoveryrequest: string = '';
  friends: string[][] = [];
  blocked: string[][] = [];
  showBlock: boolean = false;

  requested: boolean = false;
  processingUser: string = '';

  constructor(
    private servercomm: ServercommService,
    private alertcom: CustomAlertComponent,
    private router: Router
  ) {}

  ngOnInit() {
    this.initiation();
  }

  initiation() {
    this.servercomm.getProfileData().then((response) => {
      response = response['message'];
      console.log(response);

      if (response == 'You session has ended please login again!') {
        this.alertcom.updateAlert('danger', response, 5000);
        this.servercomm.checkLoggedInStatus();
        this.router.navigate(['/login']);
      } else {
        let first = response[0];
        this.email = first[0];
        this.user = first[1];
        this.Registered = first[2];
        this.Lastlogin = first[3];
        this.Lastupdatedpassword = first[4];
        this.lastsuccessrecovery = first[5];
        this.Lastrecoveryrequest = first[6];
        this.image.nativeElement.src = first[7];
        response[1].forEach((user: string[]) => {
          if (user[1] == 'friend') {
            this.friends.push([user[0], user[2]]);
          } else {
            this.blocked.push([user[0], user[2]]);
          }
          console.log(this.friends);
        });
      }
    });
  }

  navigate(destination: string) {
    this.router.navigate([destination]);
  }

  openFileUploader() {
    this.imageUploader.nativeElement.click();
  }

  showEdit() {
    const editImg = this.editImg.nativeElement;
    setTimeout(() => {
      editImg.classList.toggle('show-edit');
    }, 100);
  }

  editImage(event: any) {
    const file = event.target.files[0];
    this.servercomm
      .uploadImage(file, this.servercomm.getLoggedInStatusasValue()[1])
      .then((response) => {
        response = response['message'];
        if (response.includes('Image saved successfully')) {
          let responseLi = response.split(' : ');
          this.alertcom.updateAlert('safe', responseLi[0], 5000);
          this.image.nativeElement.src = responseLi[1];
        } else if (response == 'You are not logged in') {
          this.alertcom.updateAlert('danger', response, 5000);
          this.router.navigate(['/login']);
        } else {
          this.alertcom.updateAlert('danger', response, 5000);
        }
      })
      .catch((error) => {
        this.alertcom.updateAlert(
          'danger',
          'Something went wrong please try again',
          5000
        );
      });
  }

  FriendMangment(user: any[], state: string = 'accept') {
    this.requested = true;
    this.processingUser = user[0];
    this.servercomm
      .FriendManagment(user, state)
      .then((response) => {
        response = response['message'];
        this.requested = false;
        this.processingUser = '';

        if (response == 'Your session has ended please login again!') {
          this.alertcom.updateAlert('danger', response, 5000);
          this.servercomm.checkLoggedInStatus();
        } else if (response == 'You have blocked this user successfully!') {
          this.alertcom.updateAlert('safe', response, 5000);
          this.friends = this.friends.filter((friend) => friend[0] != user[0]);
          this.blocked.push(user);
        } else if (response == 'You have unblocked this user successfully!') {
          this.alertcom.updateAlert('safe', response, 5000);
          this.blocked = this.blocked.filter((block) => block[0] != user[0]);
        } else if (response == 'You have removed this friend successfully!') {
          this.alertcom.updateAlert('safe', response, 5000);
          this.friends = this.friends.filter((friend) => friend[0] != user[0]);
        } else if (response == 'Synchronization error') {
          this.alertcom.updateAlert(
            'danger',
            response + ' We have refreshed the page for you.',
            5000
          );
          this.initiation();
        }
      })
      .catch((err) => {
        this.alertcom.updateAlert('danger', 'Unknown error occured', 5000);
        this.requested = false;
      });
  }
}
