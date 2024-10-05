import { ActionIcon, alpha, Box, Button, Card, Checkbox, Collapse, Divider, Fieldset, Flex, Indicator, List, LoadingOverlay, Modal, ModalProps, MultiSelect, NumberInput, Paper, Popover, rem, ScrollArea, Select, Switch, Text, Textarea, TextInput, Title, Tooltip, useMantineTheme} from '@mantine/core'
import { useDisclosure, useHotkeys, useIntersection, useResizeObserver, useSetState, useViewportSize } from '@mantine/hooks';
import { DownloadData, ExtractorFavicon, filterData, InfoCountType } from '../Dashboard/Data/download-data-table';
import { IconCheck, IconDatabase, IconExternalLink, IconEye, IconFilter, IconFolderCog, IconHeart, IconMathEqualGreater, IconPlayerStop, IconSearch, IconSettings, IconSquareRoundedArrowDown, IconSquareRoundedPlus, IconTrash, IconWorld, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { arraySplitting, encodeJsonBtoa, isArray, isNumber, isObject, isValidUrl, removeDuplicateObjArray, toCapitalized } from '@/utils';
import { useAuth, useDownload, useLicenseRecord } from '@/contexts';
import { downloadPopularSortByData, typeDownloadData, videoFormatSelection, youtubeSortByData } from '@/contexts/download-data';
import logger, { loggerTime } from '@/helper/logger';
import { bytesToSize, formatDuration, formatDuration2, sizeToBytes } from '@/utils/format';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { defaultHeaders, isDev, isDevServerHost, localhostApi } from '@/api/backend/config';
import { ContentEmbed } from '@/components/mantine-reusable/ContentEmbed';
import { fileParse, ipcRenderer, ipcRendererInvoke, isDesktopApp, machineId, webContentSend } from '@/App/electron/ipc';
import { openExternal } from '@/App/electron/openExternal';
import { dialog } from '@/App/electron/dialog';
import { MainDashboard } from './dashboard';
import { AppName } from '@/App/config';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { dataProducts } from '../Products/data';
import { getOneProductFilter } from '../Profile';
import { notifications } from '@mantine/notifications';
import { ModalComponent, useModalState } from '@/components/mantine-reusable/ModalComponent';
import { decryptionCryptoJs, encryptionCryptoJs, generateHash } from '@/utils/scripts/crypto-js';
import { getVideoMetadataByRequest } from '@/lib/utils_media';
import { isFirstUserOnDesktop, isFirstUserTrialExpired } from '../useCheckSession';


export const Dashboard = () => {
  const useAuthData = useAuth();
  const { stateHelper, setStateHelper } = useAuthData
  const useLicenseRecordData = useLicenseRecord();

  const useDownloadData = useDownload();
  const { 
    downloadSettings, updateDownloadSettings, 
    downloadRecords, addDownloadRecord, addManyDownloadRecords, deleteManyDownloadRecords,
    simpleData, updateSimpleData,
    downloadProgressBar, updateDownloadProgressBar
  } = useDownloadData;

  useHotkeys([
    ['mod+o', () => {
      openModal();
    }],
  ]);

  const [state, setState] = useSetState({
    dataDownloadSelected: [] as IYouTube[],
    isDownloading: false,
  });

  const [openedModal, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [openedSettingsModal, { toggle: toggleSettingsModal, close: closeSettingsModal }] = useDisclosure(false);
  const [openedMainSettings, { open: openMainSettings, close: closeMainSettings }] = useDisclosure(false);
  const [openedDataInfo, { open: openDataInfo, close: closeDataInfo }] = useDisclosure(false);
  const [openedIFrame, { open: openIFrame, close: closeIFrame }] = useDisclosure(false);
  const [openedError, { open: openError, close: closeError }] = useDisclosure(false);


  const { 
    stateModalManager, 
    openModalManager, closeModalManager 
  } = useModalState();

  const [jwPlayerData, setJWPlayerData] = useState<any>('{}');

  const [dataTable, setDataTable] = useState({} as typeof simpleData['dataTableDownloading']);
  const [extracting, setExtracting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  let dataTables = {
    dataTableDownloading: simpleData.dataTableDownloading,
    dataTableDownloadCompleted: simpleData.dataTableDownloadCompleted,
    dataTableDownloadUnCompleted: simpleData.dataTableDownloadUnCompleted,
  };

  useEffect(() => {
    const isDownloading = !downloadSettings.justExtracting;
    class ExtractorHelper {
      onFinished(data: IYouTube[]){
        setExtracting(false);
        openedModal && closeModal();
        if(downloadSettings.justExtracting && data && data.length > 0){
          setTimeout(()=>{
            openDataInfo();
          },50)
        }
      }
    }
    if(extracting){
      const id = notifications.show({
        loading: true,
        color: 'teal',
        title: 'Extracting Video Info. . .',
        message: 'Grab a cup of coffee and wait until it\'s successful.',
        autoClose: false,
        withCloseButton: true,
      });
      (async function(){
        const extractorHelper = new ExtractorHelper()
        const extractor = new Extractor({downloadSettings});
        extractor.server_host = isDev ? isDevServerHost : (stateHelper.server_host || "")
        extractor.onFinished = function(data) {
          extractorHelper.onFinished(data);
          notifications.update({
            id,
            color: 'teal',
            title: 'Finished Extraction',
            message: `Total Video Info: ${data && data?.length ? data.length : 0}`,
            icon: <IconCheck style={{ width: rem(18), height: rem(18) }} />,
            loading: false,
            autoClose: 5000,
          });
        }
        extractor.onError = function(err){
          notifications.update({
            id,
            color: 'red',
            title: 'Error Extraction',
            message: `Oops... Something went wrong`,
            icon: <IconX style={{ width: rem(18), height: rem(18) }} />,
            loading: false,
            autoClose: 5000,
          });
          logger?.log("error extraction", err)
          if(err?.status === 429){
            openError();
          } else if(isDesktopApp && (err?.response?.data as any)?.error === "Invalid Machine ID"){
            openModalManager({
              title: "Invalid Machine ID",
              propsTitle: { c: "red" },
              children: function(){
                return (
                  <Flex className='space-y-4 px-4 py-8' align="center" justify="center" direction={'column'} mih={240} >
                    <div>
                      <Text fz={'sm'} ta="center">
                        Your account cannot use with this computer.<br/>
                        If you want to change, please contact our supporter or<br/>
                        click button below to contact us on Telegram
                      </Text>
                    </div>
                    <Flex justify={'center'}>
                      <Button variant='filled'
                        onClick={()=>{
                          openExternal({url: window.mainAssets?.publish$link?.telegram?.channel})
                        }}
                      >Contact Us</Button>
                    </Flex>
                  </Flex>
                )
              }(),
            })
          } else if(err && err.status === 200 && err.message.includes('Something wrong')){
            openModalManager({
              title: "Oops... Something went wrong",
              propsTitle: { c: "red" },
              children: function(){
                return (
                  <Flex className='space-y-4 px-4 py-8' align="center" justify="center" direction={'column'} mih={240} >
                    <div>
                      {
                        window.navigator.onLine ? (
                          <>
                            <Text fz={'sm'} ta="center">
                              Links maybe broken or invalid or require cookie. Please try again.
                            </Text>
                            {
                              !isDesktopApp && (
                                <Text fz={'sm'} ta="center" mt={16}>
                                  Or some links are not support on browser. . . Like<br/>
                                  YouTube, Instagram, Douyin Profile...<br/>
                                  Please download desktop application for support all these sites.<br/><br/>
                                  Thank You
                                </Text>
                              )
                            }
                          </>
                        ) : (
                          <Text fz={'lg'} ta="center">
                            Please check internet connection. . .
                          </Text>
                        )
                      }
                    </div>
                    <Flex justify={'center'}>
                      <Button variant='filled' color='green'
                        onClick={()=>{
                          closeModalManager();
                          setTimeout(()=>{
                            openModal()
                          },200)
                        }}
                      >Go Back</Button>
                    </Flex>
                  </Flex>
                )
              }(),
            })
          }
        }
        const data = await extractor.run()
        if(data){
          // addManyDownloadRecords(data)
          const oldDataExtraction = simpleData.dataExtraction.filter(dt => !data?.map(dt => dt.progressId)?.join('|').includes(dt.progressId));
          const dataExtraction = [...data, ...oldDataExtraction]
          if(isDownloading){
            const dataExtractionUpdate = data.map(dt => ({
              ...dt,
              progressIdTime: `${dt.progressId}-${dt.createTime}`,
              selected: false,
              progress: undefined,
              completed: 'downloading',
            }))
            const dataDownloadTable = removeDuplicateObjArray([...downloadRecords, ...dataExtractionUpdate], 'progressIdTime')
            addManyDownloadRecords(dataDownloadTable);
            updateSimpleData({dataExtraction, downloadTab: 'Downloading'})
            setTimeout(()=> {
              updateSimpleData({dataExtraction, downloadTab: ''})
              setState({isDownloading: true, dataDownloadSelected: dataExtractionUpdate})
            }, 50)
          } else {
            updateSimpleData({dataExtraction})
          }
          localStorage.setItem("dataExtraction", JSON.stringify(dataExtraction));
        }
        logger?.log('final data', data)
      })();
    }

  }, [extracting])

  
  useEffect(()=>{
    if(state.isDownloading && state.dataDownloadSelected.length > 0){
      onDownloading(state.dataDownloadSelected, {useDownloadData,useLicenseRecordData}, setState)
    }
  },[state.isDownloading])

  // useEffect(() => {
  //   console.log('simpleData', simpleData, dataTable)
  //   if(dataTable.options)
  //   console.log('getFilteredSelectedRowModel', dataTable?.getFilteredSelectedRowModel().rows.length)
  // },[dataTable])


  function onChangeDataTable(dataTables: DataTableTabs){
    let dataTable = dataTables.dataTableDownloading || {}
    switch (simpleData.downloadTab) {
      case 'Downloading':
        dataTable = dataTables.dataTableDownloading
        break;
      case 'Completed':
        dataTable = dataTables.dataTableDownloadCompleted
        break;
      case 'Uncompleted':
        dataTable = dataTables.dataTableDownloadUnCompleted
        break;
    
      default:
        break;
    }
    setDataTable(dataTable);
    return dataTable
  }

  function filterDataTable(dt: IYouTube, completed: IYouTube['completed']){
    return filterData(downloadProgressBar, dt, completed)
  }
  const isDownloadingTab = ['', 'Downloading'].some(v =>  simpleData.downloadTab === v);

  const { height } = useViewportSize();
  let isMobile = window.isMobile;
  if(height <= 300){
    isMobile = isMobile && window.isMobile
  }

  return (
    <MainDashboard
      scrollAreaProps={{
        className: cn(isMobile ? "h-[calc(100vh-196px)]" : "h-[calc(100vh-166px)]","md:h-[calc(100vh-96px)]")
      }}
      classNames={{
        wrapper: 'flex-col md:flex-row gap-4 md:gap-0'
      }}
      renderAboveContent={
        <div className='flex flex-row gap-1 ml-4 md:flex-col md:ml-1'>
          {
            [
              {
                label: "Add URL", tooltip: "Add URLs to download",
                icon: IconSquareRoundedPlus, color: 'green',
                onClick(){
                  openModal()
                },
              },
              {
                label: "Delete", tooltip: "Remove selected videos from the list", 
                icon: IconTrash, color: "red",
                disabled: isDownloadingTab ? true : (
                  dataTable.options ? dataTable.getFilteredSelectedRowModel().rows.length <= 0 : true
                ),
                onClick(){
                  if(dataTable.options){
                    const selectedRows = dataTable.getSelectedRowModel().rows
                    const dataSelectedRows = selectedRows.map(row => row.original)
                    deleteManyDownloadRecords(dataSelectedRows)
                  }
                },
              },
              {
                label: "Stop All", tooltip: "Stop all selected videos downloading", 
                icon: IconPlayerStop, color: "orange",
                disabled: isDownloadingTab ? downloadRecords.filter(dt => filterDataTable(dt, 'downloading')).length <= 0 : true,
                hidden: window.isMobile,
                async onClick(){
                  if(dataTable.options){
                    const selectedRows = dataTable.getSelectedRowModel().rows
                    const dataSelectedRows = selectedRows.map(row => row.original)
                    const progressIdTimeSelectedRows = dataSelectedRows.map(dt => `${dt.progressId}-${dt.createTime}`);

                    await ipcRendererInvoke("write-text-loop", "logger.txt", progressIdTimeSelectedRows.join('\n'));
                  }
                },
              },
              {
                label: "Stop Ex", tooltip: "Stop extracting videos", 
                icon: IconPlayerStop, color: "pink",
                disabled: !extracting,
                hidden: window.isMobile,
                async onClick(){
                  if(extracting){
                    notifications.show({
                      loading: true,
                      color: 'orange',
                      title: 'Stop Extracting Video Info',
                      message: 'Please waiting. . .',
                      autoClose: false,
                      withCloseButton: false,
                    });
                    ipcRendererInvoke("restart-download-app");
                    setExtracting(false);
                    setTimeout(()=>{
                      setStateHelper({serverIsLive: false})
                    },1000)
                  }
                },
              },
              {
                label: "Download", tooltip: "ReDownload selected items from the list",
                icon: IconSquareRoundedArrowDown, color: "green.7",
                disabled: isDownloadingTab ? true : (
                  dataTable.options ? dataTable.getFilteredSelectedRowModel().rows.length <= 0 : true
                ),
                async onClick(){
                  if(dataTable.options){
                    const selectedRows = dataTable.getSelectedRowModel().rows
                    const dataSelectedRows = selectedRows.map(row => row.original)
                    // const progressIdTimeSelectedRows = dataSelectedRows.map(dt => `${dt.progressId}-${dt.createTime}`);

                    const dataDownloadSelected = dataSelectedRows.map(dt => ({
                      ...dt,
                      progressIdTime: `${dt.progressId}-${dt.createTime}`,
                      selected: false,
                      progress: undefined,
                      completed: 'downloading',
                    }))
                    const dataDownloadTable = removeDuplicateObjArray([...downloadRecords, ...dataDownloadSelected], 'progressIdTime')
                    addManyDownloadRecords(dataDownloadTable);

                    setState({dataDownloadSelected: dataDownloadSelected,  isDownloading: true})
                    updateSimpleData({downloadTab: 'Downloading'})
                    setTimeout(()=> {
                      updateSimpleData({downloadTab: ''})
                    }, 50)
                  }
                },
              },
              {
                label: "Data Info", tooltip: "Data Info from extracting",
                icon: IconDatabase, color: "blue",
                // disabled: simpleData.dataExtraction.length <= 0,
                onClick(){
                  openDataInfo()
                }
              },
            ].map(item => {
              return (
                <Button key={item.label} title={item.tooltip} color={item.color} 
                  disabled={item.disabled} hidden={item.hidden}
                  bg={item.disabled ? item.color : undefined}
                  opacity={item.disabled ? 0.6 : undefined}
                  classNames={{
                    root: 'shadow-md data-[disabled]:text-white',
                    label: 'flex-col'
                  }}
                  h={60-2} w={64} p={0}
                  onClick={item.onClick}
                >
                  <item.icon size={30} stroke={1.6}/>
                  <Text span fz={12} className='flex items-end grow font-semibold'>{item.label}</Text>
                </Button>
              )
            })
          }
        </div>
      }
      renderBelowContent={
        <>
        <Modal opened={openedModal} onClose={closeModal} size="100%" centered transitionProps={{ duration: 100, transition: 'fade-down' }}
          withCloseButton={false}
          classNames={{
            body: 'p-0',
            content: 'overflow-hidden bg-[var(--web-wash)] lg:flex-[0_0_75%]'
          }}
          // styles={{
          //   inner: {
          //     '--modal-y-offset': '0'
          //   }
          // }}
        >
          <Card className='sticky top-0 z-10 -mt-4 mb-4 -mx-4 shadow-sm' p={8}>
            <Title component={'h3'} unstyled ta="center" className='text-lg xs:text-[22px]'>
              Enter Video Links To Download
            </Title>
          </Card>
          <ScrollArea className='grow' h={'calc(100vh - 170px)'}>
            <Box className='space-y-4 p-4'>
              <div>
                <div className='flex flex-col'>
                  <Flex justify={'space-between'}>
                    <Box>
                      {
                        function() {
                          
                          const hasLink = downloadSettings.videoLinks.length > 0
                          const validLinks = (hasLink ? downloadSettings.videoLinks
                          .filter(v => v.trim() !== "").length : 0) as number
                          const inValidLinks = (hasLink ? downloadSettings.videoLinks
                          .filter(v => !isValidUrl(v.trim()) && v.trim() !== "").length : 0) as number
                          return (
                            <Box component='span' display={"block"}>
                              {
                                <Text span fz={14} fw={600} display={"inline-block"} mr={8} c='green.7'>{`Total Links: ${validLinks}`}</Text>
                              }
                              {
                                inValidLinks > 0 &&
                                <Text span display={"inline-block"}>
                                  {`|`}
                                  <Text span fz={14} fw={600} display={"inline-block"} ml={8} c='red'>
                                    {`Invalid Links: ${inValidLinks}`}
                                  </Text>
                                </Text>
                              }
                            </Box>
                          )
                        }()
                      }
                    </Box>
                    <div style={{display: "flex"}}>
                      <div>
                      {
                        // isObject(stateHelper) && stateHelper.timerExtraction &&
                        // <Text c='green.7'>3:30</Text>
                      }
                      </div>
                      {/* <div style={{width: 120}}></div> */}
                    </div>
                  </Flex>
                </div>
                <div className='relative flex'>
                  <Textarea className='grow'
                    pos={'relative'}
                    placeholder={
                      "Enter your video url one per line \n\n" +
                      // (licenseExpired ? "Your license may be expired but you can download 1 video per action \n\n" : "") +
                      "example:\n" +
                      "https://www.youtube.com/watch?v=VIDEO_ID\n" +
                      "https://www.youtube.com/shorts/VIDEO_ID\n" +
                      "https://www.facebook.com/(username/videos/ | watch?v=)VIDEO_ID\n" +
                      "https://www.facebook.com/username/posts/pfbid...(Post PE)\n" +
                      "https://www.instagram.com/(p | reel | reels)/VIDEO_ID\n" +
                      "https://www.tiktok.com/@username/video/VIDEO_ID\n" +
                      "https://www.douyin.com/video/VIDEO_ID\n" +
                      "https://www.kuaishou.com/short-video/VIDEO_ID\n" +
                      ". . .\n"+
                      "or\n" +
                      "https://www.youtube.com/(@username | /channel/CHANNEL_ID)\n"+
                      "https://www.youtube.com/playlist?list=PLAYLISTID\n"+
                      "https://www.instagram.com/username\n"+
                      "https://www.facebook.com/(username | PAGE_ID)\n"+
                      "https://www.tiktok.com/@username\n"+
                      "https://www.douyin.com/user/USER_ID\n"+
                      "https://www.kuaishou.com/profile/USER_ID\n"
                      // ". . .\n"
                    }
                    value={downloadSettings.videoLinks.join('\n')}
                    onChange={(e) => {
                      updateDownloadSettings({videoLinks: e.currentTarget.value.split('\n'), directDownload: false})
                    }}
                    autosize
                    minRows={15}
                    maxRows={20}
                    classNames={{
                      input: 'pr-8 md:pr-36 bg-gray-600/10 dark:bg-muted placeholder:text-gray-400 dark:placeholder:text-gray-400/80 placeholder:!text-[12px] xs:placeholder:!text-sm' // placeholder:bg-[var(--web-wash)]
                    }}
                    onFocus={closeSettingsModal}
                  />
                  <div className='absolute top-0 right-0 p-1 h-full'>
                    <div className='flex h-full'>
                      <Card p={8} className={'md:block mr-8 md:mr-0 max-w-36 shadow-md'.concat(openedSettingsModal ? ' transition-all' :' hidden')}>
                        <div className='flex flex-col justify-between h-full'>
                          <div className='space-y-3'>
                            <div title={"save as profile folder"}>
                              <Checkbox
                                label={`Save as Profile`} 
                                color='green' fw={600} size="xs"
                                checked={downloadSettings.saveFolderAsProfile}
                                onChange={() =>
                                  updateDownloadSettings({saveFolderAsProfile: !downloadSettings.saveFolderAsProfile})
                                }
                              />
                            </div>
                            <Tooltip 
                              label="download limit: limit is 0 (zero) it will download all available videos from profiles"
                              // disabled={videoSettings.limit_dl_tooltip ?? false} 
                              withArrow withinPortal zIndex={2001}
                            >
                              <NumberInput
                                placeholder={`${downloadSettings.limitDownload}`}
                                value={downloadSettings.limitDownload}
                                onChange={(e) => updateDownloadSettings({limitDownload: Number(e)})}
                                min={0}
                                radius="xs"
                                size="xs"
                                // w={100}
                              />
                            </Tooltip>
                            <Select
                              title={"Download sort by"}
                              value={downloadSettings.popularSortBy}
                              onChange={(val) => { updateDownloadSettings({ popularSortBy: val || downloadSettings.popularSortBy }) }}
                              data={
                                [...downloadPopularSortByData]
                                .map(val => ({value: val, label: toCapitalized(val)}))
                              }
                              checkIconPosition='right'
                              // w={100}
                              radius="xs"
                              size='xs'
                              maxDropdownHeight={200}
                            />
                            <Select
                              title={"Sort by Video or Short — Support only YouTube and Facebook(stream not support)"}
                              value={downloadSettings.youtubeSortBy}
                              onChange={(val) => { updateDownloadSettings({ youtubeSortBy: val || downloadSettings.youtubeSortBy }) }}
                              data={
                                [...youtubeSortByData]
                                .map(val => ({value: val, label: toCapitalized(val)}))
                              }
                              checkIconPosition='right'
                              // w={100}
                              radius="xs"
                              size='xs'
                              maxDropdownHeight={200}
                            />
                            <Button
                              title='Download Settings'
                              size='xs' radius='xs' variant='outline' fullWidth
                              onClick={() => openMainSettings()}
                            >Settings</Button>
                            {
                              !downloadSettings.justExtracting && (
                                <>
                                <Select
                                  title={"Select download as video(mp4) or audio(mp3)"}
                                  value={downloadSettings.downloadAs}
                                  onChange={(val) => { val && updateDownloadSettings({ downloadAs: val }) }}
                                  data={
                                    ["video", "audio"]
                                    .map(val => ({value: val, label: toCapitalized(val)}))
                                  }
                                  checkIconPosition='right'
                                  // w={80}
                                  radius="xs"
                                  size='xs'
                                  maxDropdownHeight={90}
                                  comboboxProps={{ shadow: 'md' }}
                                />
                                {
                                  downloadSettings.videoLinks.length > 0 && downloadSettings.videoLinks.filter(link => youtube_validate(link)).length > 0 && 
                                  <Select
                                    title='Download YouTube video from 2k-8k'
                                    placeholder={"Select Quality - Default 720p"}
                                    value={downloadSettings.videoResolution}
                                    onChange={(val) => {logger?.log(val); val && updateDownloadSettings({ videoResolution: val }) }}
                                    data={videoFormatSelection('horizontal')}
                                    checkIconPosition='right'
                                    radius="xs"
                                    size='xs'
                                    maxDropdownHeight={300}
                                    comboboxProps={{ shadow: 'md' }}
                                    classNames={{
                                      dropdown: '!w-fit text-nowrap'
                                    }}
                                  />
                                }
                                </>
                              )
                            }
                          </div>
                          <div className='space-y-3'>
                            <div title={`No download, just extract video info`}>
                              <Checkbox label={`Extract Only`}
                                // labelPosition='left'
                                color='green' fw={600} size="xs" mb={8}
                                checked={downloadSettings.justExtracting}
                                onChange={() =>
                                  updateDownloadSettings({justExtracting: !downloadSettings.justExtracting})
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                      <div className='relative'>
                        <Tooltip label='Open Settings'>
                          <ActionIcon className='absolute top-0 right-0 md:hidden' variant='light'
                            onClick={toggleSettingsModal}
                          >
                            <IconSettings/>
                          </ActionIcon>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Box>
          </ScrollArea>
          <Card className='sticky bottom-0 z-10 border-t-[2px] dark:border-t-[1px] dark:border-gray-600'>
            <div className='shadow-sm'></div>
            <div className='flex justify-between'>
              <Button variant='filled' color='red'
                onClick={closeModal}
              >Close</Button>
              <Button variant='filled' color='green'
                loading={extracting} loaderProps={{type: 'dots'}}
                disabled={extracting}
                onClick={(e)=>{
                  e.preventDefault()
                  setExtracting(true);
                  if(!downloadSettings.justExtracting){
                    setIsDownloading(true)
                  }
                  closeModal();
                }}
              >{downloadSettings.justExtracting ? 'Extract Info' : 'Download'}</Button>
            </div>
          </Card>
        </Modal>
        <ModalIFrame opened={openedIFrame} onClose={closeIFrame} jwPlayerData={jwPlayerData} />
        <ModalExpiredError opened={openedError} onClose={closeError} />
        <ModalManager 
          onClose={closeModalManager} topRightCloseButton
          {...stateModalManager}
        />
        <DataExtractingInfoPage opened={openedDataInfo} onClose={closeDataInfo} 
          onOpenIFrame={(jwPlayerData)=>{
            setJWPlayerData(jwPlayerData)
            openIFrame()
          }}
          onOpenSettingsModal={openMainSettings}
        />
        <DownloadSettingsPage opened={openedMainSettings} onClose={closeMainSettings} />
        </>
      }
    >
      <DownloadData
        onRowSelection={{
          onDownloadingTableChange: (table) => {
            dataTables = {
              ...dataTables,
              dataTableDownloading: table
            }
            updateSimpleData({...dataTables})
            onChangeDataTable(dataTables)
          },
          onCompletedTableChange: (table) => {
            dataTables = {
              ...dataTables,
              dataTableDownloadCompleted: table
            }
            updateSimpleData({...dataTables})
            onChangeDataTable(dataTables)
          },
          onUnCompletedTableChange: (table) => {
            dataTables = {
              ...dataTables,
              dataTableDownloadUnCompleted: table
            }
            updateSimpleData({...dataTables})
            onChangeDataTable(dataTables)
          },
        }}
      />
    </MainDashboard>
  )
}

interface DownloadSettingsPageProps extends Omit<ModalProps, 'children'> {}
export function DownloadSettingsPage({
  ...props
}: DownloadSettingsPageProps){
  const { downloadSettings, updateDownloadSettings } = useDownload();

  const theme = useMantineTheme()

  return (
    <Modal 
      size="100%" centered 
      withCloseButton={false}
      classNames={{
        body: 'p-0',
        content: 'overflow-hidden bg-[var(--web-wash)]'
      }}
      {...props}
    >
      <Card className='sticky top-0 z-10 -mt-4 mb-4 -mx-4 shadow-sm' p={8}>
        <Title component={'h3'} lh={'h3'} fz={'h3'} ta="center">
          Download Settings
        </Title>
      </Card>
      <div className=' absolute top-1 right-1 z-20' title='Close'>
        <ActionIcon color='red' radius={'100%'} size={20}
          onClick={props.onClose}
        ><IconX/></ActionIcon>
      </div>
      <ScrollArea className='grow' h={'calc(100vh - 130px)'}>
        <Box className='space-y-4 p-4'>
          <div className='grid gap-2 grid-cols-6 *:col-span-full sm:*:col-span-3 last:*:col-span-full lg:*:col-span-2 lg:last:*:col-span-2 *:shadow-md'>
            <Card>
              <Divider
                labelPosition="center"
                label={
                  <Text>Download Settings</Text>
                }
                mb={'md'}
              />
              <div className='space-y-4'>
                <TextInput
                  label="Download Folder"
                  title={downloadSettings.saveFolderPath || 'click the icon to select folder path'}
                  styles={{
                    input:{fontSize: 12}
                  }}
                  placeholder='C:\Users\. . .\~'
                  value={downloadSettings.saveFolderPath}
                  // onChange={(e) => {
                  //   updateDownloadSettings({saveFolderPath: e.currentTarget.value})
                  // }}
                  readOnly
                  rightSection={
                    isDesktopApp ?
                    <ActionIcon
                      variant='light' c={'green'}
                      onClick={ async() => {
                        if(isDesktopApp){
                          dialog({
                            callbackName: "showOpenDialog",
                            callback: async (result) => {
                              logger?.log(result)
                              if (result.canceled === false && result.filePaths.length > 0){
                                const folderPath = result.filePaths[0];
                                if(folderPath){
                                  updateDownloadSettings({saveFolderPath: folderPath});
                                  const headers = {
                                    headers: {
                                      ...defaultHeaders.headers,
                                      authorization: machineId
                                    }
                                  }
                                  const res: AxiosResponse = await ipcRendererInvoke("settings", {
                                    ...headers, update: true, folder: folderPath
                                  })
                                  // logger(res)
                                  // if(res.status === 200){
                                  //   handleSettings({...res.data})
                                  // }
                                }
                              }
                            },
                            error: logger?.log,
                          })
                        }
                      }}
                    >
                      <IconFolderCog title='Select Folder' />
                    </ActionIcon>
                    : (
                      <Popover width={window.innerWidth - 40} position="bottom" withArrow shadow="md">
                        <Popover.Target>
                        <ActionIcon variant='light' c={'green'} >
                          <IconFolderCog title='Select Folder' />
                        </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <div className='scrollbar-width-5 h-[250px] space-y-2.5 *:text-sm xs:*:text-base'>
                            <Text fw={600} ta="center" c="green" className='text-xl xs:text-2xl sm:text-[26px]'>Browser SaveAs configuration</Text>
                            <Text>Typically, when the file is downloaded, it will be saved in the download folder. However, the user can configure the browser to “saveAs” and choose a different location to save the file.</Text>
                            <Text>In Chrome, the user can go to <Text className='bg-green-200/10' unstyled span c='green' py={2} px={3} style={{borderRadius: 6}}>Settings &gt; Downloads</Text>  and toggle the “Ask where to save each file before downloading” option.</Text>
                            <Text>In Edge, the user can go to <Text className='bg-green-200/10' unstyled span c='green' py={2} px={3} style={{borderRadius: 6}}>Settings &gt; Downloads</Text> and toggle the “Ask me what to do with each download” option.</Text>
                            <Text>In Firefox, the user can go to <Text className='bg-green-200/10' unstyled span c='green' py={2} px={3} style={{borderRadius: 6}}>Options &gt; General &gt; Files and Applications</Text> and toggle the “Always ask you where to save files” option.</Text>
                            <Text>In Safari, the user can go to <Text className='bg-green-200/10' unstyled span c='green' py={2} px={3} style={{borderRadius: 6}}>Preferences &gt; General</Text> and toggle the “File download location” option.</Text>
                          </div>
                        </Popover.Dropdown>
                      </Popover>
                    )
                  }
                />
                <Select
                  title={'choose "FAST" option for download video large size'}
                  value={downloadSettings.typeDownload}
                  onChange={(val) => updateDownloadSettings({ typeDownload: val || downloadSettings.typeDownload }) }
                  data={
                    [...typeDownloadData]
                    .map(val => ({value: val, label: val}))
                  }
                  disabled={!isDesktopApp}
                  styles={{
                    input: {fontWeight: 600},
                    option: {fontWeight: 600},
                  }}
                  radius="xs"
                  size='xs'
                  maxDropdownHeight={200}
                />
                <Checkbox
                  label={"Always download with thumbnail"}
                  color='green'
                  size="sm" fw={600}
                  checked={downloadSettings.downloadWithThumbnail}
                  onChange={() => updateDownloadSettings({
                    downloadWithThumbnail: !downloadSettings.downloadWithThumbnail
                  })}
                />
                <Checkbox
                  label={"Auto translate filename to English"}
                  color='green'
                  size="sm" fw={600}
                  checked={downloadSettings.autoTranslateToEnglish ?? false}
                  onChange={() => updateDownloadSettings({
                    autoTranslateToEnglish: !downloadSettings.autoTranslateToEnglish
                  })}
                />
                <div className='flex items-center gap-2'>
                  <Text span>download</Text>
                  <NumberInput
                    title='download 1 to 50 files in the same time'
                    placeholder="3"
                    value={downloadSettings.downloadFilesInTheSameTime}
                    onChange={(val) => updateDownloadSettings({downloadFilesInTheSameTime: Number(val)})}
                    min={1}
                    max={100}
                    radius="xs"
                    size="xs"
                    styles={{
                      input: {padding: 6}
                    }}
                    w={downloadSettings.downloadFilesInTheSameTime < 100 ? 50 : 60}
                  />
                  <Text span lh={'1'}>files in the same time</Text>
                </div>
              </div>
            </Card>
            <Card>
              <Divider
                labelPosition="center"
                label={
                  <Text>Website Cookie</Text>
                }
                mb={'md'}
              />
              <div className='space-y-4'>
                <TextInput
                  label="Kuaishou Cookie"
                  placeholder='add kuaishou cookie'
                  title={
                    `add cookie if video downloading was got an error \n` +
                    "example: did=web_2c2a7f3c2d2e6595b..."
                  }
                  mb={10}
                  styles={{
                    input:{fontSize: 12}
                  }}
                  value={downloadSettings.kuaishouCookie}
                  onChange={(e) => {
                    updateDownloadSettings({kuaishouCookie: e.currentTarget.value})
                  }}
                />
              </div>
            </Card>
            <div></div>
            {
            // <Card>
            //   <Divider
            //     labelPosition="center"
            //     label={
            //       <Text>Speed Extraction</Text>
            //     }
            //     mb={'md'}
            //   />
            //   <div className={'relative space-y-4'.concat(downloadSettings.cpu < 8 ? ' opacity-30':'')}>
            //     {
            //     downloadSettings.cpu < 8 ?
            //       <div>
            //         {/* <div className='absolute top-0 w-full h-full z-10 text-red-600'></div> */}
            //         <Text c='red' fz={14}>{`Your PC is not support for this options`}</Text>
            //       </div>
            //     :
            //       <Checkbox
            //         label={`Extract video faster by using CPU`}
            //         color='green'
            //         size="sm" fw={600}
            //         mb="md"
            //         checked={downloadSettings.use_custom_cpu_if_available_more_then_12}
            //         onChange={() => updateDownloadSettings({
            //           use_custom_cpu_if_available_more_then_12: !downloadSettings.use_custom_cpu_if_available_more_then_12
            //         })}
            //       />
            //     }
            //     <Box pos={'relative'}
            //       style={{
            //         border: `1px solid ${theme.colors.cyan[6]}`,
            //         borderRadius: 8,
            //         padding: 8
            //       }}
            //     >
            //       <Text c='cyan' fz={12} pos={'absolute'}
            //         style={{
            //           top: 0, right: 5
            //         }}
            //       >{`Your Current CPU: ${downloadSettings.cpu} cores`}</Text>
            //       <Text c='orange' className='ctx'>*** Note:</Text>
            //       <Text mb="md" lh={1.2}>This option is work only if video links more than 100 and maximum CPU using is 8 cores.</Text>
            //       <List
            //         spacing="xs"
            //         size="sm"
            //         center
            //         icon={
            //           <IconCircle color={theme.colors.cyan[6]} style={{ width: 16, height: 16 }} />
            //         }
            //         styles={{
            //           itemLabel: {lineHeight: 1.5}
            //         }}
            //       >
            //         <List.Item>{`Facebook: 200 links use 4 CPU - 400 links use 8 CPU.`}</List.Item>
            //         <List.Item>{`Instagram: 120 links use 4 CPU - 240 links use 8 CPU.`}</List.Item>
            //         <List.Item>{`Kuaishou: 100 links use 4 CPU - 200 links use 8 CPU.`}</List.Item>
            //         <List.Item>{`And another is fixing...but they use with default cpu less than 4.`}</List.Item>
            //       </List>
            //     </Box>
            //   </div>
            // </Card>
            }
          </div>
        </Box>
      </ScrollArea>
    </Modal>
  )
}

type StateValueProps = {
  isDownloading: boolean
} & Record<string, any>;

type UseContextDataProps = {
  useDownloadData: ReturnType<typeof useDownload>
  useLicenseRecordData: ReturnType<typeof useLicenseRecord>
}
export function onDownloading(
  dataDownloadSelected: IYouTube[], 
  useContextData: UseContextDataProps, 
  setState: (state: StateValueProps) => void
){
  const { useDownloadData, useLicenseRecordData} = useContextData;
  const { 
    downloadSettings,
    updateSimpleData,
    downloadProgressBar, updateDownloadProgressBar 
  } = useDownloadData;
  const { licenseRecords } = useLicenseRecordData;

  const {
    product, isTrailOrExpired, isPending, isActivated, isExpired, isLifeTime,
    statusColor, viewMoreText, 
    expiredDays, expiredText, expiredColor
  } = getOneProductFilter(licenseRecords, 'MT-0001');
  
  if(isExpired){
    dataDownloadSelected = dataDownloadSelected.slice(0,1)
  }

  const downloadProgressBarReset = downloadProgressBar;
  const dataDownload = dataDownloadSelected.map(dt => {
    const progressIdTime = `${dt.progressId}-${dt.createTime}`;
    const data = downloadProgressBarReset[`progressBar-${progressIdTime}`]
    if(data){
      if(data?.output_filename){
        downloadProgressBarReset[`progressBar-${progressIdTime}`] = {
          output_filename: data.output_filename,
          translateOption: data.translateOption || {}
        }
      } else {
        delete downloadProgressBarReset[`progressBar-${progressIdTime}`]
      }
    }
    return {
      ...dt,
      selected: false,
      progress: undefined,
      completed: 'downloading',
    }
  });
  updateDownloadProgressBar(downloadProgressBarReset, {new: true})

  class Downloader extends DownloadEngine {
    updateDownloadProgressBar = updateDownloadProgressBar
    updateSimpleData = updateSimpleData
    useDownloadData = useDownloadData

    onFinished(): void {
      setState({isDownloading: false})
      ipcRendererInvoke("write-file", "logger.txt", "").then(res => res)
    }
  }
  logger?.log("start downloading...");
  const downloader = new Downloader({dataDownload: dataDownload, downloadSettings})
  downloader.onError = function(error){
    logger?.log("error downloading", error)
  }
  downloader.run()
}

interface DataExtractingInfoPageProps extends Omit<ModalProps, 'children'> {
  isDownloading?: boolean
  onOpenSettingsModal?: () => void
  onOpenIFrame?: (jwPlayerData: any) => void
}


const useScrollingUp = () => {
  let prevScroll: number;
  //if it is SSR then check you are now on the client and window object is available
  if (window) {
    prevScroll = window.screenY
  }
  const [scrollingUp, setScrollingUp] = useState(false)
  const handleScroll = () => {
    const currScroll = window.scrollY
    const isScrolled = prevScroll > currScroll
    setScrollingUp(isScrolled)
    prevScroll = currScroll
  }
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  return [scrollingUp]
}

export function DataExtractingInfoPage({
  onOpenSettingsModal,
  onOpenIFrame,
  ...props
}: DataExtractingInfoPageProps){
  const { stateHelper } = useAuth();
  const useLicenseRecordData = useLicenseRecord();
  const { licenseRecords } = useLicenseRecordData
  const useDownloadData = useDownload();
  const { 
    downloadSettings, updateDownloadSettings,
    downloadRecords, addManyDownloadRecords, deleteManyDownloadRecords,
    simpleData, updateSimpleData,
    downloadProgressBar, updateDownloadProgressBar 
  } = useDownloadData;
  const theme = useMantineTheme();

  const [openedDataInfo, { open: openDataInfo, close: closeDataInfo }] = useDisclosure(false);
  const [extracting, setExtracting] = useState(false);
  const isDownloading = Boolean(simpleData.isDownloading)

  type DataExtraction = (IYouTube & {
    selected: boolean
    progressIdTime: string
    isSearchProfile?: boolean
  })[]
  const defaultFilterState = {
    dataExtraction: (simpleData.dataExtraction.length > 0 ? simpleData.dataExtraction.map(dt => {
      let selected = false;
      return {
        ...dt, selected: selected,
        progressIdTime: `${dt.progressId}-${dt.createTime}`,
      }
    }) : []) as DataExtraction,
    filterByExtractors: [] as string[],
    filterByUploader: [] as string[],
    popularSortBy: '' as DownloadSettingsType['popularSortBy'] | null,
    viewCount: {
      count: '' as string | number,
      isGreaterThan: true
    },
    likeCount: {
      count: '' as string | number,
      isGreaterThan: true
    },
    commentCount: {
      count: '' as string | number,
      isGreaterThan: true
    },
    duration: {
      count: '' as string | number,
      isGreaterThan: true
    },
  }
  const [state, setState] = useSetState({
    isSearchProfile: !(simpleData.dataExtraction.length > 0),
    inputLinkProfile: '',
    nextData: '',
    // dataExtraction: simpleData.dataExtraction.concat(...downloadRecords).map(dt => ({...dt, selected: false})),
    isDownloading: false,
    ...defaultFilterState,
    preventSelectLink: true,
  });
  const extractors = [...new Set(state.dataExtraction.map(dt => dt.info_dict.extractor_key as string))].sort()
  const uploaderList = [...new Set(state.dataExtraction.map(dt => dt.info_dict.uploader as string))].sort()
  let dataExtraction = state.dataExtraction

  switch (state.popularSortBy) {
    case 'newest':
      dataExtraction = dataExtraction.sort((a,b) => (a.info_dict.timestamp as number) - (b.info_dict.timestamp as number))
      break;
    case 'oldest':
      dataExtraction = dataExtraction.sort((a,b) => (b.info_dict.timestamp as number) - (a.info_dict.timestamp as number))
      break;
    case 'popular':
      dataExtraction = dataExtraction.sort((a,b) => (b.info_dict.view_count as number) - (a.info_dict.view_count as number))
      break;
    default:
      // dataExtraction = defaultFilterState.dataExtraction.filter(dt => dataExtraction.map(d=>d.progressId).join(',').includes(dt.progressId))
      dataExtraction = dataExtraction.sort((a,b) => (a.createTime as number) - (b.createTime as number))
      break;
  }
  if(state.filterByExtractors.length){
    dataExtraction = dataExtraction.filter(dt => state.filterByExtractors.some(v => v === dt.info_dict.extractor_key))
  }
  if(state.filterByUploader.length){
    dataExtraction = dataExtraction.filter(dt => state.filterByUploader.some(v => v === dt.info_dict.uploader))
  }

  type CountKeyType = "viewCount" | "likeCount" | "commentCount" | "duration"
  type InfoCountKeyType = "view_count" | "like_count" | "comment_count" | "duration"
  function countFilter(key: CountKeyType, infoKey: InfoCountKeyType){
    const count = state[key].count
    if(typeof count === 'number'){
      dataExtraction = dataExtraction.filter(dt => {
        let infoCount = Number(dt.info_dict[infoKey] || 0);
        if(infoKey === 'view_count' && !infoCount){
          infoCount = Number(dt.info_dict.like_count || 0);
        }
        if(typeof infoCount === 'number'){
          return state[key].isGreaterThan ? infoCount >= count : infoCount <= count
        }
      })
    }
  }
  countFilter('viewCount', 'view_count');
  countFilter('likeCount', 'like_count');
  countFilter('commentCount', 'comment_count');
  countFilter('duration', 'duration');

  const [pagination, setPagination] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({
    root: containerRef.current,
    threshold: 1,
  });

  let mainProps = props
  if(extracting){
    props = {
      ...mainProps,
      opened: openedDataInfo,
      onClose: closeDataInfo
    }
  }
  const dataExtractionSearchProfile = dataExtraction.filter(dt => Boolean(dt.isSearchProfile))
  dataExtraction = state.isSearchProfile ? dataExtractionSearchProfile : dataExtraction

  const dataExtractionSelected = dataExtraction.filter(dt => dt.selected === true);
  const hasYouTubeSelected = dataExtractionSelected.length > 0 && dataExtractionSelected.filter(dt => ['youtube'].some(v => dt.info_dict.extractor_key?.toLowerCase() === v)).length > 0

  const dataAllChecked = dataExtraction.length > 0 && dataExtraction.every((value) => value.selected);
  const dataIsSomeSelected = dataExtraction.some((value) => value?.selected);
  const dataIndeterminate = dataExtraction.some((value) => value?.selected) && !dataAllChecked;

  const isDataFiltered = state.filterByExtractors.length > 0 || state.filterByUploader.length > 0 || !!state.popularSortBy || isNumber(state.viewCount.count) || isNumber(state.likeCount.count) || isNumber(state.commentCount.count) || isNumber(state.duration.count)

  const CheckBoxData = ({showLabel=true, size="sm"}) => {
    return (
      <Flex gap={8}>
        <Checkbox
          title={dataAllChecked ? 'Deselect All' : 'Select All'}
          label={ showLabel ? (
            dataExtractionSelected.length > 0 ?
              `${dataExtractionSelected.length} of ${dataExtraction.length} link(s) selected`
            : `Total Links: ${dataExtraction.length}`
          ) : undefined}
          color='green'
          size={size}
          classNames={{
            input: 'border-green-600',
            label: 'text-green-600'
          }}
          checked={dataAllChecked} indeterminate={dataIndeterminate}
          onChange={() => {
            setState({
              dataExtraction: state.dataExtraction
              .map(dt => dataAllChecked ? {...dt, selected: false} : {...dt, selected: true})
            })
          }}
        />
      {/* { showLabel && (
        dataExtractionSelected.length > 0 ?
          <Text span fz={'sm'} c={'green.7'}>{`${dataExtractionSelected.length} of ${dataExtraction.length} link(s) selected`}</Text>
        : <Text span fz={'sm'} c={'green.7'}>{`Total Links: ${dataExtraction.length}`}</Text>
      )} */}
      </Flex>
    )
  }

  let jwPlayerData = {
    "sources": [
      // {
      //   "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4?dl=0",
      //   "label": "4k"
      // },
      // {
      //   "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4?dl=0",
      //   "label": "1080p"
      // },
      {
        "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4",
        "label": "720p",
        type: "mp4"
      },
      {
        "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4",
        "label": "360p",
        type: "mp4"
      },
      {
        "file": "https://bigf.bigo.sg/asia_live/V4s6/0V7YVR.mp4",
        "label": "Auto",
        type: "mp4",
        "default": true,
      }
    ],
    // "captions": [
    //   {
    //     "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686529/Blood/Inside/Inside.2023.en_cdm2sg.srt",
    //     "label": "English",
    //     "kind": "captions",
    //     "default": true
    //   },
    //   {
    //     "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686529/Blood/Inside/Inside.2023.km_a0mopr.srt",
    //     "label": "ខ្មែរ",
    //     "kind": "captions"
    //   },
    //   {
    //     "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.th_quqggy.srt",
    //     "label": "Thai",
    //     "kind": "captions"
    //   },
    //   {
    //     "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.kr_a7ph90.srt",
    //     "label": "Korea",
    //     "kind": "captions"
    //   },
    //   {
    //     "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.ar_ctlkw4.srt",
    //     "label": "Arabic",
    //     "kind": "captions"
    //   },
    //   {
    //     "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.id_de3dhy.srt",
    //     "label": "Indonesia",
    //     "kind": "captions"
    //   },
    //   {
    //     "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.vn_tleusl.srt",
    //     "label": "Vietnamese",
    //     "kind": "captions"
    //   },
    //   {
    //     "file": "https://res.cloudinary.com/do1zdkwaj/raw/upload/v1680686528/Blood/Inside/Inside.2023.ml_uzyzuw.srt",
    //     "label": "Malay",
    //     "kind": "captions"
    //   }
    // ]
  }


  function downloadingHandler(dataExtractionSelected: DataExtraction, updateState?: Partial<typeof state>){
    const dataExtractionUpdate = dataExtractionSelected.map(dt => ({
      ...dt,
      progressIdTime: `${dt.progressId}-${dt.createTime}`,
      selected: false,
      progress: undefined,
      completed: 'downloading',
    }))
    const dataDownloadTable = removeDuplicateObjArray([...downloadRecords, ...dataExtractionUpdate], 'progressIdTime')
    addManyDownloadRecords(dataDownloadTable);
    // updateSimpleData({
    //   dataExtractionTest: removeDuplicateObjArray([...simpleData.dataExtractionTest, ...dataExtractionUpdate], 'progressIdTime')
    // });
    props.onClose()
    setState({isDownloading: true, ...updateState})
    updateSimpleData({downloadTab: 'Downloading'})
    setTimeout(()=> {
      updateSimpleData({downloadTab: ''})
    }, 50)
  }

  useEffect(()=>{
    if(state.dataExtraction.length > 0 && entry?.isIntersecting && pagination < dataExtraction.length){
      setPagination((prev) => prev + 4)
    }
  },[entry, state.dataExtraction])

  useEffect(()=>{
    if(props.opened){
      setTimeout(async()=> {
        const __dataExtractionSearchProfile = dataExtractionSearchProfile.filter(dt => Boolean(dt.isLastSearchProfile))
        const inputLinkProfile = __dataExtractionSearchProfile.length > 0 ? __dataExtractionSearchProfile[0].info_dict.uploader_url : '';

        let isNoResolution = false;
        let dataExtraction = simpleData.dataExtraction
        if(dataExtraction.length > 0){
          let dataExtractionList = arraySplitting(dataExtraction, 20);
          let newDataExtractionList = [] as any[][];
          for await(let dataExtraction of dataExtractionList){
            const newDataExtraction = await Promise.all(
              dataExtraction.map(async(dt) => {
                const info = dt.info_dict
                if(((!info?.width && !info?.height) || !info?.duration) && info.hd){
                  await new Promise(async (resolve, reject) => {
                    try {
                      var video = document.createElement('video'); 
                      video.innerHTML = `<source src="${info.hd}" type="video/mp4" />`
                      video.onloadedmetadata = function(){
                        if(!isNaN(video.duration)){
                          var width = video.videoWidth
                          var height = video.videoHeight
                          var resolution = `${width}x${height}`
                          var duration = video.duration
                          var metadata = {
                            title: info.title,
                            width, height, resolution,
                            duration,
                            url: info.hd as string
                          }
                          logger?.log(metadata)
                          info.width = width;
                          info.height = height;
                          info.resolution = resolution;
                          info.both = info.both?.length ? info.both.map(v => {
                            if(v.width === 0){
                              v = {...v, ...metadata}
                            }
                            return v
                          }) : [metadata]
                          dt.both = info.both
                          dt.requested_download = [
                            {...dt.requested_download?.[0], ...metadata, url: info.original_url as string}
                          ]
                          isNoResolution = true;
                          resolve(metadata);
                        }
                      }
                    } catch (error) {
                      logger?.log("error metadata", error)
                      reject(error)
                    }
                  })
                }
                let dash_manifest_url = info?.dash_manifest_url;
                if(dash_manifest_url){
                  let isFetchedDashContent = Boolean(info.fetch_dash_manifest);
                  if(!isFetchedDashContent){
                    const dashContent = await fetchDashMPDContent(dash_manifest_url);
                    if(dashContent){
                      const {videoOnly, audioOnly} = extractDashMPD(dashContent);
                      info.video_only = videoOnly
                      info.audio_only = audioOnly
                      info.music = audioOnly?.[0]?.url || info.music
                      info.fetch_dash_manifest = true
                      isNoResolution = true
                    }
                  }
                }
                if(info.video_only?.length){
                  info.video_only = info.video_only.sort((a,b) => a.width - b.width)
                }
                let selected = false;
                return {
                  ...dt, selected: selected,
                  progressIdTime: `${dt.progressId}-${dt.createTime}`,
                }
              }) 
            )
            newDataExtractionList.push(newDataExtraction)
          }
          dataExtraction = Array.prototype.concat(...newDataExtractionList)
        }
        const updateState = {
          inputLinkProfile: inputLinkProfile || '',
          isSearchProfile: !(simpleData.dataExtraction.length > 0),
          dataExtraction: dataExtraction,
        } as Partial<typeof state>;
        logger?.log("dataExtraction",dataExtraction)
        if(isNoResolution){
          updateSimpleData({dataExtraction})
          localStorage.setItem("dataExtraction", JSON.stringify(dataExtraction));
        }
        setTimeout(()=>{
          setState(updateState);
        },10)
      },40)
    }

  },[props.opened])

  useEffect(()=>{
    if(state.isDownloading && dataExtractionSelected.length > 0){
      // const progressList = [5,12.59,23,35.6,50.3,65,70.45,84,93,98.9,100]
      onDownloading(dataExtractionSelected, {useDownloadData, useLicenseRecordData}, setState);
    }
  },[state.isDownloading])

  useEffect(() => {
    class ExtractorHelper {
      onFinished(data: DataExtraction){
        data;
        setExtracting(false);
        openDataInfo();
      }
    }
    if(extracting){
      (async function(){
        const extractorHelper = new ExtractorHelper()
        const extractor = new Extractor({downloadSettings});
        extractor.server_host = isDev ? isDevServerHost : (stateHelper.server_host || "")
        extractor.inputSearchProfileLink = state.inputLinkProfile + (state.nextData||'')
        extractor.onFinished = extractorHelper.onFinished
        extractor.onError = function(err){
          logger?.log("error", err)
        }
        let data = await extractor.run()
        if(data){
          data = data.map(dt => ({
            ...dt, selected: false, progressIdTime: `${dt.progressId}-${dt.createTime}`,
            isSearchProfile: true, isLastSearchProfile: true
          }))
          let dataExtractionSearchProfile = simpleData.dataExtraction.filter(dt => Boolean(dt.isSearchProfile) && !data?.map(dt => dt.progressId)?.join('|').includes(dt.progressId))
          dataExtractionSearchProfile = dataExtractionSearchProfile.length > 0 ? dataExtractionSearchProfile.map(dt => ({...dt, selected: false, isLastSearchProfile: false})) : [];
          let notDataExtractionSearchProfile = simpleData.dataExtraction.filter(dt => !Boolean(dt.isSearchProfile))
          notDataExtractionSearchProfile = notDataExtractionSearchProfile.length > 0 ? notDataExtractionSearchProfile.map(dt => ({...dt, selected: false})) : [];

          const dataExtraction = [
            ...data,
            ...dataExtractionSearchProfile,
            ...notDataExtractionSearchProfile,
          ]
          updateSimpleData({dataExtraction})
          localStorage.setItem("dataExtraction", JSON.stringify(dataExtraction));
          setTimeout(()=> {
            setState({dataExtraction: dataExtraction as DataExtraction})
          },10)
        }
        logger?.log('final data', data)
      })();
    }
  }, [extracting])

  return (
    <Modal
      size="100%" centered 
      withCloseButton={false} py={rem(10)}
      classNames={{
        body: 'p-0',
        inner: '',
        content: 'overflow-hidden bg-[var(--web-wash)]'
      }}
      {...props}
    >
      <Card className='sticky top-0 z-10 -mt-4 mb-4 -mx-4 shadow-sm' p={8}>
        <div className='px-6 flex gap-2 items-center justify-between flex-col xs:flex-row'>
          <div className='flex gap-4 items-center'>
            <Title component={'h3'} lh={'h3'} fz={'h3'} ta="center">
              Data Extraction
            </Title>
          </div>
          <div className='flex gap-4 items-center justify-between'>
            <div className='flex gap-4 items-center'>
              {/* <div className='hidden sm:block'>
                <CheckBoxData/>
              </div> */}
              <Tooltip label={state.isSearchProfile ? 'Show All Data Extraction' : 'Extract Data From Profile'} refProp="rootRef">
                <Switch
                  checked={state.isSearchProfile}
                  onChange={() => setState({isSearchProfile: !state.isSearchProfile})}
                  color="teal"
                  size="md"
                  thumbIcon={
                    state.isSearchProfile ? (
                      <IconCheck
                        style={{ width: rem(12), height: rem(12) }}
                        color={theme.colors.teal[6]}
                        stroke={3}
                      />
                    ) : (
                      <IconX
                        style={{ width: rem(12), height: rem(12) }}
                        color={theme.colors.red[6]}
                        stroke={3}
                      />
                    )
                  }
                />
              </Tooltip>
              <Flex gap={4}>
              <Popover width={window.innerWidth > 400 ? 400 : window.innerWidth-20} position="bottom" withArrow shadow="md">
                <Popover.Target>
                  {/* <Button variant='light' c={'cyan'} leftSection={<IconFilter size={20}/>}>Filter Data</Button> */}
                  <Indicator inline color='green.5' size={8} offset={2} disabled={!isDataFiltered}>
                    <ActionIcon title='Filter Data' variant='light' c={'cyan'}><IconFilter size={20}/></ActionIcon>
                  </Indicator>
                </Popover.Target>
                <Popover.Dropdown className=''>
                  <div className='space-y-2'>
                    <Flex gap={8}>
                      <Select
                        label={"Sort By"}
                        title={"Download sort by"}
                        placeholder='Pick value'
                        value={state.popularSortBy||null}
                        onChange={(val) => { setState({ popularSortBy: val }) }}
                        data={
                          [...downloadPopularSortByData]
                          .map(val => ({value: val, label: toCapitalized(val)}))
                        }
                        checkIconPosition='right'
                        clearable
                        comboboxProps={{withinPortal: false, shadow: 'md'}}
                        w={'40%'}
                        // classNames={{
                        //   input: 'placeholder:text-xs'
                        // }}
                      />
                      <Flex w={'60%'} justify={'space-between'}>
                        <div className='grow'></div>
                        <Button variant='light' c={'red'} 
                          disabled={!isDataFiltered} opacity={isDataFiltered ? 1 : 0.5}
                          // className='hidden md:block'
                          onClick={()=> setState({...defaultFilterState})}
                        >Reset</Button>
                      </Flex>
                    </Flex>
                    <MultiSelect
                      className='grow'
                      classNames={{
                        dropdown: '!my-0'
                      }}
                      label="Filter By Site"
                      placeholder={"Pick value"}
                      value={state.filterByExtractors}
                      data={extractors}
                      onChange={(extractors) => setState({filterByExtractors: extractors})}
                      checkIconPosition='right'
                      searchable
                      nothingFoundMessage="Nothing found..."
                      clearable
                      comboboxProps={{withinPortal: false, shadow: 'md'}}
                    />
                    <MultiSelect
                      className='grow'
                      classNames={{
                        dropdown: '!my-0'
                      }}
                      label="Filter By Profile"
                      placeholder={"Pick value"}
                      value={state.filterByUploader}
                      data={uploaderList}
                      onChange={(uploader) => setState({filterByUploader: uploader})}
                      checkIconPosition='right'
                      searchable
                      nothingFoundMessage="Nothing found..."
                      clearable
                      comboboxProps={{withinPortal: false, shadow: 'md'}}
                      // dropdownOpened
                    />
                    <Fieldset legend={<Text span unstyled fz={'sm'} fw={600} px={4}>Filter By Statistic</Text>} variant='filled' px={12}>
                      <div className='space-y-2'>
                        {
                          [
                            {
                              label: 'View Count', valueKey: 'viewCount',
                            },
                            {
                              label: 'Like Count', valueKey: 'likeCount',
                            },
                            {
                              label: 'Comment Count', valueKey: 'commentCount',
                            },
                          ].map(item => {
                            const key = item.valueKey as CountKeyType
                            return (
                              <Flex key={item.label} gap={4} justify={'space-between'} align={'center'}>
                                <Text span unstyled fz={'sm'} className='text-nowrap'>{item.label}</Text>
                                <ActionIcon unstyled c={'cyan'}
                                  title='click to change "Greater than OR Less than OR Equal"'
                                  className={''.concat(state[key].isGreaterThan ? '' : 'rotate-180')}
                                  onClick={()=> setState({[key]: {
                                    ...state[key],
                                    isGreaterThan: !state[key].isGreaterThan
                                  }})}
                                ><IconMathEqualGreater/>
                                </ActionIcon>
                                <NumberInput
                                  placeholder={'Input number'}
                                  value={state[key].count}
                                  onChange={(e) => (isNumber(e) || e === '') && setState({[key]: {
                                    ...state[key],
                                    count: e
                                  }})}
                                  min={0}
                                  radius="xs"
                                  size="xs"
                                  // w={100}
                                />
                              </Flex>
                            )
                          })
                        }
                      </div>
                    </Fieldset>
                    <div>
                      <Flex gap={4} justify={'space-between'} align={'center'}>
                        <Text span unstyled fw={600} fz={'sm'} className='text-nowrap'>{'Filter By Duration'}</Text>
                        <ActionIcon unstyled c={'cyan'}
                          title='click to change "Greater than OR Less than OR Equal"'
                          className={''.concat(state.duration.isGreaterThan ? '' : 'rotate-180')}
                          onClick={()=> setState({duration: {
                            ...state.duration,
                            isGreaterThan: !state.duration.isGreaterThan
                          }})}
                        ><IconMathEqualGreater/>
                        </ActionIcon>
                        <NumberInput
                          title={'duration by second'}
                          placeholder={'duration by second'}
                          value={state.duration.count}
                          onChange={(e) => (isNumber(e) || e === '') && setState({duration: {
                            ...state.duration,
                            count: e
                          }})}
                          min={0}
                          radius="xs"
                          size="xs"
                          // w={100}
                        />
                      </Flex>
                    </div>
                  </div>
                </Popover.Dropdown>
              </Popover>
              <ActionIcon title='Download Settings' variant='light' c={'cyan'}
                onClick={onOpenSettingsModal}
              ><IconSettings size={20}/></ActionIcon>
              </Flex>
            </div>
            <div className='grow'></div>
            <div className='flex gap-4 items-center pr-0 xs:pr-8'>
              <div>
              <Button variant='filled' color='green'
                // loading={extracting} loaderProps={{type: 'dots'}}
                disabled={!dataIsSomeSelected}
                onClick={(e) => {
                  e.preventDefault();
                  const { isExpired } = getOneProductFilter(licenseRecords, 'MT-0001');
                  const __dataExtraction = isExpired ? dataExtraction.slice(0,1) : dataExtraction
                  downloadingHandler(__dataExtraction.filter(dt => dt.selected))
                }}
              >Download</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <div className=' absolute top-1 right-1 z-20' title='Close'>
        <ActionIcon color='red' radius={'100%'} size={20}
          onClick={props.onClose}
        ><IconX/></ActionIcon>
      </div>
      <ScrollArea ref={containerRef} className='grow' h={'calc(100vh - 130px)'}>
        <Box className='space-y-4 p-4'>
          { state.isSearchProfile &&
            <Flex gap={2}>
              <TextInput
                className='grow'
                placeholder='Enter channel or profile link . . .'
                value={state.inputLinkProfile}
                onChange={(e) => setState({inputLinkProfile: e.currentTarget.value})}
                error={state.inputLinkProfile !== "" && !isValidUrl(state.inputLinkProfile)}
              />
              { state.inputLinkProfile && isValidUrl(state.inputLinkProfile) && ['.youtube.com','.facebook.com'].some(v=> (new URL(state.inputLinkProfile)).host.toLowerCase().includes(v)) &&
                <Select
                  title={"Sort by Video or Short — Support only YouTube and Facebook"}
                  value={downloadSettings.youtubeSortBy}
                  onChange={(val) => { updateDownloadSettings({ youtubeSortBy: val || downloadSettings.youtubeSortBy }) }}
                  data={
                    [...youtubeSortByData].filter(v => (new URL(state.inputLinkProfile)).host.toLowerCase().includes('.facebook.com') ? v !== 'streams' : v)
                    .map(val => ({value: val, label: toCapitalized(val)}))
                  }
                  checkIconPosition='right'
                  w={100}
                  classNames={{
                    dropdown: '!w-fit text-nowrap',
                  }}
                  maxDropdownHeight={200}
                />
              }
              <Button px={6} color={'green'} loading={extracting}
                onClick={(e)=>{
                  if(!extracting && state.inputLinkProfile && isValidUrl(state.inputLinkProfile)){
                    e.preventDefault();
                    openDataInfo();
                    setState({nextData:''})
                    setExtracting(true);
                    return;
                  }
                }}
              ><IconSearch/></Button>
            </Flex>
          }
          {
            dataExtraction.length > 0 &&
            <Box className={''.concat('sticky top-0 -mt-4 -mb-3 -mx-2 py-4 px-2 z-[99] bg-[var(--web-wash)]', dataExtractionSelected.length > 0 ? ' transition-transform':'')}>
              {
                dataExtractionSelected.length <= 0 &&
                <Flex gap={8} align={'center'} wrap={'wrap'}>
                  <Card p={4}>
                    <CheckBoxData showLabel={true}/>
                  </Card>
                </Flex>
              }
              <Collapse in={dataExtractionSelected.length > 0} className='grow'>
                <Flex gap={8} align={'center'} wrap={'wrap'}>
                  <Card p={4}>
                    <CheckBoxData showLabel={true}/>
                  </Card>
                  {
                    dataIsSomeSelected && (
                      <>
                      <Button variant='filled' color='red' size='compact-sm'
                        // loading={extracting} loaderProps={{type: 'dots'}}
                        disabled={!dataIsSomeSelected}
                        onClick={(e) => {
                          e.preventDefault();
                          let dataSelected = dataExtraction.filter(dt => dt.selected)
                          let __dataExtractionUpdate = state.dataExtraction.filter(dt => !dataSelected.map(d=>d.progressIdTime).join('|').includes(dt.progressIdTime))

                          let dataExtractionUpdate = removeDuplicateObjArray(__dataExtractionUpdate, 'progressIdTime');
                          // if(state.isSearchProfile){
                          //   const notDataExtractionSearchProfile = state.dataExtraction.filter(dt => !Boolean(dt.isSearchProfile))
                          //   dataExtractionUpdate = [...notDataExtractionSearchProfile, ...dataExtractionUpdate]
                          // }
                          setState({dataExtraction: dataExtractionUpdate});
                          updateSimpleData({dataExtraction: dataExtractionUpdate});
                          localStorage.setItem("dataExtraction", JSON.stringify(dataExtractionUpdate));
                        }}
                      >Delete</Button>
                      <Card p={4} title={"save as profile folder"}>
                        <Checkbox
                          label={`Save as Profile`} 
                          color='green' fw={600} size="sm"
                          checked={downloadSettings.saveFolderAsProfile}
                          onChange={() =>
                            updateDownloadSettings({saveFolderAsProfile: !downloadSettings.saveFolderAsProfile})
                          }
                        />
                      </Card>
                      <Card p={4}>
                        <Checkbox
                          label={`Download as MP3`} 
                          color='green' fw={600} size="sm"
                          checked={downloadSettings.downloadAs === "audio"}
                          onChange={() =>
                            updateDownloadSettings({downloadAs: downloadSettings.downloadAs === "video" ? "audio" : "video"})
                          }
                        />
                      </Card>
                      {
                        hasYouTubeSelected && 
                        <Select
                          title='Download YouTube video from 2k-8k'
                          placeholder={"Select Quality - Default 720p"}
                          value={downloadSettings.videoResolution}
                          onChange={(val) => {logger?.log(val); val && updateDownloadSettings({ videoResolution: val }) }}
                          data={videoFormatSelection('horizontal')}
                          checkIconPosition='right'
                          radius="xs"
                          size='xs'
                          maxDropdownHeight={300}
                          comboboxProps={{ shadow: 'md' }}
                          w={160}
                          classNames={{
                            input: 'border-none',
                            dropdown: '!w-fit text-nowrap',
                          }}
                        />
                      }
                      <Card p={4}>
                        <Checkbox
                          label={"Download with thumbnail"}
                          color='green' size="sm" fw={600}
                          checked={downloadSettings.downloadWithThumbnail}
                          onChange={() => updateDownloadSettings({
                            downloadWithThumbnail: !downloadSettings.downloadWithThumbnail
                          })}
                        />
                      </Card>
                      <Card p={4}>
                        <Checkbox
                          label={"Translate filename to English"}
                          color='green' size="sm" fw={600}
                          checked={downloadSettings.autoTranslateToEnglish ?? false}
                          onChange={() => updateDownloadSettings({
                            autoTranslateToEnglish: !downloadSettings.autoTranslateToEnglish
                          })}
                        />
                      </Card>
                      </>
                    )
                  }
                </Flex>
              </Collapse>
            </Box>
          }
          <Box className='relative space-y-4'>
            <Box className={'grid gap-x-2 gap-y-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'.concat(dataExtraction.length <= 0 ? ' h-96':'')}>
              {
                dataExtraction.slice(0,pagination).map(data => {
                  const info = data.info_dict;
                  const extractor = info.extractor_key?.toLowerCase() as string;
                  const progressIdTime = `${data.progressId}-${data.createTime}`
                  const favicon = ExtractorFavicon(extractor, stateHelper.server_host);

                  const req_dl = data.requested_download;
                  const req_dl_info = req_dl && req_dl.length > 0 ? (req_dl[0] ?? info) : info;
                  let duration = req_dl_info.duration || info.duration;
                  let videoDuration = ''
                  if(duration){
                    videoDuration = formatDuration(duration)
                  }

                  let placeholder = "/img/no-image-placeholder.svg"  // "https://placehold.co/600x400?text=AIOTubeDown"
                  let width = req_dl_info.width;
                  let height = req_dl_info.height;
                  let size = {w: 192} as {w:number,h:number}
                  let q_size = `w=${size.w}`
                  if(width && height && height < width){
                    size.h = 108
                    q_size = `w=${size.w}&h=${size.h}`
                  }
                  // `/goto/api/v1/img/s?${q_size}&url=${encodeURIComponent(info.thumbnail)}` 
                  let thumbnail = info.thumbnail 
                    ? `/ct-image?data=${encodeJsonBtoa({url:info.thumbnail, ...size, placeholder: true})}` 
                    : placeholder

                  return (
                    <Card key={progressIdTime} p={8} shadow='sm'
                      styles={(theme) => ({
                        root: {
                          outline: data.selected ? `1px solid ${alpha(theme.colors.green[6], 0.5)}` : ''
                        }
                      })}
                      onClick={()=>{
                        state.preventSelectLink &&
                        setState({
                          dataExtraction: state.dataExtraction
                          .map(dt => progressIdTime === `${dt.progressId}-${dt.createTime}` ? {...dt, selected: !dt.selected} : dt)
                        })
                      }}
                    >
                      <div className='flex flex-col h-full space-y-2'>
                        <Flex gap={16} direction={'column'} justify={'space-between'} h={'100%'}>
                          <div className='grow space-y-2'>
                            <ContentEmbed
                              mainProps={{
                                className: 'group'
                              }}
                              belowContent={
                                <>
                                <div 
                                  title={''.concat(data.selected ? 'Deselect':'Select',' Link: ', info.original_url as string)}
                                  className='absolute top-1 left-1 z-10 hidden group-hover:block'
                                  style={{
                                    display: data.selected ? 'block' : ''
                                  }}
                                >
                                  <Checkbox
                                    color='green'
                                    size="sm"
                                    classNames={{
                                      input: 'border-green-600'
                                    }}
                                    checked={data.selected}
                                    onChange={() => {
                                      setState({
                                        dataExtraction: state.dataExtraction
                                        .map(dt => progressIdTime === `${dt.progressId}-${dt.createTime}` ? {...dt, selected: !dt.selected} : dt)
                                      })
                                    }}
                                    onMouseEnter={()=> setState({preventSelectLink: false})}
                                    onMouseLeave={()=> setState({preventSelectLink: true})}
                                  />
                                </div>
                                <div className='absolute top-1 right-1 z-10' title={info.extractor_key}>
                                  <Paper shadow='sm' className='cursor-pointer group-hover:flex hidden'
                                    title={'Open Link: '.concat(info.original_url as string)}
                                    onClick={async ()=>{
                                      const isDevelopment = false
                                      if(isDevelopment){
                                        // let url = 'https://tikwm.com/video/media/play/7378028350914202886.mp4'
                                        // url = 'http://localhost:5501/v.mp4?url=' + encodeURIComponent(encodeURIComponent('https://v3-dy-o.zjcdn.com/6fd610abc7bd7359d76dfeababa252ca/6694b628/video/tos/cn/tos-cn-ve-15/o0kCQdBmAgCIPk9gLEzifgvAZqfDjF95HC2C8A/?a=6383&ch=0&cr=0&dr=0&cd=0%7C0%7C0%7C0&cv=1&br=2493&bt=2493&cs=0&ds=4&ft=X1nbLcv54QByUxinKCHlxTO5rn_tN0iXCl1WdlMyeF~4&mime_type=video_mp4&qs=0&rc=ZGY0ZGk8Zzw7MzQ2ZTs4O0BpM3FzM3g5cnQ6dDMzNGkzM0AxYDNeYjYuXjIxYi4yMl5eYSNsal9tMmRrcDNgLS1kLS9zcw%3D%3D&btag=c0000e00010000&cc=1f&cquery=100b&dy_q=1721018374&feature_id=46a7bb47b4fd1280f3d3825bf2b29388&l=20240715123934595B18F82CDA1FBD5AC6&req_cdn_type='))
          
                                        // jwPlayerData.sources[0].file = url
                                        // jwPlayerData.sources[1].file = url
                                        // jwPlayerData.sources[2].file = url
          
                                        // let redirect = '&redirect=false'
                                        if(info.hd && (new URL(info.hd).host.includes('douyin.com'))){
                                          var r = fetch('http://localhost:5501/embed/video.mp4?url=' +encodeURIComponent(`${info.hd}`))
                                          info.hd = (await r).url
                                          var r = fetch('http://localhost:5501/embed/video.mp4?url=' +encodeURIComponent(`${info.sd}`))
                                          info.sd = (await r).url
                                        }
                                        jwPlayerData.sources[0].file = 'http://localhost:5501/embed/video.mp4?url=' + encodeURIComponent(encodeURIComponent(`${info.hd}`))
                                        jwPlayerData.sources[1].file = 'http://localhost:5501/embed/video.mp4?url=' + encodeURIComponent(encodeURIComponent(`${info.sd}`))
                                        jwPlayerData.sources[2].file = 'http://localhost:5501/embed/video.mp4?url=' + encodeURIComponent(encodeURIComponent(`${info.hd}`))
                                        
                                        onOpenIFrame?.(jwPlayerData)
                                      } else {
                                        if(isDesktopApp){
                                          if(info.original_url)
                                          openExternal({url: info.original_url})
                                        } else {
                                          if(isDev){
                                            window.navigator.clipboard.writeText(info.original_url as string)
                                          } else {
                                            window.open(info.original_url)
                                          }
                                        }
                                      }
                                    }}
                                    style={{
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backdropFilter: "blur(2)",
                                      background: "rgb(59 130 246 / 0.3)"
                                    }}
                                  >
                                    <Text span unstyled c={'blue.8'}><IconExternalLink size={20} /></Text>
                                  </Paper>
                                </div>
                                <div className='absolute bottom-1 right-1 z-10' title={info.extractor_key}>
                                  <Flex align="center" justify={"center"} gap={4}>
                                    {
                                      function(){
                                        const dataQuality = info.video_only?.length 
                                          ? info.video_only 
                                          : (info.both?.length ? info.both : data.both)
                                        if(!dataQuality || (isArray(dataQuality) && dataQuality.length <= 0)){
                                          return
                                        }
                                        let lsn = dataQuality.length - 1
                                        let width = Number(dataQuality[lsn].width)
                                        if(width < info.width){
                                          width = info.width
                                        }
                                        let height = Number(dataQuality[lsn].height)
                                        if(height < info.height){
                                          height = info.height
                                        }
                                        let size = height < width ? height : width
                                        let val = `${size}p`
                                        if(size >= 1440 && size < 2160){
                                          val = '2K'
                                        } else if(size >= 2160 && size < 4320){
                                          val = '4K'
                                        } else if(size >= 4320){
                                          val = '8K'
                                        }

                                        return (
                                          <Paper shadow='sm' px={2}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              backdropFilter: "blur(2)",
                                              color: "gold",
                                              background: "rgb(59 130 246 / 0.5)",
                                              fontSize: 14,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {val}
                                          </Paper>
                                        )
                                      }()
                                    }
                                    <Paper shadow='sm'
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "transparent"
                                      }}
                                    >
                                      {
                                        favicon
                                        ? <img src={favicon} width={20} height={20} />
                                        : 
                                        <IconWorld size={20} />
                                      }
                                    </Paper>
                                  </Flex>
                                </div>
                                </>
                              }
                            >
                              <img
                                className='group-hover:[filter:brightness(1.1)] hover:cursor-default'
                                // title={'Open Link: '.concat(info.original_url as string)}
                                decoding='async' loading='lazy' src={thumbnail} alt={info.title}
                                onMouseEnter={()=> setState({preventSelectLink: false})}
                                onMouseLeave={()=> setState({preventSelectLink: true})}
                              />
                            </ContentEmbed>
                            {
                              Boolean(info.user_info?.name || info.uploader) && 
                              <Box className={isDesktopApp ? 'cursor-default':''}>
                                {
                                  isDesktopApp ?
                                  <Text span fz={'xs'} c={'cyan'} lineClamp={1}>{info.user_info?.name || info.uploader}</Text>
                                  : <Text component='a' href={info.uploader_url} target='_blank' fz={'xs'} c={'cyan'} lineClamp={1}>{info.user_info?.name || info.uploader}</Text>
                                }
                              </Box>
                            }
                            <div className='cursor-default'>
                              <div title={info.title} className='text-xs xs:text-sm line-clamp-3' >{info.title}</div>
                            </div>
                          </div>
                          <div className='cursor-default'>
                            <div className='flex justify-between'>
                              <div className='text-xs'>{duration && duration > 0 ? videoDuration : ''}</div>
                              <div className='text-xs text-right'>{extractor !== "generic" && (InfoCountType(info, "comment_count") + ' comments')}</div>
                            </div>
                            <div className='border-t border-gray-300/40 pt-1.5 -mx-2 px-2'>
                              <Flex justify={'space-between'} className='gap-1 xs:gap-2.5'>
                              { extractor !== "generic" &&
                              (
                                [
                                  {icon:IconHeart, text: InfoCountType(info, "like_count"), color: 'pink'},
                                  {icon:IconEye, text: !info.view_count ? `${InfoCountType(info, "like_count")}+` : InfoCountType(info, "view_count")},
                                  // {icon:IconMessageCircle, text: InfoCountType(info, "comment_count")},
                                ] 
                              ).map((item, i) => {

                                return (
                                  <Flex key={data.progressId.concat(`${i}`)} align={"center"} justify={"center"} gap={4}>
                                      <Text unstyled span c={item.color || 'blue'}>
                                        <item.icon size={20} />
                                      </Text>
                                      <Text span lh={0.7} className='text-xs'>
                                        {item.text}
                                      </Text>
                                  </Flex>
                                )
                              })
                            }
                              </Flex>
                            </div>
                          </div>
                        </Flex>
                      </div>
                    </Card>
                  )
                })
              }
              <Paper ref={ref} h={1} opacity={0}></Paper>
            </Box>
            {
              state.isSearchProfile && (
                dataExtraction.length > 0 ?
                <Flex align={'center'} justify={'center'} direction={'column'}>
                  <Button
                    color='cyan'
                    loading={extracting}
                    loaderProps={{type: 'dots'}}
                    onClick={(e)=>{
                      const __dataExtractionSearchProfile = dataExtractionSearchProfile
                      const inputLinkProfile = __dataExtractionSearchProfile.length > 0 ? __dataExtractionSearchProfile[0].info_dict.uploader_url : ''
                      if(!extracting && inputLinkProfile){
                        e.preventDefault();
                        const dataExtraction = state.dataExtraction.filter(dt => dt?.isSearchProfile === true && Boolean(dt.isLastSearchProfile));
                        const lastDataExtraction = dataExtraction?.[0];
                        logger?.log('lastDataExtraction',lastDataExtraction)
                        if (lastDataExtraction){
                          const info = lastDataExtraction.info_dict
                          const next_cursor = info?.next_cursor;
                          const next_data = info?.string_next_data || lastDataExtraction.string_next_data;
                          const _q = inputLinkProfile.includes('?') ? "&" : "?";
                          let nextData = ''
                          if(next_cursor){
                            nextData = `${_q}next_cursor=${next_cursor}`
                          } else if(next_data){
                            nextData = `${_q}next_data=${next_data}`
                          }
                          logger?.log("nextData",nextData, inputLinkProfile)
                          if(nextData){
                            setState({inputLinkProfile, nextData});
                            setTimeout(()=>{
                              setExtracting(true);
                            },10)
                          } else {
                            setState({nextData: 'no-more'});
                          }
                        }
                      }
                    }}
                    disabled={state.nextData === 'no-more'}
                  >{state.nextData === 'no-more' ? 'No More' : 'Load More'}</Button>
                </Flex>
                : <LoadingOverlay 
                  visible={extracting} zIndex={1000} 
                  overlayProps={{ radius: "sm", blur: 2 }}
                  loaderProps={{ color: 'green', type: 'dots' }}
                />
              )
            }
            {
              dataExtraction.length <= 0 &&
              <div className='absolute top-0 w-full h-full z-10'>
                <Flex className='w-full h-full' align={'center'} justify={'center'}>No Data Extraction</Flex>
              </div>
            }
          </Box>
        </Box>
      </ScrollArea>
    </Modal>
  )
}

export const ModalManager = ModalComponent

interface ModalExpiredErrorProps extends Omit<ModalProps, 'children'> {}
export function ModalExpiredError({
  ...props
}: ModalExpiredErrorProps){
  const navigate = useNavigate();

  return (
    <Modal
      size="md" centered 
      withCloseButton={false} zIndex={209}
      classNames={{
        body: 'p-0',
        content: 'overflow-hidden bg-[var(--web-wash)]'
      }}
      {...props}
      
    >
      <Card className='sticky top-0 z-10 -mt-4 mb-4 -mx-4 shadow-sm' p={8}>
        <Title component={'h3'} lh={'h3'} fz={'h3'} ta="center" c="orange">
          Upgrade Your Plan
        </Title>
      </Card>
        <Flex className='space-y-4 px-4 py-8' align="center" justify="center" mih={220} >
          <div>
            <Text fz={'sm'} ta="center">
              You've reached the limit of the free plan.<br/>
              Please upgrade your account to continue.
            </Text>
          </div>
        </Flex>
      <Card className='sticky bottom-0 z-10 border-t-[2px] dark:border-t-[1px] dark:border-gray-600'>
        <div className='shadow-sm'></div>
        <div className='flex justify-between'>
          <Button variant='filled' color='red'
            onClick={props.onClose}
          >Close</Button>
          <Button variant='filled' color='orange'
            onClick={(e)=>{
              e.preventDefault()
              navigate('/products/'+dataProducts[0].slug)
            }}
          >{"Upgrade"}</Button>
        </div>
      </Card>
    </Modal>
  )
}

interface ModalIFrameProps extends Omit<ModalProps, 'children'> {
  jwPlayerData?: any
}
export function ModalIFrame({
  jwPlayerData,
  ...props
}: ModalIFrameProps){
  const { downloadRecords } = useDownload();
  // const { height, width } = useViewportSize();
  const [ref, rect] = useResizeObserver();

  return (
    <Modal
      size="100%" centered 
      withCloseButton={false} zIndex={209}
      classNames={{
        body: 'p-0',
        content: 'overflow-hidden bg-[var(--web-wash)]'
      }}
      {...props}
    >
      <Card className='sticky top-0 z-10 -mt-4 mb-4 -mx-4 shadow-sm' p={8}>
        <Title component={'h3'} lh={'h3'} fz={'h3'} ta="center">
          Extracting Data Info
        </Title>
      </Card>
      <div className=' absolute top-1 right-1 z-20' title='Close'>
        <ActionIcon color='red' radius={'100%'} size={20}
          onClick={props.onClose}
        ><IconX/></ActionIcon>
      </div>
      <ScrollArea className='grow' h={'calc(100vh - 125px)'}>
        <Box className='space-y-4 p-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
            <div ref={ref} className={'col-span-full md:col-span-2'} style={{width: `100%`, height: `${rect.width * 9/16}px`}}>
              {
                isObject(jwPlayerData) &&
                <iframe className='w-full h-full' src={"/player/index.html?data=".concat(encodeURIComponent(JSON.stringify(jwPlayerData)))} frameBorder="0"></iframe>
              }
            </div>
            <div className='col-span-full md:col-span-1'>Video Info</div>
          </div>
        </Box>
      </ScrollArea>
    </Modal>
  )
}


interface DataProgressDefault {
	total: string;
	totalBytes: number;
	downloaded: string;
	downloadedBytes: number;
	speed: string;
	speedBytes: number;
	averageSpeed: string;
	averageSpeedBytes: number;
	remaining: string;
	remainingBytes: number;
	progress: number;
	progressString: string;
	percentage: number;
	percentageString: string;
	timeLeftSeconds: number;
	timeLeftFormat: string;
  ext: string
  mimeType: string
}
interface DataProgress extends DataProgressDefault, Record<string, any> {}

export function updateDataProgress(dataProgress: Record<string, number>) {
  let finalDataProgress = { ...dataProgress } as Prettify<DataProgress>;
  Object.entries(dataProgress).forEach(([key, val]) => {
    if (key.includes("Bytes")) {
      finalDataProgress[key.replace(/Bytes/g, "")] = bytesToSize(val);
    } else if (key === "percentage" || key === "progress") {
      if (key === "progress")
        finalDataProgress["progressString"] = String(val).slice(0, 5) + "%";
      else if (key === "percentage")
        finalDataProgress["percentageString"] = String(val).slice(0, 5) + "%";
    } else if (key === "timeLeftSeconds") {
      finalDataProgress["timeLeftFormat"] = formatDuration2(val, true);
    }
  });
  return finalDataProgress;
}

interface DownloadXMLHttpRequestProps {
  url: string
  method?: string
  filename?: string
  onProgress?: (dataProgress: DataProgress, stopDownload: boolean) => void
  onXMLHttpRequest?: (request:XMLHttpRequest ) => void
}
export function downloadXMLHttpRequest({
  url,
  method,
  filename,
  onProgress,
  onXMLHttpRequest,
}: DownloadXMLHttpRequestProps) {
  var request = new XMLHttpRequest();
  request.responseType = "blob"; // Not sure if this is needed
  request.open(method || "GET", url);
  logger?.log(url)

  onXMLHttpRequest?.(request);
  var stopDownload = false;

  var ext = 'mp4';
  var mimeType = 'video/mp4';
  request.onreadystatechange = function () {
    var type = this.getResponseHeader('content-type');
    ext = type?.split('/')?.[1]?.split(';')?.[0] || ext;
    mimeType = type?.split(';')?.[0] || mimeType
    if(type?.includes('audio') && type?.split('/')?.[1] === 'mp4'){
      ext = 'm4a'
    }
    if(!type || !["video","audio","image"].some(v => type?.split('/')?.[0]?.toLowerCase()?.includes(v))){
      stopDownload = true;
    }
    if(stopDownload) {
      this.abort()
      return;
    }
    if (request.readyState === this.DONE && !stopDownload) {
      var anchor = document.createElement('a');
      if(!filename){
        var pathname = new URL(url).pathname
        filename = (pathname.endsWith('/') ? pathname.slice(0,-1) : pathname).split('/').at(-1) || AppName
      }
      anchor.download = `${filename}.${ext}`
      anchor.href = window.URL.createObjectURL(request.response);
      anchor.click();
      window.URL.revokeObjectURL(url)
    }
  };

  let timeStart = Date.now();
  const ReceivedBytesArr: number[] = [];
  let PreviousReceivedBytes = 0;
  let totalBytes = 0;
  let downloadedBytes = 0;
  let progress = 0;
  let percentage = 0;
  let speedBytes = 0;
  let averageSpeedBytes = 0;
  let averageSpeedCount = 0;


  request.addEventListener("progress", function (e) {
    if (e.lengthComputable) {
      totalBytes = e.total;
      downloadedBytes = e.loaded;
      progress = (downloadedBytes / totalBytes) * 100;
      percentage = progress;

      ReceivedBytesArr.push(downloadedBytes);
      if (ReceivedBytesArr.length >= 2) {
        PreviousReceivedBytes = ReceivedBytesArr.shift() as number;
        speedBytes =
          Math.max(PreviousReceivedBytes, ReceivedBytesArr[0]) -
          Math.min(PreviousReceivedBytes, ReceivedBytesArr[0]);
      } else {
        speedBytes = downloadedBytes;
      }

      let end = Date.now();
      let totalSeconds = end - timeStart;
      let seconds_per_byte = downloadedBytes
        ? totalSeconds / downloadedBytes
        : totalSeconds;
      let remainingBytes = totalBytes - downloadedBytes;
      let timeLeftSeconds = (seconds_per_byte * remainingBytes) / 1000;

      let _dataProgress = {
        totalBytes, downloadedBytes, speedBytes, progress, percentage, 
        averageSpeedBytes, remainingBytes, timeLeftSeconds
      }

      if (_dataProgress.speedBytes > 0) {
        averageSpeedBytes = averageSpeedBytes + _dataProgress.speedBytes;
        averageSpeedCount++;
      }
      if (averageSpeedCount > 0) {
        _dataProgress.averageSpeedBytes = averageSpeedBytes / averageSpeedCount;
      }

      const dataProgress = updateDataProgress(_dataProgress);
      if(stopDownload){
        dataProgress.stopDownload = stopDownload;
      }
      dataProgress.ext = ext
      dataProgress.mimeType = mimeType
      onProgress?.(dataProgress, stopDownload);
    }
  }, false);
  request.send();
}


class DownloadBaseIE {
  useDownloadData = {} as ReturnType<typeof useDownload>
  updateDownloadProgressBar(dataDownloadProgressBar: DownloadProgressBarType){dataDownloadProgressBar}
  updateSimpleData(data: Record<string,any>){data}

  onFinished(){}
}


interface DownloadEngineConstructor {
  dataDownload: IYouTube[]
  downloadSettings: DownloadSettingsType
  licenseExpired?: boolean
}

class DownloadEngine extends DownloadBaseIE {
  startTime = 0;

  tableData = [] as IYouTube[];
  dataDownloadCompleted = [] as IYouTube[];
  errorData = [] as (Record<string, any>)[];
  info_dict = {} as IYouTube;

  justExtracting = false;
  isDownloadAudio = false;
  save_as = "";
  isProfile = false;
  isYTPlaylist = false;
  isDownloadSelection = false;
  downloadWithThumbnail = false;
  closeNotification = false;

  queueDownload = 3;
  typeDownload = 'FAST' as DownloadSettingsType['typeDownload'];

  dataDownloadProgressBar: DownloadProgressBarType = {}

  settings: Prettify<DownloadSettingsType>
  licenseExpired: boolean
  constructor({
    dataDownload,
    downloadSettings,
    licenseExpired = true
  }: DownloadEngineConstructor) {
    super()
    this.startTime = Date.now();

    this.settings = downloadSettings
    this.licenseExpired = licenseExpired
    this.justExtracting = downloadSettings.justExtracting
    this.isDownloadSelection = downloadSettings.downloadAs === "audio"
    this.downloadWithThumbnail = downloadSettings.downloadWithThumbnail
    this.tableData = dataDownload
    this.queueDownload = downloadSettings.downloadFilesInTheSameTime
    this.typeDownload = downloadSettings.typeDownload
  }
  loggerTime() {
    loggerTime(this.startTime)
  }
  onError(error: {error: string, url: string} & Record<string,any>){error}
  async translate(text:string) {
    const settings = this.settings
    let translateTitle = null;
    let translateOption = {};
    if(settings.autoTranslateToEnglish === true){
      let retries = 0
      while (true) {
        let dataTranslate = {} as AxiosResponse<any, any>;
        if(isDesktopApp){
          dataTranslate = await ipcRendererInvoke("translate", text, )
        } else {
          try {
            dataTranslate = await axios.post('/api/v1/translate.php', { text }, {...defaultHeaders})
          } catch {}
        }
        logger?.log("[dataTranslate]: ", dataTranslate);
        if(dataTranslate.status === 200){
          if(dataTranslate.data.from.language.iso !== "en"){
            translateTitle = dataTranslate.data.text
            translateOption = dataTranslate.data
          }
          break;
        }
        if(retries >= 1){
          break;
        }
        retries++;
      }
      // const dataTranslate: AxiosResponse<any, any> = await ipcRendererInvoke("translate", text, )
      // if(dataTranslate.status === 200){
      //   if(dataTranslate.data.from.language.iso !== "en"){
      //     translateTitle = dataTranslate.data.text
      //     translateOption = dataTranslate.data
      //   }
      // } else {
      //   const dataTranslate: AxiosResponse<any, any> = await ipcRendererInvoke("translate", text )
      //   if(dataTranslate.status === 200){
      //     if(dataTranslate.data.from.language.iso !== "en"){
      //       translateTitle = dataTranslate.data.text
      //       translateOption = dataTranslate.data
      //     }
      //   }
      // }
    }
    return { translateTitle, translateOption }
  }
  onUpdateDownloadProgressBar(progressIdTime:string, dataDownloadProgress: Record<string,any>){
    return this.dataDownloadProgressBar = {
      ...this.dataDownloadProgressBar,
      [`progressBar-${progressIdTime}`]: {
        ...this.dataDownloadProgressBar[`progressBar-${progressIdTime}`],
        ...dataDownloadProgress
      }
    }
  }
  // updateDownloadData(progressIdTime:string, updateData?: Partial<IYouTube>){
  //   // this.tableData = this.tableData.map(dt => `${dt.progressId}-${dt.createTime}` === progressIdTime ? {...dt, ...updateData} : dt)
  //   this.updateSimpleData({dataExtractionTest: this.tableData})
  // }
  getRanges(size: number, start = 0, chunkSize = 3 * 1024 ** 2) {
    let ranges = [];
    let part_size = chunkSize;
    let count = 0;
    while (size - start > part_size) {
      ranges.push([start, start + part_size - 1, count]);
      start += part_size;
      count++;
    }
    if (ranges.length > 0) {
      return [...ranges, [start, size, `${count}$end`]].reverse();
    }
    return [[start, size]];
  }
  async singleVideo(info_dict: IYouTube, all_info_dict_list: IYouTube[]) {
    const { simpleData, updateSimpleData, addManyDownloadRecords } = this.useDownloadData;
    const settings = this.settings
    const downloadFolder = (video_info:IYouTube['info_dict']) => {
      let saveAs = "";
      const isProfile = info_dict.save_as === "profile" || settings.saveFolderAsProfile;
      if(typeof video_info === "object" && video_info.uploader && isProfile) {
        saveAs = `\\${toCapitalized(String(video_info.extractor_key))}\\${String(video_info.uploader)?.replace(/\n/g, " ")?.replace(/["*<>#%\/\{\}\|\\\^~\[\]`;\?:]/g, "")}`
      }
      const downloadFolder = settings.saveFolderPath?.replace(/\//g,"\\") + saveAs
      return downloadFolder
    }

    // const info_dict = testInsertTable();
    let video_info = info_dict.info_dict
    // const progressId = `${video_info.extractor_key?.toLowerCase()}-${video_info.id}`;
    const progressId = info_dict.progressId;
    const progressIdTime = `${info_dict.progressId}-${info_dict.createTime}`;

    let downloadProgressBarItems = JSON.parse(localStorage.getItem("downloadProgressBar") as string) as Record<string,any>;
    if(isObject(downloadProgressBarItems[`progressBar-${progressIdTime}`])){
      info_dict = {
        ...info_dict,
        ...downloadProgressBarItems[`progressBar-${progressIdTime}`]
      }
    }

    function safe_filename(title:string){
      return title.replace(/\n\n\n\n/g," ").replace(/\n\n\n/g," ").replace(/\n\n/g," ").replace(/\n/g," ").replace(/["*<>#%\/\{\}\|\\\^~\[\]`;\?:]/g, "")
    }
    function safeFileName(title:string,){
      let lengthFilename = 0;
      let addFilename = "";
      const info_dict_list = all_info_dict_list.filter(v => v.info_dict.id !== video_info.id)
      const isTheSameFilename = info_dict_list.length > 0 && info_dict_list.map(v => safe_filename(v.info_dict.title).trim())
      .some(v => v  === safe_filename(title).trim())
      // const isInstagram = video_info.extractor_key?.toLowerCase() === "instagram";
      // if (isInstagram && localSettings.fixInstagramFilePath === true){
      if (isTheSameFilename){
        addFilename = ` [${video_info.id}]`
        lengthFilename = addFilename.length
      }

      const filename = safe_filename(title).substring(0,155 - lengthFilename) + addFilename

      return filename.trim()
    }
    const filenameObj = {filename: video_info.title}
    if (settings.autoTranslateToEnglish === true && !info_dict.output_filename){
      let translateObj = await this.translate(video_info.title)
      if(translateObj.translateTitle){
        const title = translateObj.translateTitle
        info_dict["output_filename"] = title ? safeFileName(title) : title
        info_dict["translateOption"] = translateObj.translateOption as IYouTube['translateOption']

        filenameObj.filename = info_dict.output_filename as string
      } else {
        filenameObj.filename = safeFileName(video_info.title)
      }
    } else if(info_dict.output_filename)  {
      filenameObj.filename = info_dict.output_filename
    } else  {
      filenameObj.filename = safeFileName(video_info.title)
    }


    // logger("filenameObj: ", filenameObj)
    // let filenameObj = {filename: info_dict.output_filename}
    const download_folder = downloadFolder(video_info);

    const isDownloadAudio = settings.downloadAs === "audio";
    const isDefaultLink = !([
      "facebook", "instagram", "tiktok", "douyin", "kuaishou", "generic"
    ].some(v => v === video_info.extractor_key?.toLowerCase() ))
    const isYouTube = video_info.extractor_key?.toLowerCase() === "youtube";
    // const isHighResolution = settings.videoResolution && Number(settings.videoResolution) > 720 || (Number(settings.videoResolution) > 360 && Number(settings.videoResolution) <= 480);
    let isHighResolution = settings.videoResolution && Number(settings.videoResolution) > 360;

    logger?.log("[isHighResolution]: ", isHighResolution);

    // let linkDL = (isYouTube ? (
    //   settings.videoResolution
    //   && Number(settings.videoResolution) < 720
    //   ? video_info.sd : video_info.hd
    // ) : video_info.hd) as string
    let linkDL = video_info.hd as string;
    let videoOnly = video_info.video_only
    if(isYouTube && isHighResolution && videoOnly && videoOnly.length > 0){
      let videoSelectedList = videoOnly.filter(v => {
        const quality = String(v.height < v.width ? v.height : v.width)
        return v.url.startsWith('https://rr') && quality === settings.videoResolution
      });
      if(videoSelectedList.map(v => v.ext).some(v => v === 'mp4')){
        videoSelectedList = videoSelectedList.filter(v => v.ext === 'mp4')
      }
      const videoSelected = videoSelectedList.at(-1);
      if(videoSelected){
        linkDL = videoSelected.url
      } else {
        let highestQuality = videoOnly[0]
        const videoResolution = highestQuality.height < highestQuality.width ? highestQuality.height : highestQuality.width
        if(videoResolution > 360){
          videoSelectedList = videoOnly.filter(v => {
            const quality = String(v.height < v.width ? v.height : v.width)
            const videoResolution = String(v.height < v.width ? highestQuality.height : highestQuality.width)
            return v.url.startsWith('https://rr') && quality === videoResolution
          });
          if(videoSelectedList.map(v => v.ext).some(v => v === 'mp4')){
            videoSelectedList = videoSelectedList.filter(v => v.ext === 'mp4')
          }
          const videoSelected = videoSelectedList[0];
          linkDL = videoSelected.url
        } else {
          isHighResolution = false
        }
      }
    } else {
      isHighResolution = false
    }


    if(video_info.extractor_key?.toLowerCase() === 'tiktok' && !linkDL.startsWith('http')){
      linkDL = `https://tikwm.com/video/media/play/${video_info.id}.mp4`
    }

    let options = {
      isYouTube, isDefaultLink, isHighResolution
    }

    let isCompleted = false;
    let isError = false;
    let dataDownloadingObj = {} as Record<string, any>;
    let averageSpeedDownload = 0;
    let countCompleted = 0;
    let ext = 'mp4';

    if(isDownloadAudio && (!isYouTube || isDefaultLink)){
      let dataAudioDL = {dataDownloadingObj, isCompleted, isError, averageSpeedDownload, countCompleted, ext};
      if(isDesktopApp && (this.typeDownload === 'DEFAULT' || !video_info.music)){
        dataAudioDL = await this.audioDL(linkDL, info_dict, download_folder, filenameObj.filename)
      } else {
        let musicLink = video_info.music
        let dash_manifest_url = video_info.dash_manifest_url
        if(!musicLink && dash_manifest_url){
          const dashContent = await fetchDashMPDContent(dash_manifest_url);
          if(dashContent){
            const { audioOnly } = extractDashMPD(dashContent)
            linkDL = audioOnly?.[0]?.url
          }
        } else {
          linkDL = musicLink || ""
        }
        if(video_info.extractor_key?.toLowerCase() === 'tiktok' && !linkDL.startsWith('http')){
          linkDL = `https://tikwm.com/video/music/${video_info.id}.mp3`
        }
        if(!linkDL){
          this.onError?.({error: "No music link", url: video_info.original_url as string})
        }
        logger?.log("download music", linkDL)
        dataAudioDL = await this.aioTubeDownloader(linkDL, info_dict, download_folder, filenameObj.filename)
      }
      dataDownloadingObj = dataAudioDL.dataDownloadingObj
      isCompleted = dataAudioDL.isCompleted
      isError = dataAudioDL.isError
      averageSpeedDownload = dataAudioDL.averageSpeedDownload
      countCompleted = dataAudioDL.countCompleted
      ext = dataAudioDL.ext
    }
    // else if((isYouTube || (isDefaultLink && !video_info.hd)) && isHighResolution) {
    else if(!isYouTube && isDefaultLink && !video_info.hd) {
      linkDL = video_info.original_url as string;
      const dataAIODLP = await this.aiodlpDefault(linkDL, info_dict, download_folder, filenameObj.filename, isHighResolution, isDefaultLink)
      dataDownloadingObj = dataAIODLP.dataDownloadingObj
      isCompleted = dataAIODLP.isCompleted
      isError = dataAIODLP.isError
      averageSpeedDownload = dataAIODLP.averageSpeedDownload
      countCompleted = dataAIODLP.countCompleted
      ext = dataAIODLP.ext
    }
    else {
      logger?.log("downloading video..................")
      if(this.typeDownload === 'DEFAULT'){
        // const dataIPullDL = await this.iPullDL(linkDL, info_dict, download_folder, filenameObj.filename);
        // dataDownloadingObj = dataIPullDL.dataDownloadingObj
        // isCompleted = dataIPullDL.isCompleted
        // isError = dataIPullDL.isError
        // averageSpeedDownload = dataIPullDL.averageSpeedDownload
        // countCompleted = dataIPullDL.countCompleted
        // ext = dataIPullDL.ext

        const dataAIODLP = await this.aiodlp(linkDL, info_dict, download_folder, filenameObj.filename)
        dataDownloadingObj = dataAIODLP.dataDownloadingObj
        isCompleted = dataAIODLP.isCompleted
        isError = dataAIODLP.isError
        averageSpeedDownload = dataAIODLP.averageSpeedDownload
        countCompleted = dataAIODLP.countCompleted
        ext = dataAIODLP.ext
      }
      else {
        // await new Promise(async (resolve, reject) => {
        //   const url = new URL(linkDL)
        //   if(!url.search.startsWith('?')){
        //     linkDL = linkDL + '?dl=1'
        //   }

        //   return await ipcRendererInvoke("download", linkDL + `&download_with_rename_file=${encodeURIComponent(filenameObj.filename as string)}`, progressId, info_dict.timeRange, {
        //     ...filenameObj,
        //     downloadFolder: download_folder,
        //   }).then(async (_) => {
        //     webContentSend(
        //       `progress-${progressId}`,
        //       (dataDownloading_:any) => {
        //         const dataDownloading = dataDownloading_ as DownloadProgressProps

        //         // logger("dataDownloading === ", dataDownloading)
        //         let downloadProgressBarItems:Record<string,any> = JSON.parse(localStorage.getItem("downloadProgressBar") as string);

        //         const isStopDownload = dataDownloading?.progress < 100 && dataDownloading?.stopDownload === true
        //         if(dataDownloading?.speedBytes > 0)
        //         dataDownloadingObj = {
        //           ...dataDownloadingObj,
        //           ...downloadProgressBarItems,
        //           [`progressBar-${progressId}`]: {
        //             ...dataDownloading,
        //             download_folder,
        //             output_path: `${download_folder}\\${filenameObj.filename}.${ext}`,
        //             filename: filenameObj.filename,
        //             isDownloading: isStopDownload ? false : true,
        //           },
        //         };
        //         if(isStopDownload) {
        //           return resolve(dataDownloadingObj);
        //         }

        //         const dlSpeedNumber = dataDownloading.speedBytes;
        //         if(dlSpeedNumber > 0){
        //           countCompleted ++;
        //         }

        //         averageSpeedDownload = averageSpeedDownload + dlSpeedNumber;
        //         let speedDownloadItems:Record<string,any> = JSON.parse(localStorage.getItem("speedDownload") as string);

        //         if(dataDownloading?.progress < 100){
        //           localStorage.setItem("downloadProgressBar", JSON.stringify(dataDownloadingObj));
        //           // logger("countCompleted", dataDownloading, averageSpeedDownload, countCompleted, speedDownloadList);

        //           const bytes = countCompleted > 0 ?(averageSpeedDownload / countCompleted) : dataDownloading.totalBytes;
        //           let dataSpeedDownloadObj = {
        //             ...speedDownloadItems,
        //             [`speedDownload-${progressId}`]:
        //             _bytesToSize(bytes) + "/sec"
        //           };

        //           localStorage.setItem("speedDownload", JSON.stringify(dataSpeedDownloadObj));

        //           let downloadProgressBarLocal = localStorage.getItem("downloadProgressBar") as string;
        //           const downloadProgressBar = JSON.parse(downloadProgressBarLocal)
        //           this.updateDownloadProgressBar({
        //             ...downloadProgressBar,
        //             ...dataDownloadingObj
        //           });
        //         } else {
        //           isCompleted = true;
        //         }
        //       }
        //     );

        //     webContentSend(`download-completed-${progressId}`, async (dataCompleted: any) => {
        //       // const { downloadFolder, filePath, filename, progress, } = dataCompleted;
        //       ext = `${dataCompleted.filePath}`.split('.').slice(-1)[0]
        //       dataDownloadingObj.output_path = `${download_folder}\\${filenameObj.filename}.${ext}`
        //       isCompleted = true;
        //       resolve(dataDownloadingObj);
        //     });

        //     webContentSend(`download-error-${progressId}`, async (error: any, dataError: any) => {
        //       logger("Error downloading", error, dataError)
        //       isError = true;
        //       resolve({error, dataError, progressId, url: video_info.url})
        //     });
        //   }).catch((error) => reject({error, progressId, url: video_info.url}));
        // });

        let RangeBytes = 1024*1024*2
        let headers = {
          'Range': `bytes=${RangeBytes + 1}-${RangeBytes * 2}`
        };
        // await ipcRendererInvoke("downloadHelper", linkDL, progressId, info_dict.timeRange, {
        //   // filename: resolveFilename + `.${ext}`,
        //   // directory: resolveOutputFile,
        //   fileName: `${filenameObj.filename}.part1`,
        //   destFolder: download_folder,
        //   removeOnFail: false,
        //   // // chunkSize: 1024*1024,
        //   // acceptRangeIsKnown: true,
        //   // defaultFetchDownloadInfo: {length: 1024*1024*3, acceptRange: true},
        //   headers: headers,
        // }, RangeBytes * 2 - (RangeBytes + 1))
        // return dataDownloadingObj

        const dataAIODLP = await this.aioTubeDownloader(linkDL, info_dict, download_folder, filenameObj.filename, options)
        dataDownloadingObj = dataAIODLP.dataDownloadingObj
        isCompleted = dataAIODLP.isCompleted
        isError = dataAIODLP.isError
        averageSpeedDownload = dataAIODLP.averageSpeedDownload
        countCompleted = dataAIODLP.countCompleted
        ext = dataAIODLP.ext
      }
    }

    if(isCompleted || dataDownloadingObj?.[`progressBar-${progressIdTime}`]?.progress >= 100){
      if(this.licenseExpired){
        let limitDownloadExpiredUserLocal = localStorage.getItem("limitDownloadExpiredUser");
        if(limitDownloadExpiredUserLocal){
          const limitDownloadExpiredUser = Number(limitDownloadExpiredUserLocal) - 1;
          localStorage.setItem("limitDownloadExpiredUser", `${limitDownloadExpiredUser}`)
        }
      }
      const filename = filenameObj.filename;
      const filePath = `${download_folder}\\${filename}.${ext}`
      const dataDownloading = dataDownloadingObj[`progressBar-${progressIdTime}`] as DownloadProgressProps;

      if(dataDownloading.speedBytes){
        averageSpeedDownload = averageSpeedDownload + dataDownloading.speedBytes;
        let speedDownloadItems:Record<string,any> = JSON.parse(localStorage.getItem("speedDownload") as string);
  
        const bytes = dataDownloading.speedBytes > 0 ?(averageSpeedDownload / countCompleted) : dataDownloading.speedBytes;
        let dataSpeedDownloadObj = {
          ...speedDownloadItems,
          [`speedDownload-${progressIdTime}`]:
          bytesToSize(bytes) + "/sec"
        };
        if(dataDownloading.averageSpeed){
          dataSpeedDownloadObj[`speedDownload-${progressIdTime}`] = dataDownloading.averageSpeed + "/sec"
        }
      }

      // localStorage.setItem("speedDownload", JSON.stringify(dataSpeedDownloadObj));

      const req_dl = info_dict.requested_download
        ? info_dict.requested_download?.map(dlInfo => {
          return {
            ...dlInfo,
            output_path: download_folder,
            file_path: filePath,
            title: filename
          }
        }) : [];

      const infoDLCompleted = {
          ...dataDownloading,
        completed: "completed",
        requested_download: req_dl,
        output_file_path: filePath,
        output_path: download_folder,
        justExtracting: false,
        isDownloading: false,
      };
      // tableDataDownloaded.push(infoDLCompleted);

      let downloadProgressBar:Record<string,any> = JSON.parse(localStorage.getItem("downloadProgressBar") as string);
      dataDownloadingObj = {
        ...downloadProgressBar,
        [`progressBar-${progressIdTime}`]: {
          ...infoDLCompleted,
        },
      };
      // let fileMetadata = {} as any;
      // let retries = 0;
      // while (!fileMetadata.streams){
      //   const fileExist = await ipcRendererInvoke('file-exist', 'custom:' + filePath);
      //   const fileRequest = fileExist ? filePath : video_info.hd
      //   fileMetadata = await ipcRendererInvoke("file-metadata", progressId, fileRequest);
      //   if(isObject(fileMetadata) && fileMetadata.streams){
      //     const ffprobe = new FFMpegHelper();
      //     try {
      //       const videoMetadata = ffprobe.getVideoData(fileMetadata)
      //       logger("[videoMetadata]: ", videoMetadata)
      //       dataDownloadingObj[`progressBar-${progressId}`].metadata = videoMetadata;
      //       break;
      //     } catch (error) {
      //       logger({errorCatch: "Couldn't read video metadata", fileRequest})
      //       fileMetadata = {};
      //     }
      //   }
      //   if(retries >= 3){
      //     break;
      //   }
      //   retries++;
      // }
      // setTimeout(async () => {
      // }, 2000)
      // localStorage.setItem("downloadProgressBar", JSON.stringify(dataDownloadingObj));

      // this.updateDownloadProgressBar(dataDownloadingObj);
      
      // logger("Download with thumbnail", this.downloadWithThumbnail)
      const $this = this;
      if(this.downloadWithThumbnail){
        // logger("Downloading thumbnail", filenameObj, downloadFolder)
        if(isDesktopApp){
          const thumbnailFolder = `${download_folder}\\thumbnail`
          await ipcRendererInvoke('create-folder', thumbnailFolder, {recursive:true});
          // await ipcRendererInvoke(
          //   "download", video_info.thumbnail + `&download_with_rename_file=${encodeURIComponent(filename)}`,
          //   progressId + "-thumbnail", info_dict.createTime, {
          //   ...filenameObj,
          //   downloadFolder: thumbnailFolder,
          // })

          let oneMB = 1024**2 // 1 Megabyte
          let downloadOptions = {
            url: video_info.thumbnail,
            progressId: progressId + "-thumbnail",
            timeRange: info_dict.createTime,
            options: {
              filename: filename,
              resolveFilename: progressIdTime,
              outputFolder: thumbnailFolder,
              chunkSize: oneMB*10,
              // downloadEngine: "aioHelper" as "electron" | "iPull" | "aioHelper" | {type: "electron"| "iPull"} | null, // default is "aioHelper" and electron if size smaller than 11MB,
              iPullOptions: {
                chunkSize: oneMB*10
              },
              // override: false, // default true
              // delayError: 1500, // default 1000,
              delayGetFileMetadata: 0.01, // default 1 second,
              skipRunFileMetadata: true,
            },
            // loggerFilePath: "logger.txt", // default
          }
          return await ipcRendererInvoke("aioTubeDownloader", downloadOptions);
        } else if(video_info.thumbnail) {
          await new Promise(async (resolve, reject) => {
            downloadXMLHttpRequest({
              url: video_info.thumbnail as string,
              filename: filename,
              onXMLHttpRequest(request) {
                request.onabort = function(e){
                  e.preventDefault()
                  e.stopPropagation()
                  $this.onError?.({error: "onabort", type: "Thumbnail", url: linkDL})
                  resolve({error: "onabort", type: "Thumbnail", url: linkDL})
                }
                request.onerror = function(e){
                  e.preventDefault()
                  e.stopPropagation()
                  $this.onError?.({error: "onerror", type: "Thumbnail", url: linkDL})
                  resolve({error: "onerror", type: "Thumbnail", url: linkDL})
                }
              },
              async onProgress(dataProgress) {
                try {
                  logger?.log("dataProgress Thumbnail", dataProgress)
                } catch (error) {
                  reject({error, type: "Thumbnail", url: linkDL})
                }
              },
            })
          });
        }
      }
    }

    // logger("download Data " + progressId, dataDownloadingObj)
    return dataDownloadingObj
  }
  async aioTubeDownloader(
    linkDL:string, info_dict:IYouTube, download_folder:string, filename:string,
    options?: {
      isYouTube: boolean
      isDefaultLink: boolean
      isHighResolution: boolean
    }
  ){
    const { simpleData, updateSimpleData, addManyDownloadRecords } = this.useDownloadData;
    const settings = this.settings
    const isDownloadAudio = settings.downloadAs === "audio"
    
    const video_info = info_dict.info_dict
    const progressId = info_dict.progressId
    const progressIdTime = `${info_dict.progressId}-${info_dict.createTime}`;

    let isYouTube = false, isDefaultLink = false, isHighResolution = false
    if(options){
      isYouTube = options.isYouTube;
      isDefaultLink = options.isDefaultLink;
      isHighResolution = options.isHighResolution;
    }

    let isCompleted = false;
    let isError = false;
    let dataDownloadingObj = {
      [`progressBar-${progressIdTime}`]: {
        output_filename: info_dict.output_filename,
        translateOption: info_dict.translateOption,
      }
    } as Record<string, any>;
    let averageSpeedDownload = 0;
    let countCompleted = 0;
    let ext = 'mp4'

    let outputFilepath = `${download_folder}\\${filename}.${ext}`
    // const fileExist = await ipcRendererInvoke("file-exist", outputFilepath)
    // // logger("fileExist", fileExist, outputFilepath, linkDL)
    // if(fileExist){
    //   // let dataFileDeleted =
    //   await ipcRendererInvoke("remove-files", "custom:" + outputFilepath);
    // }
    let resolveFilename = progressIdTime
    let resolveOutputFile = `${download_folder}\\${resolveFilename}.${ext}`

    let resolveCompleted = false;
    type DataProgress = {
      progress: number;
      percentage: number;
      percentageString: string;
      totalBytes: number;
      total: string;
      downloadedBytes: number;
      downloaded:string;
      speedBytes: number;
      speed:string;
      averageSpeedBytes: number;
      averageSpeed:string;
      timeLeftSeconds: number;
      timeLeftFormat: string;
      metadata?: FileMetadata;
      completed?: boolean;
      stopDownload?: boolean;
    } & Record<string,any>;
    type DownloadMetaData = {
      dataProgress: DataProgress,
      size: string;
      finalAddress: string;
      savedFilePath: string;
      fileParts: string[];
      fileParse: {
        root: string,
        dir: string,
        base: string,
        ext: string,
        name: string
      }
    }
    const $this = this;
    function onError(error: any, resolveOrReject?: (data:any)=>void){
      isError = true
      const dataTableUpdate = $this.tableData.map(dt => {
        let data = dt
        if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
          dataDownloadingObj[`progressBar-${progressIdTime}`].completed = 'uncompleted'
          data = {
            ...data,
            completed: 'uncompleted'
          }
        }
        return data
      });
      $this.tableData = dataTableUpdate
      $this.updateDownloadProgressBar(dataDownloadingObj);
      $this.onError?.({error, progressIdTime, url: video_info.original_url as string})
      resolveOrReject?.({error, progressIdTime, url: video_info.url})
    }
    
    try {
      if(isDesktopApp){
        await new Promise(async (resolve, reject) => {
          const url = new URL(linkDL);
          if(!url.search.startsWith('?')){
            linkDL = linkDL + '?dl=1'
          }
          let resolvePush = true;
          let resolveError = true;
          await ipcRendererInvoke('create-folder', download_folder, {recursive:true});
          webContentSend(
            `progress-${progressIdTime}`,
            async (downloadMetaData_:any) => {
              let downloadMetaData = downloadMetaData_ as DownloadMetaData;
              // logger?.log("Data Downloading: ", downloadMetaData)
              let dataProgress = downloadMetaData.dataProgress
              let dataDownloading = dataProgress
              // logger("Data Downloading: ", dataDownloading)
              if(resolveCompleted){
                return;
              }
              if(resolvePush && downloadMetaData.fileParts?.length > 0) {
                resolvePush = false;
                ipcRendererInvoke("fileParts", downloadMetaData.fileParts);
              }
    
              let downloadProgressBarItems = JSON.parse(localStorage.getItem("downloadProgressBar") as string) as Record<string,any>;
    
              const isStopDownload = dataDownloading?.progress < 100 && dataDownloading?.stopDownload === true
              let previousProgressDownloading = dataDownloadingObj[`progressBar-${progressIdTime}`];
              const dataUpdate = {
                ...dataDownloading,
                progressIdTime,
                completed: "downloading",
                download_folder,
                output_path: download_folder,
                output_file_path: `${download_folder}\\${filename}.${ext}`,
                resolveOutputFilepath: `${download_folder}\\${resolveFilename}.${ext}`,
                filename: filename,
                isDownloading: isStopDownload ? false : true,
              }
              dataDownloadingObj = {
                ...dataDownloadingObj,
                ...downloadProgressBarItems,
                [`progressBar-${progressIdTime}`]: {
                  ...dataDownloadingObj[`progressBar-${progressIdTime}`],
                  ...dataUpdate
                },
              };
              // logger?.log("Data dataDownloadingObj", dataDownloadingObj)
              if(dataDownloading?.speedBytes <= 0 && previousProgressDownloading){
                dataDownloadingObj[`progressBar-${progressIdTime}`] = previousProgressDownloading
              }
              if(isStopDownload) {
                dataDownloadingObj[`progressBar-${progressIdTime}`].completed = 'uncompleted'
                this.updateDownloadProgressBar(dataDownloadingObj);
                return resolve(dataDownloadingObj);
              } else if(typeof dataDownloading?.stopDownload === 'boolean') {
                let loggerText = await ipcRendererInvoke("read-file", "logger.txt")
                logger?.log("text", loggerText)
                if(typeof loggerText === 'string' && loggerText?.includes(progressIdTime)){
                  setTimeout(() => {
                    resolve(dataDownloading)
                  },2500)
                }
              }
    
    
              averageSpeedDownload = dataDownloading.averageSpeedBytes;
    
              // localStorage.setItem("downloadProgressBar", JSON.stringify(dataDownloadingObj));
    
              const dataTableUpdate = this.tableData.map(dt => {
                let data = dt
                if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
                  data = {
                    ...data,
                    ...dataUpdate
                  }
                }
                return data
              });
              this.tableData = dataTableUpdate
    
              this.updateDownloadProgressBar(dataDownloadingObj);
    
    
              if(dataDownloading.completed){
                resolveCompleted = true;
              }
            }
          )
    
          webContentSend(
            `error-${progressIdTime}`,
            async (errorDownloadMetaData_) => {
              let errorDownloadMetaData = errorDownloadMetaData_ as DownloadMetaData;
              logger?.log("errorDownloadMetaData:", errorDownloadMetaData)
              // let timer = setTimeout( async () => {
              //   clearTimeout(timer);
              //   let removeFileData = await ipcRendererInvoke("remove-files", errorDownloadMetaData.fileParts);
              //   logger("removeFileData:", removeFileData);
              // },500)
              const dataTableUpdate = this.tableData.map(dt => {
                let data = dt
                if(Object.keys(dataDownloadingObj).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
                  dataDownloadingObj[`progressBar-${progressIdTime}`].completed = 'uncompleted'
                  data = {
                    ...data,
                    completed: 'uncompleted'
                  }
                }
                return data
              });
              this.tableData = dataTableUpdate
              // updateSimpleData({dataExtractionTest: dataTableUpdate})
              this.updateDownloadProgressBar(dataDownloadingObj);
            }
          )
          // webContentSend(
          //   `stop-${progressId}`,
          //   async (stopDataDownload_:any) => {
          //     const stopDataDownload = stopDataDownload_ as DownloadProgressProps;
          //     logger("Stop Download: ", stopDataDownload)
          //     if(stopDataDownload.stopDownload) {
          //       return resolve(dataDownloadingObj);
          //     } else {
          //       let loggerText:string = await ipcRendererInvoke("read-file", "logger.txt")
          //       // logger("text", loggerText)
          //       if(loggerText.includes(progressId as string)){
          //         setTimeout(() => {
          //           resolve(stopDataDownload)
          //         },2500)
          //       }
          //     }
          //   }
          // )
          webContentSend(
            `completed-${progressIdTime}`,
            async (downloadMetaData_:any) => {
              isCompleted = true;
              let downloadMetaData = downloadMetaData_ as DownloadMetaData;
              if(downloadMetaData.fileParse){
                ext = downloadMetaData.fileParse.ext.replace(/\./g, "")
              }
              const completedData = downloadMetaData.dataProgress;
              // logger?.log("Completed Progress: ", downloadMetaData, "\ndataDownloadingObj", dataDownloadingObj)
              const resolveOutputFilepath = dataDownloadingObj?.[`progressBar-${progressIdTime}`]?.resolveOutputFilepath
              if(resolveOutputFilepath){
                // const newFilename =
                await ipcRendererInvoke("rename-file", resolveOutputFilepath, filename)
                // logger("new filename: ", newFilename)
              }
              // resolve(dataDownloadingObj);
            }
          )
          logger?.log('linkDL',linkDL)
          let oneMB = 1024**2 // 1 Megabyte
          let downloadOptions = {
            url: linkDL,
            progressId,
            timeRange: info_dict.createTime,
            options: {
              filename: filename,
              resolveFilename: resolveFilename,
              outputFolder: download_folder,
              chunkSize: oneMB*10,
              // downloadEngine: "aioHelper" as "electron" | "iPull" | "aioHelper" | {type: "electron"| "iPull"} | null, // default is "aioHelper" and electron if size smaller than 11MB,
              iPullOptions: {
                chunkSize: oneMB*10
              },
              // override: false, // default true
              // delayError: 1500, // default 1000,
              delayGetFileMetadata: 0.3, // default 1 second,
              addAudio: isYouTube && isHighResolution && video_info.music ? video_info.music : undefined
            },
            // loggerFilePath: "logger.txt", // default
          }
          return await ipcRendererInvoke("aioTubeDownloader", downloadOptions).then(async (res) => {
            // logger?.log("Download Response", res)
            if(res.error){
              let error = res.error
              logger?.log("Error downloading", error)
              isError = true;
              const dataTableUpdate = this.tableData.map(dt => {
                let data = dt
                if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
                  dataDownloadingObj[`progressBar-${progressIdTime}`].completed = 'uncompleted'
                  data = {
                    ...data,
                    completed: 'uncompleted'
                  }
                }
                return data
              });
              this.tableData = dataTableUpdate
              // updateSimpleData({dataExtractionTest: dataTableUpdate});
              this.updateDownloadProgressBar(dataDownloadingObj);
              resolve({error, progressIdTime, url: video_info.url})
            } else {
              isCompleted = true;
              let downloadMetaData = res as DownloadMetaData;
              let metadata = downloadMetaData?.dataProgress?.metadata
              if(metadata){
                const req_dl = info_dict.requested_download
                  ? info_dict.requested_download?.map(dlInfo => {
                    return {
                      ...dlInfo,
                      output_path: download_folder,
                      file_path: outputFilepath,
                      title: filename
                    }
                  }) : [];
    
                const infoDLCompleted = {
                  completed: "completed",
                  requested_download: req_dl,
                  output_file_path: outputFilepath,
                  output_path: download_folder,
                  justExtracting: false,
                  isDownloading: false,
                };
                let downloadProgressBarItems = JSON.parse(localStorage.getItem("downloadProgressBar") as string);
                const dataUpdate = {
                  ...dataDownloadingObj[`progressBar-${progressIdTime}`],
                  ...downloadMetaData.dataProgress,
                  metadata,
                  ...infoDLCompleted,
                  progressIdTime
                }
                dataDownloadingObj = {
                  ...dataDownloadingObj,
                  ...downloadProgressBarItems,
                  [`progressBar-${progressIdTime}`]: dataUpdate
                }
                // localStorage.setItem("downloadProgressBar", JSON.stringify(dataDownloadingObj));
    
                const dataTableUpdate = this.tableData.map(dt => {
                  let data = dt
                  if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
                    data = {
                      ...data,
                      ...dataUpdate,
                    }
                  }
                  return data
                });
                this.tableData = dataTableUpdate
                // this.dataDownloadCompleted.push({...info_dict, ...dataUpdate})
                
                // const dataDownloadCompleted = removeDuplicateObjArray([...simpleData.dataDownloadCompleted, ...this.dataDownloadCompleted], 'progressIdTime')
                // updateSimpleData({dataExtractionTest: dataTableUpdate, dataDownloadCompleted: dataDownloadCompleted})
                
                this.updateDownloadProgressBar(dataDownloadingObj);
              }
    
              resolve(metadata)
            }
          }).catch((error) => {
            isError = true
            const dataTableUpdate = this.tableData.map(dt => {
              let data = dt
              if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
                dataDownloadingObj[`progressBar-${progressIdTime}`].completed = 'uncompleted'
                data = {
                  ...data,
                  completed: 'uncompleted'
                }
              }
              return data
            });
            this.tableData = dataTableUpdate
            // updateSimpleData({dataExtractionTest: dataTableUpdate})
            this.updateDownloadProgressBar(dataDownloadingObj);
            reject({error, progressIdTime, url: video_info.url})}
          );
        });
      } else if(!isDesktopApp){
        // linkDL = '/download.php?url='+encodeURIComponent(linkDL) + '&redirect=true';
        if(video_info.extractor_key?.toLowerCase() === 'tiktok' && linkDL.includes('.tiktokcdn.') && !isDownloadAudio){
          linkDL = `https://tikwm.com/video/media/play/${video_info.id}.mp4`
        }
        linkDL = '/download.php?data='+encodeJsonBtoa({url:linkDL, redirect: true});
        
        await new Promise(async (resolve, reject) => {
          downloadXMLHttpRequest({
            url: linkDL,
            filename: filename,
            onXMLHttpRequest(request) {
              request.onabort = function(e){
                e.preventDefault()
                e.stopPropagation()
                onError({error: "onabort"}, resolve)
              }
              request.onerror = function(e){
                e.preventDefault()
                e.stopPropagation()
                onError({error: "onerror"}, resolve)
              }
            },
            async onProgress(dataProgress, stopDownload) {
              try {
                ext = dataProgress.ext
                let dataDownloading = dataProgress;
                let downloadProgressBarItems = JSON.parse(localStorage.getItem("downloadProgressBar") as string) as Record<string,any>;
    
                const isStopDownload = dataDownloading?.progress < 100 && stopDownload
                let previousProgressDownloading = dataDownloadingObj[`progressBar-${progressIdTime}`];
                const dataUpdate = {
                  ...dataDownloading,
                  progressIdTime,
                  completed: dataDownloading?.progress >= 100 ? "completed" : "downloading",
                  download_folder,
                  output_path: download_folder,
                  output_file_path: `${download_folder}\\${filename}.${ext}`,
                  resolveOutputFilepath: `${download_folder}\\${resolveFilename}.${ext}`,
                  filename: filename,
                  isDownloading: !isStopDownload,
                }
                dataDownloadingObj = {
                  ...dataDownloadingObj,
                  ...downloadProgressBarItems,
                  [`progressBar-${progressIdTime}`]: {
                    ...dataDownloadingObj[`progressBar-${progressIdTime}`],
                    ...dataUpdate
                  },
                };
                // logger?.log("Data dataDownloadingObj", dataDownloadingObj)
                if(dataDownloading?.speedBytes <= 0 && previousProgressDownloading){
                  dataDownloadingObj[`progressBar-${progressIdTime}`] = previousProgressDownloading
                }
                if(isStopDownload) {
                  dataDownloadingObj[`progressBar-${progressIdTime}`].completed = 'uncompleted'
                  $this.updateDownloadProgressBar(dataDownloadingObj);
                  return resolve(dataDownloadingObj);
                } else if(dataDownloading?.stopDownload) {
                  let loggerText = await ipcRendererInvoke("read-file", "logger.txt")
                  logger?.log("text", loggerText)
                  if(typeof loggerText === 'string' && loggerText?.includes(progressIdTime)){
                    setTimeout(() => {
                      resolve(dataDownloading)
                    },1500)
                  }
                }
      
                averageSpeedDownload = dataDownloading.averageSpeedBytes;
      
                const dataTableUpdate = $this.tableData.map(dt => {
                  let data = dt
                  if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
                    data = {
                      ...data,
                      ...dataUpdate
                    }
                  }
                  return data
                });
                $this.tableData = dataTableUpdate
      
                $this.updateDownloadProgressBar(dataDownloadingObj);
      
      
                if(dataDownloading?.progress >= 100 && !isCompleted){
                  isCompleted = true;
                  var video = document.createElement('video');
                  var mimeType = dataProgress.mimeType
                  video.innerHTML = `<source src="${linkDL}" type="${mimeType}" />`
                  video.onloadedmetadata = function(){
                    try {
                      var width = video.videoWidth
                      var height = video.videoHeight
                      var duration = video.duration
                      var bitrate = dataProgress.totalBytes / (duration * (1000/8)) * 1000
                      bitrate = Number(String(bitrate).includes(".") ? String(bitrate).split(".")[0] : bitrate);
                      var metadata = {
                        ext,
                        filename,
                        filepath: `${filename}.${ext}`,
                        filenameUri: encodeURI(`file:///C:/Downloads/${filename}.${ext}`),
                        fileSize: dataProgress.totalBytes,
                        fileSizeString: dataProgress.total,
                        folderPath: `C:/Downloads`,
                        title: filename,
                        width, height, 
                        resolution: `${width}x${height}`,
                        duration, bitrate,
                      }
                      let downloadProgressBarItems = JSON.parse(localStorage.getItem("downloadProgressBar") as string) as Record<string,any>;
                      dataDownloadingObj = {
                        ...dataDownloadingObj,
                        ...downloadProgressBarItems,
                        [`progressBar-${progressIdTime}`]: {
                          ...dataDownloadingObj[`progressBar-${progressIdTime}`],
                          metadata: metadata
                        },
                      };
                    } catch (error) {
                      logger?.log("error metadata", error)
                    }
                    $this.updateDownloadProgressBar(dataDownloadingObj);
                    setTimeout(()=>{
                      resolve(dataDownloadingObj)
                    }, 1000)
                  }
                }
              } catch (error) {
                onError(error, reject)
              }
            },
          })
        });
        
        // function simpleLoad() {
        //   await sleep(1)
        //   linkDL = '/download.php?url='+encodeURIComponent(linkDL) + '&title=' + encodeURIComponent(filename);
          
        //   isCompleted = true;
        //   let downloadMetaData = {
        //     dataProgress: {
        //       progress: 100,
        //       percentage: 100,
        //       percentageString: '100',
        //       totalBytes: 0,
        //       total: '',
        //       downloadedBytes: 0,
        //       downloaded:'',
        //       speedBytes: 0,
        //       speed:'',
        //       averageSpeedBytes: 0,
        //       averageSpeed:'',
        //       timeLeftSeconds: 0,
        //       timeLeftFormat: '',
        //       metadata: undefined,
        //     },
        //   };
        //   let metadata = downloadMetaData?.dataProgress?.metadata
        
        //   const req_dl = info_dict.requested_download
        //     ? info_dict.requested_download?.map(dlInfo => {
        //       return {
        //         ...dlInfo,
        //         output_path: download_folder,
        //         file_path: outputFilepath,
        //         title: filename
        //       }
        //     }) : [];
      
        //   const infoDLCompleted = {
        //     completed: "completed",
        //     requested_download: req_dl,
        //     output_file_path: outputFilepath,
        //     output_path: download_folder,
        //     justExtracting: false,
        //     isDownloading: false,
        //     linkDL,
        //   };
        //   let downloadProgressBarItems = JSON.parse(localStorage.getItem("downloadProgressBar") as string);
        //   const dataUpdate = {
        //     ...dataDownloadingObj[`progressBar-${progressIdTime}`],
        //     ...downloadMetaData.dataProgress,
        //     metadata,
        //     ...infoDLCompleted,
        //     progressIdTime
        //   }
        //   dataDownloadingObj = {
        //     ...dataDownloadingObj,
        //     ...downloadProgressBarItems,
        //     [`progressBar-${progressIdTime}`]: dataUpdate
        //   }
        //   // localStorage.setItem("downloadProgressBar", JSON.stringify(dataDownloadingObj));
      
        //   const dataTableUpdate = this.tableData.map(dt => {
        //     let data = dt
        //     if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
        //       data = {
        //         ...data,
        //         ...dataUpdate,
        //       }
        //     }
        //     return data
        //   });
        //   this.tableData = dataTableUpdate
        //   // this.dataDownloadCompleted.push({...info_dict, ...dataUpdate})
          
        //   // const dataDownloadCompleted = removeDuplicateObjArray([...simpleData.dataDownloadCompleted, ...this.dataDownloadCompleted], 'progressIdTime')
        //   // updateSimpleData({dataExtractionTest: dataTableUpdate, dataDownloadCompleted: dataDownloadCompleted})
          
        //   this.updateDownloadProgressBar(dataDownloadingObj);
        // }
      }
    } catch (error) {
      onError(error)
    }


    return {dataDownloadingObj, isCompleted, isError, averageSpeedDownload, countCompleted, ext }
  }
  async iPullDL(linkDL:string, info_dict:IYouTube, download_folder:string, filename:string){
    const video_info = info_dict.info_dict
    const progressId = info_dict.progressId

    let isCompleted = false;
    let isError = false;
    let dataDownloadingObj = {} as Record<string, any>;
    let averageSpeedDownload = 0;
    let countCompleted = 0;
    let ext = 'mp4'

    let outputFilepath = `${download_folder}\\${filename}.${ext}`
    // const fileExist = await ipcRendererInvoke("file-exist", outputFilepath)
    // // logger("fileExist", fileExist, outputFilepath, linkDL)
    // if(fileExist){
    //   // let dataFileDeleted =
    //   await ipcRendererInvoke("remove-files", "custom:" + outputFilepath);
    // }
    let resolveFilename = progressId + "-" + Date.now()
    let resolveOutputFile = `${download_folder}\\${resolveFilename}.${ext}`

    // let progress = 0;
    // let downloaded = "0 Bytes";
    // let speedBytes = 0;
    // let speed = "0 Bytes";
    // let totalBytes = 0;
    // let total = "0 Bytes";

    await new Promise(async (resolve, reject) => {
      const url = new URL(linkDL)
      if(!url.search.startsWith('?')){
        linkDL = linkDL + '?dl=1'
      }
      let DataDownloading = {
        "timeLeft": 14.728282232704403,
        "ended": false,
        "totalDownloadParts": 1,
        "fileName": "tiktok-6958825767098797313-1715183909701.mp4",
        "downloadPart": 1,
        "transferAction": "Downloading",
        "downloadStatus": "Active",
        "downloadFlags": [],
        "startTime": 1715183914123,
        "endTime": 0,
        "formattedSpeed": "325.63kB/s",
        "formatTransferred": "3.26MB",
        "formatTransferredOfTotal": "3.26MB/3.27MB",
        "formatTotal": "3.27MB",
        "formatTimeLeft": "15ms",
        "formattedPercentage": "99.85%",
        "formattedComment": "",
        "index": 0,
        "speed": 325632,
        "transferredBytes": 3260416,
        "totalBytes": 3265212,
        "percentage": 99.85311826613402,
      }

      webContentSend(
        `progress-${progressId}`,
        async (dataDownloading_:any) => {
          let _dataDownloading = dataDownloading_ as typeof DataDownloading
          let dataDownloading = {
            totalBytes: _dataDownloading.totalBytes,
            total: bytesToSize(_dataDownloading.totalBytes),
            progress: _dataDownloading.percentage,
            downloaded: bytesToSize(_dataDownloading.transferredBytes),
            speedBytes: _dataDownloading.speed,
            speed: bytesToSize(_dataDownloading.speed),
          } as DownloadProgressProps;
          // logger("Data Downloading: ", dataDownloading)

          let downloadProgressBarItems:Record<string,any> = JSON.parse(localStorage.getItem("downloadProgressBar") as string);

            const isStopDownload = dataDownloading?.progress < 100 && dataDownloading?.stopDownload === true
            let previousProgressDownloading = dataDownloadingObj[`progressBar-${progressId}`]
            dataDownloadingObj = {
              ...dataDownloadingObj,
              ...downloadProgressBarItems,
              [`progressBar-${progressId}`]: {
                ...dataDownloading,
                download_folder,
                output_path: download_folder,
                output_file_path: `${download_folder}\\${filename}.${ext}`,
                resolveOutputFilepath: `${download_folder}\\${resolveFilename}.${ext}`,
                filename: filename,
                isDownloading: isStopDownload ? false : true,
              },
            };
            if(dataDownloading.speedBytes <= 0 && previousProgressDownloading){
              dataDownloadingObj[`progressBar-${progressId}`] = previousProgressDownloading
            }
            if(isStopDownload) {
              return resolve(dataDownloadingObj);
            } else {
              let loggerText:string = await ipcRendererInvoke("read-file", "logger.txt")
              // logger("text", loggerText)
              if(loggerText.includes(progressId as string)){
                setTimeout(() => {
                  resolve(dataDownloading)
                },2500)
              }
            }

            const dlSpeedNumber = dataDownloading.speedBytes;
            if(dlSpeedNumber > 0){
              countCompleted ++;
            }

            averageSpeedDownload = averageSpeedDownload + dlSpeedNumber;
            let speedDownloadItems:Record<string,any> = JSON.parse(localStorage.getItem("speedDownload") as string);

            if(dataDownloading?.progress < 100){
              localStorage.setItem("downloadProgressBar", JSON.stringify(dataDownloadingObj));
              // logger("countCompleted", dataDownloading, averageSpeedDownload, countCompleted, speedDownloadList);

              const bytes = countCompleted > 0 ?(averageSpeedDownload / countCompleted) : dataDownloading.totalBytes;
              let dataSpeedDownloadObj = {
                ...speedDownloadItems,
                [`speedDownload-${progressId}`]:
                bytesToSize(bytes) + "/sec"
              };

              localStorage.setItem("speedDownload", JSON.stringify(dataSpeedDownloadObj));

              let downloadProgressBarLocal = localStorage.getItem("downloadProgressBar") as string;
              const downloadProgressBar = JSON.parse(downloadProgressBarLocal)
              this.updateDownloadProgressBar({
                ...downloadProgressBar,
                ...dataDownloadingObj
              });
            }
            // else {
            //   isCompleted = true;
            // }
        }
      )
      webContentSend(
        `saveProgress-${progressId}`,
        async (saveProgress_:any) => {
          const saveProgress = saveProgress_ as DownloadProgressProps;
          logger?.log("Save Progress: ", saveProgress)
        }
      )
      webContentSend(
        `stop-${progressId}`,
        async (stopDataDownload_:any) => {
          const stopDataDownload = stopDataDownload_ as DownloadProgressProps;
          logger?.log("Stop Download: ", stopDataDownload)
          if(stopDataDownload.stopDownload) {
            return resolve(dataDownloadingObj);
          } else {
            let loggerText:string = await ipcRendererInvoke("read-file", "logger.txt")
            // logger?.log("text", loggerText)
            if(loggerText.includes(progressId as string)){
              setTimeout(() => {
                resolve(stopDataDownload)
              },2500)
            }
          }
        }
      )
      webContentSend(
        `completed-${progressId}`,
        async (completedData_:any) => {
          isCompleted = true;
          const completedData = completedData_ as DownloadProgressProps;
          const resolveOutputFilepath = dataDownloadingObj?.[`progressBar-${progressId}`]?.resolveOutputFilepath
          if(resolveOutputFilepath){
            logger?.log("Completed Progress: ", completedData)
            // const newFilename =
            await ipcRendererInvoke("rename-file", resolveOutputFilepath, filename)
            // logger("new filename: ", newFilename)
          }
          // resolve(dataDownloadingObj);
        }
      )

      let headers = {} as any
      headers['Range'] = `bytes=0-${1024*1024*2}`;

      return await ipcRendererInvoke("downloadIPull", linkDL, progressId, info_dict.timeRange, {
        filename: filename + `.${ext}`,
        directory: download_folder,
        // chunkSize: 1024*1024,
        // acceptRangeIsKnown: true,
        // defaultFetchDownloadInfo: {length: 1024*1024*2, acceptRange: true},
        parallelStreams: 5,
        // headers: headers,
      }).then(async (res) => {
        logger?.log("Download Response", res)
        if(res.error){
          let error = res.error
          logger?.log("Error downloading", error)
          isError = true;
          resolve({error, progressId, url: video_info.url})
        } else {
          resolve(dataDownloadingObj)
        }
      }).catch((error) => reject({error, progressId, url: video_info.url}));
    });

    return {dataDownloadingObj, isCompleted, isError, averageSpeedDownload, countCompleted, ext }
  }
  async electronDL(linkDL:string, info_dict:IYouTube, download_folder:string, filename:string){
    const video_info = info_dict.info_dict
    const progressId = info_dict.progressId

    let isCompleted = false;
    let isError = false;
    let dataDownloadingObj = {} as Record<string, any>;
    let averageSpeedDownload = 0;
    let countCompleted = 0;
    let ext = 'mp4'

    let outputFilepath = `${download_folder}\\${filename}.${ext}`
    // const fileExist = await ipcRendererInvoke("file-exist", outputFilepath)
    // // logger("fileExist", fileExist, outputFilepath, linkDL)
    // if(fileExist){
    //   // let dataFileDeleted =
    //   await ipcRendererInvoke("remove-files", "custom:" + outputFilepath);
    // }
    let resolveFilename = progressId + "-" + Date.now()
    let resolveOutputFile = `${download_folder}\\${resolveFilename}.${ext}`

    // let progress = 0;
    // let downloaded = "0 Bytes";
    // let speedBytes = 0;
    // let speed = "0 Bytes";
    // let totalBytes = 0;
    // let total = "0 Bytes";

    await new Promise(async (resolve, reject) => {
      const url = new URL(linkDL)
      if(!url.search.startsWith('?')){
        linkDL = linkDL + '?dl=1'
      }

      // let headers = {} as Record<string, string>
      // headers['Range'] = `bytes=0-${1024*1024*2}`;
      return await ipcRendererInvoke("download", linkDL + `&download_with_rename_file=${encodeURIComponent(resolveFilename)}`, progressId, info_dict.timeRange, {
        filename: resolveFilename,
        downloadFolder: download_folder,
        // headers: Object.entries(headers).map(([key, val]) => ({name: key, value: val})),
        // headers: headers,
      }).then(async (_) => {
        webContentSend(
          `progress-${progressId}`,
          async (dataDownloading_:any) => {
            const dataDownloading = dataDownloading_ as DownloadProgressProps

            // logger("dataDownloading === ", dataDownloading, filename)
            let downloadProgressBarItems:Record<string,any> = JSON.parse(localStorage.getItem("downloadProgressBar") as string);

            const isStopDownload = dataDownloading?.progress < 100 && dataDownloading?.stopDownload === true
            let previousProgressDownloading = dataDownloadingObj[`progressBar-${progressId}`]
            dataDownloadingObj = {
              ...dataDownloadingObj,
              ...downloadProgressBarItems,
              [`progressBar-${progressId}`]: {
                ...dataDownloading,
                download_folder,
                output_path: download_folder,
                output_file_path: `${download_folder}\\${filename}.${ext}`,
                filename: filename,
                isDownloading: isStopDownload ? false : true,
              },
            };
            if(dataDownloading.speedBytes <= 0 && previousProgressDownloading){
              dataDownloadingObj[`progressBar-${progressId}`] = previousProgressDownloading
            }
            if(isStopDownload) {
              return resolve(dataDownloadingObj);
            } else {
              let loggerText:string = await ipcRendererInvoke("read-file", "logger.txt")
              // logger("text", loggerText)
              if(loggerText.includes(progressId as string)){
                setTimeout(() => {
                  resolve(dataDownloading)
                },2500)
              }
            }

            const dlSpeedNumber = dataDownloading.speedBytes;
            if(dlSpeedNumber > 0){
              countCompleted ++;
            }

            averageSpeedDownload = averageSpeedDownload + dlSpeedNumber;
            let speedDownloadItems:Record<string,any> = JSON.parse(localStorage.getItem("speedDownload") as string);

            if(dataDownloading?.progress < 100){
              localStorage.setItem("downloadProgressBar", JSON.stringify(dataDownloadingObj));
              // logger("countCompleted", dataDownloading, averageSpeedDownload, countCompleted, speedDownloadList);

              const bytes = countCompleted > 0 ?(averageSpeedDownload / countCompleted) : dataDownloading.totalBytes;
              let dataSpeedDownloadObj = {
                ...speedDownloadItems,
                [`speedDownload-${progressId}`]:
                bytesToSize(bytes) + "/sec"
              };

              localStorage.setItem("speedDownload", JSON.stringify(dataSpeedDownloadObj));

              let downloadProgressBarLocal = localStorage.getItem("downloadProgressBar") as string;
              const downloadProgressBar = JSON.parse(downloadProgressBarLocal)
              this.updateDownloadProgressBar({
                ...downloadProgressBar,
                ...dataDownloadingObj
              });
            }
            else {
              isCompleted = true;
            }
          }
        );

        webContentSend(`download-completed-${progressId}`, async (dataCompleted: any) => {
          // const { downloadFolder, filePath, filename, progress, } = dataCompleted;
          ext = `${dataCompleted.filePath}`.split('.').slice(-1)[0]
          dataDownloadingObj.output_file_path = `${download_folder}\\${filename}.${ext}`
          dataDownloadingObj.output_path = download_folder
          isCompleted = true;
          const newFilename = await ipcRendererInvoke("rename-file", resolveOutputFile, filename)
          logger?.log("new filename: ", newFilename)
          resolve(dataDownloadingObj);
        });

        webContentSend(`download-error-${progressId}`, async (error: any, dataError: any) => {
          logger?.log("Error downloading", error, dataError)
          isError = true;
          resolve({error, dataError, progressId, url: video_info.url})
        });
      }).catch((error) => reject({error, progressId, url: video_info.url}));
    });

    return {dataDownloadingObj, isCompleted, isError, averageSpeedDownload, countCompleted, ext }
  }
  async aiodlp(linkDL:string, info_dict:IYouTube, download_folder:string, filename:string){
    const video_info = info_dict.info_dict
    const progressId = info_dict.progressId

    let resolveFilename = progressId + "-" + Date.now()

    let args = [
      '--newline',
      // '--quiet',
      // '--progress',
      '--no-part',
      '--force-overwrites',
      // ...(localSettings.downloadWithThumbnail === true ?["--write-thumbnail"] : []),

      // '--output','%(title)s.%(ext)s',
      '--output', `${download_folder}\\${resolveFilename}.%(ext)s`,
      // 'https://www.youtube.com/watch?v=5dlubcRwYnI',
      // video_info.requested_formats?.[0].url,
      linkDL,
    ] as string[];
    // logger('args: ', args)

    let isCompleted = false;
    let isError = false;
    let dataDownloadingObj = {} as Record<string, any>;
    let averageSpeedDownload = 0;
    let countCompleted = 0;
    let ext = 'mp4'

    let progress = 0;
    let downloaded = "0 Bytes";
    let speedBytes = 0;
    let speed = "0 Bytes";
    let totalBytes = 0;
    let total = "0 Bytes";
    // let frag = "0/1";
    await new Promise(async (resolve, reject) => {
      return await ipcRendererInvoke("aio-dlp", progressId, args).then((_) => {
        webContentSend(`aio-dlp-processing-${progressId}`,async (str_data: any) => {
          let strData = (str_data as string).trim()
          // logger("[dataProgress string data === ]: ", strData)
          if(strData.startsWith('[download] Destination:')){
            ext = strData.split('.').slice(-1)[0]
          }
          if(!strData.startsWith('[download] Destination:') && strData.startsWith('[download]') && strData.includes("ETA")){
            let strDataSplit = strData.replace(/\[download\]/g, "").replace(/ of /g, "").trim().split(' ').filter(v => v !== "")
            let _progress = Number(strDataSplit[0].trim().replace(/%/g, ""))
            let speedProgress = _progress - progress
            progress = _progress
            total = strDataSplit[1].trim()
            totalBytes = sizeToBytes(total);
            const downloadedBytes = totalBytes * progress / 100
            speedBytes = totalBytes * speedProgress / 100
            downloaded = bytesToSize(downloadedBytes)
            speed = bytesToSize(speedBytes)
            const dataDownloading = {
              totalBytes,
              total,
              progress,
              downloaded,
              speedBytes,
              speed,
            } as DownloadProgressProps;
            // logger("[dataProgress]: ", dataDownloading)

            let downloadProgressBarItems:Record<string,any> = JSON.parse(localStorage.getItem("downloadProgressBar") as string);

            const isStopDownload = dataDownloading?.progress < 100 && dataDownloading?.stopDownload === true
            dataDownloadingObj = {
              ...dataDownloadingObj,
              ...downloadProgressBarItems,
              [`progressBar-${progressId}`]: {
                ...dataDownloading,
                download_folder,
                output_path: download_folder,
                output_file_path: `${download_folder}\\${filename}.${ext}`,
                filename: filename,
                resolveOutputFilepath: `${download_folder}\\${resolveFilename}.${ext}`,
                isDownloading: isStopDownload ? false : true,
              },
            };
            if(isStopDownload) {
              const resolveOutputFilepath = dataDownloadingObj?.[`progressBar-${progressId}`]?.resolveOutputFilepath
              if(resolveOutputFilepath){
                setTimeout(async() => {
                  const fileExist = await ipcRendererInvoke("file-exist", resolveOutputFilepath)
                  if(fileExist){
                    // const newFilename =
                    await ipcRendererInvoke("rename-file", resolveOutputFilepath, filename)
                    // logger("stop new filename: ", newFilename)
                  }
                }, 2500)
              }
              return resolve(dataDownloadingObj);
            }

            const dlSpeedNumber = dataDownloading.speedBytes;
            if(dlSpeedNumber > 0){
              countCompleted ++;
            }

            averageSpeedDownload = averageSpeedDownload + dlSpeedNumber;
            let speedDownloadItems:Record<string,any> = JSON.parse(localStorage.getItem("speedDownload") as string);

            if(dataDownloading?.progress < 100){
              localStorage.setItem("downloadProgressBar", JSON.stringify(dataDownloadingObj));
              // logger("countCompleted", dataDownloading, averageSpeedDownload, countCompleted, speedDownloadList);

              const bytes = countCompleted > 0 ?(averageSpeedDownload / countCompleted) : dataDownloading.speedBytes;
              let dataSpeedDownloadObj = {
                ...speedDownloadItems,
                [`speedDownload-${progressId}`]:
                bytesToSize(bytes) + "/sec"
              };

              localStorage.setItem("speedDownload", JSON.stringify(dataSpeedDownloadObj));

              let downloadProgressBarLocal = localStorage.getItem("downloadProgressBar") as string;
              const downloadProgressBar = JSON.parse(downloadProgressBarLocal)
              this.updateDownloadProgressBar({
                ...downloadProgressBar,
                ...dataDownloadingObj
              });
            } else {
              isCompleted = true;
              const resolveOutputFilepath = dataDownloadingObj?.[`progressBar-${progressId}`]?.resolveOutputFilepath
              if(resolveOutputFilepath){
                // const newFilename =
                await ipcRendererInvoke("rename-file", resolveOutputFilepath, filename)
                // logger("new filename: ", newFilename)
              }
              resolve(dataDownloadingObj);
            }
          }
        });
        webContentSend(`aio-dlp-error-${progressId}`,async (error: any) => {
          isError = true;
          let valueError = { error, progressId, url: video_info.url }
          logger?.log("Error === ", valueError);
          resolve(valueError)
        });
      })
      .catch((error) => reject({error, progressId, url: video_info.url}));
    })
    return {dataDownloadingObj, isCompleted, isError, averageSpeedDownload, countCompleted, ext }
  }
  async aiodlpDefault(linkDL:string, info_dict:IYouTube, download_folder:string, filename:string, isHighResolution:boolean, isDefaultLink:boolean){
    const settings = this.settings
    const video_info = info_dict.info_dict
    const progressId = info_dict.progressId
    const progressIdTime = `${info_dict.progressId}-${info_dict.createTime}`;
    let resolveFilename = progressIdTime

    let args = [
      '--newline', '--quiet', '--progress', '--no-part',
      '--force-overwrites',
      // '--trim-filenames', 135
      // '--progress-template', 'download-title:%(info.id)s-%(progress.eta)s'
      // "--skip-download",
      // "--no-simulate", "--list-formats",
      // "--dump-json",
      // ...(this.downloadWithThumbnail ? ["--write-thumbnail"] : []),
      ...(isHighResolution || isDefaultLink ? [
        "--ffmpeg-location", 'ffmpeg\\ffmpeg.exe',
        // '--format', `bestvideo[${videoSettings.download_type === "vertical" ? "width" : "height"}<=${videoSettings.resolution}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/bestvideo+bestaudio/best`,
        // "-f", `bv*[${videoSettings.download_type === "vertical" ? "width" : "height"}<=${videoSettings.resolution}]+ba[ext=m4a]/b[ext=mp4]/wv*+ba/w`,
        "-S", `res:${settings.videoResolution},ext:mp4:m4a`, "--recode", "mp4",
        // "-f", video_info.format_id, "--recode","mp4"
      ] : []),
      // '--output','%(title)s.%(ext)s',
      '--output', `${download_folder}\\${resolveFilename}.%(ext)s`,
      // 'https://www.youtube.com/watch?v=5dlubcRwYnI',
      // video_info.requested_formats?.[0].url,
      linkDL,
    ] as string[];
    // logger("[args]: ", args)

    let isCompleted = false;
    let isError = false;
    let dataDownloadingObj = {} as Record<string, any>;
    let averageSpeedDownload = 0;
    let countCompleted = 0;
    let ext = 'mp4'

    let dataProgressing = {} as (DownloadProgressProps | Record<string, any>) ;
    let progress = 0;
    let downloaded = "0 Bytes";
    let speedBytes = 0;
    let speed = "0 Bytes";
    let totalBytes = 0;
    let total = "0 Bytes";
    let frag = "0/1";

    await new Promise(async (resolve, reject) => {
      return await ipcRendererInvoke("aio-dlp", progressIdTime, args).then((_) => {
        webContentSend(`aio-dlp-processing-${progressIdTime}`,async (str_data: any) => {
          let strData = (str_data as string).trim()
          if(strData.startsWith('[download] Destination:')){
            ext = strData.split('.').slice(-1)[0]
          }
          if(!strData.startsWith('[download] Destination:') && strData.startsWith('[download]') && strData.includes("ETA")){
            // logger("[dataProgress]: ", strData)
            const dataProgress = {} as Record<string, any>;
            // as DownloadProgressProps;
            const isFrag = /\(frag/.test(strData.trim())

            if(isFrag){
              frag = strData.split(/\(frag/)[1].trim().replace(/\)/g, '');
              dataProgress["frag"] = frag
            } else {
              dataProgress["frag"] = null
            }
            const dataProgressList = strData.split(" ").filter(v => /\d/.test(v))
            const dataProgressVideo = dataProgressList;
            dataProgressVideo.map((_, i) => {

              if(i === 0){
                progress = Number(dataProgressList[0].replace(/\%/g, ""))
                if(progress < 100){
                  dataProgress["progress"] = progress
                }
                // logger("[dataProgress]: ", dataProgress);
              }
              if(i === 1){
                downloaded  = dataProgressList[1];
                total = info_dict.requested_download?.[0].filesize ||  downloaded
                totalBytes = sizeToBytes(total);
                dataProgress["downloaded"] = downloaded
              }
              if(i === 2){
                speed = dataProgressList[2]
                speedBytes = sizeToBytes(speed)
                dataProgress["speed"] = speed
              }
            })
            // logger("[dataProgress]: ", dataProgress)

            dataProgressing = {
              ...dataProgress,
              progress,
              speed,
              speedBytes,
              totalBytes,
              downloaded,
              total,
            }
            const dataDownloading = dataProgressing as DownloadProgressProps

            let downloadProgressBarItems:Record<string,any> = JSON.parse(localStorage.getItem("downloadProgressBar") as string);

            const isStopDownload = dataDownloading?.progress < 100 && dataDownloading?.stopDownload === true
            if(dataDownloading?.speedBytes > 0){
              dataDownloadingObj = {
                ...dataDownloadingObj,
                ...downloadProgressBarItems,
                [`progressBar-${progressIdTime}`]: {
                  ...dataDownloading,
                  download_folder,
                  output_path: `${download_folder}\\${filename}.${ext}`,
                  resolveOutputFilepath: `${download_folder}\\${resolveFilename}.${ext}`,
                  filename: filename,
                  isDownloading: isStopDownload ? false : true,
                },
              };
            }
            if(isStopDownload) {
              const resolveOutputFilepath = dataDownloadingObj?.[`progressBar-${progressIdTime}`]?.resolveOutputFilepath
              if(resolveOutputFilepath){
                setTimeout(async() => {
                  const fileExist = await ipcRendererInvoke("file-exist", resolveOutputFilepath)
                  if(fileExist){
                    // const newFilename =
                    await ipcRendererInvoke("rename-file", resolveOutputFilepath, filename)
                    // logger("stop new filename: ", newFilename)
                  }
                }, 2500)
              }
              return resolve(dataDownloadingObj);
            }

            const dlSpeedNumber = dataDownloading.speedBytes;

            if(dlSpeedNumber > 0){
              countCompleted ++;
            }
            averageSpeedDownload = averageSpeedDownload + dlSpeedNumber;

            let speedDownloadItems:Record<string,any> = JSON.parse(localStorage.getItem("speedDownload") as string);

            if(dataDownloading?.progress < 100){
              localStorage.setItem("downloadProgressBar", JSON.stringify(dataDownloadingObj));

              const bytes = countCompleted > 0 ?(averageSpeedDownload / countCompleted) : dataDownloading.speedBytes;
              let dataSpeedDownloadObj = {
                ...speedDownloadItems,
                [`speedDownload-${progressIdTime}`]:
                bytesToSize(bytes) + "/sec"
              };

              localStorage.setItem("speedDownload", JSON.stringify(dataSpeedDownloadObj));

              let downloadProgressBarLocal = localStorage.getItem("downloadProgressBar") as string;
              const downloadProgressBar = JSON.parse(downloadProgressBarLocal)
              this.updateDownloadProgressBar({
                ...downloadProgressBar,
                ...dataDownloadingObj
              });
            } else {
              isCompleted = true;
              const resolveOutputFilepath = dataDownloadingObj?.[`progressBar-${progressIdTime}`]?.resolveOutputFilepath
              if(resolveOutputFilepath){
                // const newFilename =
                await ipcRendererInvoke("rename-file", resolveOutputFilepath, filename)
                // logger("new filename: ", newFilename)
              }
              resolve(dataDownloadingObj)
            }
          }
        });
        webContentSend(`aio-dlp-error-${progressIdTime}`,async (error: any) => {
          resolve({error, progressIdTime, url: video_info.url})
        });
      })
      .catch((error) => reject({error, progressIdTime, url: video_info.url}));
    })
    return {dataDownloadingObj, isCompleted, isError, averageSpeedDownload, countCompleted, ext }
  }
  async audioDL(linkDL:string, info_dict:IYouTube, download_folder:string, filename:string){
    const settings = this.settings
    const video_info = info_dict.info_dict
    const progressId = info_dict.progressId
    const progressIdTime = `${info_dict.progressId}-${info_dict.createTime}`;
    const url_dl = linkDL;
    const outputFilepath = `${download_folder}\\${filename}.mp3`;
    const args = [
      '-y',
      // '-hide_banner',
      // '-loglevel', // 'repeat+info',
      // '-progress', 'pipe:3',
      '-i', url_dl,
      '-vn',
      '-acodec', 'libmp3lame',
      '-b:a', `${settings.audioQuality}k`,
      '-movflags', '+faststart',
      `file:${outputFilepath}`
    ]


    let isCompleted = false;
    let isError = false;
    let dataDownloadingObj = {
      [`progressBar-${progressIdTime}`]: {
        output_filename: info_dict.output_filename,
        translateOption: info_dict.translateOption,
      }
    } as Record<string, any>;
    let averageSpeedDownload = 0;
    let countCompleted = 0;
    let ext = 'mp3'

    let dataProgressing = {} as (DownloadProgressProps | Record<string, any>) ;
    let progress = 0;
    let downloadedBytes = 0;
    let downloaded = "0 Bytes";
    let speedBytes = 0;
    let speed = "0 Bytes";
    let totalBytes = 0;
    let total = "0 Bytes";

    const ffmpeg_command_channel = (on:string) => `ffmpeg-command-${on}-${progressIdTime}`;

    await new Promise(async (resolve, reject) => {
      return await ipcRendererInvoke("ffmpeg-command", progressIdTime, args, {})
      .then(() => {
        webContentSend(ffmpeg_command_channel("raw"),async (std_out) => {
          let stdout = std_out as string
          if(/HTTP error/.test(stdout)){
            const error = new Error('HTTP error')
            isError = true;
            const dataTableUpdate = this.tableData.map(dt => {
              let data = dt
              if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
                dataDownloadingObj[`progressBar-${progressIdTime}`].completed = 'uncompleted'
                data = {
                  ...data,
                  completed: 'uncompleted'
                }
              }
              return data
            });
            this.tableData = dataTableUpdate

            this.updateDownloadProgressBar(dataDownloadingObj);
            resolve({error, progressIdTime, url: video_info.url})
          }
          // logger?.log(ffmpeg_command_channel("raw"), stdout)
        });
        webContentSend(`ffmpeg-command-progress-${progressIdTime}`,async (_dataProgress: any) => {
          const dataProgress = _dataProgress as FFmpegDataProgressProps
          if(dataProgress.speed && typeof dataProgress.speed === "number"){
            let _progress = Number((dataProgress.progress * 100000).toFixed(2));
            let speedProgress = _progress - progress
            progress = _progress
            if(progress > 100){
              progress = 100
            }
            totalBytes = dataProgress.size;
            total = bytesToSize(totalBytes)
            downloadedBytes = totalBytes * progress / 100
            speedBytes = totalBytes * speedProgress / 100
            downloaded = bytesToSize(downloadedBytes)
            speed = bytesToSize(speedBytes)
          }

          if(speedBytes > 0){
            countCompleted ++;
          }
          averageSpeedDownload = averageSpeedDownload + speedBytes;
          const averageSpeedBytes = countCompleted > 0 ? (averageSpeedDownload / countCompleted) : speedBytes;

          dataProgressing = {
            totalBytes,
            total,
            progress,
            downloaded,
            speedBytes,
            speed,
            averageSpeedBytes,
            averageSpeed: bytesToSize(averageSpeedBytes)
          }
          // logger?.log("dataProgress", dataProgressing)
          const dataDownloading = dataProgressing as DownloadProgressProps

          // let downloadProgressBarItems:Record<string,any> = JSON.parse(localStorage.getItem("downloadProgressBar") as string);

          //   const isStopDownload = dataDownloading?.progress < 100 && dataDownloading?.stopDownload === true
          //   dataDownloadingObj = {
          //     ...dataDownloadingObj,
          //     ...downloadProgressBarItems,
          //     [`progressBar-${progressId}`]: {
          //       ...dataDownloading,
          //       download_folder,
          //       output_path: download_folder,
          //       output_file_path: `${download_folder}\\${filename}.${ext}`,
          //       filename: filename,
          //       isDownloading: isStopDownload ? false : true,
          //     },
          //   };
          //   if(isStopDownload) {
          //     return resolve(dataDownloadingObj);
          //   }

          let downloadProgressBarItems = JSON.parse(localStorage.getItem("downloadProgressBar") as string) as Record<string,any>;

          const isStopDownload = dataDownloading?.progress < 100 && dataDownloading?.stopDownload === true
          let previousProgressDownloading = dataDownloadingObj[`progressBar-${progressIdTime}`];
          const dataUpdate = {
            ...dataDownloading,
            progressIdTime,
            completed: "downloading",
            download_folder,
            output_path: download_folder,
            output_file_path: `${download_folder}\\${filename}.${ext}`,
            filename: filename,
            isDownloading: isStopDownload ? false : true,
          }
          dataDownloadingObj = {
            ...dataDownloadingObj,
            ...downloadProgressBarItems,
            [`progressBar-${progressIdTime}`]: {
              ...dataDownloadingObj[`progressBar-${progressIdTime}`],
              ...dataUpdate
            },
          };
          // logger?.log("Data dataDownloadingObj", dataDownloadingObj)
          if(dataDownloading?.speedBytes <= 0 && previousProgressDownloading){
            dataDownloadingObj[`progressBar-${progressIdTime}`] = previousProgressDownloading
          }
          if(isStopDownload) {
            dataDownloadingObj[`progressBar-${progressIdTime}`].completed = 'uncompleted'
            this.updateDownloadProgressBar(dataDownloadingObj);
            return resolve(dataDownloadingObj);
          }

          if(dataDownloading?.progress < 100){
            this.updateDownloadProgressBar(dataDownloadingObj);
          } else {
            isCompleted = true;
            function getTinyMetadata(filePath:string){
              const info = {
                title: "",
                ext: "mp3",
                duration: video_info.duration,
                fileSize: 0,
                fileSizeString: "0 Byte",
                resolution: "0x0",
                width: 0,
                height: 0,
                filename: "",
                filepath: "",
                filenameUri: "",
                folderPath: "",
                bitRate: 0,
                frameRate: null
              }
              
              // const { size } = await ipcRendererInvoke("tiny-file-metadata", v)
              const size = dataDownloading.totalBytes
              const { filename, filepath, folderPath, ext } = fileParse(filePath)
              return {
                ...info,
                title: filename,
                ext,
                filename: filename,
                filepath: filepath,
                filenameUri: encodeURI(`file:///${filepath.replace(/\\/g,'/')}`),
                folderPath: folderPath,
                fileSize: size,
                fileSizeString: dataDownloading.total,
              }
            }
            let metadata = getTinyMetadata(outputFilepath);
            if(metadata){
              const req_dl = info_dict.requested_download
                ? info_dict.requested_download?.map(dlInfo => {
                  return {
                    ...dlInfo,
                    output_path: download_folder,
                    file_path: outputFilepath,
                    title: filename
                  }
                }) : [];

              const infoDLCompleted = {
                completed: "completed",
                requested_download: req_dl,
                output_file_path: outputFilepath,
                output_path: download_folder,
                justExtracting: false,
                isDownloading: false,
              };
              let downloadProgressBarItems = JSON.parse(localStorage.getItem("downloadProgressBar") as string);
              const dataUpdate = {
                ...dataDownloadingObj[`progressBar-${progressIdTime}`],
                metadata,
                ...infoDLCompleted,
                progressIdTime
              }
              dataDownloadingObj = {
                ...dataDownloadingObj,
                ...downloadProgressBarItems,
                [`progressBar-${progressIdTime}`]: dataUpdate
              }

              const dataTableUpdate = this.tableData.map(dt => {
                let data = dt
                if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
                  data = {
                    ...data,
                    ...dataUpdate,
                  }
                }
                return data
              });
              this.tableData = dataTableUpdate

              this.updateDownloadProgressBar(dataDownloadingObj);
            }
            resolve(metadata);
          }
        });

        // setTimeout(async()=>{
        //   if(!dataProgressing.progress){
        //     const r: AxiosResponse & {ok: boolean} = await ipcRendererInvoke("fetch", linkDL, {})
        //     if(!r.ok){
        //       // webContentSend(ffmpeg_command_channel("completed"),async (__dataCompleted) => {
        //       //   const dataCompleted = {
        //       //     ...(__dataCompleted as any),
        //       //     downloadFolder: download_folder,
        //       //     filePath: `${outputFilepath}`,
        //       //     filename: filename,
        //       //     process: dataProgressing
        //       //   }

        //       //   logger?.log("dataProgressing", dataCompleted, __dataCompleted)
        //       //   if(dataCompleted.code === 1){
        //       //   }
        //       // });
        //       const error = r
        //       isError = true;
        //       const dataTableUpdate = this.tableData.map(dt => {
        //         let data = dt
        //         if(Object.keys(dataDownloadingObj).filter(v => v.includes(progressIdTime)).some(key => key.includes(`${dt.progressId}-${dt.createTime}`))){
        //           dataDownloadingObj[`progressBar-${progressIdTime}`].completed = 'uncompleted'
        //           data = {
        //             ...data,
        //             completed: 'uncompleted'
        //           }
        //         }
        //         return data
        //       });
        //       this.tableData = dataTableUpdate

        //       this.updateDownloadProgressBar(dataDownloadingObj);
        //       resolve({error, progressIdTime, url: video_info.url})
        //     }
        //   }
        // },2000)
      })
      .catch((error) => reject({error, progressIdTime, url: video_info.url}));
    })

    return {dataDownloadingObj, isCompleted, isError, averageSpeedDownload, countCompleted, ext }
  }
  async multipleVideos(){
    const dataDownload = [...this.tableData].map(dt => ({...dt, progress: undefined}))
    const queueDownload = isDesktopApp ? this.queueDownload : 2
    const infoDictListOfList = arraySplitting(dataDownload, queueDownload)
    let tableData_ = Array.prototype.concat(...infoDictListOfList) as IYouTube[];
    // let stateHelperObj = {}
    // tableData_.forEach(info => {
    //   stateHelperObj = {
    //     ...stateHelperObj,
    //     [`${info.progressId}-stopDownloading`]: undefined,
    //   }
    // })
    // setStateHelper({
    //   ...stateHelper,
    //   ...stateHelperObj,
    // })
    // this.updateDownloadData(tableData_);

    let info_dict_list = [];
    for await (let infoDictList of infoDictListOfList) {
      this.tableData = tableData_;
      try {
        let info_list = await axios.all(
          infoDictList.map(async (infoDict) => await this.singleVideo(infoDict, this.tableData))
        )
        info_dict_list.push(info_list)
      } catch (error) {
        logger?.log("Error", error)
      }
    }

    // this.onFinished()
    info_dict_list = Array.prototype.concat(...info_dict_list)
    return info_dict_list
  }
  async run(){
    const infoDictList = await this.multipleVideos()
    logger?.log("complete download", infoDictList)
    this.onFinished()
    this.loggerTime()
  }
}

