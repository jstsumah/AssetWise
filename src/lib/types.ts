
export type AssetCategory = 'Laptop' | 'Desktop' | 'Phone' | 'Tablet' | 'Other';
export type AssetStatus = 'Available' | 'In Use' | 'In Repair' | 'Decommissioned';

export type Company = {
  id: string;
  name: string;
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
