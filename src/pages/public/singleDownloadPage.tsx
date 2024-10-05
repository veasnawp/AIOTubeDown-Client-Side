import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, Flex, Group, Progress, Select,  Text, TextInput, Title } from "@mantine/core";

import { IconClipboard, IconEye, IconHeart, IconX } from "@tabler/icons-react";
import { useAuth, useDownload, useLicenseRecord } from "@/contexts";
import { isDev, isDevServerHost } from "@/api/backend/config";
import { useSetState } from "@mantine/hooks";
import { MainDashboard } from "../Dashboard/dashboard";
import logger from "@/helper/logger";
import { addDays, getActivationDays, getNewExpireDate } from "../Products/data";
import { decodeEntities, encodeJsonBtoa, isArray, isObject } from "@/utils";


import { formatBytes, getQuality, formatResolution, getFormats, isDownloadable, getExt, sortByDownloadable, sortFormatsByType, isAudioExt, handleVideoMetadata, gotoOtherUrl } from '@/lib/utils_media';
import { DataResponse, fetchInfo, fetchKuaishouInfo, fetchYouTubeInfo, fetchYouTubeOrInstagram, PollTaskDataProgress, sendTask } from "@/lib/api";
import { formatDuration, getBytesByTbr, sizeToBytes } from "@/utils/format";
import { ContentEmbed } from "@/components/mantine-reusable/ContentEmbed";
import { isDesktopApp, machineId } from "@/App/electron/ipc";
import { ExtractorFavicon, InfoCountType } from "../Dashboard/Data/download-data-table";
import { NotificationData, notifications } from "@mantine/notifications";
import { downloadXMLHttpRequest, Extractor } from "../Dashboard";
import { encryptionCryptoJs, getDeviceId } from "@/utils/scripts/crypto-js";
import { AppName } from "@/App/config";

const GROUPS = {
  video: { label: 'Video', icon: '📼' },
  audio: { label: 'Audio', icon: '🎧' },
  videoOnly: { label: 'Video Only', icon: '🔇' },
} as const;