const videoLinksByType = {
  defaultLinks: [] as string[],
  youtubeLinks: [] as string[],
  facebookLinks: [] as string[],
  instagramLinks: [] as string[],
  tiktokLinks: [] as string[],
  douyinLinks: [] as string[],
  kuaishouLinks: [] as string[],
}

type VideoLinksByTypeProps = typeof videoLinksByType

export async function fetchDashMPDContent(dash_manifest_url:string) {
  const obj = {
    url: dash_manifest_url,
    responseType: "text",
    options: {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "dpr": "1",
        "priority": "u=0, i",
        "sec-ch-prefers-color-scheme": "dark",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-model": "\"\"",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-ch-ua-platform-version": "\"10.0.0\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "cross-site",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "viewport-width": "672",
      }
    }
  }
  const data = await axios.get('/api/v1/request?data='+encodeJsonBtoa(obj)).then(dt=> dt.data).catch(()=> null)

  return (isObject(data) && data.data ? data.data : null) as string|null
}

export function extractDashMPD(dashContent:string) {
  const AdaptationSet = $(dashContent).find('AdaptationSet');

  let videoOnly = [] as any[];
  let audioOnly = [] as any[];

  const RepresentationAttrName = ['id', 'bandwidth', 'codecs', 'mimeType', 'FBContentLength', 'width', 'height', 'FBQualityClass'];
  AdaptationSet.each(function () {
    const $this = $(this);
    const contentType = $this.attr('contentType');
    const isVideo = contentType === 'video';
    if (isVideo || contentType === 'audio') {
      const Representation = $this.find('Representation');
      Representation.each(function () {
        const $rep = $(this);
        const info = {} as Record<string, any>;
        RepresentationAttrName.forEach(attrName => {
          if (attrName === 'FBContentLength') {
            let contentLength = $rep.attr(attrName) || null
            const fileSize = contentLength ? Number(contentLength) : null;
            info['filesize_num'] = fileSize ? fileSize : null;;
            info['filesize'] = fileSize ? bytesToSize(fileSize) : null;
          } else {
            info[attrName] = $rep.attr(attrName) || null;
          }
        })
        info['url'] = $this.find('BaseURL').text();
        if (isVideo) {
          info['ext'] = 'mp4';
          if (info.width && info.height) {
            info['resolution'] = `${info.width}x${info.height}`
            info.width = Number(info.width)
            info.height = Number(info.height)
          }
          videoOnly.push(info);
        } else {
          const codecs = $rep.attr('codecs')
          info['ext'] = codecs?.startsWith('mp4a') ? 'mp4a' : 'mp3';
          audioOnly.push(info);
        }
      })
    }
  })
  videoOnly = videoOnly.sort((a,b) => Number(a.height) - Number(b.height))

  return {audioOnly, videoOnly}
}

