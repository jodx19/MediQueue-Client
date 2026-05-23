import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-mq-navy text-white overflow-hidden relative selection:bg-mq-teal selection:text-white">
      
      <!-- Ambient Background Effects -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-mq-teal/20 blur-[150px] rounded-full"></div>
        <div class="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[150px] rounded-full"></div>
      </div>

      <!-- Navbar -->
      <nav class="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-mq-teal flex items-center justify-center shadow-lg shadow-mq-teal/30">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <path d="M20 8C14 8 10 13 10 20C10 27 14 32 20 32C26 32 30 27 30 20" stroke="white" stroke-width="3" stroke-linecap="round"/>
              <circle cx="28" cy="12" r="4" fill="white"/>
            </svg>
          </div>
          <span class="text-2xl font-bold tracking-tight text-white">MediQueue</span>
        </div>
        <div class="flex gap-4 items-center">
          <a routerLink="/auth/patient-login" class="text-sm font-bold text-gray-300 hover:text-white transition-colors">Patient Portal</a>
          <a routerLink="/auth/login" class="btn-neon !text-sm !px-6">Staff Login</a>
        </div>
      </nav>

      <!-- Hero Section -->
      <main class="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-24 pb-32 max-w-5xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-mq-teal-light text-xs font-bold uppercase tracking-widest mb-8">
          <span class="w-2 h-2 rounded-full bg-mq-teal animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)]"></span>
          Next-Gen EMR Platform
        </div>
        
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Smarter Care. <br/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-mq-teal-light to-blue-400">Zero Friction.</span>
        </h1>
        
        <p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
          MediQueue streamlines your clinical workflow from appointment booking to SOAP notes and billing, creating a seamless experience for both staff and patients.
        </p>
        
        <div class="flex flex-col sm:flex-row justify-center gap-4 w-full">
          <a routerLink="/auth/login" class="btn-primary !px-8 !py-4 !text-lg !font-bold flex items-center justify-center gap-2">
            Staff Login
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
          <a routerLink="/book" class="btn-primary !px-8 !py-4 !text-lg !font-bold flex items-center justify-center gap-2 !bg-white/10 !border !border-white/20 hover:!bg-white/20">
            Book an Appointment
          </a>
          <a routerLink="/auth/patient-login" class="px-8 py-4 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-lg transition-all text-center">
            Patient Sign In
          </a>
        </div>
      </main>
      
      <!-- Dashboard Preview Mockup -->
      <div class="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        <div class="rounded-2xl border border-white/10 bg-gray-900/50 backdrop-blur-xl shadow-2xl p-2 relative overflow-hidden transform perspective-1000 rotate-x-12 scale-95 hover:scale-100 hover:rotate-x-0 transition-all duration-700 ease-out cursor-pointer group">
          <div class="absolute inset-0 bg-gradient-to-t from-mq-navy via-transparent to-transparent z-20 group-hover:opacity-0 transition-opacity duration-700"></div>
          
          <!-- Mockup Header -->
          <div class="h-10 w-full bg-gray-800/80 rounded-t-xl flex items-center px-4 gap-2 border-b border-gray-700/50">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <!-- Mockup Body (Image) -->
          <div class="bg-mq-slate h-[400px] w-full rounded-b-xl flex items-center justify-center relative overflow-hidden">
            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#0D9488 1px, transparent 1px); background-size: 20px 20px;"></div>
            <h2 class="text-4xl font-black text-mq-navy/20 uppercase tracking-widest relative z-10">MediQueue Workspace</h2>
          </div>

        </div>
      </div>
    </div>
  `
})
export class LandingComponent {}
