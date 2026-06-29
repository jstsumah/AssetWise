'use client';

import { Logo } from '@/components/icons/logo';
import Link from 'next/link';
import { ShieldCheck, DatabaseBackup, Briefcase, ArrowLeft, Lock } from 'lucide-react';
import { Sparkles } from 'lucide-react';

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

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      {/* LEFT: Restricted access panel */}
      <div
        className="flex flex-col justify-center items-center px-8 py-12 bg-background"
        style={{ width: '40%', minWidth: '360px' }}
      >
        {/* Logo */}
        <div className="w-full max-w-sm mb-10">
          <Link href="/login" className="flex items-center gap-2 group w-fit">
            <Logo className="size-7 text-primary transition-transform group-hover:scale-110" />
            <span className="text-xl font-semibold font-headline text-foreground">
              AssetWise
            </span>
          </Link>
        </div>

        {/* Access restricted message */}
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Lock className="size-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-headline font-bold text-foreground tracking-tight">
                Access by Invitation Only
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                New accounts are created by your system administrator. If you&apos;ve been added, check your email for a link to set your password.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
              <div className="size-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Admin adds your account</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your IT administrator creates your profile in the system.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
              <div className="size-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">You receive an email</p>
                <p className="text-xs text-muted-foreground mt-0.5">A set-password link is sent to your work email address.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
              <div className="size-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Admin activates your account</p>
                <p className="text-xs text-muted-foreground mt-0.5">Once activated by an admin, you can sign in with your new password.</p>
              </div>
            </div>
          </div>

          {/* Back to login */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Sign In
          </Link>

          <p className="text-xs text-center text-muted-foreground">
            Need access? Contact your system administrator.
          </p>
        </div>
      </div>

      {/* RIGHT: Branded panel (60%) */}
      <div
        className="relative hidden md:flex flex-col overflow-hidden"
        style={{
          width: '60%',
          backgroundImage: 'url(/office-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />

        <div className="relative z-10 mt-auto w-full px-12 py-10 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary border border-primary/30 bg-primary/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <Sparkles className="size-3 text-primary" />
              Admin-Controlled Access
            </div>
            <h2 className="text-3xl xl:text-4xl font-headline font-bold text-white leading-tight">
              Secure by Design,{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                Access by Invitation
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              Only your administrator can provision accounts, ensuring every user is verified and trusted before gaining access.
            </p>
          </div>

          <div className="border-t border-white/10" />

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

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} AssetWise Inc. — Professional workspace management.
          </p>
        </div>
      </div>
    </div>
  );
}
