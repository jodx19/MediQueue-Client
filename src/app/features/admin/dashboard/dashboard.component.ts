import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users, DollarSign, Calendar, Stethoscope, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-angular';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef;
  @ViewChild('patientFlowChart') patientFlowChartRef!: ElementRef;

  readonly LucideIcons = { Users, DollarSign, Calendar, Stethoscope, ArrowUpRight, ArrowDownRight, MoreHorizontal };

  metrics = [
    { label: 'Total Patients', value: '12,450', trend: '+12%', up: true, icon: 'Users' },
    { label: 'Monthly Revenue', value: 'EGP 842K', trend: '+8.5%', up: true, icon: 'DollarSign' },
    { label: 'Appointments', value: '1,240', trend: '-2.1%', up: false, icon: 'Calendar' },
    { label: 'Active Doctors', value: '24', trend: '+0%', up: true, icon: 'Stethoscope' },
  ];

  recentAppointments = [
    { patient: 'Omar Tarek', doctor: 'Dr. Ahmed Samy', date: 'Today, 10:00 AM', status: 'Completed' },
    { patient: 'Sara Ali', doctor: 'Dr. Mona Hassan', date: 'Today, 11:30 AM', status: 'In Progress' },
    { patient: 'Khaled Hassan', doctor: 'Dr. Ahmed Samy', date: 'Today, 01:00 PM', status: 'Waiting' },
    { patient: 'Nour Yasser', doctor: 'Dr. Tarek Ziad', date: 'Tomorrow, 09:00 AM', status: 'Scheduled' },
  ];

  topDoctors = [
    { name: 'Dr. Ahmed Samy', specialty: 'Cardiology', patients: 145 },
    { name: 'Dr. Mona Hassan', specialty: 'Pediatrics', patients: 120 },
    { name: 'Dr. Tarek Ziad', specialty: 'Orthopedics', patients: 98 },
  ];

  ngAfterViewInit() {
    this.initRevenueChart();
    this.initPatientFlowChart();
  }

  initRevenueChart() {
    new Chart(this.revenueChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Revenue',
          data: [12000, 19000, 15000, 22000, 18000, 28000, 24000],
          borderColor: '#0D9488',
          backgroundColor: 'rgba(13, 148, 136, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(226, 232, 240, 0.5)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  initPatientFlowChart() {
    new Chart(this.patientFlowChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['New', 'Returning', 'Referral'],
        datasets: [{
          data: [35, 50, 15],
          backgroundColor: ['#0D9488', '#2DD4BF', '#042F2E'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
        }
      }
    });
  }
}
