import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { TaskcardComponent } from './components/taskcard/taskcard.component';
import { BoardComponent } from './components/board/board.component';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { authGuard } from './guards/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'board',
        pathMatch: 'full'
    },
    { 
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
        canActivate: [authGuard],
        title: 'Dashboard'
    },
    { 
        path: 'login',
        component: LoginComponent,
    },
    { 
        path: 'board/:boardId',
        loadComponent: () => import('./components/board/board.component')
        .then(m => m.BoardComponent),
        canActivate: [authGuard],
        title: 'Task Board'
    },
    {
        path: '**',
        redirectTo: 'login'
    },
];
