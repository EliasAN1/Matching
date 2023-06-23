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
  friends: string[] = [];

  constructor(
    private servercomm: ServercommService,
    private alertcomm: CustomAlertComponent,
    private router: Router
  ) {}

  ngOnInit() {
    this.servercomm.getProfileData().then((response) => {
      response = response['message'];
      if (response == 'You session has ended please login again!') {
        this.alertcomm.updateAlert('danger', response, 5000);
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
        this.friends = response[1];
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
          this.alertcomm.updateAlert('safe', responseLi[0], 5000);
          this.image.nativeElement.src = responseLi[1];
        } else if (response == 'You are not logged in') {
          this.alertcomm.updateAlert('danger', response, 5000);
          this.router.navigate(['/login']);
        } else {
          this.alertcomm.updateAlert('danger', response, 5000);
        }
      })
      .catch((error) => {
        this.alertcomm.updateAlert(
          'danger',
          'Something went wrong please try again',
          5000
        );
      });
  }
}