interface ExtractorConstructor {
  downloadSettings: DownloadSettingsType
  licenseExpired?: boolean
}

export class Extractor {
  isDev = false;
  tableData = [] as IYouTube[];
  errorData = [] as Record<string, any>[];
  info_dict = {} as IYouTube;

  deviceInfo = {
    cpu: 8
  }
  use_custom_cpu_if_available_more_then_12 = false;
  server_host = isDev ? isDevServerHost : ""
  isPublic = false
  customInputLinks = ''

  acceptLinks = ["youtube.com","youtu.be","facebook.com","instagram.com","tiktok.com","douyin.com","kuaishou.com"]
  defaultLinks = [] as string[];
  youtubeLinks = [] as string[];
  facebookLinks = [] as string[];
  instagramLinks = [] as string[];
  tiktokLinks = [] as string[];
  douyinLinks = [] as string[];
  kuaishouLinks = [] as string[];
  genericLinks = [] as string[];
  videoLinksByType = videoLinksByType;

  inputSearchProfileLink = null as string | null;

  justExtracting = false;
  isDownloadAudio = false;
  save_as = "";
  isProfile = false;
  isYTPlaylist = false;
  isDownloadSelection = false;
  downloadWithThumbnail = false;
  closeNotification = false;
  extract_only_original_url_from_profile = false;

