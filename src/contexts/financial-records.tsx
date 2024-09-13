import { ReactNode, createContext, useEffect, useState } from "react";
import { useAuth } from ".";
import logger from "@/helper/logger";
import { fetchApi } from "./auth";

interface FinancialRecordCategories {
	business: string | object;
	household: string | object;
	savings: object;
	loans: object;
}

export interface FinancialRecord {
	_id?: string;
	id?: string;
	date: string | number | Date;
	updatedDate?: string | number | Date;
	amount: number;
	originalAmount?: number;
  currency?: "USD" | "RIEL" | (string&{});
	category: keyof FinancialRecordCategories | (string&{});
	childCategory?: string;
	paymentMethod: string;
	note?: string;
	error?: any;
}

type TypeOfDataRecords = 'Local Storage'|'Cloud Storage'|(string&{})

type ExchangeRateType = {
  from: string, to: string, 
  buy: number, sell: number, unit?: string
}

type ExchangeRateData = {
  default: number,
  ABA?: ExchangeRateType
  ACLEDA?: ExchangeRateType
}

export interface FinancialRecordContextProps {
	records: Prettify<FinancialRecord>[];
	addRecord: (newRecord: FinancialRecord) => Promise<FinancialRecord[] | undefined>;
	updateRecord: (id: string, newRecord: FinancialRecord) => Promise<FinancialRecord[] | undefined>;
	deleteRecord: (record: FinancialRecord) => Promise<FinancialRecord[] | undefined>;
  onTypeofDataRecordsChange: (value: TypeOfDataRecords) => void;
  newRecordIsAdded: boolean;
  exchangeRateData: ExchangeRateData
  onExchangeRateData: () => Promise<ExchangeRateData|undefined>
}

export const FinancialRecordContext = createContext<
	FinancialRecordContextProps | undefined
>(undefined);

export const setItemStorageFinancialRecord = (records: FinancialRecord[]) => {
	localStorage.setItem("financialRecordsData", JSON.stringify(records))
}

export const getItemStorageFinancialRecord = () => {
	const financialRecordsStorage = localStorage.getItem("financialRecordsData")
  
  const records = financialRecordsStorage ? JSON.parse(financialRecordsStorage) : [];
  return records
}

export const fetchRecords = async (userId:string, id="", options?: RequestInit, error?: ErrorFunction) => {
  return await fetchApi(`/${userId}/records/` + id, options, error);
}

const headers = {
  "Content-Type": "application/json"
}

export const FinancialRecordProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
  const { user, handleRefreshToken } = useAuth();
  const userId = user._id || user.userId;
  const [typeofDataRecords, setTypeofDataRecords] = useState<TypeOfDataRecords>('Local Storage');
  const [refreshErrorToken, setRefreshErrorToken] = useState(false);

	const [records, setRecords] = useState<FinancialRecord[]>(() => {
    let records = [];
    if(typeofDataRecords === 'Local Storage'){
      records = getItemStorageFinancialRecord()
    }

    return records;
	});
  const [newRecordIsAdded, setNewRecordIsAdded] = useState(false);

  const rate = localStorage.getItem('exchangeRate');
  const [exchangeRateData, setExchangeRateData] = useState(() => {
    return rate ? {default: 4000, ...(JSON.parse(rate))} : {default: 4000}
  });


	function handleOnChangeRecords(updateRecords: FinancialRecord[]){
		setRecords(updateRecords);
    if(typeofDataRecords === "Local Storage"){
      setItemStorageFinancialRecord(updateRecords);
    }
		return updateRecords
	}
	const addRecord = async (newRecord: Partial<FinancialRecord>) => {
    if(typeofDataRecords === "Cloud Storage"){
      const body = JSON.stringify(newRecord);

      return await fetchRecords(userId, '', {method: "POST", headers, body}, handleRefreshToken).then(data=> {
        logger?.log("ADD Record:", data);
        if(!data) return;

        newRecord = {...newRecord, ...data}
        const updateRecords = [...records, newRecord] as FinancialRecord[];
        setNewRecordIsAdded(true);
        setTimeout(()=> {
          setNewRecordIsAdded(false);
        },200);
        return handleOnChangeRecords(updateRecords)
      })
    }

    const updateRecords = [...records, newRecord] as FinancialRecord[];
    setNewRecordIsAdded(true);
    setTimeout(()=>{
      setNewRecordIsAdded(false);
    },200);
    return handleOnChangeRecords(updateRecords)
	};
	const updateRecord = async (id: string, record: FinancialRecord) => {
    record.updatedDate = new Date().toISOString();

    if(record._id && typeofDataRecords === "Cloud Storage"){
      const body = JSON.stringify(record);
      return await fetchRecords(userId, record._id, {method: "PATCH", headers, body}, handleRefreshToken).then(data=>{ 
        logger?.log("UPDATE Record:", data)
        if(!data) return;

        record = {...record, ...data}
        const updateRecords = records.map(v => 
          v.id === id ? {...v, ...record} : v
        );
        return handleOnChangeRecords(updateRecords)
      })
    }
		const updateRecords = records.map(v => 
			v.id === id ? {...v, ...record} : v
		);
		return handleOnChangeRecords(updateRecords)
	};
	const deleteRecord = async (record: FinancialRecord) => {
    if(record._id && typeofDataRecords === "Cloud Storage"){
      return await fetchRecords(userId, record._id, {method: "DELETE", headers}, handleRefreshToken).then(data=>{
        logger?.log("DELETE Record:", data)
        if(!data) return;

        const updateRecords = records.filter(v => v._id !== record._id);
        return handleOnChangeRecords(updateRecords)
      })
    }
		const updateRecords = records.filter(v => v.id !== record.id);
		return handleOnChangeRecords(updateRecords)
	};

  const onTypeofDataRecordsChange = (val: TypeOfDataRecords) => {
    setTypeofDataRecords(val);
    setRefreshErrorToken(true);
  }

  const onExchangeRateData = async () => {
    let exchangeRate = exchangeRateData
    let data = await fetchApi('/exchange-rate');
    if(data){
      exchangeRate.ABA = data.ABA[0]
      exchangeRate.ACLEDA = data.ACLEDA[0]
      localStorage.setItem('exchangeRate', JSON.stringify(exchangeRate))
      setExchangeRateData(exchangeRate);
    }
    return exchangeRate as ExchangeRateData | undefined;
  }

  useEffect(() => {
    if(typeofDataRecords === "Cloud Storage" && refreshErrorToken){
      setRefreshErrorToken(false);
      ;(async()=>{
        const data = await fetchRecords(userId, '', undefined, async (err) => {
          await handleRefreshToken(err, async () => setRefreshErrorToken(true));
          !(err instanceof Error) && logger?.log("Error Data From API: ", err);
        });
        if(!data){
          return;
        }
        let records = data as FinancialRecord[];
        setRecords(records)
      })();
    } else if(typeofDataRecords === "Local Storage") {
      setRecords(getItemStorageFinancialRecord())
    }
  },[typeofDataRecords, refreshErrorToken])

  useEffect(() => {
    if(!rate){
      onExchangeRateData();
    }
  },[]);

	return (
		<FinancialRecordContext.Provider
			value={{ 
        records, addRecord, updateRecord, deleteRecord, 
        onTypeofDataRecordsChange, newRecordIsAdded,
        exchangeRateData, onExchangeRateData,
      }}
		>
			{children}
		</FinancialRecordContext.Provider>
	);
};