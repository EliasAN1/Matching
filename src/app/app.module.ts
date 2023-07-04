import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { ServercommService } from './services/servercomm.service';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SignupPageComponent } from './components/signup-page/signup-page.component';
import { CustomAlertComponent } from './components/custom-alert/custom-alert.component';
import { CreateExerciseComponent } from './components/create-exercise/create-exercise.component';
import { ExerciseComponent } from './components/exercise/exercise.component';
import { SavedExercisesPageComponent } from './components/saved-exercises-page/saved-exercises-page.component';
import { EditExerciseComponent } from './components/edit-exercise/edit-exercise.component';
import { RetrievePassComponent } from './components/retrieve-pass/retrieve-pass.component';
import { RecoverAuthComponent } from './components/recover-auth/recover-auth.component';
import { AccountMangerComponent } from './components/account-manger/account-manger.component';
import { AdminComponent } from './components/admin/admin.component';
import { PublicexercisesComponent } from './components/publicexercises/publicexercises.component';
import { PhoneNavbarComponent } from './components/phone-navbar/phone-navbar.component';
import { UserPageComponent } from './components/user-page/user-page.component';
import { FriendsComponent } from './components/friends/friends.component';
import { VisitUserPageComponent } from './components/visit-user-page/visit-user-page.component';
import { ChattingComponent } from './components/chatting/chatting.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginPageComponent,
    NavbarComponent,
    SignupPageComponent,
    CustomAlertComponent,
    CreateExerciseComponent,
    ExerciseComponent,
    SavedExercisesPageComponent,
    EditExerciseComponent,
    RetrievePassComponent,
    RecoverAuthComponent,
    AccountMangerComponent,
    AdminComponent,
    PublicexercisesComponent,
    PhoneNavbarComponent,
    UserPageComponent,
    FriendsComponent,
    VisitUserPageComponent,
    ChattingComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, HttpClientModule],
  providers: [ServercommService],
  bootstrap: [AppComponent],
})
export class AppModule {}