  imageBase64Obj = {};

  startTime:number;

  settings: Prettify<DownloadSettingsType>
  licenseExpired: boolean
  constructor({
    downloadSettings,
    licenseExpired
  }: ExtractorConstructor) {
    this.licenseExpired = licenseExpired || false
    this.settings = downloadSettings
    this.startTime = Date.now();
    this.use_custom_cpu_if_available_more_then_12 = downloadSettings.use_custom_cpu_if_available_more_then_12
    this.deviceInfo.cpu = downloadSettings.cpu
    this.justExtracting = downloadSettings.justExtracting
    this.isDownloadSelection = downloadSettings.downloadAs === "audio"
    this.downloadWithThumbnail = downloadSettings.downloadWithThumbnail
  }
  onFinished(data: IYouTube[]){data}
  onError(error: AxiosError){error}
  logger = logger?.log || (() => {})
  loggerTime() {
    if(this.isDev){
      let endTime = Date.now();
      console.info("It took ", endTime - this.startTime, " seconds")
      console.info("Time Format ", formatDuration((endTime - this.startTime)/1000))
      console.info("===========\n")
    }
  }
  showNotification () {
    // const closeNotification = this.closeNotification;
    // settings.onDownloading
    // handleSettings({onDownloading: false})
    // notifications.show({
    //   color: "green",
    //   bg: colorSchemes.sectionBGColor.dark,
    //   loading: true,
    //   // title: 'Extracting Data ...',
    //   title: this.justExtracting ? 'Extracting Data ...' : 'Downloading Data ...',
    //   message: 'Data will be showed on Table',
    //   autoClose: settings.onDownloading ?? false,
    //   withCloseButton: false,
    //   sx: {
    //     boxShadow: "",
    //     border: "1px solid rgb(255 255 255 / 20%)",
    //     // "& .mantine-Notification-root": {
    //     //   border: "1px solid rgb(255 255 255 / 20%)"
    //     // }
    //   }
    // });
  }
  videoExtractOptions(useCLI=false){
    const settings = this.settings;
    let options = {
      download: false,
      // download: justExtracting ? false : true,
      save_as: this.save_as,
      ...(settings.folder_history ? {
        folderpath: settings.folder_history
      } : {}),
      resolution: settings.videoResolution,
      download_type: settings.downloadAs,
      ...(settings.kuaishouCookie && settings.kuaishouCookie !== "" ?
        {kuaishou_cookie: settings.kuaishouCookie} : {}
      ),
      ...(settings.x_bogus && settings.x_bogus !== "" ?
        {x_bogus: settings.x_bogus} : {}
      ),
      ...(settings.instagramCookie && settings.instagramCookie !== "" ?
        {instagram_cookie: settings.instagramCookie} : {}
      ),
      ...(this.isDownloadAudio
        ? {download_audio: settings?.audioQuality ?? "128"}
        :{}
      ),
      is_on_web: true,
      instagram_extract_server: "default",
      douyin_is_headless: true,
      // douyin_server: "driver",
      add_download_options: {
        times_of_download: this.justExtracting ? 5 : 1,
        enable_generic_url: true,
        use_logfile: false,
        // custom_logfile: "",
      }
    } as Record<string, any>;
    if(this.server_host){
      options.server_host = this.server_host
    }

    if (useCLI === false){
      return options;
    }

    if(typeof options.add_download_options === "object"){

      options = {
        ...options,
        ...options.add_download_options
      }
      delete options["add_download_options"]
    }

    return Object.entries(options).map(([key, value]) => {
      return `${key}:${value}`
    }).join("__aio__dlp__")
  }
  profileExtractOptions(addOptions: Record<string, any> = {}, useCLI=false){
    const settings = this.settings;
    let inputSearchProfileLink = this.inputSearchProfileLink
    const use_per_next_cursor = Boolean(inputSearchProfileLink);
    let next_data = {} as any;
    if(inputSearchProfileLink){
      if(inputSearchProfileLink.includes('next_cursor=')){
        const cursor_continue = inputSearchProfileLink.split('next_cursor=')?.[1]
        next_data = {cursor_continue}
      } else if(inputSearchProfileLink.includes('next_data=')){
        const youtube_string_next_data = inputSearchProfileLink.split('next_data=')?.[1]
        next_data = {youtube_string_next_data}
      }
    }
    let _options = {
      limit: this.licenseExpired ? 1 : use_per_next_cursor ? 0 : settings.limitDownload,
      sort_by: settings.popularSortBy ?? "newest",
      youtube_video_type: settings.youtubeSortBy ?? "videos",
      ...(settings.kuaishouCookie && settings.kuaishouCookie !== "" ?
        {kuaishou_cookie: settings.kuaishouCookie} : {}
      ),
      douyin_is_headless: true,
      kuaishou_server: "1",
      // kuaishou_use_extract_url_dl: true,
      // tiktok_extract_server: "1",
      only_original_url_from_profile: this.extract_only_original_url_from_profile,
      use_per_next_cursor: use_per_next_cursor,
      ...next_data
    };
    if(this.server_host){
      _options.server_host = this.server_host
    }
    type Options = typeof _options
    let options = _options as Options & Record<string, any>;
    options = {...options, ...addOptions}
    if (useCLI === false){
      return options;
    }

    if(typeof options.add_download_options === "object"){
      options = {
        ...options,
        ...options.add_download_options
      }
      delete options["add_download_options"]
    }

    return Object.entries(options).map(([key, value]) => {
      return `${key}:${value}`
    }).join("__aio__dlp__")
  }
  /* GET VIDEO LINKS */
  fixVideoLinksByType(videoLinks: string[]) {
    let videoLinksByType = {} as typeof this.videoLinksByType;
    // const match = (link:string, pattern:string | RegExp) => link.match(new RegExp(pattern))
    const isGeneric = (link:string) => link.includes("&download_with_info_dict=")

    let youtubeLinks = videoLinks
    .filter((link) => link.includes('.youtube.com') || link.includes('youtu.be') && !isGeneric(link))
    youtubeLinks = youtubeLinks.length > 0 ? youtubeLinks.map(link => {
      let url = link;
      if (link.includes('/@') || link.includes('/channel')) {
        const channelId = link.split('youtube.com/')[1]
        url = `https://www.youtube.com/${channelId}`
      } else if(link.includes('/playlist?list=')) {
        url = `https://www.youtube.com/playlist?list=${link.split('/playlist?list=')[1]}`
      } else {
        const videoId = link.includes('/shorts/')
            ? link.split('/shorts/')[1]
            : link.includes('/embed/')
            ? link.split('/embed/')[1]
            : link.includes('youtu.be/')
            ? link.split('youtu.be/')[1].split("?")[0]
            : link.split('/watch?v=')[1];

        url = `https://www.youtube.com/watch?v=${videoId}`
      }
      return url
    }) : []
    videoLinksByType = {
      ...videoLinksByType, youtubeLinks
    }
    this.youtubeLinks = youtubeLinks

    let facebookLinks = videoLinks.filter((link) => link.match(new RegExp('\.facebook\.com')) && !isGeneric(link))
    facebookLinks = facebookLinks.length > 0 ? facebookLinks.map(link => `https://www.facebook.com/${link.split('facebook.com/')[1]}`) : []
    videoLinksByType = {
      ...videoLinksByType, facebookLinks
    }
    this.facebookLinks = facebookLinks

    let instagramLinks = videoLinks.filter((link) => link.match(new RegExp('\.instagram\.com')) && !isGeneric(link))
    instagramLinks = instagramLinks.length > 0 ? instagramLinks.map(link => `https://www.instagram.com/${link.replace(/reels/g, 'reel').split('instagram.com/')[1]}`) : []
    videoLinksByType = {
      ...videoLinksByType, instagramLinks
    }
    this.instagramLinks = instagramLinks

    let tiktokLinks = videoLinks.filter((link) => link.includes('.tiktok.com') && !isGeneric(link))
    tiktokLinks = tiktokLinks.length > 0 ? tiktokLinks.map(link => `https://www.tiktok.com/${link.split('tiktok.com/')[1]}`) : []
    videoLinksByType = {
      ...videoLinksByType, tiktokLinks
    }
    this.tiktokLinks = tiktokLinks

    let kuaishouLinks = videoLinks.filter((link) => link.match(new RegExp('\.kuaishou\.com')) && !isGeneric(link))
    kuaishouLinks = kuaishouLinks.length > 0 ? kuaishouLinks.map(link => {
      let url = link;
      if (link.includes('/profile/')) {
        const userId = link.split('/profile/')[1]
        url = `https://www.kuaishou.com/profile/${userId}`
      } else if (link.includes("v.kuaishou.com")) {
        const videoId = link.split('kuaishou.com/')[1]
        url = `https://v.kuaishou.com/${videoId}`
      } else {
        const videoId = link.split('/short-video/')[1]
        url = `https://www.kuaishou.com/short-video/${videoId}`
      }
      return url
    }) : []
    videoLinksByType = {
      ...videoLinksByType, kuaishouLinks
    }
    this.kuaishouLinks = kuaishouLinks

    let douyinLinks = videoLinks.filter((link) => link.match(new RegExp('\.douyin\.com')) && !isGeneric(link))
    douyinLinks = douyinLinks.length > 0 ? douyinLinks.map(link => {
      let url = link;
      if (link.includes('/user/') || link.includes("share/user/")) {
        const userId = link.split('/user/')[1]
        url = `https://www.douyin.com/user/${userId}`
      } else if (link.includes("v.douyin.com")) {
        const videoId = link.split('douyin.com/')[1]
        url = `https://v.douyin.com/${videoId}`
      } else {
        const videoId = link.split('/video/')[1]
        url = `https://www.douyin.com/video/${videoId}`
      }
      return url
    }) : []
    videoLinksByType = {
      ...videoLinksByType, douyinLinks
    }
    this.douyinLinks = douyinLinks

    const acceptLinks = this.acceptLinks
    let defaultLinks = videoLinks.filter((link) => !acceptLinks.some(v => link.includes(v)) && !isGeneric(link))
    let genericLinks = videoLinks.filter((link) => isGeneric(link))
    defaultLinks = [...genericLinks, ...defaultLinks]
    videoLinksByType = {
      ...videoLinksByType, defaultLinks
    }
    this.defaultLinks = defaultLinks

    return videoLinksByType
  }
  async preGetVideoLinks(textLinks:string){
    let videoLinks = textLinks.split('\n');
    const genericLinks = videoLinks.filter((link) => {
      const _ = link.split("?")[0].split(".")
      const ext = _[_.length - 1]
      link = (link.includes('?') ? link : link + '&') + 'is_generic=true'
      return !( ext.length <= 2 || ext.length > 4) && link;
    })
    
    const hostRedirectPattern = "vt.tiktok.com|v.douyin.com|v.kuaishou.com";
    const redirectLinks = videoLinks.filter(link => hostRedirectPattern.includes(new URL(link).host.toLowerCase()));
    if(redirectLinks.length > 0){
      videoLinks = videoLinks.filter(link => !(hostRedirectPattern.includes(new URL(link).host.toLowerCase())));
      let __videoRedirectLinksOfLinks = arraySplitting(redirectLinks, 50);
      let videoRedirectLinksOfLinks = [] as string[][];
      for await (let __vdoLinks of __videoRedirectLinksOfLinks){
        const videoRedirectLinks = await Promise.all(
          redirectLinks.map(async(link)=>{
            let url = link;
            try {
              const r = await fetch('/api/v1/request?data='+encodeJsonBtoa({url:link, useData: "no"}));
              const data = await r.json();
              if(data && data.url){
                url = data.url
              }
            } catch {}
            return url
          })
        )
        videoRedirectLinksOfLinks.push(videoRedirectLinks)
      }
      videoLinks = Array.prototype.concat(...videoRedirectLinksOfLinks)
    }
    const [video_list, isProfile] = fixOneProfile(videoLinks)
    if(!this.isPublic){
      logger?.log(video_list, isProfile, genericLinks, videoLinks)
    }

    const ytPlaylistId = videoLinks.map((youtubeLink) => getYouTubeID(youtubeLink.trim(), "list")).filter(v => typeof v === "string") as string[]
    const yt_playlist = ytPlaylistId.map(id => `https://www.youtube.com/playlist?list=${id}`)
    const hasYTPlaylist = textLinks.includes("youtube.com/playlist?list=");

    return {
      videoLinks, genericLinks, 
      videoProfileLinks: video_list, isProfile,
      videoYouTubePlaylistLinks: yt_playlist, ytPlaylistId, hasYTPlaylist
    }
  }
  async getVideoLinks(){
    const settings = this.settings
    const licenseExpired = this.licenseExpired

    const {
      downloadSelection,
      videoLinksSelection,
    } = {
      downloadSelection: settings.directDownload,
      videoLinksSelection: settings.directDownload ? (
        settings.directVideoLinks ?? []
      ) : [],
    }

    let isDownloadSelection = downloadSelection
    let inputVideoLinks = isDownloadSelection ? videoLinksSelection.join('\n').trim() : settings.videoLinks.join('\n').trim()
    // logger("[inputVideoLinks]: ", inputVideoLinks)
    if (isDownloadSelection && !inputVideoLinks){
      inputVideoLinks = settings.videoLinks.join('\n').trim()
      isDownloadSelection = false
    } else if (this.inputSearchProfileLink){
      inputVideoLinks = this.inputSearchProfileLink
    }
    this.isDownloadSelection = isDownloadSelection
    // logger("[inputVideoLinks]: ", inputVideoLinks?.split('\n').map(link => decodeURIComponent(link)))

    if(this.isPublic && this.customInputLinks){
      inputVideoLinks = this.customInputLinks.trim();
    }
    var videoLinks = [] as string[];
    if(inputVideoLinks && inputVideoLinks.startsWith('http')){
      let textLinks = inputVideoLinks as string;
      if(licenseExpired || (this.isPublic && this.customInputLinks)){
        textLinks = textLinks.split('\n')[0]
      }

      const dataVideoLinks = await this.preGetVideoLinks(textLinks)
      videoLinks = dataVideoLinks.videoLinks
      const { 
        genericLinks, isProfile, videoProfileLinks,
        hasYTPlaylist: isYTPlaylist, videoYouTubePlaylistLinks: yt_playlist
      } = dataVideoLinks


      this.isProfile = isProfile
      this.isYTPlaylist = isYTPlaylist

      if(this.isDownloadSelection){
        this.isProfile = false
        this.isYTPlaylist = false
        this.save_as = ""
      }

      if(this.isProfile || settings.saveFolderAsProfile)
      this.save_as = "profile"
      else if(isYTPlaylist)
      this.save_as = "profile"

      // logger(isProfile,isYTPlaylist)
      if(isDownloadSelection){
        videoLinks = videoLinks
        // videoLinks = [
        //   ...videoLinks.filter(link => link.includes(".youtube.com/watch?v=")),
        //   ...videoLinks.filter(link => link.includes("download_with_info_dict=")),
        // ]
        // logger("[downloadSelection]: ", videoLinks)
      }
      else if(genericLinks.length > 0){
        this.genericLinks = genericLinks;
        const fixLinks = finalValidLinks(textLinks)
        videoLinks = [...new Set([...genericLinks, ...fixLinks.videoLinks])]
        // logger("[genericLinks]: ", videoLinks)
      }
      else if(isProfile || isYTPlaylist){
        let profile_url_list = [] as string[];
        if(isProfile){
          const fixLinks = finalValidLinks(videoProfileLinks.join("\n"))
          profile_url_list = fixLinks.videoLinks
        }

        this.showNotification()
 
        this.extract_only_original_url_from_profile = true;
        let body = {
          profile_url_list: [...profile_url_list, ...yt_playlist],
          ...(this.profileExtractOptions(
            // {kuaishou_is_headless: false, douyin_goto_url: 'https://www.douyin.com/follow', douyin_is_headless: false}
          ) as Record<string, any>),
        } as Record<string, any>
        let hash = generateHash();
        const data = {
          server_host: this.server_host,
          encodeResponse: true,
          hash,
          options: {
            body
          },
        }
        const dataEncoded = encryptionCryptoJs(data)
        body = {
          data: dataEncoded
        }
        let API_ROUTE = '/aio-dlp/get_videos_profile';
        if(!this.isPublic){
          const {isTrialExpired} = isFirstUserTrialExpired()
          if(!isTrialExpired){
            API_ROUTE = `/api/task-app/${hash}/info-profile`
          }
        }
        const resExtractVideoList = await axios.post(
          localhostApi(API_ROUTE), body, defaultHeaders
        ).catch(err => {
          this.onError?.(err)
          return err
        }) as AxiosResponse
        logger?.log("[extractVideoList]", resExtractVideoList)
        if(resExtractVideoList.status === 200){
          let data = resExtractVideoList.data
          if(isObject(data) && typeof data.data === 'string'){
            data = decryptionCryptoJs(data.data)
          }
          videoLinks = data
          if(this.extract_only_original_url_from_profile){
            videoLinks = videoLinks.map(link => {
              let url = link
              if(["\.youtube\.com","\.facebook\.com"].some(v => link.match(new RegExp(v)))){
                url = link.split("&download_with_info_dict=")[0]
              }
              return url
            })
          }
          // const fixLinks = finalValidLinks(videoLinks.map(v => v.split("&download_with_info_dict=")[0]).join("\n"))
          // this.videoLinksByType = fixLinks.linksByType
          // this.videoLinksByType = this.fixVideoLinksByType(videoLinks)
        } else {
          videoLinks = []
        }
        this.logger("[videoLinks From Profile]", videoLinks)
        this.loggerTime()
      } else {
        const fixLinks = finalValidLinks(videoLinks)
        videoLinks = [...new Set(fixLinks.videoLinks)]
        this.videoLinksByType = fixLinks.linksByType
        // this.videoLinksByType = this.fixVideoLinksByType(videoLinks)
      }
      if(!isProfile){
        this.logger("videoLinks", videoLinks)
      }
    }

    return videoLinks
  }
  updateInfo(data: IYouTube) {
    const info = data.info_dict;
    let translateOptions = {translateOption: data.translateOption || {}} as any;
    let output_filename = {};
    if(data?.output_filename){
      output_filename = {output_filename: data.output_filename}
    }
    // logger("[title]", title);
    // const output_filename = title ? title.replace(/\n\n\n\n/g," ").replace(/\n\n\n/g," ").replace(/\n\n/g," ").replace(/\n/g," ").replace(/["*<>#%\/\{\}\|\\\^~\[\]`;\?:]/g, "").substring(0,155 - lengthFilename) + addFilename : title

    const updateData = {
      ...data,
      ...output_filename,
      translateOption: translateOptions.translateOption,
    }
    if (updateData.url_dl){
      delete updateData.url_dl
    }

    const req_dl = data.requested_download ?? (data.info_dict.requested_download ?? {})
    return {
      ...updateData,
      requested_download: [{
        ...(req_dl && typeof req_dl === "object" && Array.isArray(req_dl) ? req_dl[0] : {}),
        ...translateOptions,
        title: info.title,
        ext: this.isDownloadAudio ? "mp3" : "mp4",
      }],
      // ...url_dl,
      ...(this.justExtracting ? {} : {completed: "progressing"}),
      justExtracting: this.justExtracting,
      save_as: this.save_as
    }
  }
  getInfoDictList(info_dict_list: IYouTube[]) {
    const tableData = info_dict_list.map((info) => {
      const video_info = info.info_dict
      const extractor = video_info.extractor_key?.toLowerCase() as string;
      let id = video_info.id.replace(/([\W])/g,"").slice(0,160)
      const progressId = `${extractor}-${id}`;

      const link = video_info?.original_url as string;
      const isGeneric = link.includes("&download_with_info_dict=")
      if(!this.acceptLinks.some(v => link.includes(v)) && !isGeneric && !this.isDownloadSelection){
        const url_dl = video_info.url
        video_info.hd = url_dl
        video_info.sd = url_dl
        video_info.url = video_info.original_url
        if(info.requested_download && info.requested_download.length){
          info.requested_download = [{
            ...info.requested_download[0],
            width: video_info.width,
            height: video_info.height,
            resolution: video_info.resolution,
            url: video_info.original_url as string,
          }]
        }
      }
      if(info.progress){
        delete info.progress
      }

      if(extractor === 'youtube'){
        info.info_dict.extractor_key = 'YouTube'
      }
      else if(extractor === 'instagram' && video_info.dash_info){
        try {
          const dash_info = JSON.parse(decodeURIComponent(video_info.dash_info))

          if(isObject(dash_info) && dash_info.is_dash_eligible && dash_info.video_dash_manifest){
            const video_dash_manifest = dash_info.video_dash_manifest
            // const period = $(video_dash_manifest).find('Period');
            const {videoOnly, audioOnly} = extractDashMPD(video_dash_manifest)
            info.info_dict.video_only = videoOnly;
            info.info_dict.audio_only = audioOnly;
            info.info_dict.music = audioOnly?.[0]?.url || info.music
          }
        } catch{}
      }
      if(!info.both || (isArray(info.both) && info.both.length <= 0)){
        info.both = [{
          title: video_info.title,
          url: video_info.hd as string,
          width: video_info.width,
          height: video_info.height,
          resolution: video_info.resolution,
        }]
      }

      return ({
        createTime: (new Date()).getTime(),
        ...this.infoDictResolver(info),
        ...this.updateInfo(info),
        // justExtracting: this.justExtracting,
        // save_as: this.save_as,
        progressId: progressId,
        downloadWithThumbnail: this.downloadWithThumbnail,
      })
    })
    this.tableData = tableData

    this.loggerTime()
    // setImageBase64(this.imageBase64Obj)
    return tableData
  }
  infoDictResolver(info:IYouTube){
    const video_info = info.info_dict

    const progressId = `${video_info.extractor_key?.toLowerCase()}-${video_info.id}`;

    const thumbnailBase64 = video_info.thumbnail_base64
    if(thumbnailBase64){
      this.imageBase64Obj = {
        ...this.imageBase64Obj,
        [`${progressId}`]: thumbnailBase64,
      }
      delete info.info_dict.thumbnail_base64
    }
    const userInfo = video_info.user_info
    const hasAvatarBase64 = userInfo && userInfo.avatar_base64
    const avatarBase64 = hasAvatarBase64 ? userInfo.avatar_base64 : null

    if(avatarBase64){
      this.imageBase64Obj = {
        ...this.imageBase64Obj,
        [`${progressId}-avatar`]: avatarBase64,
      }
      delete info.info_dict.user_info?.avatar_base64
    }

    const req_dl = info.requested_download ?? (info.info_dict.requested_download ?? {})

    if(info.url_dl){
      delete info.url_dl
    }
    return {
      ...info,
      ...(req_dl ? { requested_download: req_dl } : {}),
      // timeRange: (new Date()).getTime() * (i+1),
    }
  }
  async extractGenericLinks(genericLinks:string[]){
    const videoFileLinks = genericLinks.map(link => ({
      type: link.split('?')[0].split('.').at(-1),
      url: link
    }))
    const formats = await getVideoMetadataByRequest(videoFileLinks);
    let dataInfoList = [] as IYouTube[]
    if(formats){
      dataInfoList = formats.map((f,i) => {
        const parse = new URL(f.url)
        const file = parse.pathname.split('/').at(-1)
        const title = file?.split(f.ext)[0] as string;
        const url = f.url
        return {
          progressId: `generic-${title}-${i}`,
          url_dl: url,
          info_dict: {
            id: `generic-${title}`,
            title: title,
            thumbnail: '',
            duration: 0,
            formats,
            extractor_key: 'generic',
            hd: url,
            sd: url,
            original_url: url,
            webpage_url: url,
            ...f
          }
        }
      })
    }
    return dataInfoList
  }
  // Extract By CLI
  async extractByCLI(url_list:string[], extract_as?:"profile"|"video"): Promise<IYouTube[] | string[]>{
    const data: any = await new Promise(() => {
      let args = [
        extract_as || "profile",
        "--url_list", url_list.join("__aio__dlp__"),
        "-o", this.profileExtractOptions({}, true),
        // "--id", machineId
      ] as string[];
      logger?.log("[ARGS]: ", args);

      // ipcRendererInvoke("run-any-software", "aio-dlp.exe", args).then(data => {
      //   const name = "aio-dlp"
      //   const channel = (type:string) => `run-any-software-${type}-${name}`
      //   // webContentSend(channel("processing"), (stdout) => {
      //   //   logger("[STDOUT]: ", stdout)
      //   // })

      //   webContentSend(channel("completed"), (stdout_list, code) => {
      //     let data_list = stdout_list as string[];
      //     // logger("[STDOUT LIST]: ", stdout_list, code)
      //     data_list = data_list.filter(str => str.includes("download_with_info_dict="))
      //     if(data_list.length > 0){
      //       const info_dict_list = JSON.parse(data_list[0].replace(/\[RETURN\]/g, "").trim())
      //       resolve(info_dict_list)
      //     } else {
      //       resolve({error: "No Data", stdout_list, code})
      //     }
      //   })

      //   webContentSend(channel("error"), (stderr) => {
      //     logger("[STDERR]: ", stderr)
      //     reject({error: "No Data", stderr})
      //   })
      // })
    });

    // logger?.log("[Finished DATA]: ", data)
    return data
  }

