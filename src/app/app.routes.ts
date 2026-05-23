import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },

  // Auth routes
  {
    path: 'auth',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      {
        path: 'patient-login',
        loadComponent: () => import('./features/auth/patient-login/patient-login.component').then(m => m.PatientLoginComponent),
      },
    ],
  },

  // Legacy redirects
  { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },

  // Public patient pages
  { path: 'book', loadComponent: () => import('./features/patient-portal/book/book-appointment.component').then(m => m.BookAppointmentComponent) },
  {
    path: 'register',
    loadComponent: () => import('./features/patient-portal/register/patient-self-register.component').then(m => m.PatientSelfRegisterComponent),
  },

  // Patient Portal (protected, Patient role only)
  {
    path: 'my-portal',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Patient'] },
    loadComponent: () => import('./layout/patient-shell/patient-shell.component').then(m => m.PatientShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/patient-portal/dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent) },
    ],
  },
  {
    path: 'my-appointments',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Patient'] },
    loadComponent: () => import('./layout/patient-shell/patient-shell.component').then(m => m.PatientShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/patient-portal/my-appointments/my-appointments.component').then(m => m.MyAppointmentsComponent) },
    ],
  },
  {
    path: 'my-records',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Patient'] },
    loadComponent: () => import('./layout/patient-shell/patient-shell.component').then(m => m.PatientShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/patient-portal/my-records/my-records.component').then(m => m.MyRecordsComponent) },
    ],
  },
  {
    path: 'my-invoices',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Patient'] },
    loadComponent: () => import('./layout/patient-shell/patient-shell.component').then(m => m.PatientShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/patient-portal/my-invoices/my-invoices.component').then(m => m.MyInvoicesComponent) },
    ],
  },

  // Staff Shell (protected)
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
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
          { path: 'list', loadComponent: () => import('./features/patients/patient-list/patient-list.component').then(m => m.PatientListComponent), title: 'Patients' },
          { path: 'register', loadComponent: () => import('./features/patients/patient-register/patient-register.component').then(m => m.PatientRegisterComponent), canActivate: [roleGuard], data: { roles: ['Admin', 'Receptionist'] }, title: 'Register Patient' },
          { path: ':id', loadComponent: () => import('./features/patients/patient-detail/patient-detail.component').then(m => m.PatientDetailComponent), title: 'Patient' },
        ],
      },
      {
        path: 'doctors',
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Receptionist', 'Doctor'] },
        children: [
          { path: '', pathMatch: 'full', loadComponent: () => import('./features/doctors/doctor-list/doctor-list.component').then(m => m.DoctorListComponent) },
          { path: ':id', loadComponent: () => import('./features/doctors/doctor-detail/doctor-detail.component').then(m => m.DoctorDetailComponent), title: 'Doctor' },
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
          { path: ':id', loadComponent: () => import('./features/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent), title: 'Invoice' },
        ],
      },
    ],
  },

  // Error pages
  { path: '403', loadComponent: () => import('./shared/components/forbidden/forbidden.component').then(m => m.ForbiddenComponent) },
  { path: '404', loadComponent: () => import('./features/errors/not-found/not-found.component').then(m => m.NotFoundComponent) },
  { path: '500', loadComponent: () => import('./features/errors/server-error/server-error.component').then(m => m.ServerErrorComponent) },

  // Wildcard
  { path: '**', redirectTo: '/404' },
];
