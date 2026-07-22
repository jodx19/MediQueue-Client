import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { superAdminGuard } from './core/auth/super-admin.guard';

export const routes: Routes = [

  // ══ PUBLIC ══
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component')
        .then(m => m.LandingComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent),
  },
  {
    path: 'auth/patient-login',
    loadComponent: () =>
      import('./features/auth/patient-login/patient-login.component')
        .then(m => m.PatientLoginComponent),
  },
  {
    path: 'book',
    loadComponent: () =>
      import('./features/patient-portal/book/book-appointment.component')
        .then(m => m.BookAppointmentComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/patient-portal/register/patient-self-register.component')
        .then(m => m.PatientSelfRegisterComponent),
  },
  {
    path: 'register-clinic',
    loadComponent: () =>
      import('./features/tenant-register/tenant-register.component')
        .then(m => m.TenantRegisterComponent)
  },

  // ══ PATIENT PORTAL — dedicated patient shell ══
  {
    path: '',
    loadComponent: () =>
      import('./layout/patient-shell/patient-shell.component')
        .then(m => m.PatientShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'my-portal',
        canActivate: [roleGuard(['Patient'])],
        loadComponent: () =>
          import('./features/patient-portal/dashboard/patient-dashboard.component')
            .then(m => m.PatientDashboardComponent),
      },
      {
        path: 'my-appointments',
        canActivate: [roleGuard(['Patient'])],
        loadComponent: () =>
          import('./features/patient-portal/my-appointments/my-appointments.component')
            .then(m => m.MyAppointmentsComponent),
      },
      {
        path: 'my-records',
        canActivate: [roleGuard(['Patient'])],
        loadComponent: () =>
          import('./features/patient-portal/my-records/my-records.component')
            .then(m => m.MyRecordsComponent),
      },
      {
        path: 'my-invoices',
        canActivate: [roleGuard(['Patient'])],
        loadComponent: () =>
          import('./features/patient-portal/my-invoices/my-invoices.component')
            .then(m => m.MyInvoicesComponent),
      },
    ],
  },

  // ══ PROTECTED — Staff Shell wraps all ══
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component')
        .then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Admin only
      {
        path: 'dashboard',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component')
            .then(m => m.DashboardComponent),
      },
      {
        path: 'doctors',
        canActivate: [roleGuard(['Admin', 'Receptionist'])],
        loadComponent: () =>
          import('./features/doctors/doctor-list/doctor-list.component')
            .then(m => m.DoctorListComponent),
      },
      {
        path: 'doctors/:id',
        canActivate: [roleGuard(['Admin', 'Receptionist'])],
        loadComponent: () =>
          import('./features/doctors/doctor-detail/doctor-detail.component')
            .then(m => m.DoctorDetailComponent),
      },
      {
        path: 'super-admin',
        canActivate: [roleGuard(['Admin']), superAdminGuard],
        loadComponent: () =>
          import('./features/super-admin/super-admin.component')
            .then(m => m.SuperAdminComponent),
      },
      {
        path: 'super-admin/tenants',
        canActivate: [roleGuard(['Admin', 'SuperAdmin']), superAdminGuard],
        loadComponent: () =>
          import('./features/super-admin/tenant-list/tenant-list.component')
            .then(m => m.TenantListComponent),
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['Admin', 'Doctor'])],
        loadComponent: () =>
          import('./features/reports/reports.component')
            .then(m => m.ReportsComponent),
      },
      {
        path: 'settings',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/settings/settings.component')
            .then(m => m.SettingsComponent),
      },
      {
        path: 'audit-logs',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/audit/audit-log/audit-log.component')
            .then(m => m.AuditLogComponent),
      },

      // Admin + Receptionist
      {
        path: 'patients',
        canActivate: [roleGuard(['Admin', 'Receptionist'])],
        loadComponent: () =>
          import('./features/patients/patient-list/patient-list.component')
            .then(m => m.PatientListComponent),
      },
      {
        path: 'patients/register',
        canActivate: [roleGuard(['Admin', 'Receptionist'])],
        loadComponent: () =>
          import('./features/patients/patient-register/patient-register.component')
            .then(m => m.PatientRegisterComponent),
      },
      {
        path: 'patients/:id',
        canActivate: [roleGuard(['Admin', 'Receptionist', 'Doctor'])],
        loadComponent: () =>
          import('./features/patients/patient-detail/patient-detail.component')
            .then(m => m.PatientDetailComponent),
      },
      {
        path: 'appointments',
        canActivate: [roleGuard(['Admin', 'Receptionist'])],
        loadComponent: () =>
          import('./features/appointments/appointment-list/appointment-list.component')
            .then(m => m.AppointmentListComponent),
      },
      {
        path: 'appointments/:id',
        canActivate: [roleGuard(['Admin', 'Receptionist'])],
        loadComponent: () =>
          import('./features/appointments/appointment-detail/appointment-detail.component')
            .then(m => m.AppointmentDetailComponent),
      },
      {
        path: 'invoices',
        canActivate: [roleGuard(['Admin', 'Receptionist'])],
        loadComponent: () =>
          import('./features/invoices/invoice-list/invoice-list.component')
            .then(m => m.InvoiceListComponent),
      },
      // IMPORTANT: static segments must come BEFORE the :id parameter route
      {
        path: 'invoices/create',
        canActivate: [roleGuard(['Admin', 'Receptionist'])],
        loadComponent: () =>
          import('./features/invoices/components/create-invoice/create-invoice.component')
            .then(m => m.CreateInvoiceComponent),
      },
      {
        path: 'invoices/revenue',
        canActivate: [roleGuard(['Admin'])],
        loadComponent: () =>
          import('./features/invoices/components/revenue-report/revenue-report.component')
            .then(m => m.RevenueReportComponent),
      },
      {
        path: 'invoices/:id',
        canActivate: [roleGuard(['Admin', 'Receptionist'])],
        loadComponent: () =>
          import('./features/invoices/invoice-detail/invoice-detail.component')
            .then(m => m.InvoiceDetailComponent),
      },

      // Doctor only
      {
        path: 'my-queue',
        canActivate: [roleGuard(['Doctor'])],
        loadComponent: () =>
          import('./features/clinical-visits/my-queue/my-queue.component')
            .then(m => m.MyQueueComponent),
      },
      {
        path: 'clinical-visits/:id',
        canActivate: [roleGuard(['Doctor'])],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/clinical-visits/visit-detail/visit-detail.component')
            .then(m => m.VisitDetailComponent),
      },

      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  { path: '**', redirectTo: '' },
];
