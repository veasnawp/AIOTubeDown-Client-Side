import { ReactNode, createContext, useEffect, useState } from "react";
import { useAuth } from ".";
import logger from "@/helper/logger";
import { fetchApi, getUserSession, removeUserStorage } from "./auth";
import { isArray } from "@/utils";
import { isDesktopApp } from "@/App/electron/ipc";

interface ItemLicenseRecord extends Record<string, any> {
	key: string
}

type TypeOfDataRecords = 'Local Storage'|'Cloud Storage'|(string&{})

export const paymentMethodData = ["Cash", "Credit Card", "Bank Transfer", "QR Code"] as const;

declare global {
  interface LicenseRecord {
    _id?: string;
    id: string
    userId: string
    status: 'trial' | 'expired' | 'pending' | 'activated' | (string&{})
    modifyDateActivated: string
    activationDays: number
    expiresAt: string
    currentPlan: '1 Day' | '3 Days' | '7 Days' | '1 Month' | '3 Months' | '1 Year' | 'Lifetime' | 'Family' | (string&{})
    historyLicenseBough: string[]
    toolName: string
    productId: string
    category: string
    paymentMethod: (typeof paymentMethodData)[number]
    note?: string
    options?: Record<string,any>
    error?: any;
  }
  interface LicenseRecordContextProps {
    licenseRecords: Prettify<LicenseRecord>[];
    addLicenseRecord: (newRecord: Omit<Partial<LicenseRecord>,'userId'> & {userId:string}) => Promise<LicenseRecord[] | undefined>;
    getLicenseRecords: (id: string) => Promise<LicenseRecord[] | undefined>;
    updateLicenseRecord: (id: string, newRecord: Partial<LicenseRecord>) => Promise<LicenseRecord[] | undefined>;
    deleteLicenseRecord: (record: Partial<LicenseRecord>) => Promise<LicenseRecord[] | undefined>;
    newLicenseRecordIsAdded: boolean;
  }
}

export const LicenseRecordContext = createContext<
	LicenseRecordContextProps | undefined
>(undefined);

export const setItemStorageLicenseRecord = (records: LicenseRecord[]) => {
	localStorage.setItem("licenseRecordsData", JSON.stringify(records))
}

export const getItemStorageLicenseRecord = () => {
	const licenseRecordsStorage = localStorage.getItem("licenseRecordsData")
  
  const records = licenseRecordsStorage ? JSON.parse(licenseRecordsStorage) : [];
  return records
}

export const fetchLicenseRecords = async (userId:string, id="", options?: RequestInit, error?: ErrorFunction) => {
  return await fetchApi(`/${userId}/l-records/` + id, options, error);
}

const headers = {
  "Content-Type": "application/json"
}

export const LicenseRecordProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
  const { user, onUserChange, handleRefreshToken, logOut } = useAuth();
  const userId = user._id || user.userId;

	const [records, setRecords] = useState<LicenseRecord[]>(() => {
    let records = getItemStorageLicenseRecord();
    return records;
	});
  const [newRecordIsAdded, setNewRecordIsAdded] = useState(false);


	function handleOnChangeRecords(updateRecords: LicenseRecord[]){
		setRecords(updateRecords);
		return updateRecords
	}
  const getRecords = async (user_id: string) => {
    return await fetchLicenseRecords(user_id, '', {method: "GET", headers}, handleRefreshToken).then(data=>{ 
      logger?.log("data Records:", data)
      if(!data) return;
  
      const licenses = data as LicenseRecord[];
      return handleOnChangeRecords(licenses)
    }) as LicenseRecord[] | undefined
	};
	const addRecord = async (newRecord: Partial<LicenseRecord>) => {
    const body = JSON.stringify(newRecord);

    return await fetchLicenseRecords(userId, '', {method: "POST", headers, body}, handleRefreshToken).then(data=> {
      logger?.log("ADD Record:", data);
      if(!data) return;

      newRecord = {...newRecord, ...data}
      newRecord.id = newRecord._id
      const updateRecords = [...records, newRecord] as LicenseRecord[];
      setNewRecordIsAdded(true);
      setTimeout(()=> {
        setNewRecordIsAdded(false);
      },200);
      return handleOnChangeRecords(updateRecords)
    })
	};
	const updateRecord = async (id: string, record: Partial<LicenseRecord>) => {
    const body = JSON.stringify(record);
    return await fetchLicenseRecords(userId, id, {method: "PATCH", headers, body}, handleRefreshToken).then(data=>{ 
      logger?.log("UPDATE Record:", data)
      if(!data) return;

      record = {...record, ...data}
      const updateRecords = records.map(v => 
        v.id === id ? {...v, ...record} : v
      );
      return handleOnChangeRecords(updateRecords)
    })
	};
	const deleteRecord = async (record: Partial<LicenseRecord>) => {
    return await fetchLicenseRecords(userId, record._id, {method: "DELETE", headers}, handleRefreshToken).then(data=>{
      logger?.log("DELETE Record:", data)
      if(!data) return;

      const updateRecords = records.filter(v => v._id !== record._id);
      return handleOnChangeRecords(updateRecords)
    })
	};

  let resolveUseEffectMultiLoad = true;
  useEffect(()=>{
    if(resolveUseEffectMultiLoad){
      resolveUseEffectMultiLoad = false;
      useEffectFunc();
    }
  },[])

  async function useEffectFunc() {
    const session = await getUserSession();
    logger?.log("session", session, user)
    if(session && !session?.error){
      const user = session;
      if (user._id && isArray(user.licenses) && user.licenses.length > 0) {
        const licenses = await getRecords(user._id);
        onUserChange({...user, licenses: licenses || user.licenses});
      } else {
        onUserChange(session);
      }
    } else {
      if(!['/register','/login'].some(v => window?.location?.pathname.startsWith(v))){
        logOut();
      } else {
        onUserChange({});
        removeUserStorage();
      }
    }
  }


	return (
		<LicenseRecordContext.Provider
			value={{ 
        licenseRecords: records, addLicenseRecord: addRecord, getLicenseRecords: getRecords,
        updateLicenseRecord: updateRecord, deleteLicenseRecord: deleteRecord, 
        newLicenseRecordIsAdded: newRecordIsAdded,
      }}
		>
			{children}
		</LicenseRecordContext.Provider>
	);
};