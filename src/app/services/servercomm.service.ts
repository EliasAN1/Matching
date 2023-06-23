import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
const httpOptions = {
  withCredentials: true,
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    charset: 'UTF-8',
  }),
};
@Injectable({
  providedIn: 'root',
})
export class ServercommService {
  constructor(private http: HttpClient) {}
  loggedInStatus = new BehaviorSubject<[boolean, string]>([false, '']);
  logInOutinprogress = new BehaviorSubject<boolean>(false);

  async checkLoggedInStatus() {
    this.http
      .get('http://127.0.0.1:5000/api/authenticate', httpOptions)
      .subscribe(
        (response: any) => {
          const message = response.message;
          if (message == 'Not logged in') {
            return this.loggedInStatus.next([false, '']);
          } else {
            return this.loggedInStatus.next([true, message]);
          }
        },
        (error) => {}
      );
  }
  getLoggedInStatusasObservable() {
    return this.loggedInStatus.asObservable();
  }
  getLoggedInStatusasValue() {
    return this.loggedInStatus.getValue();
  }

  // Checking if logout or login in progess
  setlogInOutinprogressValue(value: boolean) {
    this.logInOutinprogress.next(value);
  }

  getlogInOutinprogressasObservable() {
    return this.logInOutinprogress.asObservable();
  }

  getlogInOutinprogressasValue() {
    return this.logInOutinprogress.getValue();
  }

  checkAdmin(): Promise<any> {
    return this.http
      .get('http://127.0.0.1:5000/api/authenticate-admin', httpOptions)
      .toPromise();
  }

  addExerciseToUser(
    exerciseFrom: string,
    exerciseTo: string,
    exerciseName: string
  ): Promise<any> {
    const data = {
      exerciseFrom: exerciseFrom,
      exerciseTo: exerciseTo,
      exerciseName: exerciseName,
    };

    return this.http
      .post('http://127.0.0.1:5000/api/addexercise-admin', data, httpOptions)
      .toPromise();
  }

  async registerUser(
    email_: string,
    user_: string,
    password_: string,
    login: boolean = true
  ): Promise<any> {
    const data = {
      email: email_,
      user: user_,
      password: password_,
      login: login,
    };
    return this.http
      .post('http://127.0.0.1:5000/api/register-user', data, httpOptions)
      .toPromise();
  }

  async login(user_: string, password_: string): Promise<any> {
    const data = { user: user_, password: password_ };
    this.logInOutinprogress.next(true);
    setTimeout(() => {
      this.logInOutinprogress.next(false);
    }, 2000);
    return this.http
      .post('http://127.0.0.1:5000/api/login-user', data, httpOptions)
      .toPromise();
  }

  logout() {
    let response_ = '';
    sessionStorage.removeItem('exercises');
    this.http
      .get('http://127.0.0.1:5000/api/logout-user', httpOptions)
      .subscribe((response: any) => {
        response = response['message'];
        if (response == 'You logged out successfully') {
          this.checkLoggedInStatus();
          response_ = response;
        }
      });
    this.logInOutinprogress.next(true);
    setTimeout(() => {
      this.logInOutinprogress.next(false);
    }, 1500);
    return response_;
  }

  // functionallity
  async getData(): Promise<any> {
    return this.http
      .get('http://127.0.0.1:5000/api/getdata', httpOptions)
      .toPromise();
  }

  async getAllPublicData(): Promise<any> {
    return this.http
      .get('http://127.0.0.1:5000/api/getallpublicdata', httpOptions)
      .toPromise();
  }

  async getPublicData(exercisename: string, username: string): Promise<any> {
    const data = { exercisename: exercisename, user: username };
    return this.http
      .post('http://127.0.0.1:5000/api/getpublicdata', data, httpOptions)
      .toPromise();
  }

  async saveExercise(
    publicE: string,
    exercise_name_: string,
    exercise_: { question: string; questionOrder: string }[]
  ): Promise<any> {
    const data = {
      exercisename: exercise_name_,
      questions: exercise_,
      public: publicE,
    };
    return this.http
      .post('http://127.0.0.1:5000/api/save-data', data, httpOptions)
      .toPromise();
  }
  async deleteExercise(exercise_name_: string): Promise<any> {
    const data = { exercise_name: exercise_name_ };
    return this.http
      .post('http://127.0.0.1:5000/api/deletedata', data, httpOptions)
      .toPromise();
  }
  async modifyExercise(
    exercise_name: string,
    exercise_: { question: string; questionOrder: string }[]
  ): Promise<any> {
    const data = { exercisename: exercise_name, questions: exercise_ };
    return this.http
      .post('http://127.0.0.1:5000/api/modify-data', data, httpOptions)
      .toPromise();
  }

  async modifyExercisePrivacy(
    exercise_name: string,
    state: string
  ): Promise<any> {
    if (state == 'Make public') {
      state = 'True';
    } else {
      state = 'False';
    }
    const data = { exercisename: exercise_name, state: state };
    return this.http
      .post('http://127.0.0.1:5000/api/modify-data-privacy', data, httpOptions)
      .toPromise();
  }

  // Retriving data
  async checkPath(path: string): Promise<any> {
    const data = { email: path };
    return this.http
      .post('http://127.0.0.1:5000/api/pathcheck', data, httpOptions)
      .toPromise();
  }

  async retrive(
    dataToRetrieve_: string,
    email_: string,
    currentseleciton: string
  ): Promise<any> {
    const data = {
      dataToRetrieve: dataToRetrieve_,
      email: email_,
      modkind: currentseleciton,
    };
    return this.http
      .post('http://127.0.0.1:5000/api/recover', data, httpOptions)
      .toPromise();
  }
  async codeCheck(code_: string, email_: string): Promise<any> {
    const data = { code: code_, email: email_ };
    return this.http
      .post('http://127.0.0.1:5000/api/auth-recovery', data, httpOptions)
      .toPromise();
  }

  async updatepass(pass: string): Promise<any> {
    const data = { password: pass };
    return this.http
      .post('http://127.0.0.1:5000/api/update', data, httpOptions)
      .toPromise();
  }

  // Reset password while logged in
  async resetPass(pass: string): Promise<any> {
    const data = { password: pass };
    return this.http
      .post('http://127.0.0.1:5000/api/update-pass', data, httpOptions)
      .toPromise();
  }

  async notme(email_: string): Promise<any> {
    const data = { email: email_ };
    return this.http
      .post('http://127.0.0.1:5000/api/notme', data, httpOptions)
      .toPromise();
  }

  async adminmodificaiton(
    user: string,
    kind: string,
    data_: string
  ): Promise<any> {
    const data = { user: user, kind: kind, data: data_ };

    return this.http
      .post('http://127.0.0.1:5000/api/admin-modifications', data, httpOptions)
      .toPromise();
  }

  async friend_request(user: string, target: string): Promise<any> {
    const data = { user: user, target: target };

    return this.http
      .post('http://127.0.0.1:5000/api/friend-request', data, httpOptions)
      .toPromise();
  }

  async uploadImage(image: any, username: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', image, username);

    return this.http
      .post('http://127.0.0.1:5000/api/upload-image', formData)
      .toPromise();
  }

  async getProfileData(): Promise<any> {
    return this.http
      .get('http://127.0.0.1:5000/api/user', httpOptions)
      .toPromise();
  }
}
