import { Routes } from '@angular/router';
import { LoginComponent } from './routes/login/login.component';
import { FinanceComponent } from './routes/finance/finance.component';
import { ApprovalsComponent } from './routes/approvals/approvals.component';
import { TripsComponent } from './routes/trips/trips.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'trips', component: TripsComponent },
    { path: 'trips/:id', component: TripsComponent },
    { path: 'login', component: LoginComponent },
    { path: 'approvals', component: ApprovalsComponent },
    { path: 'finance', component: FinanceComponent },
    { path: '**', redirectTo: '/login' }
];