  // Extract By API
  async extractByAPI(url_list: string[]){
    // const reqOptions: typeof window.requestInit = {
    //   method: "POST",
    //   body: JSON.stringify({
    //     url_list: url_list,
    //     ...(this.videoExtractOptions() as Record<string, any>)
    //   })
    // }
    // let res = await ipcRendererInvoke("get-data-from-backend", "/aio-dlp/multi?url=tcodettool", reqOptions)
    // let data_list = null
    // if(res.status === 200){
    //   data_list = res.data
    // }
    let body = {
      url_list: url_list,
      ...(this.videoExtractOptions() as Record<string, any>)
    } as any
    let hash = generateHash();
    const data = {
      server_host: this.server_host,
      encodeResponse: true,
      hash,
      options: {
        body
      },
    }
    const dataEncoded = encryptionCryptoJs(data)
    body = {
      data: dataEncoded
    }
    // else if(!isDesktopApp){
    //   body = {
    //     data: encodeJsonBtoa(body)
    //   }
    // }
    let isTooManyRequest = false;
    let API_ROUTE = this.isPublic ? `/api/task/${hash}/info` 
    : '/aio-dlp/multi?url=tcodettool'

    if(!this.isPublic){
      const {isTrialExpired} = isFirstUserTrialExpired()
      if(!isTrialExpired){
        API_ROUTE = `/api/task-app/${hash}/info`
      }
    }
    logger?.log("API_ROUTE",API_ROUTE)
    let data_list = (await axios.post(
      localhostApi(
        API_ROUTE
      ), body, defaultHeaders
    ).then(res => {
      let data = res.data;
      if(this.isPublic || data?.data){
        data = decryptionCryptoJs(data?.data)
      }
      logger?.log(data)
      return data
    })
    .catch(err => {
      this.onError?.(err);
      if(err && err?.status === 429){
        isTooManyRequest = true;
      }
      return err
    })) as IYouTube[];

    logger?.log("[Data List]: ", data_list, typeof(data_list))
    data_list = typeof data_list === "object" && Array.isArray(data_list) ? data_list : []
    let info_dict_list = data_list.length > 0
      ? data_list.filter(info => info?.info_dict && (info.info_dict?.url || info.info_dict?.webpage_url))
      : []
    
    if(!isTooManyRequest && data_list.length <= 0){
      const genericLinks = this.genericLinks
      if(genericLinks.length){
        info_dict_list = await this.extractGenericLinks(genericLinks)
      }
      if(info_dict_list.length <= 0){
        this.onError?.({status: 200, message: "Something wrong"} as AxiosError)
      }
    }

    this.loggerTime()
    return info_dict_list
  }

