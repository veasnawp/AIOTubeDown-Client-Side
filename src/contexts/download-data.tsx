import { ReactNode, createContext, useEffect, useState } from "react";
// import { useAuth } from ".";
import logger from "@/helper/logger";
import { fetchApi } from "./auth";
import { electronAppPath } from "@/App/electron/ipc";
import { removeDuplicateObjArray } from "@/utils";
import { Table as TanstackTable } from "@tanstack/react-table";
import { isDev } from "@/api/backend/config";

export const typeDownloadData = ["DEFAULT", "FAST"] as const
export const downloadPopularSortByData = ["newest", "popular", "oldest"] as const
export const youtubeSortByData = ["videos", "shorts", "streams"] as const
export const videoResolutionData = ["360", "480", "720", "1080", "1440", "2160", "4320"] as const
export const videoDownloadTypeData = ["horizontal","vertical"] as const
export const audioQualityData = ["320", "256", "192", "128", "64"] as const

export const dataTabs = ["Downloading", "Completed", "Uncompleted"] as const;

export const videoFormatSelection = (downloadType: typeof videoDownloadTypeData[number] | (string&{}) = 'horizontal') => {
  const resolutions = downloadType === "horizontal"
    ? [ "640x360", "854x480", "1280x720", "1920x1080", "2560x1440", "3840x2160", "7680x4320" ]
    : [ "360x640", "480x854", "720x1280", "1080x1920", "1440x2560", "2160x3840", "4320x7680" ]
  // const resolutionText = isMobile667 ? "" : ""
  // const resolutionText = isMobile667 ? "" : "Resolution: "
  return [
    { value: '360', label: `${resolutions[0]} - Normal` },
    { value: '480', label: `${resolutions[1]} - Standard` },
    { value: '720', label: `${resolutions[2]} - HD` },
    { value: '1080', label: `${resolutions[3]} - Full HD` },
    { value: '1440', label: `${resolutions[4]} - 2K` },
    { value: '2160', label: `${resolutions[5]} - 4K` },
    { value: '4320', label: `${resolutions[6]} - 8K` },
  ]
}

interface SimpleData extends DataTableTabs, Record<string,any> {
  dataExtraction: IYouTube[]
  dataExtractionTest: IYouTube[]
  downloadTab: (typeof dataTabs)[number] | (string & {})
}

declare global {
  interface DownloadRecordContextProps {
    downloadSettings: Prettify<DownloadSettingsType>;
    updateDownloadSettings: (updateSettingsValue: Prettify<Partial<DownloadSettingsType>>, saveLocal?: boolean) => DownloadSettingsType
    downloadRecords: Prettify<IYouTube>[];
    addDownloadRecord: (newRecord: IYouTube) => IYouTube[];
    addManyDownloadRecords: (newRecords: IYouTube[]) => IYouTube[];
    deleteManyDownloadRecords: (newRecords: IYouTube[]) => IYouTube[];
    updateDownloadRecord: (progressId: string, newRecord: IYouTube) => IYouTube[];
    refreshDownloadDataRecords: () => void;

    simpleData: Prettify<SimpleData>
    updateSimpleData: (dataUpdate: Partial<SimpleData>) => SimpleData
    downloadProgressBar: DownloadProgressBarType
    updateDownloadProgressBar: (dataProgressBarUpdate: DownloadProgressBarType, options?: {saveLocal?: boolean, new?: boolean}) => DownloadProgressBarType
  }
  interface DownloadSettingsType extends Record<string, any> {
    videoLinks: string[]
    downloadAs: 'video' | 'audio' | (string&{})
    saveFolderPath: string
    saveFolderAs: 'profile' | 'playlist' | (string&{})
    saveFolderAsProfile: boolean
    directDownload: boolean
    justExtracting: boolean
    limitDownload: number
    popularSortBy: (typeof downloadPopularSortByData)[number] | (string&{})
    youtubeSortBy: (typeof youtubeSortByData)[number] | (string&{})
    videoResolution: (typeof videoResolutionData)[number] | (string&{})
    audioQuality: (typeof audioQualityData)[number] | (string&{})
    videoDownloadType: (typeof videoDownloadTypeData)[number] | (string&{})
    typeDownload: (typeof typeDownloadData)[number] | (string&{})
    downloadWithThumbnail: boolean
    autoTranslateToEnglish: boolean
    downloadFilesInTheSameTime: number
    kuaishouCookie: string
    use_custom_cpu_if_available_more_then_12: boolean
    cpu: number
  }
  type DownloadProgressBarType = Record<`progressBar-${string}`,any>
  type DataTableTabs = {
    dataTableDownloading: TanstackTable<IYouTube> & Record<string,any>
    dataTableDownloadCompleted: TanstackTable<IYouTube> & Record<string,any>
    dataTableDownloadUnCompleted: TanstackTable<IYouTube> & Record<string,any>
  }
}

