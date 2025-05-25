import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { TaskcardComponent } from './components/taskcard/taskcard.component';
import { BoardComponent } from './components/board/board.component';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'board',
        pathMatch: 'full'
    },
    { 
        path: 'login',
        component: LoginComponent,
    },
    { 
        path: 'board',
        component: BoardComponent,
        canActivate: [authGuard]
    },
    //  { 
    //     path: 'taskcard',
    //     component: TaskcardComponent,
    // },
    {
        path: '**',
        redirectTo: 'login'
    },
];