  async extractByAPIWithPool(url_list: string[], chunkSize=50){
    const url_list_of_list = arraySplitting(url_list, chunkSize)
    const data_list = await axios.all(
      url_list_of_list.map(async(url_list) => await this.extractByAPI(url_list))
    )
    const infoDictList = Array.prototype.concat(...data_list) as IYouTube[];
    // logger("[infoDictList]: ", infoDictList)
    return infoDictList
  }

  async loopExtractByAPIWithPoolPer8CPU(videoLinks: Array<string>, videoLinksSplit=100, chunkSize:number) {
    let info_dict_list_of_list = [];
    for await (let links of arraySplitting(videoLinks, 8 * chunkSize)){
      const url_list_of_list = arraySplitting(links, videoLinksSplit)
      const infoDictListOfList = await Promise.all(
        url_list_of_list.map((url_list) => {
          return new Promise((resolve, reject) => {
            this.extractByAPIWithPool(url_list, chunkSize)
            .then(data => resolve(data))
            .catch(error => reject(error))
          })
        })
      );
      const _infoDictList = (Array.prototype.concat(...infoDictListOfList))
      info_dict_list_of_list.push(_infoDictList)
    }
    return Array.prototype.concat(...info_dict_list_of_list) as IYouTube[];
  }

  async loopExtractByAPIWithPool(videoLinks: Array<string>, videoLinksSplit:number, chunkSize:number) {
    const url_list_of_list = arraySplitting(videoLinks, videoLinksSplit)

    const infoDictListOfList = [];
    for await (let url_list of url_list_of_list){
      const infoDictList = (await this.extractByAPIWithPool(url_list, chunkSize))
      infoDictListOfList.push(infoDictList)
    }
    return Array.prototype.concat(...infoDictListOfList) as IYouTube[]
  }

