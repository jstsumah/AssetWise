'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus, Eye, EyeOff, Copy, Trash2, Pencil, RefreshCw,
  KeyRound, Globe, Lock, Wifi, Server, Database, Search,
  Shield, Users, Building2, Check, X, ChevronDown, ExternalLink, Smartphone
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  getVaultEntries, addVaultEntry, updateVaultEntry, deleteVaultEntry,
} from '@/lib/data';
import {
  deriveKey, encryptPassword, decryptPassword,
  scorePassword, strengthLabels, strengthColors,
  generatePassword,
} from '@/lib/crypto';
import type { VaultEntry, VaultCategory, VaultAccess, PasswordHistoryEntry } from '@/lib/types';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const CATEGORIES: VaultCategory[] = ['Login', 'Wi-Fi', 'API Key', 'SSH Key', 'Database', 'Phone Email', 'Other'];
const ACCESS_LEVELS: { value: VaultAccess; label: string; icon: React.ElementType }[] = [
  { value: 'owner', label: 'Only Me', icon: Lock },
  { value: 'admins', label: 'Admins Only', icon: Shield },
  { value: 'company', label: 'Entire Company', icon: Building2 },
];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  username: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  url: z.string().url({ message: 'Enter a valid URL' }).optional().or(z.literal('')),
  notes: z.string().optional(),
  category: z.enum(['Login', 'Wi-Fi', 'API Key', 'SSH Key', 'Database', 'Phone Email', 'Other'] as const),
  accessLevel: z.enum(['owner', 'admins', 'company'] as const),
});
type FormValues = z.infer<typeof formSchema>;

// ─── Category helpers ─────────────────────────────────────────────────────────

const categoryIcon: Record<VaultCategory, React.ElementType> = {
  'Login': KeyRound,
  'Wi-Fi': Wifi,
  'API Key': RefreshCw,
  'SSH Key': Server,
  'Database': Database,
  'Phone Email': Smartphone,
  'Other': Globe,
};

