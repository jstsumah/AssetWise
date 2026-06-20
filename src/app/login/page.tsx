'use client';

import { LoginForm } from '@/components/login-form';
import { Logo } from '@/components/icons/logo';
import Link from 'next/link';
import {
  ShieldCheck,
  DatabaseBackup,
  Briefcase,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Briefcase,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    title: 'Asset Lifecycle Register',
    desc: 'Full inventory tracking from purchase to decommission.',
  },
  {
    icon: ShieldCheck,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    title: 'Zero-Knowledge Vault',
    desc: 'AES-256 encrypted credential storage with role-based access.',
  },
  {
    icon: DatabaseBackup,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    title: 'Automated Backups',
    desc: 'Scheduled DB snapshots with instant one-click restores.',
  },
];

const stats = [
  { value: '142', label: 'Assets tracked' },
  { value: '36', label: 'Vault secrets' },
  { value: '99.9%', label: 'Uptime' },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── LEFT: Form panel (40%) ── */}
      <div
        className="flex flex-col justify-center items-center px-8 py-12 bg-background"
        style={{ width: '40%', minWidth: '360px' }}
      >
        {/* Logo */}
        <div className="w-full max-w-sm mb-10">
          <Link href="/product" className="flex items-center gap-2 group w-fit">
            <Logo className="size-7 text-primary transition-transform group-hover:scale-110" />
            <span className="text-xl font-semibold font-headline text-foreground">
              AssetWise
            </span>
          </Link>
        </div>

        {/* Form */}
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-headline font-bold text-foreground tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your workspace to continue.
            </p>
          </div>
          <LoginForm />
        </div>

        {/* Footer note */}
        <p className="mt-10 text-xs text-muted-foreground text-center max-w-sm">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
          >
            Create one free <ArrowRight className="size-3" />
          </Link>
        </p>
      </div>

      {/* ── RIGHT: Branded panel (60%) ── */}
      <div
        className="relative hidden md:flex items-center justify-center overflow-hidden"
        style={{
          width: '60%',
          backgroundImage: 'url(/feature-showcase.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/75 to-slate-950/95" />

        {/* Ambient glow blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[45%] aspect-square rounded-full bg-primary/20 blur-[100px] pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[35%] aspect-square rounded-full bg-indigo-600/15 blur-[80px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '3s' }} />

        {/* Content — full width, generous padding */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center px-16 py-16 space-y-8">
          {/* Headline */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary border border-primary/30 bg-primary/5 px-3 py-1 rounded-full">
              <span className="size-1.5 rounded-full bg-primary animate-pulse inline-block" />
              Enterprise Platform
            </div>
            <h2 className="text-3xl xl:text-4xl font-headline font-bold text-white leading-tight">
              The Infrastructure Your{' '}
              <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Team Deserves
              </span>
            </h2>
            <p className="text-base text-slate-400 leading-relaxed max-w-lg">
              Manage workspace hardware, encrypted credentials, and disaster recovery — all in one unified, audit-ready control panel.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Stats row */}
          <div className="flex items-center gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-headline font-bold text-white">{s.value}</div>
                <div className="text-sm text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature grid — 2 columns, full-width */}
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-5 backdrop-blur-sm hover:bg-white/8 transition-colors group"
              >
                <div className={`size-10 rounded-lg ${bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon className={`size-5 ${color}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white leading-snug">{title}</div>
                  <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom copyright */}
          <p className="text-xs text-slate-600 pt-2">
            © {new Date().getFullYear()} AssetWise Inc. — Professional workspace management.
          </p>
        </div>
      </div>
    </div>
  );
}