export default function SingleDownloadPage() {
  // const navigate = useNavigate();
  const useAuthData = useAuth();
  const useDownloadData = useDownload();
  const { stateHelper, setStateHelper } = useAuthData;
  const { downloadSettings } = useDownloadData;

  const toastNotifications = (errorMessage?: string, notification?: NotificationData) => {
    setStateHelper({
      notificationsProps: {position: "top-center"}
    })
    errorMessage = errorMessage?.includes('undefined') ? 'Please reload the page and try again.' : errorMessage;
    setTimeout(()=>{
      notifications.show({
        loading: false,
        color: 'red',
        title: <Text fz={'lg'}>{'Oop... Something when wrong'}</Text>,
        message: <Text c={'red'}>{errorMessage}</Text>,
        autoClose: 3000,
        withCloseButton: true,
        withBorder: true,
        onClose() {
          setTimeout(()=>{
            setStateHelper({
              notificationsProps: {position: undefined}
            })
          },5000)
        },
        ...notification
      });
    },100)
  }

  const [stateTest, setStateTest] = useSetState({
    url: '',
    loading: false,
    info: {} as IYouTube['info_dict'],
    originalFormats: [] as OriginalVideoExtractFormat[],
    formats: [] as (OriginalVideoExtractFormat & {isDownloadable:boolean})[],
    format_id: '',
    isWaitSortFormats: false,
    isConverting: false,
    sortFormats: {
      video: [],
      audio: [],
      videoOnly: [],
    } as ReturnType<typeof sortFormatsByType>
  });
  const [dataProgress, setDataProgress] = useState({} as PollTaskDataProgress['progress'])
  // const { data: dataInfo, loading: loadingInfo, error, refetch: refetchInfo, abort: abortInfo } = useFetch(
  //   stateTest.fetchUrl, { method: "GET", headers: defaultHeaders.headers, }
  // );

  // const info = stateTest.info;
  const info = useMemo(() => {
    if(stateTest.info?.title){
      stateTest.info.title = decodeEntities(stateTest.info.title)
    }
    return stateTest.info;
  }, [stateTest.info]);

  const extractor = info.extractor_key?.toLowerCase() as string;
  const favicon = ExtractorFavicon(extractor, stateHelper.server_host);
  const req_dl = info.requested_download;
  const req_dl_info = req_dl && req_dl.length > 0 ? (req_dl[0] ?? info) : info;
  let duration = req_dl_info.duration || info.duration;
  let videoDuration = ''
  if(duration){
    videoDuration = formatDuration(duration)
  }
  
  const thumbnail = `/ct-image?data=${encodeJsonBtoa({url:info.thumbnail, w: Number(info.width) > 1920 ? Math.round(info.width/3) : (info.width ? Number(info.width)/2 : 360), placeholder: true})}`
  const originalFormats = stateTest.originalFormats;
  const hasFormats = originalFormats.length > 0;

  // Formats sorted by type (video, audio, videoOnly)
  const sortFormats = stateTest.sortFormats;
  const sortedFormats = useMemo(() => {
    return sortByDownloadable(sortFormats);
  }, [sortFormats, stateTest.isWaitSortFormats]);

  const hasVideoOnlyFormats = (sortedFormats?.videoOnly.length ?? 0) > 0;
  const hasAudioOnlyFormats = (sortedFormats?.audio.length ?? 0) > 0;
  // const canMerge = hasVideoOnlyFormats && hasAudioOnlyFormats;

  // const hasSubtitles = Object.keys(info?.subtitles ?? {}).length > 0;
  // // Video has automatic captions (YouTube only)
  // const hasCaptions = Object.keys(info?.automatic_captions ?? {}).length > 0;


  const selectedFormat = (stateTest.formats.find(
    ({ format_id }) => format_id === stateTest.format_id
  ) || {}) as typeof stateTest.formats[0];
  // logger?.log(selectedFormat)

  const urlSelected = useMemo(() => {
    const url = selectedFormat.isDownloadable ? gotoOtherUrl(selectedFormat.url, {title: info.title}) : selectedFormat.url
    return url;
  }, [selectedFormat,sortFormats, stateTest.isWaitSortFormats]);

  const isAudio = isAudioExt(selectedFormat.ext);
  const videoWithAudio = selectedFormat.vcodec && selectedFormat.vcodec !== 'none' && selectedFormat.acodec && selectedFormat.acodec !== 'none';
  const isMoreThan500MB = selectedFormat.filesize ? selectedFormat.filesize > (500 * 1024**2) : false

  // const { cutFile, setCutFile, cutFrom, setCutFrom, cutTo, setCutTo } =
  //   useCutFileState({ info });


  useEffect(()=>{
    logger?.log("sortedFormats",sortedFormats)
    logger?.log("selectedFormat",selectedFormat)
    setStateTest({loading: false})
  },[])

  useEffect(()=>{
    if(stateTest.isWaitSortFormats){
      setStateTest({isWaitSortFormats: false})
    }
  },[])

  useEffect(()=>{
    (async()=>{
      if(stateTest.loading && stateTest.url.trim().startsWith('http')){
        let info = stateTest.info
        let originalFormats = stateTest.originalFormats
        let formats = stateTest.formats
        let format_id = stateTest.format_id
        let sortFormats = stateTest.sortFormats
        let isWaitSortFormats = false;

        const videoUrl = stateTest.url.trim()
        
        const extractor = new Extractor({downloadSettings});
        extractor.isPublic = true;
        extractor.customInputLinks = videoUrl;
        extractor.server_host = isDev ? isDevServerHost : (stateHelper.server_host || "")

        const dataVideoLinks = await extractor.preGetVideoLinks(videoUrl);
        const {
          videoLinks,
          genericLinks, isProfile, videoProfileLinks,
          hasYTPlaylist: isYTPlaylist, videoYouTubePlaylistLinks: yt_playlist
        } = dataVideoLinks

        if(isProfile || isYTPlaylist){
          setStateTest({loading:false});
          toastNotifications("Unsupported URL");
          return;
        }
        const videoLinksByType = extractor.fixVideoLinksByType(videoLinks)
        const {
          defaultLinks, youtubeLinks,
          facebookLinks, instagramLinks,
          tiktokLinks, douyinLinks, kuaishouLinks
        } = videoLinksByType

        const randomList = [...Array(10).keys()]
        const random = Math.floor(Math.random() * [...randomList].length);
        const isEven = randomList[random] % 2 === 0;

        // const host  = new URL(videoUrl).host.toLowerCase();
        const isYouTube = youtubeLinks.length > 0
        if(isYouTube || (kuaishouLinks.length || douyinLinks.length || instagramLinks.length)){
          let data: IYouTube['info_dict'] & DataResponse
          if(isYouTube){
            data = (await fetchYouTubeInfo(videoUrl)) as any;
            // if(isEven){
            // } else {
            //   data = (await fetchYouTubeOrInstagram(videoUrl)) as any;
            // }
          } else if(douyinLinks.length) {
            extractor.onError = function(err){
              logger?.log('error',err);
              if(err?.status === 429){
                toastNotifications('Too Many Request! Please try again later.')
              } else if(err && err.status === 200 && err.message.includes('Something wrong')){
                toastNotifications("URL may unsupported! Please try again.")
              }
            }
            const dataInfoList = await extractor.run();
            if(dataInfoList && dataInfoList.length){
              const dataInfo = dataInfoList[0];
              const info = dataInfoList[0].info_dict;
              info.formats = [];
              function defaultFormat(dt:Partial<VideoExtractFormat>, i:number, overwrite?:Partial<VideoExtractFormat>&Record<string,any>){
                return {
                  ...dt,
                  vcodec: "mp4",
                  acodec: "mp3",
                  protocol: 'https',
                  format_id: `${i}-${dt.filesize_num || dt.resolution}-${info.id}`,
                  filesize: dt.filesize_num,
                  ext: dt.ext || "mp4",
                  quality: getQuality(dt),
                  ...overwrite,
                }
              }
              if(dataInfo.info_dict.audio_only?.length){
                dataInfo.info_dict.audio_only.map((dt,i) => {
                  const ext = dt.ext || "mp3"
                  const format = defaultFormat(dt,i, {vcodec: "none", acodec: ext, ext, quality: dt.filesize_num})
                  info.formats?.push(format)
                })
              }
              if(dataInfo.both?.length){
                dataInfo.both.map((dt,i) => {
                  const format = defaultFormat(dt,i)
                  info.formats?.push(format)
                })
              }
              if(dataInfo.info_dict.video_only?.length){
                dataInfo.info_dict.video_only.map((dt,i) => {
                  const format = defaultFormat(dt,i, {acodec: "none",})
                  info.formats?.push(format)
                })
              }
              data = info as any
            } else {
              data = { errorCode: 1, message: ""} as any
            }
          } else {
            if(instagramLinks.length && isEven){
              data = (await fetchYouTubeOrInstagram(videoUrl)) as any;
            } else {
              data = (await fetchKuaishouInfo(videoUrl)) as any;
            }
          }
          logger?.log("info data", data);
          if(!data.errorCode){
            info = data;
            originalFormats = getFormats(info)
            formats = originalFormats.map((format) => ({
              ...format,
              isDownloadable: isDownloadable(format),
              // Some format objects don't have the "ext" property
              ext: format.ext ?? getExt(format.url),
            }))
            .reverse();
            sortFormats = sortFormatsByType(formats);
            format_id = (sortFormats?.video)?.at(-1)?.format_id || ""
            // Sort formats by the media type (video, audio, videoOnly)
            if(sortFormats?.video?.length > 0){
              isWaitSortFormats = true
              sortFormats.video = await Promise.all(
                sortFormats?.video.map(async(f) => {
                  f = await handleVideoMetadata(f);
                  if(f.duration && !info.duration){
                    info.duration = f.duration
                  }
                  return f
                })
              )
            }
            if(sortFormats?.videoOnly?.length > 0 && !sortFormats?.videoOnly.some(f => f.protocol === 'original')){
              isWaitSortFormats = true
              sortFormats.videoOnly = await Promise.all(
                sortFormats?.videoOnly.map(async(f) => {
                  // f.isDownloadable = false
                  f = await handleVideoMetadata(f);
                  if(f.duration && !info.duration){
                    info.duration = f.duration
                  }
                  return f
                })
              )
            }
            if(sortFormats?.video?.length || sortFormats?.videoOnly?.length){
              const formatsVideo = sortFormats?.video?.length ? sortFormats?.video : sortFormats?.videoOnly;
              if(formatsVideo.length){
                const video = formatsVideo.filter(f => {
                  let p = f.width && f.height ? (f.height < f.width ? f.height : f.width) : 1080
                  return p <= 1080
                })?.[0]
                format_id = video?.format_id || ""
              }
            }
            if(isWaitSortFormats){
              setStateTest({loading:false, isWaitSortFormats, info, originalFormats, formats, sortFormats, format_id});
            }
          } else if(data.message) {
            toastNotifications(data.message)
          }
        } else {
          await fetchInfo(videoUrl, {
            onSuccess: async (data) => {
              logger?.log(data);
              const __formats = data?.result?.[0]?.formats
              if(isArray(__formats)){
                info = data.result[0]
                originalFormats = getFormats(info)
                formats = originalFormats.map((format) => ({
                  ...format,
                  isDownloadable: isDownloadable(format),
                  // Some format objects don't have the "ext" property
                  ext: format.ext ?? getExt(format.url),
                }))
                .reverse();
  
                sortFormats = sortFormatsByType(formats);
                // Sort formats by the media type (video, audio, videoOnly)
                format_id = (sortFormats?.video)?.at(-1)?.format_id || ""
                if(sortFormats?.video?.length > 0){
                  isWaitSortFormats = true
                  sortFormats.video = await Promise.all(
                    sortFormats?.video.map(async(f) => {
                      f = await handleVideoMetadata(f);
                      if(f.duration && !info.duration){
                        info.duration = f.duration
                      }
                      return f
                    })
                  )
                }
                if(sortFormats?.videoOnly?.length > 0){
                  isWaitSortFormats = true
                  sortFormats.videoOnly = await Promise.all(
                    sortFormats?.videoOnly.map(async(f) => {
                      f.isDownloadable = false
                      f = await handleVideoMetadata(f);
                      if(f.duration && !info.duration){
                        info.duration = f.duration
                      }
                      return f
                    })
                  )
                }
                if(sortFormats?.video?.length || sortFormats?.videoOnly?.length){
                  const formatsVideo = sortFormats?.video?.length ? sortFormats?.video : sortFormats?.videoOnly;
                  if(formatsVideo?.length){
                    const video = formatsVideo.filter(f => {
                      let p = f.width && f.height ? (f.height < f.width ? f.height : f.width) : 1080
                      return p <= 1080
                    })?.[0]
                    format_id = video?.format_id || ""
                  }
                }
                if(isWaitSortFormats){
                  setStateTest({loading:false, isWaitSortFormats, info, originalFormats, formats, sortFormats, format_id});
                }
              } else {
                toastNotifications("Please try again")
              }
            },
            onError: (error)=> {
              toastNotifications(error.message)
            },
            // taskOptions: { originOptions: { signal } },
            // retryOptions: { times: 2}
          });
        }

        setStateTest({loading:false, isWaitSortFormats, info, originalFormats, formats, sortFormats, format_id});
      }
    })();
  },[stateTest.loading]);


  useEffect(()=>{
    if(stateTest.isWaitSortFormats){
      setStateTest({isWaitSortFormats: false})
    }
  },[stateTest.isWaitSortFormats, stateTest.isConverting])

  useEffect(()=>{
    (async()=>{
      if(stateTest.isConverting){
        setDataProgress({} as any)
        let percent = '';
        let sortFormats = stateTest.sortFormats;
        const sFormat = {...selectedFormat} as typeof selectedFormat & {type: string}
        if(!sFormat.isDownloadable){
          if(sortedFormats?.audio?.length && sortedFormats?.audio[0]?.format_id && info.original_url){
            sFormat.format = `${sFormat.format_id}+${sortedFormats?.audio[0]?.format_id}`
            sFormat.url = info.original_url
            sFormat.type = "download"
          }
          // Test Expired Link 12:50 AM
          // https://hc07.v01.savethevideo.com/facebook-1200933381056704-1070112441216147v+861326175860388a.mp4
          await sendTask({
            data: sFormat,
            async onSuccess(resp: DataResponse) {
              logger?.log("resp",resp);
              if(resp?.downloadUrlX || resp?.state === 'completed'){
                let downloadUrl = resp?.downloadUrlX;
                let filesize: number|undefined
                if(Array.isArray(resp?.result) && resp.result.length > 0){
                  downloadUrl = resp.result[0].link
                  filesize = sizeToBytes(resp.result[0].size)
                }
                if(downloadUrl){
                  const videos = [] as OriginalVideoExtractFormat[];
                  if(isAudioExt(selectedFormat.ext)){
                    sortFormats.audio = sortFormats.audio.map(f => {
                      if(f.format_id === selectedFormat.format_id){
                        f.url = downloadUrl
                        f.isDownloadable = true
                      }
                      return f
                    })
                  } else {
                    sortFormats.videoOnly = sortFormats.videoOnly.map(f => {
                      if(f.format_id === selectedFormat.format_id){
                        f.url = downloadUrl
                        f.isDownloadable = true
                        if(filesize){
                          f.filesize = filesize
                        }
                        videos.push(f)
                      }
                      return f
                    }).filter(f => !Boolean(f.isDownloadable));
                    sortFormats.video = [...sortFormats.video, ...videos].sort((a,b)=> {
                      let sorted = Number(b.filesize) - Number(b.filesize)
                      if(a.height && b.height){
                        sorted = a.height - b.height
                      } else if(a.width && b.width){
                        sorted = a.width - b.width
                      }
                      return sorted
                    })
                  }
                } else {
                  toastNotifications('Please try again')
                }
              }
              if(percent){
                setDataProgress({...dataProgress, percent: '100%'})
                setTimeout(()=>{
                  setDataProgress({} as any)
                },3000)
              }
            },
            async onProgress(dataProgress) {
              const result = dataProgress.result as PollTaskDataProgress
              if(isObject(result?.progress) || dataProgress.percent){
                let progress = {} as PollTaskDataProgress['progress']
                if(dataProgress.percent){
                  percent = dataProgress.percent
                  progress.percent = percent
                } else {
                  percent = result?.progress?.percent
                  progress = result?.progress
                }
                setDataProgress(progress);
              }
            },
            async onError(error) {
              toastNotifications(error.message)
            },
          })
        }
        setStateTest({isConverting: false, sortFormats, isWaitSortFormats: true});
      }
    })()
  },[stateTest.isConverting])

  return (
    <MainDashboard
      classNames={{
        inner: "*:shadow-none"
      }}
    >
      <Card className="space-y-2.5 mb-24 sm:mb-0">
        <div className="flex flex-col justify-center text-center mb-10">
          <Title mb={16} className="text-2xl xs:[font-size:var(--title-fz)]"><Text unstyled span c="green.8">All In One</Text> Online Video <Text unstyled span c="green.8">Downloader</Text></Title>
          <Text className="text-gray-600 dark:text-gray-300">{`Save videos from YouTube, Twitter, Tiktok, Instagram, Facebook, Vimeo, Dailymotion, Douyin, Kuaishou and free, fast, no need to log in, supports video resolution 2K, 4K, 8K from over 999+ platforms.`}</Text>
        </div>
        <form onSubmit={(e)=>{
          e.stopPropagation()
          if(stateTest.url && stateTest.url.trim().startsWith('http')){
            e.preventDefault();
            setStateTest({loading:true});
          }
        }}>
          <TextInput
            className="grow"
            placeholder="Enter a link"
            value={stateTest.url}
            onChange={(e)=> {
              const url = e.currentTarget.value;
              setStateTest({url: url})
            }}
            onKeyDown={(e) => {
              const url = stateTest.url;
              if(e.key === 'Enter' && url){
                setStateTest({url: url, loading:true})
              }
            }}
            required autoFocus size="xl"
            classNames={{
              input: "text-[15px]"
            }}
            rightSection={(()=>{
              return (
                <Group gap={6} mr={4}>
                  <Button px={6} variant="light" size="sm" 
                    className={''.concat(stateTest.url ? 'bg-[rgba(218,235,251,0.9)] dark:bg-[rgba(145,193,238,0.5)]' : '')}
                    onClick={async(e)=>{
                      e.preventDefault();
                      if(stateTest.url){
                        setStateTest({url: ''})
                      } else {
                        const text = await window.navigator.clipboard.readText();
                        setStateTest({url: text})
                      }
                    }}
                  >{(function(){
                    const Icon = stateTest.url ? IconX : IconClipboard
                    return(
                      <>
                      <Icon size={20} />{ stateTest.url ? "Clear" : " Paste"}
                      </>
                    )
                  })()}</Button>
                  <Button px={8} color={'green'} size="lg" loading={stateTest.loading} type="submit" className="hidden sm:block">Download</Button>
                </Group>
              )
            })()}
            // rightSectionProps={}
            rightSectionWidth={'fit-content'}
          />
          <Button fullWidth color={'green'} size="lg" mt={8} loading={stateTest.loading} type="submit" className="block sm:hidden">Download</Button>
        </form>
        {
          hasFormats && (
            <div className="flex flex-col gap-3 sm:flex-row !mt-12">
              <div className="space-y-3 grow">
                <ContentEmbed
                  className="group"
                  mainProps={{
                    className: 'group'
                  }}
                  title={'custom:' + info.title}
                  belowContent={
                    info.thumbnail && (
                      <div className="w-full absolute bottom-2.5 z-10">
                        <div className="flex items-center justify-center">
                          <Button color="cyan" c="white" size="compact-sm" className="text-xs xs:text-sm opacity-30 group-hover:opacity-85"
                            onClick={async()=>{
                              let filename = info.title||info.id;
                              if(!filename && info.original_url?.startsWith('http')){
                                filename = new URL(info.original_url).pathname.replace(/\//g, '-')
                              }
                              let thumbnail = info.thumbnail
                              if(extractor === 'youtube'){
                                thumbnail = 'https://i.ytimg.com/vi/5dlubcRwYnI/maxresdefault.jpg'
                              }
                              const data = encryptionCryptoJs({url:thumbnail, title: filename});
                              const linkDL = `/api/download?data=${data}&__sig=${getDeviceId(10)}`;
                              await new Promise(async (resolve, reject) => {
                                downloadXMLHttpRequest({
                                  url: linkDL,
                                  filename: filename.replace(/["*<>%\/\{\}\|\\\^~\[\]`;\?:]/g, "").substring(0,235),
                                  onXMLHttpRequest(request) {
                                    request.onabort = function(e){
                                      e.preventDefault()
                                      e.stopPropagation()
                                      window.open(linkDL)
                                      resolve({error: "onabort", type: "Thumbnail", url: linkDL})
                                    }
                                    request.onerror = function(e){
                                      e.preventDefault()
                                      e.stopPropagation()
                                      window.open(linkDL)
                                      resolve({error: "onerror", type: "Thumbnail", url: linkDL})
                                    }
                                  },
                                  async onProgress(dataProgress) {
                                    try {
                                      logger?.log("dataProgress Thumbnail", dataProgress)
                                    } catch (error) {
                                      toastNotifications((error as Error).message)
                                      reject({error, type: "Thumbnail", url: linkDL})
                                    }
                                  },
                                })
                              });
                            }}
                          >Save Thumbnail</Button>
                        </div>
                      </div>
                    )
                  }
                >
                  <img 
                    className={"group-hover:filter-none hover:cursor-default"} alt={info.title}
                    src={thumbnail}
                  />
                </ContentEmbed>
                {
                  Boolean(info.user_info?.name || info.uploader) && 
                  <Box className={isDesktopApp ? 'cursor-default':''}>
                    {
                      isDesktopApp ?
                      <Text fz={15} span c={'cyan'}>{info.user_info?.name || info.uploader}</Text>
                      : <Text fz={15} component='a' href={info.uploader_url} target='_blank' c={'cyan'}>{info.user_info?.name || info.uploader}</Text>
                    }
                  </Box>
                }
                <div className='cursor-default'>
                  <Text fz={15} lineClamp={3}>{info.title}</Text>
                </div>
                <div className='cursor-default'>
                  <div className='flex justify-between'>
                    <div className='text-sm'>{duration && duration > 0 ? videoDuration : ''}</div>
                    <div className='text-sm text-right'>{extractor !== "generic" && (InfoCountType(info, "comment_count") + ' comments')}</div>
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
                        <Flex key={info.original_url?.concat(`${i}`)} align={"center"} justify={"center"} gap={4}>
                            <Text unstyled span c={item.color || 'blue'}>
                              <item.icon size={24} />
                            </Text>
                            <Text span lh={0.7} className='text-sm'>
                              {item.text}
                            </Text>
                        </Flex>
                      )
                    })
                  }
                    </Flex>
                  </div>
                </div>
              </div>
              <div className="space-y-3 min-w-full sm:min-w-80 max-w-96">
                {(function(){
                  const __dataSortedFormats = [...Object.entries(GROUPS)]
                    .map(([key, value]) => {
                      const items = (sortedFormats as typeof stateTest.sortFormats)?.[key as 'video']?.map((format) => {
                        const f = format
                        const quality = getQuality(f);
                        const resolution = formatResolution(f);
                        let filesize = f.filesize ? formatBytes(f.filesize) : '';
                        if(!filesize){
                          if(f.tbr && info.duration){
                            filesize = formatBytes(getBytesByTbr(info.duration, f.tbr))
                          } else {
                            filesize = f.filesize_approx
                              ? "~" + formatBytes(f.filesize_approx)
                              : '';
                          }
                        }
                        // Audio bitrate
                        const abr = f.abr ? `${Math.round(f.abr)}Kbps` : '';
                        // Video bitrate
                        const vbr = f.vbr ? `${Math.round(f.vbr)}Kbps` : '';
                        // Bitrate
                        const tbr = f.tbr && !f.abr && !f.vbr ? `${Math.round(f.tbr)}Kbps` : '';
                        // Audio sampling rate
                        const asr = f.asr ? `${f.asr}Hz` : '';
                        // Frames per second
                        const fps = f.fps ? `${Math.round(f.fps)}fps` : '';
    
                        const item = `${value.icon} - ${f.ext?.toUpperCase()}` +
                        (quality ? ` - ${quality}` : '') +
                        (resolution ? ` - (${resolution})` : '') +
                        // (abr ? ` - ${abr}` : '') +
                        // (vbr ? ` - ${vbr}` : '') +
                        // (tbr ? ` - ${tbr}` : '') +
                        (asr ? ` - ${asr}` : '') +
                        (fps ? ` - ${fps}` : '') +
                        (filesize ? ` - (${filesize})` : '')
    
                        return {label: item, value: `${f.format_id}`};
                      })
    
                      return {
                        group: value.label, items
                      }
                    })
                  const dataSortedFormats = __dataSortedFormats.filter(v => Boolean(v.items));

                  const itemLabelSelected = Array.prototype.concat(...dataSortedFormats.map(dt => dt.items))
                  let itemLabel = '';
                  if(itemLabelSelected.length){
                    itemLabel = itemLabelSelected.find(t => t?.value === stateTest.format_id)?.label
                  }
                  return (
                    <Select
                      label={"Select Format"} title={itemLabel}
                      placeholder='Select One'
                      value={stateTest.format_id}
                      onChange={(val) => { setStateTest({format_id: val||stateTest.format_id})}}
                      data={dataSortedFormats}
                      checkIconPosition='right'
                      comboboxProps={{
                        withinPortal: true, shadow: 'md', offset: 2,
                        width: window.innerWidth >= 640 ? 'fit-content' : undefined
                      }}
                      // size="lg"
                      // w={'40%'}
                      // classNames={{
                      //   input: 'placeholder:text-xs'
                      // }}
                    />
                  )
                })()}
                {
                  (selectedFormat.isDownloadable && (!isMoreThan500MB)) || (isAudio || videoWithAudio) ? (
                    <Button
                      component="a"
                      href={urlSelected}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      fullWidth size="lg"
                    >
                      { isAudio ? "Download Audio" : "Download MP4"}
                    </Button>
                  ) : (
                    <Button
                      fullWidth size="lg"
                      loading={stateTest.isConverting}
                      onClick={()=>{
                        if(selectedFormat.url === 'upgrade' || isMoreThan500MB){
                          window.open('/tools/aiotubedown')
                        } else {
                          setStateTest({isConverting:true})
                        }
                      }}
                    >
                      {
                        isAudioExt(selectedFormat.ext) ? "Convert Audio" 
                        : selectedFormat.url === 'upgrade' || isMoreThan500MB ? 'Download with '+AppName : "Merge MP4 and Audio"
                      }
                    </Button>
                  )
                }
                {
                  dataProgress.percent && 
                  (
                    (function(){
                      const progress = Number(dataProgress.percent.replace('%',''))
                      return (
                        <Progress.Root size="lg" h={16} transitionDuration={200}>
                          <Progress.Section className="items-center"
                            value={progress} animated
                            color={
                              progress <= 15 ? "yellow"
                              : progress <= 30 ? "orange"
                              : progress <= 50 ? "pink"
                              : progress <= 70 ? "grape"
                              : progress <= 80 ? "violet"
                              : progress <= 90 ? "teal"
                              : progress >= 100 ? "green"
                              : undefined
                            }
                          >
                            <Progress.Label fz={12}>{dataProgress.percent}</Progress.Label>
                          </Progress.Section>
                        </Progress.Root>
                      )
                    }())
                  )
                }
              </div>
            </div>
          )
        }
      </Card>
    </MainDashboard>
  )
}




