import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { ShellComponent } from './layout/shell/shell.component';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { PatientListComponent } from './features/patients/patient-list/patient-list.component';
import { ClinicalVisitsDashboardComponent } from './features/doctor/clinical-visits-dashboard/clinical-visits-dashboard.component';
import { BookAppointmentComponent } from './features/patient-portal/book-appointment/book-appointment.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, data: { animation: 'landing' } },
  { path: 'book', component: BookAppointmentComponent, data: { animation: 'book' } },
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent, data: { animation: 'dashboard' } },
      { path: 'patients/list', component: PatientListComponent, data: { animation: 'patients' } },
      { path: 'clinical-visits', component: ClinicalVisitsDashboardComponent, data: { animation: 'clinical-visits' } },
      { path: 'appointments', loadComponent: () => import('./features/appointments/appointments.component').then(m => m.AppointmentsComponent), data: { animation: 'appointments' } },
      { path: 'invoices', loadComponent: () => import('./features/invoices/invoices.component').then(m => m.InvoicesComponent), data: { animation: 'invoices' } },
    ]
  },
  { path: '**', redirectTo: '' }
];
