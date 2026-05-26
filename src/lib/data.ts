
import type { Asset, AssetCategory, AssetStatus, Company, Employee, RecentActivity, VaultAccess, VaultCategory, VaultEntry } from './types';
import { supabase } from './supabase';

// Caching layer to prevent re-fetching data on every navigation
let companies: Company[] | null = null;
let employees: Employee[] | null = null;
let assets: Asset[] | null = null;
let recentActivity: RecentActivity[] | null = null;

// Function to clear the cache after data mutation
export function clearCache() {
  companies = null;
  employees = null;
  assets = null;
  recentActivity = null;
}

// ─── Case & Key Mappings between UI (CamelCase) and DB (lowercase) ─────────────

function mapCompanyFromDb(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    website: row.website || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    industry: row.industry || undefined,
    address: row.address || undefined,
    taxId: row.taxid || undefined
  };
}

function mapCompanyToDb(company: Partial<Company>): any {
  const row: any = {};
  if (company.name !== undefined) row.name = company.name;
  if (company.website !== undefined) row.website = company.website;
  if (company.email !== undefined) row.email = company.email;
  if (company.phone !== undefined) row.phone = company.phone;
  if (company.industry !== undefined) row.industry = company.industry;
  if (company.address !== undefined) row.address = company.address;
  if (company.taxId !== undefined) row.taxid = company.taxId;
  return row;
}

function mapEmployeeFromDb(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    department: row.department || 'Unassigned',
    jobTitle: row.jobtitle || 'New Employee',
    avatarUrl: row.avatarurl || '',
    role: row.role as 'Admin' | 'Employee',
    active: !!row.active,
    companyId: row.companyid || ''
  };
}

function mapEmployeeToDb(employee: Partial<Employee>): any {
  const row: any = {};
  if (employee.name !== undefined) row.name = employee.name;
  if (employee.email !== undefined) row.email = employee.email;
  if (employee.department !== undefined) row.department = employee.department;
  if (employee.jobTitle !== undefined) row.jobtitle = employee.jobTitle;
  if (employee.avatarUrl !== undefined) row.avatarurl = employee.avatarUrl;
  if (employee.role !== undefined) row.role = employee.role;
  if (employee.active !== undefined) row.active = employee.active;
  if (employee.companyId !== undefined) row.companyid = employee.companyId || null;
  return row;
}

function mapAssetFromDb(row: any): Asset {
  return {
    id: row.id,
    serialNumber: row.serialnumber,
    tagNo: row.tagno,
    category: row.category as AssetCategory,
    brand: row.brand,
    model: row.model,
    purchaseDate: row.purchasedate,
    warrantyExpiry: row.warrantyexpiry,
    status: row.status as AssetStatus,
    assignedTo: row.assignedto || '',
    photoUrl: row.photourl || '',
    history: [], // History audit logs are retrieved dynamically from activity_logs
    companyId: row.companyid,
    assetValue: Number(row.assetvalue || 0),
    remarks: row.remarks || ''
  };
}

function mapAssetToDb(asset: Partial<Asset>): any {
  const row: any = {};
  if (asset.serialNumber !== undefined) row.serialnumber = asset.serialNumber;
  if (asset.tagNo !== undefined) row.tagno = asset.tagNo;
  if (asset.category !== undefined) row.category = asset.category;
  if (asset.brand !== undefined) row.brand = asset.brand;
  if (asset.model !== undefined) row.model = asset.model;
  if (asset.purchaseDate !== undefined) row.purchasedate = asset.purchaseDate;
  if (asset.warrantyExpiry !== undefined) row.warrantyexpiry = asset.warrantyExpiry;
  if (asset.status !== undefined) row.status = asset.status;
  if (asset.assignedTo !== undefined) row.assignedto = asset.assignedTo || null;
  if (asset.photoUrl !== undefined) row.photourl = asset.photoUrl;
  if (asset.companyId !== undefined) row.companyid = asset.companyId;
  if (asset.assetValue !== undefined) row.assetvalue = asset.assetValue;
  if (asset.remarks !== undefined) row.remarks = asset.remarks;
  return row;
}

function mapRecentActivityFromDb(row: any): RecentActivity {
  return {
    id: String(row.id),
    assetId: row.assetid,
    assetSerial: row.assetserial,
    employeeId: row.employeeid || '',
    employeeName: row.employeename,
    date: row.date,
    action: row.action as 'Assigned' | 'Returned'
  };
}