const categoryColor: Record<VaultCategory, string> = {
  'Login': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Wi-Fi': 'bg-green-500/20 text-green-400 border-green-500/30',
  'API Key': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'SSH Key': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Database': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Phone Email': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Other': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

// ─── Dynamic Field Configurations per Category ────────────────────────────────

interface CategoryFieldConfig {
  titleLabel: string;
  titlePlaceholder: string;
  showUsername: boolean;
  usernameLabel?: string;
  usernamePlaceholder?: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showUrl: boolean;
  urlLabel?: string;
  urlPlaceholder?: string;
}

const FIELD_CONFIGS: Record<VaultCategory, CategoryFieldConfig> = {
  'Login': {
    titleLabel: 'Website / Service Name',
    titlePlaceholder: 'e.g. GitHub, Google Workspace',
    showUsername: true,
    usernameLabel: 'Username or Email',
    usernamePlaceholder: 'username@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter account password',
    showUrl: true,
    urlLabel: 'Website URL',
    urlPlaceholder: 'https://github.com',
  },
  'Wi-Fi': {
    titleLabel: 'Network Name (SSID)',
    titlePlaceholder: 'e.g. Office Guest, Corporate Wi-Fi',
    showUsername: false,
    passwordLabel: 'Wi-Fi Password / Security Key',
    passwordPlaceholder: 'Enter network password',
    showUrl: false,
  },
  'API Key': {
    titleLabel: 'Service / API Key Name',
    titlePlaceholder: 'e.g. Stripe API Key, OpenAI Key',
    showUsername: false,
    passwordLabel: 'API Key / Token',
    passwordPlaceholder: 'sk-... or token secret',
    showUrl: false,
  },
  'SSH Key': {
    titleLabel: 'SSH Connection / Key Name',
    titlePlaceholder: 'e.g. Production Server, Backup Host SSH',
    showUsername: true,
    usernameLabel: 'SSH Username (optional)',
    usernamePlaceholder: 'e.g. ubuntu, root',
    passwordLabel: 'Private Key or Passphrase',
    passwordPlaceholder: 'Paste SSH private key or type passphrase',
    showUrl: false,
  },
  'Database': {
    titleLabel: 'Database Connection Name',
    titlePlaceholder: 'e.g. Production Postgres, Staging Redis',
    showUsername: true,
    usernameLabel: 'Database User',
    usernamePlaceholder: 'e.g. postgres, admin',
    passwordLabel: 'Database Password',
    passwordPlaceholder: 'Enter database password',
    showUrl: true,
    urlLabel: 'Host / Connection String',
    urlPlaceholder: 'postgresql://db.example.com:5432/dbname',
  },
  'Phone Email': {
    titleLabel: 'Phone Email Description',
    titlePlaceholder: 'e.g. iPhone Apple ID, Android Google Account',
    showUsername: true,
    usernameLabel: 'Email Address',
    usernamePlaceholder: 'username@example.com',
    passwordLabel: 'Email Password',
    passwordPlaceholder: 'Enter account password',
    showUrl: false,
  },
  'Other': {
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Office Alarm Code, License Key',
    showUsername: true,
    usernameLabel: 'Username / Identifier (optional)',
    usernamePlaceholder: 'e.g. Serial code, username',
    passwordLabel: 'Secret Password / Key',
    passwordPlaceholder: 'Enter secure credentials',
    showUrl: true,
    urlLabel: 'URL (optional)',
    urlPlaceholder: 'https://example.com',
  },
};


// ─── Password Strength Meter ──────────────────────────────────────────────────

function PasswordStrengthMeter({ password }: { password: string }) {
  const score = scorePassword(password);
  const filled = score;

  return (
    <div className="space-y-1">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i < filled ? strengthColors[score] : 'bg-muted'
            }`}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs text-muted-foreground">{strengthLabels[score]}</p>
      )}
    </div>
  );
}

// ─── Single vault card ────────────────────────────────────────────────────────

interface VaultCardProps {
  entry: VaultEntry;
  cryptoKey: CryptoKey | null;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
}

function VaultCard({ entry, cryptoKey, onEdit, onDelete }: VaultCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const { toast } = useToast();

  const toggleReveal = async () => {
    if (!cryptoKey) return;
    if (!revealed) {
      const plain = await decryptPassword(entry.encryptedPassword, entry.iv, cryptoKey);
      setDecrypted(plain);
    }
    setRevealed((v) => !v);
  };

  const handleCopy = async () => {
    if (!cryptoKey) return;
    const plain = decrypted ?? await decryptPassword(entry.encryptedPassword, entry.iv, cryptoKey);
    if (!plain) {
      toast({ title: 'Decryption failed', variant: 'destructive' });
      return;
    }
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    toast({ title: 'Copied to clipboard', description: 'Password will be cleared in 30 seconds.' });
    setTimeout(() => {
      navigator.clipboard.writeText('').catch(() => {});
      setCopied(false);
    }, 30_000);
  };

  const handleCopyUsername = async () => {
    if (!entry.username) return;
    await navigator.clipboard.writeText(entry.username);
    setCopiedUsername(true);
    toast({ title: 'Username copied', description: 'Username copied to clipboard.' });
    setTimeout(() => {
      setCopiedUsername(false);
    }, 3000);
  };

  const Icon = categoryIcon[entry.category];
  const AccessIcon = ACCESS_LEVELS.find(a => a.value === entry.accessLevel)?.icon ?? Lock;

  return (
    <div className="group relative rounded-xl border bg-card hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 overflow-hidden">
      {/* Colored top accent */}
      <div className={`h-1 w-full ${categoryColor[entry.category].split(' ')[0]}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`rounded-lg p-2 border ${categoryColor[entry.category]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{entry.title}</p>
              {entry.username && (
                <p className="text-sm text-muted-foreground truncate">{entry.username}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(entry)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Password row */}
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 font-mono text-sm">
          <span className="flex-1 truncate tracking-wider">
            {revealed && decrypted ? decrypted : '••••••••••••'}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={toggleReveal}>
                  {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{revealed ? 'Hide' : 'Show'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy password</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Labeled Quick-Copy Action Buttons */}
        <div className="mt-3 flex gap-2">
          {entry.username && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={handleCopyUsername}
            >
              {copiedUsername ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              <span>Copy Username</span>
            </Button>
          )}
          <Button
            type="button"
            variant={entry.username ? "secondary" : "default"}
            size="sm"
            className={`h-8 gap-1.5 text-xs font-medium ${entry.username ? 'flex-1' : 'w-full'}`}
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied Password' : 'Copy Password'}</span>
          </Button>
        </div>

        {/* Footer row */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${categoryColor[entry.category]}`}>
              {entry.category}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <AccessIcon className="h-3 w-3" />
              {ACCESS_LEVELS.find(a => a.value === entry.accessLevel)?.label}
            </span>
          </div>
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Entry Form Dialog ────────────────────────────────────────────────────────

interface EntryDialogProps {
  open: boolean;
  editEntry: VaultEntry | null;
  cryptoKey: CryptoKey | null;
  onClose: () => void;
  onSaved: () => void;
  defaultCategory?: VaultCategory;
}

// ─── Password History Item Helper ─────────────────────────────────────────────

function HistoryItem({
  item,
  cryptoKey,
  index,
}: {
  item: PasswordHistoryEntry;
  cryptoKey: CryptoKey | null;
  index: number;
}) {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleDecrypt = async () => {
    if (!cryptoKey) return;
    if (!decrypted) {
      const plain = await decryptPassword(item.encryptedPassword, item.iv, cryptoKey);
      setDecrypted(plain);
    }
    setRevealed((v) => !v);
  };

  const handleCopy = async () => {
    if (!cryptoKey) return;
    const plain = decrypted ?? await decryptPassword(item.encryptedPassword, item.iv, cryptoKey);
    if (!plain) {
      toast({ title: 'Decryption failed', variant: 'destructive' });
      return;
    }
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    toast({ title: 'Historical password copied' });
    setTimeout(() => setCopied(false), 3000);
  };

  const dateStr = new Date(item.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between py-2 text-xs border-b last:border-b-0 border-border/40">
      <div className="space-y-0.5 min-w-0 flex-1 pr-2">
        <p className="font-mono tracking-wider font-medium truncate">
          {revealed && decrypted ? decrypted : '••••••••••••'}
        </p>
        <p className="text-[10px] text-muted-foreground">Archived on {dateStr}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleDecrypt}
          title={revealed ? 'Hide password' : 'Show password'}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          title="Copy password"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function EntryDialog({ open, editEntry, cryptoKey, onClose, onSaved, defaultCategory = 'Login' }: EntryDialogProps) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [undoPassword, setUndoPassword] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '', username: '', password: '', url: '', notes: '',
      category: defaultCategory, accessLevel: 'owner',
    },
  });

  const watchedPassword = form.watch('password');
  const watchedCategory = form.watch('category');
  const config = FIELD_CONFIGS[watchedCategory] || FIELD_CONFIGS['Login'];

  // Clear fields when category config changes to hide them (keeps values clean)
  useEffect(() => {
    if (open) {
      if (!config.showUsername) {
        form.setValue('username', '');
      }
      if (!config.showUrl) {
        form.setValue('url', '');
      }
    }
  }, [watchedCategory, config.showUsername, config.showUrl, open, form]);

  // Populate form when editing
  useEffect(() => {
    if (!open) {
      setUndoPassword(null);
      setShowHistory(false);
      return;
    }

    const load = async () => {
      if (editEntry && cryptoKey) {
        const plain = await decryptPassword(editEntry.encryptedPassword, editEntry.iv, cryptoKey);
        form.reset({
          title: editEntry.title,
          username: editEntry.username ?? '',
          password: plain ?? '',
          url: editEntry.url ?? '',
          notes: editEntry.notes ?? '',
          category: editEntry.category,
          accessLevel: editEntry.accessLevel,
        });
      } else {
        form.reset({
          title: '', username: '', password: '', url: '', notes: '',
          category: defaultCategory, accessLevel: 'owner',
        });
      }
    };
    load();
  }, [open, editEntry, cryptoKey, defaultCategory, form]);

  const onGenerate = () => {
    const currentPwd = form.getValues('password');
    if (currentPwd && currentPwd !== undoPassword) {
      setUndoPassword(currentPwd);
    }
    const pwd = generatePassword(20);
    form.setValue('password', pwd, { shouldValidate: true });
    setShowPassword(true);
    toast({
      title: 'New password generated',
      description: 'Click the green Undo button next to the password field to restore the previous value.',
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    if (!cryptoKey) {
      toast({ 
        title: 'Encryption Error', 
        description: 'Encryption key is missing. Please make sure you are assigned to a company.', 
        variant: 'destructive' 
      });
      return;
    }
    setSaving(true);
    try {
      const { encryptedPassword, iv } = await encryptPassword(values.password, cryptoKey);
      const now = new Date().toISOString();

      // Check if password changed and keep a secure history entry as a fail-safe
      let passwordHistory: PasswordHistoryEntry[] = editEntry?.passwordHistory ?? [];
      if (editEntry) {
        const oldPlain = await decryptPassword(editEntry.encryptedPassword, editEntry.iv, cryptoKey);
        if (values.password !== oldPlain) {
          const archiveItem: PasswordHistoryEntry = {
            encryptedPassword: editEntry.encryptedPassword,
            iv: editEntry.iv,
            updatedAt: editEntry.updatedAt,
          };
          passwordHistory = [archiveItem, ...passwordHistory].slice(0, 5); // Store last 5 passwords
        }
      }

      const payload: Omit<VaultEntry, 'id'> = {
        title: values.title,
        username: values.username ?? '',
        encryptedPassword,
        iv,
        url: values.url ?? '',
        notes: values.notes ?? '',
        category: values.category,
        accessLevel: values.accessLevel,
        ownerId: user.id,
        ownerName: user.name,
        companyId: user.companyId,
        createdAt: editEntry?.createdAt ?? now,
        updatedAt: now,
        passwordHistory,
      };

      if (editEntry) {
        await updateVaultEntry(editEntry.id, payload);
        toast({ title: 'Entry updated' });
      } else {
        await addVaultEntry(payload);
        toast({ title: 'Entry saved to vault' });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to save entry', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {editEntry ? 'Edit Vault Entry' : 'New Vault Entry'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>{config.titleLabel} *</FormLabel>
                <FormControl><Input placeholder={config.titlePlaceholder} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Category + Access Level */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="accessLevel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Who can access</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACCESS_LEVELS.map(a => (
                        <SelectItem key={a.value} value={a.value}>
                          <span className="flex items-center gap-2">
                            <a.icon className="h-3.5 w-3.5" />
                            {a.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Username */}
            {config.showUsername && (
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>{config.usernameLabel}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder={config.usernamePlaceholder} {...field} />
                    </FormControl>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={async () => {
                              const val = form.getValues('username');
                              if (!val) return;
                              await navigator.clipboard.writeText(val);
                              toast({ title: 'Username copied' });
                            }}
                            disabled={!form.getValues('username')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy username</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Password + generator */}
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>{config.passwordLabel} *</FormLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={config.passwordPlaceholder}
                        className="pr-10 font-mono"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <TooltipProvider>
                    {undoPassword && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 shrink-0 animate-in fade-in zoom-in-95 duration-200"
                            onClick={() => {
                              const val = form.getValues('password');
                              form.setValue('password', undoPassword, { shouldValidate: true });
                              setUndoPassword(val);
                              toast({ title: 'Password swapped' });
                            }}
                          >
                            <RefreshCw className="h-4 w-4 rotate-180 text-green-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo generate / Restore previous</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            const val = form.getValues('password');
                            if (!val) return;
                            await navigator.clipboard.writeText(val);
                            toast({ title: 'Password copied' });
                          }}
                          disabled={!form.getValues('password')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy password</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon" onClick={onGenerate}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generate strong password</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <PasswordStrengthMeter password={watchedPassword} />
                <FormMessage />
              </FormItem>
            )} />

            {/* URL */}
            {config.showUrl && (
              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{config.urlLabel}</FormLabel>
                  <FormControl><Input placeholder={config.urlPlaceholder} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Notes */}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional info..." className="resize-none" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Password History Collapsible Section */}
            {editEntry && editEntry.passwordHistory && editEntry.passwordHistory.length > 0 && (
              <div className="border rounded-lg p-3 bg-muted/30 space-y-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowHistory(v => !v)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    Password History ({editEntry.passwordHistory.length})
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`} />
                </button>

                {showHistory && (
                  <div className="pt-2 space-y-2 max-h-40 overflow-y-auto divide-y divide-border">
                    {editEntry.passwordHistory.map((item, idx) => (
                      <HistoryItem
                        key={idx}
                        item={item}
                        cryptoKey={cryptoKey}
                        index={idx}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editEntry ? 'Save Changes' : 'Add to Vault'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Vault Client ────────────────────────────────────────────────────────

export function VaultClient() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | VaultCategory>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<VaultEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VaultEntry | null>(null);

  // Derive the company-scoped crypto key once
  useEffect(() => {
    if (!user?.companyId) return;
    deriveKey(user.companyId).then(setCryptoKey).catch(console.error);
  }, [user?.companyId]);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getVaultEntries(user.companyId, user.id, isAdmin);
      // Sort newest first
      data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleEdit = (entry: VaultEntry) => {
    setEditEntry(entry);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditEntry(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVaultEntry(deleteTarget.id);
      toast({ title: 'Entry deleted' });
      setDeleteTarget(null);
      loadEntries();
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  // Filter entries
  const filtered = entries.filter(e => {
    const matchesSearch = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.username ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || e.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const tabCounts = {
    all: entries.length,
    ...Object.fromEntries(CATEGORIES.map(c => [c, entries.filter(e => e.category === c).length])),
  } as Record<string, number>;

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" />
            Password Vault
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Passwords are encrypted client-side with AES-256 before being stored.
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">
            All <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{tabCounts.all}</span>
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

      {/* Entries grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border bg-card h-36 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-4">
          <div className="rounded-full bg-muted p-5">
            <KeyRound className="h-8 w-8" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No entries found</p>
            <p className="text-sm mt-1">
              {search ? 'Try a different search term.' : 'Add your first password to the vault.'}
            </p>
          </div>
          {!search && (
            <Button onClick={handleNew} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> New Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(entry => (
            <VaultCard
              key={entry.id}
              entry={entry}
              cryptoKey={cryptoKey}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <EntryDialog
        open={dialogOpen}
        editEntry={editEntry}
        cryptoKey={cryptoKey}
        onClose={() => setDialogOpen(false)}
        onSaved={loadEntries}
        defaultCategory={activeTab === 'all' ? 'Login' : activeTab}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vault entry?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.title}</strong> will be permanently removed from the vault. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
