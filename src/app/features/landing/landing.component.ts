import { Component, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, query, style, stagger, animate } from '@angular/animations';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  animations: [
    trigger('heroEnter', [
      transition(':enter', [
        query('.hero-word', [
          style({ opacity: 0, transform: 'translateY(40px)' }),
          stagger(80, [
            animate('600ms cubic-bezier(0.34,1.56,0.64,1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class LandingComponent implements OnInit, OnDestroy {

  // Live ticker counter
  readonly patientCount = signal(247);
  readonly doctorCount  = signal(12);
  private tickerInterval: any;

  // Scroll state for navbar
  readonly scrolled = signal(false);

  // Active portal tab
  readonly activePortal = signal<'patient'|'doctor'|'admin'>('patient');

  readonly tickerItems = [
    '247 Patients Today', '98% Satisfaction', '12 Active Doctors',
    '3 min Avg Wait', 'EGP 84,200 Revenue', '50+ Partner Clinics',
    'Real-time Sync', '24/7 Online Booking'
  ];

  readonly pulseSteps = [
    { num: 1, icon: 'calendar-plus', title: 'Patient Books',
      desc: 'Patient selects specialty, doctor, and time slot online.',
      preview: '📅 APT-2026-00142 · Dr. Ahmed Hassan · 10:30 AM' },
    { num: 2, icon: 'stethoscope', title: 'Doctor Visits',
      desc: 'Doctor opens visit, records SOAP, vitals, prescriptions.',
      preview: '📋 S: Headache · O: BP 120/80 · A: Tension · P: Rx' },
    { num: 3, icon: 'receipt', title: 'Invoice Created',
      desc: 'Invoice auto-generated after visit finalization. One click to pay.',
      preview: '💳 INV-2026-00089 · EGP 450 · Status: Paid ✓' },
  ];

  readonly features = [
    { id: 1, icon: 'list-ordered', iconBg: 'rgba(13,148,136,.15)', iconColor: '#2DD4BF',
      title: 'Smart Queue', tagline: 'Real-time queue management',
      details: ['Live SignalR updates', 'Auto-priority system', 'Wait time prediction', 'Doctor alerts'] },
    { id: 2, icon: 'clipboard', iconBg: 'rgba(124,58,237,.15)', iconColor: '#A78BFA',
      title: 'Clinical EMR', tagline: 'Full SOAP documentation',
      details: ['SOAP notes with auto-save', 'Vital signs tracking', 'Diagnoses + ICD codes', 'Prescriptions & labs'] },
    { id: 3, icon: 'receipt', iconBg: 'rgba(16,185,129,.15)', iconColor: '#34D399',
      title: 'Instant Billing', tagline: 'One-click invoicing',
      details: ['Auto-generated from visits', 'Discount management', 'Multi-payment methods', 'Revenue analytics'] },
    { id: 4, icon: 'shield', iconBg: 'rgba(245,158,11,.15)', iconColor: '#FCD34D',
      title: 'Role Access', tagline: '3 specialized portals',
      details: ['Admin command center', 'Doctor clinical workspace', 'Receptionist booking desk', 'Patient self-service'] },
    { id: 5, icon: 'bar-chart-2', iconBg: 'rgba(244,63,94,.15)', iconColor: '#FB7185',
      title: 'Analytics Suite', tagline: 'Revenue intelligence',
      details: ['Daily / weekly / monthly', 'Patient flow charts', 'Export to PDF/Excel', 'Trend forecasting'] },
    { id: 6, icon: 'lock', iconBg: 'rgba(99,102,241,.15)', iconColor: '#818CF8',
      title: 'Secure Records', tagline: 'Patient-first privacy',
      details: ['JWT encrypted sessions', 'Role-gated data access', 'Full audit trail', 'HIPAA-ready design'] },
  ];

  readonly portalTabs = [
    { id: 'patient' as const, label: 'Patient Portal' },
    { id: 'doctor' as const, label: 'Doctor Clinical' },
    { id: 'admin' as const, label: 'Admin Center' }
  ];

  readonly stats = [
    { value: '50+',    label: 'Partner Clinics' },
    { value: '12K+',   label: 'Patients Served' },
    { value: '99.9%',  label: 'Uptime' },
    { value: '4.9★',   label: 'Average Rating' },
  ];

  readonly testimonials = [
    { name: 'Dr. Sara Ahmed', role: 'Cardiologist · Cairo Clinic',
      quote: 'The SOAP auto-save alone saved me 30 minutes per day.' },
    { name: 'Mohamed Hassan', role: 'Clinic Administrator',
      quote: 'Revenue reports are now instant. The billing workflow is flawless.' },
    { name: 'Nour Essam', role: 'Head Receptionist',
      quote: 'Booking appointments used to take 5 minutes. Now it takes 30 seconds.' },
  ];

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 60); }

  ngOnInit() {
    // Animate ticker counts
    this.tickerInterval = setInterval(() => {
      if (Math.random() > 0.6)
        this.patientCount.update(n => n + Math.floor(Math.random() * 2));
    }, 3000);

    // Scroll reveal
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    setTimeout(() => {
      document.querySelectorAll('[scroll-reveal]')
        .forEach(el => observer.observe(el));
    }, 100);
  }

  ngOnDestroy() { clearInterval(this.tickerInterval); }
}
