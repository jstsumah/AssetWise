'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  KeyRound, 
  DatabaseBackup, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Activity,
  Layers,
  Sparkles,
  Server,
  Database
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/icons/logo';

export default function ProductPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      
      {/* Ambient glowing blobs behind hero */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] aspect-square rounded-full bg-accent/5 blur-[120px] pointer-events-none animate-pulse-slow delay-500" />
      
      {/* Conditionally show Public Header if the user is NOT logged in */}
      {!user && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="size-6 text-primary" />
            <span className="text-xl font-headline font-semibold text-foreground tracking-tight">
              AssetWise
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
          </div>
        </header>
      )}

      {/* Hero Section — full-width background image */}
      <section
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{
          minHeight: '92vh',
          backgroundImage: 'url(/hero-illustration.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Gradient overlay for legibility — top-to-bottom dark veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/60 to-background/95 pointer-events-none" />

        {/* Content centred over the image */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-28 md:py-40 flex flex-col items-center text-center space-y-7">
          <div className="flex justify-center opacity-0 animate-fade-in-up">
            <Badge variant="secondary" className="px-3 py-1 text-xs gap-1.5 border border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="size-3" />
              Introducing AssetWise v1.2
            </Badge>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold leading-tight md:leading-none text-foreground tracking-tight opacity-0 animate-tracking-expand">
            The Intelligent Infrastructure for{' '}
            <span className="bg-gradient-to-r from-primary via-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Corporate Assets
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed opacity-0 animate-fade-in-up delay-200">
            Streamline asset workflows, safeguard enterprise credentials with zero-knowledge vaulting, and manage automated recovery pipelines in a unified, professional dashboard.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2 opacity-0 animate-fade-in-up delay-300">
            <Button asChild size="lg" className="h-12 px-8 font-medium shadow-md shadow-primary/20 gap-2 hover:translate-y-[-1px] active:translate-y-[1px] transition-all">
              <Link href={user ? '/' : '/login'}>
                {user ? 'Go to Dashboard' : 'Get Started'}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {!user && (
              <Button asChild variant="outline" size="lg" className="h-12 px-8 hover:bg-muted/50 transition-all">
                <Link href="/signup">Create Free Account</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Bottom fade to blend into the next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Core Capabilities Showcase (Grid) */}
      <section className="w-full border-y bg-muted/20 py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-headline font-bold tracking-tight">
              Enterprise Grade Operations, Simplified
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Eliminate operational silos with an infrastructure designed from the ground up to secure and monitor workspace assets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Asset Lifecycle */}
            <Card className="border-border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between group">
              <CardHeader className="space-y-4">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Briefcase className="size-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-headline font-semibold">Asset Lifecycle Register</CardTitle>
                  <CardDescription className="text-sm">Continuous tracking of workspace hardware & license inventory.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                Log purchases, assign devices to team members with dynamic constraints, and monitor repairs. Keeps your hardware ledger audit-ready and operational at all times.
              </CardContent>
            </Card>

            {/* Card 2: Secure Vault */}
            <Card className="border-border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between group">
              <CardHeader className="space-y-4">
                <div className="size-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <KeyRound className="size-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-headline font-semibold">Credentials Vault</CardTitle>
                  <CardDescription className="text-sm">Bank-grade vaulting for database keys, SSH access, and api secrets.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                Store organization secrets securely with strict role-based access. Audit read events and retrieve credentials programmatically when needed.
              </CardContent>
            </Card>

            {/* Card 3: Disaster Recovery */}
            <Card className="border-border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between group">
              <CardHeader className="space-y-4">
                <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <DatabaseBackup className="size-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-headline font-semibold">Backups & Recovery</CardTitle>
                  <CardDescription className="text-sm">Disaster recovery setups and database snapshot pipelines.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                Schedule recurring backups, set retention limits, and execute instant restores. Built-in alerts help you discover pipeline warnings instantly.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Simulated Live Interface Preview (High Fidelity Mock UI using Tailwind) */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Control Center
            </Badge>
            <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">
              A Unified Dashboard Designed for Clarity
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              No complex installation screens or hard-coded configs. Manage your entire ecosystem in an easy-to-use control interface. Toggle themes, monitor backups, and delegate ownership without leaving the page.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">Automatic system status & server heartbeat tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">Strict audit trails for vault authorization</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium">Light and dark mode compatibility with dynamic design</span>
              </div>
            </div>
          </div>

          {/* High Fidelity Tailwind Mock Dashboard */}
          <div className="border bg-card rounded-xl shadow-xl overflow-hidden animate-float">
            {/* Window chrome header */}
            <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-destructive/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-muted-foreground ml-2 font-mono">console.assetwise.io/dashboard</span>
              </div>
              <div className="size-4 text-muted-foreground flex items-center">
                <Lock className="size-3.5" />
              </div>
            </div>
            
            {/* Visual interface contents */}
            <div className="p-6 space-y-6 bg-card">
              
              {/* Stats rows */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-3 bg-muted/10 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    <Cpu className="size-3 text-primary" /> Assets
                  </div>
                  <div className="text-lg font-headline font-bold">142</div>
                </div>
                <div className="border rounded-lg p-3 bg-muted/10 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    <Activity className="size-3 text-emerald-500" /> Backups
                  </div>
                  <div className="text-lg font-headline font-bold text-emerald-500">Active</div>
                </div>
                <div className="border rounded-lg p-3 bg-muted/10 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    <Layers className="size-3 text-orange-500" /> Vault Keys
                  </div>
                  <div className="text-lg font-headline font-bold">36</div>
                </div>
              </div>

              {/* Mock List: Live items */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Workspace Activity</div>
                
                <div className="border rounded-lg p-3 flex items-center justify-between text-xs bg-muted/5">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Server className="size-3.5 text-muted-foreground" />
                    <div>
                      <span className="font-semibold text-foreground">Production DB Snapshot</span>
                      <span className="text-muted-foreground ml-1">Automated backup success</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Just now</span>
                </div>

                <div className="border rounded-lg p-3 flex items-center justify-between text-xs bg-muted/5">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-blue-500" />
                    <Briefcase className="size-3.5 text-muted-foreground" />
                    <div>
                      <span className="font-semibold text-foreground">MacBook Pro Max 16</span>
                      <span className="text-muted-foreground ml-1">assigned to Sarah K.</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">10m ago</span>
                </div>

                <div className="border rounded-lg p-3 flex items-center justify-between text-xs bg-muted/5">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-amber-500" />
                    <KeyRound className="size-3.5 text-muted-foreground" />
                    <div>
                      <span className="font-semibold text-foreground">Auth Token Refresh</span>
                      <span className="text-muted-foreground ml-1">SSH secret updated</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">1h ago</span>
                </div>
              </div>

              {/* Vault simulated row */}
              <div className="border rounded-lg p-4 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Database className="size-4 text-orange-500" />
                    <span>PostgreSQL Staging Credentials</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Secret</Badge>
                </div>
                <div className="flex items-center justify-between bg-card border rounded p-2 text-xs">
                  <span className="font-mono text-muted-foreground">••••••••••••••••••••</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">Copy</Button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Security & Backups Section */}
      <section className="w-full bg-muted/10 py-24 border-t relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Image display */}
            <div className="order-2 lg:order-1 rounded-xl border bg-card p-2 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <img 
                src="/feature-showcase.png" 
                alt="Credentials Vault and Backups Blueprint" 
                className="w-full h-auto rounded-lg object-cover border border-muted/50"
              />
            </div>

            {/* Text details */}
            <div className="order-1 lg:order-2 space-y-6">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
                Security & Resilience
              </Badge>
              <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">
                Zero-Knowledge Vaulting & Automated Redundancy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Your credentials and server access tokens are encrypted using enterprise AES-256 standard protocols before leaving your browser. With automated backup pipelines executing on scheduled intervals, recover database integrity instantly in the event of an infrastructure warning.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="border rounded-lg p-3 bg-card space-y-1">
                  <div className="text-xs font-semibold text-foreground">Military-Grade Vault</div>
                  <p className="text-xs text-muted-foreground">End-to-end secret encryption using web-crypto standards.</p>
                </div>
                <div className="border rounded-lg p-3 bg-card space-y-1">
                  <div className="text-xs font-semibold text-foreground">30-Day Backup History</div>
                  <p className="text-xs text-muted-foreground">Keep complete database rollback archives automatically.</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Footer / Final CTA */}
      <section className="w-full py-16 bg-muted/30 border-t relative z-10 mt-auto">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-headline font-bold tracking-tight">
            Ready to Streamline Your Corporate Infrastructure?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Create an account in seconds, configure your employee database, and assign hardware with immediate visibility.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="h-12 px-8 font-medium gap-2 shadow-lg shadow-primary/10">
              <Link href={user ? '/' : '/login'}>
                {user ? 'Go to Dashboard' : 'Get Started'}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground pt-4">
            © {new Date().getFullYear()} AssetWise Inc. All rights reserved. Professional workspace management.
          </div>
        </div>
      </section>

    </div>
  );
}
