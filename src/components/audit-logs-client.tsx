'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  User,
  KeyRound,
  Briefcase,
  Users,
  Shield,
  Clock,
  Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import { useAuth } from '@/hooks/use-auth';
import { getSystemAuditLogs } from '@/lib/data';
import type { SystemAuditLog, AuditCategory } from '@/lib/types';

const CATEGORIES: AuditCategory[] = ['Auth', 'Vault', 'Assets', 'Employees', 'System'];

const categoryColors: Record<AuditCategory, string> = {
  Auth: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  Vault: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  Assets: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  Employees: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  System: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const categoryIcons: Record<AuditCategory, React.ElementType> = {
  Auth: User,
  Vault: KeyRound,
  Assets: Briefcase,
  Employees: Users,
  System: Shield,
};

function getActionBadge(action: string) {
  if (action.includes('LOGIN')) {
    return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Login</Badge>;
  }
  if (action.includes('LOGOUT')) {
    return <Badge variant="outline" className="bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30">Logout</Badge>;
  }
  if (action.includes('ACCESS')) {
    return <Badge variant="outline" className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">Vault Access</Badge>;
  }
  if (action.includes('CREATE')) {
    return <Badge variant="outline" className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">Create</Badge>;
  }
  if (action.includes('UPDATE')) {
    return <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Update</Badge>;
  }
  if (action.includes('DELETE')) {
    return <Badge variant="outline" className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30">Delete</Badge>;
  }
  return <Badge variant="outline">{action}</Badge>;
}

export function AuditLogsClient() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | AuditCategory>('all');

  const fetchLogs = useCallback(async () => {
    if (!isAdmin || !user) return;
    setLoading(true);
    try {
      const data = await getSystemAuditLogs(user.companyId);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, fetchLogs]);

  if (authLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-4">
        <div className="h-8 bg-muted animate-pulse w-64 rounded-md" />
        <div className="h-64 bg-card border rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 max-w-4xl pt-16">
        <Card className="border-destructive/30 bg-destructive/5 text-center py-10 px-6">
          <CardHeader>
            <div className="mx-auto rounded-full bg-destructive/10 p-4 w-fit mb-3">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
            <CardDescription className="text-muted-foreground mt-2 max-w-md mx-auto">
              System & Security Audit Logs are strictly restricted to Workspace Administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      !search ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchesTab = activeTab === 'all' || log.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const tabCounts = {
    all: logs.length,
    ...Object.fromEntries(CATEGORIES.map(c => [c, logs.filter(l => l.category === c).length])),
  } as Record<string, number>;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Security & Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time audit trail monitoring user logons, credential accesses, and system operations.
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2 shrink-0">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Activity
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, or details…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">
            All Events <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{tabCounts.all}</span>
          </TabsTrigger>
          {CATEGORIES.map(c => (
            <TabsTrigger key={c} value={c}>
              {c} {tabCounts[c] > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{tabCounts[c]}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Audit Log Table */}
      {loading ? (
        <div className="rounded-xl border bg-card p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-muted/50 animate-pulse rounded-md" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3 border rounded-xl bg-card">
          <div className="rounded-full bg-muted p-4">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No audit logs found</p>
            <p className="text-sm mt-1">
              {search ? 'Try adjusting your search criteria.' : 'System events will appear here as users interact with the app.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[200px]">User</TableHead>
                <TableHead className="w-[110px]">Category</TableHead>
                <TableHead className="w-[130px]">Action</TableHead>
                <TableHead>Event Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map(log => {
                const CategoryIcon = categoryIcons[log.category] || Shield;
                const formattedDate = new Date(log.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formattedDate}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col min-w-[170px]">
                        <span className="font-medium text-foreground text-sm leading-tight">{log.userName}</span>
                        <span className="text-xs text-muted-foreground font-mono truncate">{log.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs gap-1 ${categoryColors[log.category]}`}>
                        <CategoryIcon className="h-3 w-3" />
                        {log.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {log.details}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
