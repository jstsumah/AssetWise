
import type { Asset, Company, Employee, RecentActivity } from './types';
import { collection, doc, getDocs, updateDoc, addDoc, setDoc, deleteDoc, query, orderBy, limit, where } from "firebase/firestore";
import { db } from './firebase';

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

async function fetchCollection<T>(collectionName: string, cache: T[] | null, setCache: (data: T[]) => void): Promise<T[]> {
  if (cache) {
    console.log(`[Data] Returning cached ${collectionName}`);
    return cache;
  }
  try {
    console.log(`[Data] Fetching ${collectionName}...`);
    const dataCollection = collection(db, collectionName);
    const dataSnapshot = await getDocs(dataCollection);
    console.log(`[Data] Retrieved ${dataSnapshot.docs.length} documents from ${collectionName}`);
    const data = dataSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    setCache(data);
    return data;
  } catch (error) {
    console.error(`[Data] Error fetching ${collectionName}: `, error);
    throw new Error(`Failed to fetch ${collectionName}.`);
  }
}

export const getCompanies = async (): Promise<Company[]> => fetchCollection('companies', companies, (data) => companies = data);
export const getEmployees = async (): Promise<Employee[]> => fetchCollection('employees', employees, (data) => employees = data);
export const getAssets = async (): Promise<Asset[]> => fetchCollection('assets', assets, (data) => assets = data);


export const getRecentActivity = async (): Promise<RecentActivity[]> => {
    if (recentActivity) {
        console.log(`[Data] Returning cached recent activity`);
        return recentActivity;
    }
    try {
        console.log(`[Data] Fetching recent activity...`);
        const activityCollection = collection(db, 'activity');
        const q = query(activityCollection, orderBy('date', 'desc'), limit(5));
        const snapshot = await getDocs(q);
        console.log(`[Data] Retrieved ${snapshot.docs.length} activity records`);
        const activities = snapshot.docs.map(doc => doc.data() as RecentActivity);
        recentActivity = activities;
        return activities;
    } catch (error) {
        console.error("[Data] Error fetching recent activity:", error);
        return [];
    }
};

export const getCompanyById = async (id: string): Promise<Company | undefined> => {
    const allCompanies = await getCompanies();
    return allCompanies.find(c => c.id === id);
}

export const getEmployeeById = async (id: string): Promise<Employee | undefined> => {
    const allEmployees = await getEmployees();
    return allEmployees.find(e => e.id === id);
}
export const getAssetById = async (id: string): Promise<Asset | undefined> => {
    const allAssets = await getAssets();
    return allAssets.find(a => a.id === id);
}

export const updateEmployee = async (employeeId: string, data: Partial<Omit<Employee, 'id'>>) => {
    const employeeDocRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeDocRef, data);
    clearCache(); // Invalidate cache after update
}

export const createEmployee = async (data: Omit<Employee, 'id' | 'avatarUrl' | 'active'>) => {
    const employeesCollection = collection(db, 'employees');
    await addDoc(employeesCollection, { ...data, avatarUrl: '', active: false });
    clearCache();
}

export const deleteEmployee = async (employeeId: string) => {
    const employeeDocRef = doc(db, 'employees', employeeId);
    await deleteDoc(employeeDocRef);
    clearCache();
}

export const addAsset = async (data: Omit<Asset, 'id' | 'history' | 'status' | 'warrantyExpiry' | 'assignedTo'>) => {
    const assetsCollection = collection(db, 'assets');
    const newAsset: Omit<Asset, 'id'> = {
        ...data,
        status: 'Available',
        history: [],
        assignedTo: '',
        warrantyExpiry: new Date(new Date(data.purchaseDate).setFullYear(new Date(data.purchaseDate).getFullYear() + 2)).toISOString().split('T')[0], // Set warranty 2 years from purchase
    }
    await addDoc(assetsCollection, newAsset);
    clearCache();
}

export const updateAsset = async (assetId: string, data: Partial<Omit<Asset, 'id'>>) => {
    const assetDocRef = doc(db, 'assets', assetId);
    const originalAssetSnap = await getDocs(query(collection(db, 'assets'), where('__name__', '==', assetId)));
    const originalAsset = originalAssetSnap.docs[0]?.data() as Asset;
    
    await updateDoc(assetDocRef, data);

    // If an asset is assigned, log it to the activity collection
    if (data.assignedTo && data.assignedTo !== originalAsset.assignedTo) {
        const employee = await getEmployeeById(data.assignedTo);
        const asset = await getAssetById(assetId);
        
        if (employee && asset) {
            const activityLog: Omit<RecentActivity, 'id'> = {
                assetId: assetId,
                assetSerial: asset.serialNumber,
                employeeId: employee.id,
                employeeName: employee.name,
                date: new Date().toISOString(),
                action: 'Assigned'
            };
            await addDoc(collection(db, 'activity'), activityLog);
        }
    }

    clearCache(); // Invalidate cache after update
}


export const addCompany = async (data: Omit<Company, 'id'>) => {
    await addDoc(collection(db, 'companies'), data);
    clearCache();
}

export const updateCompany = async (companyId: string, data: Partial<Omit<Company, 'id'>>) => {
    const companyDocRef = doc(db, 'companies', companyId);
    await updateDoc(companyDocRef, data);
    clearCache();
}

export const deleteCompany = async (companyId: string) => {
    const companyDocRef = doc(db, 'companies', companyId);
    await deleteDoc(companyDocRef);
    clearCache();
}