export async function updateProductLicense(
  updateLicenseRecord: ReturnType<(typeof useLicenseRecord)>['updateLicenseRecord'],
  user: UserPayload,
  product: LicenseRecord,
  state: {plan: string; price: string, payWith: string} & Record<string,any>,
  status?: LicenseRecord['status'],
){
  const pricePlan = state.plan;
  const currentDate = new Date();
  let newExpireDate = getNewExpireDate(pricePlan);

  const license = (user.licenses?.length ? user.licenses.filter(l => l._id === product._id)?.[0] : {}) as LicenseRecord
  if(license && license.expiresAt){
    const isExpired = currentDate.getTime() > new Date(license.expiresAt).getTime();
    if(!isExpired){
      const expireDaysLeft = getActivationDays(currentDate, license.expiresAt)
      const addMoreExpireDays = getActivationDays(currentDate, newExpireDate)
      newExpireDate = addDays(expireDaysLeft+addMoreExpireDays)
    }
  }

  const historyLicenseBough = product.historyLicenseBough || [];
  return await updateLicenseRecord(product._id as string, {
    status: status || 'activated',
    modifyDateActivated: currentDate.toISOString(),
    activationDays: getActivationDays(currentDate, newExpireDate),
    expiresAt: newExpireDate,
    currentPlan: pricePlan,
    historyLicenseBough: [...historyLicenseBough, `${currentDate}|${newExpireDate}|${state.price}`],
    paymentMethod: state.payWith,
  }, user._id)
}

export async function addNewProductLicense(
  addLicenseRecord: ReturnType<(typeof useLicenseRecord)>['addLicenseRecord'],
  userId: string,
  dataProduct: DataProduct,
  state: {plan: string; price: string, payWith: string} & Record<string,any>,
  status?: string
){
  const pricePlan = state.plan;
  const currentDate = new Date().toISOString();
  const newExpireDate = getNewExpireDate(pricePlan);

  return await addLicenseRecord({
    userId: userId,
    status: status || 'activated',
    modifyDateActivated: currentDate,
    activationDays: getActivationDays(currentDate, newExpireDate),
    expiresAt: newExpireDate,
    currentPlan: pricePlan,
    historyLicenseBough: [`${currentDate}|${newExpireDate}|${state.price}`],
    toolName: dataProduct.productName,
    productId: dataProduct.productId,
    category: dataProduct.category,
    paymentMethod: state.payWith,
  }, userId)
}