export const DownloadRecordContext = createContext<
	DownloadRecordContextProps | undefined
>(undefined);

export const setItemStorageDownloadSettings = (settingsValue: any) => {
	localStorage.setItem("downloadSettings", JSON.stringify(settingsValue))
}

export const getItemStorageDownloadSettings = ():DownloadSettingsType => {
	const downloadSettingsStorage = localStorage.getItem("downloadSettings");
  let settings = {} as any
  try {
    settings = downloadSettingsStorage ? JSON.parse(downloadSettingsStorage) : {};
  } catch {}
  return settings
}

export const setItemStorageDownloadRecord = (records: IYouTube[]) => {
	localStorage.setItem("downloadRecordsData", JSON.stringify(records))
}

export const getItemStorageDownloadRecord = () => {
	const downloadRecordsStorage = localStorage.getItem("downloadRecordsData")
  
  let records = [];
  try {
    records = downloadRecordsStorage ? JSON.parse(downloadRecordsStorage) : [];
  } catch {}
  return records
}

export const fetchRecords = async (userId:string, id="", options?: RequestInit, error?: ErrorFunction) => {
  return await fetchApi(`/${userId}/records/` + id, options, error);
}

const headers = {
  "Content-Type": "application/json"
}

export const DownloadRecordProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
  // const { user, handleRefreshToken } = useAuth();
  // const userId = user._id || user.userId;
  const defaultDownloadSettings = {
    videoLinks: [],
    downloadAs: 'video',
    saveFolderAsProfile: true,
    directDownload: false,
    justExtracting: true,
    limitDownload: 15,
    popularSortBy: 'newest',
    youtubeSortBy: 'videos',
    videoResolution: '720',
    audioQuality: '128',
    videoDownloadType: 'horizontal'
  }
	const [downloadSettings, setDownloadSettings] = useState<DownloadSettingsType>(() => {
    let settings = getItemStorageDownloadSettings();
    return Object.assign({
      saveFolderPath: electronAppPath?.downloadPath || '',
      saveFolderAs: 'profile',
      typeDownload: 'FAST',
      downloadWithThumbnail: false,
      autoTranslateToEnglish: false,
      downloadFilesInTheSameTime: 3,
      kuaishouCookie: '',
      use_custom_cpu_if_available_more_then_12: false,
      cpu: 8,
    }, settings, defaultDownloadSettings);
	});
	const [downloadRecords, setDownloadRecords] = useState<IYouTube[]>(() => {
    let records = getItemStorageDownloadRecord();
    return records;
	});
  let dataExtractionStorage = localStorage.getItem("dataExtraction");
	const [simpleData, setSimpleData] = useState<SimpleData>(()=>{
    let dataExtraction: IYouTube[] = dataExtractionStorage ? JSON.parse(dataExtractionStorage) : [];
    if(!isDev && dataExtraction.length > 0){
      dataExtraction = dataExtraction.filter(dt => new Date(dt.createTime as number).getTime() >= new Date().getTime());
      localStorage.setItem("dataExtraction", JSON.stringify(dataExtraction));
    }
    return {
      dataTableDownloading: {} as any,
      dataTableDownloadCompleted: {} as any,
      dataTableDownloadUnCompleted: {} as any,
      dataExtraction: dataExtraction,
      dataExtractionTest: [],
      downloadTab: ''
    }
  });
  let downloadProgressBarLocal = localStorage.getItem("downloadProgressBar");
  const [downloadProgressBar, setDownloadProgressBar] = useState<DownloadProgressBarType>({
    // "progressBar-123": {},
    ...(downloadProgressBarLocal ? JSON.parse(downloadProgressBarLocal) : {}),
  });


	function updateDownloadProgressBar(dataProgressBarUpdate: DownloadProgressBarType, options?: {saveLocal?: boolean, new?: boolean}){
    options = {
      saveLocal: true,
      ...options
    }
    let dataProgressBar = {...downloadProgressBar, ...dataProgressBarUpdate};
    if(options.new){
      dataProgressBar = dataProgressBarUpdate;
    }
    if(options.saveLocal){
      localStorage.setItem("downloadProgressBar", JSON.stringify(dataProgressBar));
      const downloadProgressBarItems = JSON.parse(localStorage.getItem("downloadProgressBar") as string);
      dataProgressBar = {...dataProgressBar, ...downloadProgressBarItems}
    }
		setDownloadProgressBar(dataProgressBar);

		return dataProgressBar
  }

	function updateSimpleData(dataUpdate: Partial<SimpleData>){
    const updateSimpleData = {...simpleData, ...dataUpdate}
		setSimpleData(updateSimpleData);

		return updateSimpleData
  }

	function updateDownloadSettings(settingsValue: Partial<DownloadSettingsType>, saveLocal=true){
    const updateSettings = {...downloadSettings, ...settingsValue}
		setDownloadSettings(updateSettings);
    if(saveLocal){
      setItemStorageDownloadSettings(updateSettings);
    }
		return updateSettings
  }

	function handleOnChangeRecords(updateRecords: IYouTube[], saveLocal=true){
    updateRecords = removeDuplicateObjArray(updateRecords, 'progressIdTime');
		setDownloadRecords(updateRecords);
    if(saveLocal){
      setItemStorageDownloadRecord(updateRecords);
    }
		return updateRecords
  }

  const addDownloadRecord = (newRecord: IYouTube) => {
    const info = newRecord.info_dict
    if(!newRecord.progressId)
      newRecord.progressId = `${info.extractor_key?.toLowerCase()}-${info.id}`
    if(!newRecord.createTime)
      newRecord.createTime = new Date().getTime();
    newRecord.progressIdTime = `${newRecord.progressId}-${newRecord.createTime}`
		const updateRecords = [...downloadRecords, newRecord]
		return handleOnChangeRecords(updateRecords)
	};

  const addManyDownloadRecords = (newRecords: IYouTube[]) => {
    newRecords = newRecords.map(newRecord => {
      const info = newRecord.info_dict
      if(!newRecord.progressId)
        newRecord.progressId = `${info.extractor_key?.toLowerCase()}-${info.id}`
      if(!newRecord.createTime)
        newRecord.createTime = new Date().getTime();
      newRecord.progressIdTime = `${newRecord.progressId}-${newRecord.createTime}`
      return newRecord
    })
		const updateRecords = [...downloadRecords, ...newRecords]
		return handleOnChangeRecords(updateRecords)
	};

  const deleteManyDownloadRecords = (newRecords: IYouTube[]) => {
    const progressIdTimeSelectedRows = newRecords.map(dt => `${dt.progressId}-${dt.createTime}`)
    const updateRecords = downloadRecords.filter(dt => !dt.selected && !progressIdTimeSelectedRows.some(v => v === `${dt.progressId}-${dt.createTime}`))
		return handleOnChangeRecords(updateRecords)
	};

  const updateDownloadRecord = (progressId: string, record: IYouTube) => {
    record.createTime = new Date().getTime();

		const updateRecords = downloadRecords.map(v => 
			v.progressId === progressId ? {...v, ...record} : v
		);
		return handleOnChangeRecords(updateRecords)
	};

  let resolveUseEffectMultiLoad = true;
  useEffect(() => {
    if(!window){
      return
    }
    if(resolveUseEffectMultiLoad){
      resolveUseEffectMultiLoad = false;
      refreshDownloadDataRecords();
    }
  },[]);

  const refreshDownloadDataRecords = () => {
    updateDownloadSettings({cpu: window.navigator.hardwareConcurrency})
    if(downloadRecords.length > 0){
      const downloadProgressBarUpdate = {} as DownloadProgressBarType
      downloadRecords.forEach(dt => {
        const progressIdTime = `${dt.progressId}-${dt.createTime}`;
        if(`progressBar-${progressIdTime}` in downloadProgressBar){
          downloadProgressBarUpdate[`progressBar-${progressIdTime}`] = downloadProgressBar[`progressBar-${progressIdTime}`]
          if(downloadProgressBar[`progressBar-${progressIdTime}`].completed === 'downloading'){
            downloadProgressBarUpdate[`progressBar-${progressIdTime}`].completed = 'uncompleted'
          }
          if(downloadProgressBar[`progressBar-${progressIdTime}`]?.progress >= 100){
            downloadProgressBarUpdate[`progressBar-${progressIdTime}`].completed = 'completed'
          }
        }
      });
      updateDownloadProgressBar(downloadProgressBarUpdate, {new: true});
      const downloadProgressBarKeys = Object.keys(downloadProgressBarUpdate);
      if(downloadProgressBarKeys.length > 0){
        const allKeyString = downloadProgressBarKeys.join(',')
        const downloadRecordsUpdate = downloadRecords.filter(dt => allKeyString.includes(dt.progressIdTime)).map(dt => {
          const progressIdTime = `${dt.progressId}-${dt.createTime}`;
          if(`progressBar-${progressIdTime}` in downloadProgressBarUpdate){
            dt.completed = downloadProgressBarUpdate[`progressBar-${progressIdTime}`].completed || dt.completed
          }
          return {
            ...dt
          }
        })
        handleOnChangeRecords(downloadRecordsUpdate)
      }
    } else {
      updateDownloadProgressBar({}, {new: true})
    }
  }

	return (
		<DownloadRecordContext.Provider
			value={{ 
        downloadRecords, addDownloadRecord, addManyDownloadRecords, deleteManyDownloadRecords, updateDownloadRecord,
        downloadSettings, updateDownloadSettings,
        simpleData, updateSimpleData,
        downloadProgressBar, updateDownloadProgressBar,
        refreshDownloadDataRecords
      }}
		>
			{children}
		</DownloadRecordContext.Provider>
	);
};