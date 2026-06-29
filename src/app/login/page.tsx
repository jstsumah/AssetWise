'use client';

import { LoginForm } from '@/components/login-form';
import { Logo } from '@/components/icons/logo';
import Link from 'next/link';
import {
  ShieldCheck,
  DatabaseBackup,
  Briefcase,
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

      </div>

      {/* ── RIGHT: Branded panel (60%) ── */}
      <div
        className="relative hidden md:flex flex-col overflow-hidden"
        style={{
          width: '60%',
          backgroundImage: 'url(/office-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Subtle vignette top so it blends with background */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

        {/* Bottom overlay — dark gradient where content lives */}
        <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />

        {/* Content — pinned to bottom */}
        <div className="relative z-10 mt-auto w-full px-12 py-10 space-y-6">
          {/* Badge + headline */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary border border-primary/30 bg-primary/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-primary animate-pulse inline-block" />
              Enterprise Platform
            </div>
            <h2 className="text-3xl xl:text-4xl font-headline font-bold text-white leading-tight">
              The Infrastructure Your Team Deserves
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
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
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature grid — 3 columns, all on one line */}
          <div className="grid grid-cols-3 gap-3">
            {features.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 backdrop-blur-sm hover:bg-white/8 transition-colors group"
              >
                <div className={`size-8 shrink-0 rounded-lg ${bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon className={`size-4 ${color}`} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white leading-snug">{title}</div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} AssetWise Inc. — Professional workspace management.
          </p>
        </div>
      </div>
    </div>
  );
}
