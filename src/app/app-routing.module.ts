import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VideoChatComponent } from './video-chat/video-chat.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent},
  { path: 'chat', component: VideoChatComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
