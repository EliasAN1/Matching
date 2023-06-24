import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { SignupPageComponent } from './components/signup-page/signup-page.component';
import { CreateExerciseComponent } from './components/create-exercise/create-exercise.component';
import { ExerciseComponent } from './components/exercise/exercise.component';
import { SavedExercisesPageComponent } from './components/saved-exercises-page/saved-exercises-page.component';
import { EditExerciseComponent } from './components/edit-exercise/edit-exercise.component';
import { RetrievePassComponent } from './components/retrieve-pass/retrieve-pass.component';
import { RecoverAuthComponent } from './components/recover-auth/recover-auth.component';
import { AccountMangerComponent } from './components/account-manger/account-manger.component';
import { AdminComponent } from './components/admin/admin.component';
import { PublicexercisesComponent } from './components/publicexercises/publicexercises.component';
import { UserPageComponent } from './components/user-page/user-page.component';
import { FriendsComponent } from './components/friends/friends.component';

let routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'sign-up', component: SignupPageComponent },
  { path: 'create-exercise', component: CreateExerciseComponent },
  { path: 'exercise', component: ExerciseComponent },
  { path: 'saved-exercises', component: SavedExercisesPageComponent },
  { path: 'public-exercises', component: PublicexercisesComponent },
  { path: 'user', component: UserPageComponent },
  { path: 'friends', component: FriendsComponent },
  { path: 'edit', component: EditExerciseComponent },
  { path: 'forgotten-pass', component: RetrievePassComponent },
  { path: 'reset-pass', component: AccountMangerComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', component: RecoverAuthComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
  deleteTempRoute(name: string) {
    routes = routes.filter((route) => route.path == name);
  }

  tempRoute(name: string) {
    const foundRoute = routes.find((route) => route.path == name);
    if (foundRoute == undefined) {
    } else {
      routes.push({ path: name, component: RecoverAuthComponent });
      setTimeout(() => {
        this.deleteTempRoute(name);
      }, 600000);
    }
  }
}