function mapVaultEntryFromDb(row: any): VaultEntry {
  return {
    id: row.id,
    title: row.title,
    username: row.username || '',
    encryptedPassword: row.encryptedpassword,
    iv: row.iv,
    url: row.url || '',
    notes: row.notes || '',
    category: row.category as VaultCategory,
    accessLevel: row.accesslevel as VaultAccess,
    ownerId: row.ownerid,
    ownerName: row.ownername,
    companyId: row.companyid,
    createdAt: row.createdat,
    updatedAt: row.updatedat
  };
}

function mapVaultEntryToDb(entry: Partial<VaultEntry>): any {
  const row: any = {};
  if (entry.title !== undefined) row.title = entry.title;
  if (entry.username !== undefined) row.username = entry.username;
  if (entry.encryptedPassword !== undefined) row.encryptedpassword = entry.encryptedPassword;
  if (entry.iv !== undefined) row.iv = entry.iv;
  if (entry.url !== undefined) row.url = entry.url;
  if (entry.notes !== undefined) row.notes = entry.notes;
  if (entry.category !== undefined) row.category = entry.category;
  if (entry.accessLevel !== undefined) row.accesslevel = entry.accessLevel;
  if (entry.ownerId !== undefined) row.ownerid = entry.ownerId;
  if (entry.ownerName !== undefined) row.ownername = entry.ownerName;
  if (entry.companyId !== undefined) row.companyid = entry.companyId;
  if (entry.createdAt !== undefined) row.createdat = entry.createdAt;
  if (entry.updatedAt !== undefined) row.updatedat = entry.updatedAt;
  return row;
}

// ─── CRUD Functions ───────────────────────────────────────────────────────────

export const getCompanies = async (): Promise<Company[]> => {
  if (companies) return companies;
  const { data, error } = await supabase.from('companies').select('*');
  if (error) throw error;
  companies = (data || []).map(mapCompanyFromDb);
  return companies;
};

export const getEmployees = async (): Promise<Employee[]> => {
  if (employees) return employees;
  const { data, error } = await supabase.from('employees').select('*');
  if (error) throw error;
  employees = (data || []).map(mapEmployeeFromDb);
  return employees;
};

export const getAssets = async (): Promise<Asset[]> => {
  if (assets) return assets;
  const { data, error } = await supabase.from('assets').select('*');
  if (error) throw error;
  assets = (data || []).map(mapAssetFromDb);
  return assets;
};

export const getRecentActivity = async (): Promise<RecentActivity[]> => {
  if (recentActivity) return recentActivity;
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('date', { ascending: false })
    .limit(5);
  if (error) {
    console.error("[Data] Error fetching recent activity:", error);
    return [];
  }
  recentActivity = (data || []).map(mapRecentActivityFromDb);
  return recentActivity;
};

export const getCompanyById = async (id: string): Promise<Company | undefined> => {
    const allCompanies = await getCompanies();
    return allCompanies.find(c => c.id === id);
};

export const getEmployeeById = async (id: string): Promise<Employee | undefined> => {
    const allEmployees = await getEmployees();
    return allEmployees.find(e => e.id === id);
};

export const getAssetById = async (id: string): Promise<Asset | undefined> => {
    const allAssets = await getAssets();
    return allAssets.find(a => a.id === id);
};

export const updateEmployee = async (employeeId: string, data: Partial<Omit<Employee, 'id'>>) => {
    const dbData = mapEmployeeToDb(data);
    const { error } = await supabase.from('employees').update(dbData).eq('id', employeeId);
    if (error) throw error;
    clearCache();
};

export const createEmployee = async (data: Omit<Employee, 'id' | 'avatarUrl' | 'active'>) => {
    const newId = Math.random().toString(36).substring(2, 15);
    const dbData = mapEmployeeToDb({ ...data, avatarUrl: '', active: false });
    const { error } = await supabase.from('employees').insert({ id: newId, ...dbData });
    if (error) throw error;
    clearCache();
};

export const deleteEmployee = async (employeeId: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', employeeId);
    if (error) throw error;
    clearCache();
};

export const addAsset = async (data: Omit<Asset, 'id' | 'history' | 'status' | 'warrantyExpiry' | 'assignedTo'>) => {
    const newId = Math.random().toString(36).substring(2, 15);
    const warranty = new Date(new Date(data.purchaseDate).setFullYear(new Date(data.purchaseDate).getFullYear() + 2)).toISOString().split('T')[0];
    const dbData = mapAssetToDb({
        ...data,
        status: 'Available',
        assignedTo: '',
        warrantyExpiry: warranty
    });
    const { error } = await supabase.from('assets').insert({ id: newId, ...dbData });
    if (error) throw error;
    clearCache();
};