  async defaultVideoExtractor(videoLinks: string[]){
    const cpu = this.deviceInfo.cpu

    const totalLinks = videoLinks.length
    const chunkSize = 50
    // const runtime = Math.ceil(totalLinks / chunkSize)
    let infoDictList = [] as IYouTube[];

    if (cpu <= 4){
      infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 100, chunkSize)
      return infoDictList
    }

    if (totalLinks <= 200){
      infoDictList = (await this.extractByAPIWithPool(videoLinks, chunkSize))
    } else {
      const url_list_of_list = arraySplitting(videoLinks, 200)

      const infoDictListOfList = [];
      for await (let url_list of url_list_of_list){
        const infoDictList = (await this.extractByAPIWithPool(url_list, chunkSize))
        infoDictListOfList.push(infoDictList)
      }
      infoDictList = Array.prototype.concat(...infoDictListOfList)
    }
    return infoDictList
  }

  youtubeVideoExtractor = this.defaultVideoExtractor

  async facebookVideoExtractor(videoLinks: string[]){
    const cpu = this.deviceInfo.cpu

    const totalLinks = videoLinks.length
    const chunkSize = 50

    let infoDictList = [] as IYouTube[];

    if (cpu <= 4){
      infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 100, chunkSize)
      return infoDictList
    }

    if (totalLinks <= 100){
      infoDictList = (await this.extractByAPIWithPool(videoLinks, chunkSize))
    } else {
      if (this.use_custom_cpu_if_available_more_then_12){
        infoDictList = await this.loopExtractByAPIWithPoolPer8CPU(videoLinks, 100, chunkSize)
      } else {
        infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 200, chunkSize)
      }
    }

    return infoDictList
  }

  async instagramVideoExtractor(videoLinks: string[]){
    const cpu = this.deviceInfo.cpu
    const totalLinks = videoLinks.length
    let chunkSize = 30

    let infoDictList = [] as IYouTube[];

    if (cpu <= 4){
      infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 60, chunkSize)
      return infoDictList
    }
    if (totalLinks <= 120){
      infoDictList = (await this.extractByAPIWithPool(videoLinks, chunkSize))
    } else {
      if (this.use_custom_cpu_if_available_more_then_12){
        infoDictList = await this.loopExtractByAPIWithPoolPer8CPU(videoLinks, 60, chunkSize)
      } else {
        infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 120, chunkSize)
      }
    }

    return infoDictList
  }

  async tiktokVideoExtractor(videoLinks: string[]){
    const cpu = this.deviceInfo.cpu

    const totalLinks = videoLinks.length
    const chunkSize = 50
    // const runtime = Math.ceil(totalLinks / chunkSize)
    let infoDictList = [] as IYouTube[];

    if (cpu <= 4){
      infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 100, chunkSize)
      return infoDictList
    }
    // Is the same (only 2 cpu cores)
    if (totalLinks <= 150){
      infoDictList = (await this.extractByAPIWithPool(videoLinks, chunkSize))
    } else {
      infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 150, chunkSize)
    }

    return infoDictList
  }

  // async douyinVideoExtractor(videoLinks: string[]){
  //   const cpu = this.deviceInfo.cpu
  //   const totalLinks = videoLinks.length
  //   let chunkSize = 30

  //   let infoDictList = [] as IYouTube[];

  //   if (cpu <= 4){
  //     infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 100, 50)
  //     return infoDictList
  //   }
  //   if (totalLinks <= 90){
  //     infoDictList = (await this.extractByAPIWithPool(videoLinks, chunkSize))
  //   } else {
  //     if (this.use_custom_cpu_if_available_more_then_12){
  //       infoDictList = await this.loopExtractByAPIWithPoolPer8CPU(videoLinks, 90, chunkSize)
  //     } else {
  //       infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 90, chunkSize)
  //     }
  //   }

  //   return infoDictList
  // }

  douyinVideoExtractor = this.defaultVideoExtractor

  async kuaishouVideoExtractor(videoLinks: string[]){
    const cpu = this.deviceInfo.cpu
    const totalLinks = videoLinks.length
    let chunkSize = 25

    let infoDictList = [] as IYouTube[];

    if (cpu <= 4){
      infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 50, chunkSize)
      return infoDictList
    }
    if (totalLinks <= 100){
      infoDictList = (await this.extractByAPIWithPool(videoLinks, chunkSize))
    } else {
      if (this.use_custom_cpu_if_available_more_then_12){
        infoDictList = await this.loopExtractByAPIWithPoolPer8CPU(videoLinks, 100, chunkSize)
      } else {
        infoDictList = await this.loopExtractByAPIWithPool(videoLinks, 100, chunkSize)
      }

    }

    return infoDictList
  }

  popupInvalidLinks(originalVideoLinks: string[], infoDictList: IYouTube[]){
    const videoLinksByType = this.fixVideoLinksByType(originalVideoLinks)
    // let videoLinks  = Array.prototype.concat(this.youtubeLinks, this.facebookLinks, this.instagramLinks, this.tiktokLinks, this.douyinLinks, this.kuaishouLinks, this.defaultLinks) as string[];
    let videoLinks  = Array.prototype.concat(...Object.values(videoLinksByType))

    let invalidLinks:string[] = [];
    const links = infoDictList.map(info => info.info_dict ? `${info.info_dict.extractor_key?.toLowerCase()}-${info.info_dict.id}` : "").join(",");
    // logger("popupInvalidLinks", videoLinks,)
    // logger("popupInvalidLinks", links,)
    videoLinks.forEach(link => {
      const match = (pattern:string|RegExp) => link.match(new RegExp(pattern))
      var url = link;

      const isGeneric = link.includes("&download_with_info_dict=")

      if(match('\.youtube\.com') || match('youtu\.be') && !isGeneric){
        const videoId = match('\/shorts\/')
              ? link.split('/shorts/')[1]
              : match('\/embed\/')
              ? link.split('/embed/')[1]
              : match('youtu\.be\/')
              ? link.split('youtu.be/')[1].split("?")[0]
              : link.split('/watch?v=')[1];

          url = `youtube-${videoId}`
      }
      else if(match('\.facebook\.com') && !isGeneric){
        const videoId = match('\/videos\/')
              ? link.split('/videos/')[1]
              : link.split('?v=')[1];
        url = `facebook-${videoId}`
      }
      else if(match('\.instagram\.com') && !isGeneric){
        let _url = link.split("?")[0]
        if(_url.endsWith("/")){
          _url = _url.slice(0, -1)
        }

        const videoId = _url.split('/').slice(-1)[0]
        url = `instagram-${videoId}`
      }
      else if(match('\.tiktok\.com') && !isGeneric){
        const videoId = link.split('/video/')[1]
        url = `tiktok-${videoId}`
      }
      else if(match('\.kuaishou\.com') && !isGeneric){
          const videoId = link.split('/short-video/')[1]
          url = `kuaishou-${videoId}`
      }
      else if(match('\.douyin\.com') && !isGeneric){
          const videoId = link.split('/video/')[1]
          url = `douyin-${videoId}`
      }

      if(this.acceptLinks.some(v => link.includes(v)) && !links.includes(url.split("?")[0].split("&")[0].split("/")[0])){
        invalidLinks.push(link.split("&download_with_info_dict=")[0]);
      } else if(!this.acceptLinks.some(v => !link.includes(v)) && !links.includes(url) && !isGeneric){
        invalidLinks.push(link.split("&download_with_info_dict=")[0]);
      }
    })

    if(invalidLinks.length > 0){
      // setInvalidLinksDL(invalidLinks);
      // setActive("invalidLinks");
    }
  }

  async run(){
    const {
      onFinished,
    } = this;

    const originalVideoLinks = await this.getVideoLinks();
    let videoLinks = originalVideoLinks;
    const videoLinksByType = this.fixVideoLinksByType(originalVideoLinks)
    const {
      defaultLinks, youtubeLinks,
      facebookLinks, instagramLinks,
      tiktokLinks, douyinLinks, kuaishouLinks
    } = videoLinksByType

    logger?.log("Video links by type: ", videoLinksByType)

    let videoInfoList = [] as IYouTube[];
    // let __videoLinks = [...youtubeLinks, ...facebookLinks, ...instagramLinks, ...tiktokLinks, ...douyinLinks, ...kuaishouLinks, ...defaultLinks]
    let __videoLinks = Array.prototype.concat(...Object.values(videoLinksByType))

    // logger("__videoLinks", __videoLinks)
    if(__videoLinks.length <= 0){
      // handleSettings({onDownloading: true})
      onFinished(this.tableData)
      this.popupInvalidLinks(originalVideoLinks, [])
      this.loggerTime();
      return
    }

    const isProfileOrPlaylist = this.isProfile || this.isYTPlaylist
    this.showNotification()

    if (this.isDownloadSelection || isProfileOrPlaylist){
      if (this.isProfile && this.extract_only_original_url_from_profile){
        if(youtubeLinks && youtubeLinks.length > 0){
          const youtubeInfoList = (await this.youtubeVideoExtractor(youtubeLinks))
          this.logger("fix youtube: ", youtubeInfoList)
          videoInfoList = [...videoInfoList, ...youtubeInfoList]
          videoLinks = videoLinks.filter(link => !link.includes("youtube.com/watch"))
        }
        if(facebookLinks && facebookLinks.length > 0){
          const facebookInfoList = (await this.facebookVideoExtractor(facebookLinks))
          this.logger("fix facebook: ", facebookInfoList)
          videoInfoList = [...videoInfoList, ...facebookInfoList]
          videoLinks = videoLinks.filter(link => !link.includes("facebook.com/watch"))
        }
        if (kuaishouLinks && kuaishouLinks.length > 0){
          const kuaishouInfoList = (await this.kuaishouVideoExtractor(kuaishouLinks))
          this.logger("fix kuaishou: ", kuaishouInfoList)
          videoInfoList = [...videoInfoList, ...kuaishouInfoList]
          videoLinks = videoLinks.filter(link => !link.includes("kuaishou.com/short-video"))
        }
      }

      if(videoLinks.length > 0){
        const defaultInfoList = videoLinks.filter(link => link.includes("&download_with_info_dict=")).map((link) => {
          const videoInfo = JSON.parse(decodeURIComponent(link.split("&download_with_info_dict=")[1])) as IYouTube
          const req_dl = videoInfo.requested_download ?? (videoInfo.info_dict.requested_download ?? {})
          return {
            ...videoInfo,
            ...(req_dl ? { requested_download: req_dl } : {})
          }
        })
        videoInfoList = [...videoInfoList, ...defaultInfoList]
      }

      this.logger("[Original VideoInfoList]: ", videoInfoList)
      const infoDictList = this.getInfoDictList(videoInfoList)
      this.tableData = infoDictList
      // this.logger("[tableData]: ", infoDictList)

      onFinished(infoDictList)
    } else {

      if (videoLinks.length <= 50){
        this.logger("[VideoLinks]: <= 50", videoLinks.length)
        /* Testing 50 Video Links and got 57 seconds */
        const isKuaishouLinksMT10 = kuaishouLinks && kuaishouLinks.length > 10
        videoLinks = [...youtubeLinks, ...facebookLinks, ...instagramLinks, ...tiktokLinks, ...douyinLinks, ...defaultLinks]
        if(!isKuaishouLinksMT10){
          videoLinks = [...videoLinks, ...kuaishouLinks]
        }
        const defaultInfoList = (await this.defaultVideoExtractor(videoLinks))
        videoInfoList = [...videoInfoList, ...defaultInfoList]

        if(isKuaishouLinksMT10){
          const kuaishouInfoList = (await this.kuaishouVideoExtractor(kuaishouLinks))
          videoInfoList = [...videoInfoList, ...kuaishouInfoList]
        }

      } else {
        /* Testing 50 Video Links and got 59 seconds */

        this.logger("[VideoLinks]: > 50", videoLinks.length)

        if(youtubeLinks && youtubeLinks.length > 0){
          const youtubeInfoList = (await this.youtubeVideoExtractor(youtubeLinks))
          videoInfoList = [...videoInfoList, ...youtubeInfoList]
        }

        if(tiktokLinks && tiktokLinks.length > 0){
          const tiktokInfoList = (await this.tiktokVideoExtractor(tiktokLinks))
          videoInfoList = [...videoInfoList, ...tiktokInfoList]
        }

        if(instagramLinks && instagramLinks.length > 0){
          const instagramInfoList = (await this.instagramVideoExtractor(instagramLinks))
          videoInfoList = [...videoInfoList, ...instagramInfoList]
        }

        if(facebookLinks && facebookLinks.length > 0){
          const facebookInfoList = (await this.facebookVideoExtractor(facebookLinks))
          videoInfoList = [...videoInfoList, ...facebookInfoList]
        }

        if(douyinLinks && douyinLinks.length > 0){
          const douyinInfoList = (await this.douyinVideoExtractor(douyinLinks))
          videoInfoList = [...videoInfoList, ...douyinInfoList]
        }

        if(kuaishouLinks && kuaishouLinks.length > 0){
          const kuaishouInfoList = (await this.kuaishouVideoExtractor(kuaishouLinks))
          videoInfoList = [...videoInfoList, ...kuaishouInfoList]
        }

        if(defaultLinks && defaultLinks.length > 0){
          const defaultInfoList = (await this.defaultVideoExtractor(defaultLinks))
          videoInfoList = [...videoInfoList, ...defaultInfoList]
        }
      }

      const infoDictList = this.getInfoDictList(videoInfoList)
      this.tableData = infoDictList

      this.logger("[TableData]: ", infoDictList)
      onFinished(infoDictList)
      this.popupInvalidLinks(originalVideoLinks, infoDictList)
    }

    this.isDev = process.env.NODE_ENV !== "production"
    this.loggerTime();
    return this.tableData
  }
  async runTest() {
    const videoLinks = await this.getVideoLinks();
    const isProfileOrPlaylist = this.isProfile || this.isYTPlaylist
    if (this.isDownloadSelection || isProfileOrPlaylist){

    }

    const infoDictList = (await this.facebookVideoExtractor(videoLinks))
    logger?.log("[Test]: ", infoDictList)
    // const infoDictList = (await this.extractByAPI(videoLinks)).map((info, i) => {
    //   if(info.url_dl){
    //     delete info.url_dl
    //   }

    //   return {
    //     ...info, timeRange: (new Date()).getTime() * (i+1)
    //   }
    // })
    // // logger("[TableData]: ", infoDictList)
    // this.loadStorage(infoDictList, {
    //   addLinksPopup: false,
    //   ...(this.justExtracting ? {onDownloading: true} : {onDownloading: true}),
    // });
    // setExtracting?.(null);
    this.loggerTime();
  }
}

