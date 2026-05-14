import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'book', loadComponent: () => import('./features/patient-portal/book/book-appointment.component').then(m => m.BookAppointmentComponent) },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/patient-portal/register/patient-self-register.component').then(m => m.PatientSelfRegisterComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard', data: {} },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        title: 'Dashboard',
      },
      {
        path: 'super-admin',
        loadComponent: () => import('./features/super-admin/super-admin.component').then(m => m.SuperAdminComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        title: 'Staff Management',
      },
      {
        path: 'patients',
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Receptionist', 'Doctor'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'list' },
          {
            path: 'list',
            loadComponent: () => import('./features/patients/patient-list/patient-list.component').then(m => m.PatientListComponent),
            title: 'Patients',
          },
          {
            path: 'register',
            loadComponent: () =>
              import('./features/patients/patient-register/patient-register.component').then(m => m.PatientRegisterComponent),
            canActivate: [roleGuard],
            data: { roles: ['Admin', 'Receptionist'] },
            title: 'Register Patient',
          },
          {
            path: ':id',
            loadComponent: () => import('./features/patients/patient-detail/patient-detail.component').then(m => m.PatientDetailComponent),
            title: 'Patient',
          },
        ],
      },
      {
        path: 'doctors',
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Receptionist', 'Doctor'] },
        children: [
          { path: '', pathMatch: 'full', loadComponent: () => import('./features/doctors/doctor-list/doctor-list.component').then(m => m.DoctorListComponent) },
          {
            path: ':id',
            loadComponent: () => import('./features/doctors/doctor-detail/doctor-detail.component').then(m => m.DoctorDetailComponent),
            title: 'Doctor',
          },
        ],
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/appointments/appointment-list/appointment-list.component').then(m => m.AppointmentListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Receptionist'] },
        title: 'Appointments',
      },
      {
        path: 'my-queue',
        loadComponent: () => import('./features/clinical-visits/my-queue/my-queue.component').then(m => m.MyQueueComponent),
        canActivate: [roleGuard],
        data: { roles: ['Doctor'] },
        title: "Today's Queue",
      },
      {
        path: 'clinical-visits/:id',
        loadComponent: () => import('./features/clinical-visits/visit-detail/visit-detail.component').then(m => m.VisitDetailComponent),
        canActivate: [roleGuard],
        data: { roles: ['Doctor'] },
        title: 'Visit',
      },
      {
        path: 'invoices',
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Receptionist'] },
        children: [
          { path: '', pathMatch: 'full', loadComponent: () => import('./features/invoices/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent) },
          {
            path: ':id',
            loadComponent: () => import('./features/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
            title: 'Invoice',
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