export const updateAsset = async (assetId: string, data: Partial<Omit<Asset, 'id'>>) => {
    const { data: originalData, error: originalError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (originalError) throw originalError;
    const originalAsset = mapAssetFromDb(originalData);

    const dbData = mapAssetToDb(data);
    const { error } = await supabase.from('assets').update(dbData).eq('id', assetId);
    if (error) throw error;

    // Log assignment or return activity
    if (data.assignedTo !== undefined && data.assignedTo !== originalAsset.assignedTo) {
        if (data.assignedTo) {
            const { data: empData } = await supabase.from('employees').select('*').eq('id', data.assignedTo).single();
            if (empData) {
                const employee = mapEmployeeFromDb(empData);
                const { error: logError } = await supabase.from('activity_logs').insert({
                    assetid: assetId,
                    assetserial: data.serialNumber || originalAsset.serialNumber,
                    employeeid: employee.id,
                    employeename: employee.name,
                    action: 'Assigned',
                    date: new Date().toISOString()
                });
                if (logError) console.error("Error creating assignment log:", logError);
            }
        } else {
            const { error: logError } = await supabase.from('activity_logs').insert({
                assetid: assetId,
                assetserial: originalAsset.serialNumber,
                employeeid: originalAsset.assignedTo || null,
                employeename: originalAsset.assignedTo ? (await getEmployeeById(originalAsset.assignedTo))?.name || 'Unknown' : 'Unknown',
                action: 'Returned',
                date: new Date().toISOString()
            });
            if (logError) console.error("Error creating return log:", logError);
        }
    }

    clearCache();
};

export const addCompany = async (data: Omit<Company, 'id'>) => {
    const newId = Math.random().toString(36).substring(2, 15);
    const dbData = mapCompanyToDb(data);
    const { error } = await supabase.from('companies').insert({ id: newId, ...dbData });
    if (error) throw error;
    clearCache();
};

export const updateCompany = async (companyId: string, data: Partial<Omit<Company, 'id'>>) => {
    const dbData = mapCompanyToDb(data);
    const { error } = await supabase.from('companies').update(dbData).eq('id', companyId);
    if (error) throw error;
    clearCache();
};

export const deleteCompany = async (companyId: string) => {
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    if (error) throw error;
    clearCache();
};

// ─── Vault (Password Manager) ─────────────────────────────────────────────────

export const getVaultEntries = async (
    companyId: string,
    userId: string,
    isAdmin: boolean
): Promise<VaultEntry[]> => {
    try {
        const { data, error } = await supabase
          .from('vault')
          .select('*')
          .eq('companyid', companyId);

        if (error) throw error;

        const allEntries = (data || []).map(mapVaultEntryFromDb);

        return allEntries.filter(entry => {
            if (entry.accessLevel === 'company') return true;
            if (entry.accessLevel === 'admins' && isAdmin) return true;
            if (entry.ownerId === userId) return true;
            return false;
        });
    } catch (error) {
        console.error('[Data] Error fetching vault entries:', error);
        return [];
    }
};

export const addVaultEntry = async (data: Omit<VaultEntry, 'id'>): Promise<string> => {
    const newId = Math.random().toString(36).substring(2, 15);
    const dbData = mapVaultEntryToDb(data);
    const { error } = await supabase.from('vault').insert({ id: newId, ...dbData });
    if (error) throw error;
    return newId;
};

export const updateVaultEntry = async (entryId: string, data: Partial<Omit<VaultEntry, 'id'>>): Promise<void> => {
    // If password/IV changed, archive original password to password history
    if (data.encryptedPassword !== undefined && data.iv !== undefined) {
        try {
            await supabase.from('vault_password_history').insert({
                vaultentryid: entryId,
                encryptedpassword: data.encryptedPassword,
                iv: data.iv,
                updatedat: new Date().toISOString()
            });
        } catch (err) {
            console.error("Failed to archive password history:", err);
        }
    }

    const dbData = mapVaultEntryToDb(data);
    const { error } = await supabase.from('vault').update(dbData).eq('id', entryId);
    if (error) throw error;
};

export const deleteVaultEntry = async (entryId: string): Promise<void> => {
    const { error } = await supabase.from('vault').delete().eq('id', entryId);
    if (error) throw error;
};