function finalValidLinks(textLinks:string|string[]) {
  const allLinks = typeof textLinks === 'string' ? textLinks.split('\n') : textLinks

  let defaultLinks:string[] = [];
  let youtubeLinks:string[] = [];
  let facebookLinks:string[] = [];
  let instagramLinks:string[] = [];
  let tiktokLinks:string[] = [];
  let douyinLinks:string[] = [];
  let kuaishouLinks:string[] = [];

  const videoLinks = allLinks.map((link) => {
    const match = (pattern:string|RegExp) => link.match(new RegExp(pattern))
    var url = link;

    const isGeneric = link.includes("&download_with_info_dict=")

    if(match('\.youtube\.com') || match('youtu\.be') && !isGeneric){
      if (link.includes('/@') || link.includes('/channel')) {
        const channelId = link.split('youtube.com/')[1]
        url = `https://www.youtube.com/${channelId}`
      } else if(link.includes('/playlist?list=')) {
        url = `https://www.youtube.com/playlist?list=${link.split('/playlist?list=')[1]}`
      } else {
        const videoId = match('\/shorts\/')
            ? link.split('/shorts/')[1]
            : match('\/embed\/')
            ? link.split('/embed/')[1]
            : match('youtu\.be\/')
            ? link.split('youtu.be/')[1].split("?")[0]
            : link.split('/watch?v=')[1];

        url = `https://www.youtube.com/watch?v=${videoId}`
      }
      youtubeLinks.push(url);
    }
    else if(match('\.facebook\.com') && !isGeneric){
      const videoIdOrProfile = link.split('facebook.com/')[1]
      url = `https://web.facebook.com/${videoIdOrProfile}`
      facebookLinks.push(url);
    }
    else if(match('\.instagram\.com') && !isGeneric){
      const videoIdOrProfile = link.replace(/reels/g, 'reel').split('instagram.com/')[1]
      url = `https://www.instagram.com/${videoIdOrProfile}`
      instagramLinks.push(url);
    }
    else if(match('\.tiktok\.com') && !isGeneric){
      const videoIdOrProfile = link.split('tiktok.com/')[1]
      url = `https://www.tiktok.com/${videoIdOrProfile}`
      if(url.includes('/@/')){
        url = url.replace('/@/','/@tiktok/')
      }
      tiktokLinks.push(url);
    }
    else if((match('\.kuaishou\.com') || match('\.chenzhongtech\.com')) && !isGeneric){
      if (link.includes('/profile/') || link.includes('/fw/user/')) {
        let userId = link.split(link.includes('/profile/') ? '/profile/' : '/fw/user/')[1];
        if(link.includes('/fw/user/')){
          userId = userId.split('?')[0]
        }
        url = `https://www.kuaishou.com/profile/${userId}`
      } else if(link.includes('/fw/photo/')) {
        const videoId = link.split('/fw/photo/')[1].split('?')[0]
        url = `https://www.kuaishou.com/short-video/${videoId}`
      } else if (link.includes("v.kuaishou.com")) {
        const videoId = link.split('kuaishou.com/')[1]
        url = `https://v.kuaishou.com/${videoId}`
      } else {
        const videoId = link.split('/short-video/')[1]
        url = `https://www.kuaishou.com/short-video/${videoId}`
      }
      kuaishouLinks.push(url);
    }
    else if(match('\.douyin\.com') && !isGeneric){
      if (link.includes('/user/') || link.includes("share/user/")) {
        let userId = link.split('/user/')[1].split('?')[0]
        url = `https://www.douyin.com/user/${userId}`
      } else if (link.includes("/share/") || link.includes("/note/")) {
        let path = link.split('?')[0]
        path = path.endsWith('/') ? path.slice(0,-1) : path
        let videoId = path.split('/').at(-1)
        url = `https:/www.douyin.com/video/${videoId}`
      } else if (link.includes("v.douyin.com")) {
        const videoId = link.split('douyin.com/')[1]
        url = `https://v.douyin.com/${videoId}`
      } else {
        const videoId = link.split('/video/')[1]
        url = `https://www.douyin.com/video/${videoId}`
      }
      douyinLinks.push(url);
    } else {
      url = link
      defaultLinks.push(url);
    }

    return url.trim()
  })

  const linksByType = {
    defaultLinks, youtubeLinks,
    facebookLinks, instagramLinks,
    tiktokLinks, douyinLinks, kuaishouLinks
  }

  return { videoLinks, linksByType }

  // youtubeLinks.map((youtubeLink) => getYouTubeID(youtubeLink.trim())).filter(v => typeof v === "string")

}

function fixOneProfile(videoLinks:string[]): [string[], boolean] {
  const video_list:string[] = []
  const isProfile:boolean[] = []
  videoLinks.map(link => {
    const match = (pattern:string|RegExp) => link.match(new RegExp(pattern))
    const isGeneric = link.includes("&download_with_info_dict=")

    if(match('\.instagram\.com') && !isGeneric){
      if(!(["p","reel","reels"].some(v => v===link.split("instagram.com/")[1].split('/')[0]))){
        video_list.push(link)
        isProfile.push(true)
      }
    }
    else if(match('\.tiktok\.com') && !isGeneric){
      if(!link.includes("/video/")){
        video_list.push(link)
        isProfile.push(true)
      }
    }
    else if(match('\.youtube\.com') || match('\.youtu\.be')){
      if(match("youtube\.com\/channel\/") || match("youtube\.com\/@")){
        video_list.push(link)
        isProfile.push(true)
      }
    }
    else if(match('\.facebook\.com')){
      if(!(["/videos/","/watch?v=","/watch/?v=","/reel/","?story_fbid=","/posts/pfbid"].some((v) => link.includes(v)))){
        video_list.push(link)
        isProfile.push(true)
      }
    }
    else if((match('\.kuaishou\.com/profile/')||match('\.kuaishou\.com/fw/user/')) && !isGeneric){
      video_list.push(link)
      isProfile.push(true)
    }
    else if((match('\.douyin\.com/user/') || match('\.douyin\.com/share/user/')) && !isGeneric){
      video_list.push(link)
      isProfile.push(true)
    }
  })
  return [video_list, isProfile.length > 0]
}


export function youtube_validate(url:string): boolean {
  var regExp = /^(?:https?:\/\/)?(?:www\.)?(youtube\.com|youtu\.be)(?:\S+)?$/;
  var matches = url.match(regExp);
  return matches ? matches.length > 0 : false;
}

export function getYouTubeID(url:string, re:string='v'){
  var reg = new RegExp(`[&?]${re}=([a-z0-9_]+)`,"i");
  var match = reg.exec(url);

  if (match && match[1].length > 0 && youtube_validate(url)){
      return match[1];
  } else {
      return;
  }

}
