'use client';

import { SignupForm } from '@/components/signup-form';
import { Logo } from '@/components/icons/logo';
import Link from 'next/link';
import {
  ShieldCheck,
  DatabaseBackup,
  Briefcase,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const highlights = [
  {
    icon: Briefcase,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    title: 'Asset Lifecycle Register',
    desc: 'Track every device and license from purchase to retirement.',
  },
  {
    icon: ShieldCheck,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    title: 'Zero-Knowledge Vault',
    desc: 'Bank-grade AES-256 encryption — your keys never leave your browser.',
  },
  {
    icon: DatabaseBackup,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    title: 'Automated Backups',
    desc: 'Scheduled snapshots with instant restore and retention policies.',
  },
];

const perks = [
  'Free to get started — no credit card required',
  'Role-based access control for your whole team',
  'Audit trails and activity logs built-in',
];

export default function SignupPage() {
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
              Create your account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your workspace in under a minute.
            </p>
          </div>
          <SignupForm />
        </div>

        {/* Perks list */}
        <div className="w-full max-w-sm mt-8 space-y-2">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              {perk}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-muted-foreground text-center max-w-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
          >
            <ArrowLeft className="size-3" /> Sign in
          </Link>
        </p>
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
        {/* Subtle vignette top */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

        {/* Bottom overlay — dark gradient where content lives */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />

        {/* Content — pinned to bottom */}
        <div className="relative z-10 mt-auto w-full px-12 py-10 space-y-6">
          {/* Badge + headline */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary border border-primary/30 bg-primary/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <Sparkles className="size-3 text-primary" />
              Join AssetWise Today
            </div>
            <h2 className="text-3xl xl:text-4xl font-headline font-bold text-white leading-tight">
              Everything Your Team{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                Needs to Operate
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              A single, secure source of truth — from hardware to credentials and automated recovery pipelines.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Feature grid — 3 columns, all on one line */}
          <div className="grid grid-cols-3 gap-3">
            {highlights.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 backdrop-blur-sm hover:bg-white/8 transition-colors group"
              >
                <div className={`size-8 shrink-0 rounded-lg ${bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon className={`size-4 ${color}`} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white leading-snug">{title}</div>
                  <div className="text-xs text-slate-300 mt-1 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial strip */}
          <div className="border border-white/10 bg-white/5 rounded-xl px-5 py-4 backdrop-blur-sm flex items-start gap-4">
            <div className="size-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              SK
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 italic leading-relaxed">
                &ldquo;AssetWise cut our hardware audit time from days to minutes. The vault alone saved us three incidents.&rdquo;
              </p>
              <div className="text-xs text-slate-400 mt-1.5 font-medium">Sarah K. — IT Operations Lead</div>
            </div>
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
