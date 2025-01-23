import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./routes/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'trips',
        loadComponent: () => import('./routes/trips/trips.component').then(m => m.TripsComponent),
        canActivate: [AuthGuard],
        data: { role: UserRole.END_USER }
    },
    {
        path: 'trips/:id',
        loadComponent: () => import('./routes/trip-detail/trip-detail.component').then(m => m.TripDetailComponent),
        canActivate: [AuthGuard],
        data: { role: UserRole.END_USER }
    },
    {
        path: 'approvals',
        loadComponent: () => import('./routes/approvals/approvals.component').then(m => m.ApprovalsComponent),
        canActivate: [AuthGuard],
        data: { role: UserRole.APPROVER }
    },
    {
        path: 'finance',
        loadComponent: () => import('./routes/finance/finance.component').then(m => m.FinanceComponent),
        canActivate: [AuthGuard],
        data: { role: UserRole.FINANCE }
    },
    { path: 'unauthorized', loadComponent: () => import('./routes/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) },
    { path: '**', redirectTo: '/login' }
];