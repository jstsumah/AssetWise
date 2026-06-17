
export type AssetCategory = 'Laptop' | 'Desktop' | 'Phone' | 'Tablet' | 'Other';
export type AssetStatus = 'Available' | 'In Use' | 'In Repair' | 'Decommissioned';

export type Company = {
  id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: string;
  address?: string;
  taxId?: string;
};

export type Asset = {
  id: string;
  serialNumber: string;
  tagNo: string;
  category: AssetCategory;
  brand: string;
  model: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: AssetStatus;
  assignedTo: string; // Employee ID
  photoUrl?: string;
  history: Assignment[];
  companyId: string;
  assetValue: number;
  remarks?: string;
  phoneNumber?: string;
};

export type Employee = {
  id:string;
  name: string;
  department: string;
  jobTitle: string;
  email: string;
  avatarUrl: string;
  role: 'Admin' | 'Employee';
  active: boolean;
  companyId: string;
};

export type Assignment = {
  date: string;
  assignedTo: string; // Employee ID or 'Unassigned'
  status: AssetStatus;
  notes?: string;
};

export type RecentActivity = {
  id?: string;
  assetId: string;
  assetSerial: string;
  employeeId: string;
  employeeName: string;
  date: string;
  action: 'Assigned' | 'Returned';
}

export type VaultCategory = 'Login' | 'Wi-Fi' | 'API Key' | 'SSH Key' | 'Database' | 'Phone Email' | 'Other';
export type VaultAccess = 'owner' | 'admins' | 'company';

export type PasswordHistoryEntry = {
  encryptedPassword: string;
  iv: string;
  updatedAt: string;
};

export type VaultEntry = {
  id: string;
  title: string;
  username: string;
  encryptedPassword: string; // AES-GCM ciphertext (base64)
  iv: string;                // Initialization vector (base64)
  url?: string;
  notes?: string;
  category: VaultCategory;
  accessLevel: VaultAccess;
  ownerId: string;           // Employee UID
  ownerName: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  passwordHistory?: PasswordHistoryEntry[];
};
