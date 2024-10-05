import { encodeJsonBtoa, isArray, isObject, removeDuplicateObjArray, sleep } from '@/utils';
import { APIError, APIErrorConstructor, RequestTimeOutError } from './errors';
import { defaultHeaders } from '@/api/backend/config';
import logger from '@/helper/logger';
import { CryptoJs, decryptionCryptoJs, encryptionCryptoJs, generateHash } from '@/utils/scripts/crypto-js';
import { getYouTubeID, youtube_validate } from '@/pages/Dashboard';
import { durationFormatToSecond, getBytesByBitrate, sizeToBytes } from '@/utils/format';
import { isAudioExt } from './utils_media';
import { fixYouTubeVideoPlayback } from './youtube_sig';

export const TaskState = ['pending', 'active', 'retry', 'progress', 'completed', 'failed'] as const;
export const TaskStatePending = TaskState[0];
export const TaskStateActive = TaskState[1];
export const TaskStateRetry = TaskState[2];
export const TaskStateProgress = TaskState[3];
export const TaskStateCompleted = TaskState[4];
export const TaskStateFailed = TaskState[5];


export const API_ENDPOINT = 'https://api.v01.savethevideo.com';


export const API_ENDPOINT_GEN_YOUTUBE = 'https://an10.genyoutube.online'; // original
export const API_ENDPOINT_GEN_YOUTUBE_LIST_CAN_CONVERT = [
  // API_ENDPOINT_GEN_YOUTUBE,
  'https://yt1d.com',
  // API_ENDPOINT_GEN_YOUTUBE,
  'https://yt5s.biz',
  // API_ENDPOINT_GEN_YOUTUBE,
] as const;
export const API_ENDPOINT_GEN_YOUTUBE_LIST = [
  API_ENDPOINT_GEN_YOUTUBE,
  ...API_ENDPOINT_GEN_YOUTUBE_LIST_CAN_CONVERT,
  API_ENDPOINT_GEN_YOUTUBE,
  'https://vd6s.com', // only videos included
  API_ENDPOINT_GEN_YOUTUBE
] as const;
export const API_ENDPOINT_TIKWM = 'https://tikwm.com';
export const API_ENDPOINT_TIQU = 'https://wapi.tiqu.cc';
export const API_ENDPOINT_SUBMAGIC = 'https://submagic-free-tools.fly.dev';


export const crossOriginDefaultHeaders = {
  headers: {
    "accept-language": "en-US,en;q=0.9",
    "priority": "u=1, i",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    // "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36"
  }
}
window.os
async function handleResponse(response: Response, {encodeResponse=true, returnData=true}={}) {
  let dataJson = (await response.json()) as Response & {data: Partial<APIErrorConstructor> & Record<string,any>} & Record<string,any>
  let json = dataJson?.data;

  if(encodeResponse && json && typeof json === 'string'){
    dataJson = decryptionCryptoJs(json)
    json = returnData ? dataJson?.data : dataJson;
  }
  // logger?.log(json, dataJson, response)
  // HTTP errors.
  if (!dataJson?.ok || !response.ok) {
    throw new APIError({
      status: (dataJson || response).status,
      code: json?.code,
      message: json?.message,
      retry: json?.retry,
    });
  }
  return json;
}

export type RequestOptions = Omit<RequestInit, "body"|"headers"> & {
  body: BodyInit|Record<string,any>|null
  data: BodyInit|Record<string,any>|null
  headers: HeadersInit & Record<string,any>
  originOptions: RequestInit & {headers?:  HeadersInit & Record<string,any>}
}

type RequestDefaultSettings = {
  encodeResponse?: boolean
  returnData?: boolean
  stopSize?: number
  useData?: "yes"|"no"|"buffer"|(string&{})
  responseType?: "json"|"text"|(string&{})
}
export async function apiRequest(url:string, options?: Partial<RequestOptions>, defaultSettings?:RequestDefaultSettings) {
  // Fetch will only reject on network errors (connection, security, DNS...)
  defaultSettings = {
    encodeResponse:true, 
    useData:'yes',
    responseType:"json" as "json"|"text",
    stopSize: 1024**2 * 3, // 3 MegaBytes
    ...defaultSettings
  }

  if(defaultSettings.useData !== 'buffer' && typeof defaultSettings?.returnData === 'boolean' && defaultSettings?.returnData === false){
    defaultSettings.useData = 'no'
  }
  if(typeof defaultSettings?.encodeResponse === 'boolean' && defaultSettings?.encodeResponse === false){
    delete defaultSettings.encodeResponse
  }

  let originOptions = options?.originOptions || {};
  const hash = generateHash();
  const data = {
    url: url,
    hash,
    ...defaultSettings,
    options: {
      ...options,
      headers: {
        ...crossOriginDefaultHeaders.headers,
        ...(options?.headers)
      },
    },
  }
  // logger?.log(data.options.headers)
  let dataEncoded = '';
  if(defaultSettings.encodeResponse){
    dataEncoded = encryptionCryptoJs(data)
  } else {
    dataEncoded = encodeJsonBtoa(data);
  }
  if(defaultSettings.useData === 'buffer'){
    return `/api/request/${hash}?data=${dataEncoded}` as any
  }
  const response = await fetch(
    `/api/request/${hash}?data=${dataEncoded}`, 
    { headers: defaultHeaders.headers, ...originOptions }
  );

  return handleResponse(response, defaultSettings);
}

export function apiPost(url:string, {data, ...options}: Partial<RequestOptions>): Promise<DataResponse> {
  return apiRequest(url, {
    method: 'POST',
    body: data || options?.body,
    ...options,
  }) as any;
}

export interface PollTaskDataProgress {
  progress: {
    status: string;
    percent: string;
    size: string;
    downloaded: string;
    speed: string;
    eta: string;
    elapsed: string;
  }
}
type PromiseExecutor = (resolve: (value: unknown) => void, reject: (reason?: any) => void) => void
interface PollOptions extends RequestOptions {
  timeout: number
  interval: number
  onProgress?: (response:DataResponse) => void
}
// Poll the task status
export function pollTask(
  url: string,
  { timeout = Infinity, interval = 1500, onProgress, ...fetchOptions } = {} as Partial<PollOptions>
) {
  // By default there's no timeout
  const endTime = Number(new Date()) + timeout;
  // var data = encodeJsonBtoa({
  //   url: url,
  //   options: {
  //     signal: fetchOptions?.signal
  //   }
  // })
  // fetch("/api/v1/request?data="+data, { headers: defaultHeaders.headers });

  const poll: PromiseExecutor = (resolve, reject) => {
    apiRequest(url, fetchOptions)
      .then(async(response) => {
        logger?.log("poll Task Response", response)
        // If the task succeeded resolve
        if (response.state === TaskStateCompleted) {
          // If we have a result
          if (response.result) {
            // Check if we have a "url", "formats" array or "files" array
            if (
              // Check if we have a "url" (Task: info)
              response.result.url ||
              // Check if we have a "formats" array and is not empty (Task: info)
              (response.result.formats &&
                response.result.formats.length >= 1) ||
              // Check if we have a "files" array (Task: download, convert)
              response.result.files ||
              // Check if we have an "entries" array (Note: Playlists) (Task: info)
              response.result.entries
            ) {
              // Resolve if we have data to display
              return resolve(response);
            }
          }

          // Otherwise if we don't have data to display
          // Poll again if the timeout hasn't elapsed
          if (Number(new Date()) < endTime) {
            setTimeout(poll, interval, resolve, reject);
          } else {
            // The task succeeded but without a result to display (url or formats)
            reject(new Error('Task succeeded but without a result'));
          }
        }
        // If the task failed reject
        else if (response.state === TaskStateFailed) {
          // Task errors.
          reject(
            new APIError({
              code: response.error.code,
              message: response.error.message,
              retry: response.error.retry,
            })
          );
        }
        // If the task is reporting progress info
        else if (response.state === TaskStateProgress) {
          // Report progress
          onProgress?.(response);

          // Poll again if the timeout wasn't reached.
          if (Number(new Date()) < endTime) {
            setTimeout(poll, interval, resolve, reject);
          } else {
            reject(new RequestTimeOutError(`Polling timed out for ${url}`));
          }
        }
        // If the condition isn't met but the timeout hasn't elapsed, poll again
        else if (Number(new Date()) < endTime) {
          setTimeout(poll, interval, resolve, reject);
        }
        // Didn't match and too much time, reject!
        else {
          reject(new RequestTimeOutError(`Polling timed out for ${url}`));
        }
      })
      .catch(reject);
  };

  return new Promise(poll);
}

// Enqueue a task to be processed by the workers
export async function enqueueTask(data: Record<string,any>, options?: Partial<PollOptions>) {
  // Throws an APIError on HTTP errors (Validation errors, server errors...).
  options = {
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "Referer": "https://www.savethevideo.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    ...options,
  }
  const res = await apiPost(`${API_ENDPOINT}/tasks`, { data, headers: options.headers });
  if (res.state === TaskStatePending && res.href) {
    // Throws an APIError on task failure.
    return pollTask(`${API_ENDPOINT}${res.href}`, {method: "GET", body: null, ...options});
  }

  // Task is done (Cached).
  return res;
}

interface RetryRequestOptions {
  times: number,
  timeout: number,
  onRetry?: ({ attempt, delay }: {attempt: number, delay: number}) => void,
  shouldRetry: (error: any) => boolean,
}
// Retry an API request on certain conditions before displaying an error
export function retryRequest(
  request: () => Promise<any>,
  {
    // Number of times to retry
    times = 1,
    // Time to retry after (timeout x attempt number)
    timeout = 2000,
    // Callback to be called on each retry with the retry data
    onRetry,
    // Filter to specify on what errors to retry
    // Check application specific errors
    shouldRetry = (error: any) => {
      // Retry only on server errors.
      // Previously we were retrying based on error.retry.
      return [500, 502, 503, 504].includes(error.status);
    },
  } = {} as Partial<RetryRequestOptions>
) {
  // Retry attempt number
  let attempt = 0;

  const retryAttempt:PromiseExecutor = (resolve, reject) => {
    request()
      .then(resolve)
      .catch((error) => {
        if (attempt++ < times && shouldRetry(error)) {
          logger?.log("shouldRetry error")
          const delay = timeout * attempt;

          onRetry?.({ attempt, delay });
          setTimeout(retryAttempt, delay, resolve, reject);
        } else {
          reject(error);
        }
      });
  };

  return new Promise(retryAttempt);
}


interface SendTask {
  data: any
  onSuccess?: (resp:any) => void
  onError?: (err:Error) => void
  onProgress?: PollOptions['onProgress']
  taskOptions?: Partial<PollOptions>
  retryOptions?: Partial<RetryRequestOptions>
}
export async function sendTask({
  data,
  onSuccess,
  onError,
  onProgress,
  // "pollTask" options
  taskOptions,
  retryOptions,
}: SendTask) {
  try {
    const enqueueTaskType = youtube_validate(data.url) ? enqueueTaskYouTube : enqueueTask
    let response = await retryRequest(
      // Function to be retried
      () =>
        enqueueTaskType(data, {
          // Send the API request, 15 minutes timeout
          ...taskOptions,
          onProgress,
          timeout: taskOptions?.timeout || 900000,
        }),
      // Retry options
      {
        times: 1,
        timeout: 3000,
        onRetry: ({ attempt, delay }) => {
          logger?.log(`Retrying... (Attempt: ${attempt}, Delay: ${delay})`);
        },
        ...retryOptions,
      }
    ) as any;
    if(response && response?.error_code){
      onError?.({...response, message: "Cannot convert, please try again later",});
    } else {
      onSuccess?.(response);
    }
  } catch (error) {
    onError?.(error as Error);
  }
}


export function fetchInfo(videoUrl: string, { onSuccess, ...options }: Omit<SendTask,'data'>) {
  // TODO: temporary fix for vimeo.
  // url = replaceURL(url);

  return sendTask({
    data: { type: 'info', url: videoUrl },
    onSuccess: async (data) => {
      if(Array.isArray(data.result) && data.result.length){
        const info = data.result[0];
        if(String(info?.extractor_key).toLowerCase() === 'tiktok' && info.id){
          let dataRedirectUrls = (await Promise.all(
            ['music','media/play','media/hdplay'].map(async(type) => {
              const ext = type === 'music' ? "mp3" : "mp4"
              return await apiRequest(`${API_ENDPOINT_TIKWM}/video/${type}/${info.id}.${ext}`, {
                method: 'GET',
              }, {encodeResponse: true, returnData: false})
              .then(data => {
                return {...data, ext}
              })
              .catch(err => ({errorCode: 1, ...err})) as any;
            })
          )).filter(dt => dt.url && dt.ok && dt.headers);
          if(dataRedirectUrls.length){
            const formats = dataRedirectUrls.map((dt,i) => {
              const filesize = Number(dt.headers['content-length'])
              const type = dt.headers['content-type']
              let extArr = type?.split('/')
              let ext = type?.includes('audio/mp4') ? "m4a" : (dt.ext || extArr?.[1]);
              const format_id = `${i}-${dt.headers['x-akamai-request-id'] || dt.headers['x-tt-logid'] || info.id}-${ext}`;
              const isAudio = isAudioExt(ext);
              let url = dt.url as string;
              url = (url.includes('?') ? url + `&title` : url + `?title=`) + encodeURIComponent(`${info.title}`).split(' ').join('+')
              return {
                "url": url,
                "ext": ext,
                "format": format_id,
                "format_id": format_id,
                "acodec": "aac",
                "vcodec": isAudio ? "none" : "h264",
                "filesize": filesize,
                "protocol": "https"
              }
            })
            data.result[0].formats = formats;
          }
        }
      }

      onSuccess?.(data);
    },
    ...options,
  });
}

export interface ResponseResult {
	filename: string;
	size: string;
	ext: string;
	link: string;
}
export interface DataResponse extends Record<string,any> {
  status: string; // error | success | progressing
  downloadUrlX?: string;
  percent?: string;
  type?: string;
  id?: string; // videoId
  error_code?: string; // 'ayerror'
  state?: (typeof TaskState)[number] | (string&{})
  result?: ResponseResult[] | PollTaskDataProgress | string
  message?: string
  errorCode?: number
}
export function pollTaskYouTube(
  url: string,
  data: PollOptions['data'],
  { timeout = Infinity, interval = 1500, onProgress, ...fetchOptions } = {} as Partial<PollOptions>
) {
  // By default there's no timeout
  const endTime = Number(new Date()) + timeout;
  // var data = encodeJsonBtoa({
  //   url: url,
  //   options: {
  //     signal: fetchOptions?.signal
  //   }
  // })
  // fetch("/api/v1/request?data="+data, { headers: defaultHeaders.headers });

  let count = 0
  let isErrorConverting = false
  const poll: PromiseExecutor = (resolve, reject) => {
    apiPost(url, { data, ...fetchOptions})
      .then((response) => {
        const data = (response as any) as DataResponse
        logger?.log("poll Task Response", response)
        // If the task succeeded resolve
        if (data.status === 'success' || data?.percent && Number(data?.percent?.replace('%','')) >= 100) {
          // If we have a result
          return resolve(data);
        }
        // If the task failed reject
        else if (data.status === TaskStateFailed || data.status === 'error') {
          // Task errors.
          reject(
            new APIError({
              code: 1,
              message: data.status,
              retry: false,
            })
          );
        }
        // If the task is reporting progress info
        else if (data.status === 'processing' || (data?.percent && Number(data?.percent?.replace('%','')) < 100)) {
          if(Number(data?.percent?.replace('%','')) === 0){
            count++
            if(count >= 5){
              isErrorConverting = true
              reject(
                new APIError({
                  code: 1,
                  status: 200, 
                  message: "Cannot convert, please try again later",
                  retry: false,
                })
              );
            }
            logger?.log("count",count)
          }
          // Report progress
          onProgress?.(data);

          // Poll again if the timeout wasn't reached.
          if (Number(new Date()) < endTime && !isErrorConverting) {
            setTimeout(poll, interval, resolve, reject);
          } else {
            reject(new RequestTimeOutError(`Polling timed out for 1`));
          }
        }
        // If the condition isn't met but the timeout hasn't elapsed, poll again
        else if (Number(new Date()) < endTime && !isErrorConverting) {
          setTimeout(poll, interval, resolve, reject);
        }
        // Didn't match and too much time, reject!
        else {
          reject(new RequestTimeOutError(`Polling timed out for 2`));
        }
      })
      .catch(reject);
  };

  return new Promise(poll);
}

export interface DataEnqueueTaskYouTube {
	url: string;
	filename?: string;
	title?: string;
	convertId?: string;
	format_id?: string;
	quality: string;
	format?: string;
	format_note?: string;
	ext: string;
}
// Enqueue a task to be processed by the workers
export async function enqueueTaskYouTube(
  data: DataEnqueueTaskYouTube|string, 
  options?: Partial<PollOptions>,
) {
  // Throws an APIError on HTTP errors (Validation errors, server errors...).
  // const data = {
  //   "videoUrl": "https://www.youtube.com/watch?v=YZ84iQrbYjw",
  //   "filename": "test-download",
  //   "convertId": "gA2qomJmpD4OJqQqHtkdtw==",
  //   "quality": "720p",
  //   "format": "136",
  //   "ext": "mp4"
  // }
  const API_ENDPOINT_LIST = typeof data === 'string' ? API_ENDPOINT_GEN_YOUTUBE_LIST : API_ENDPOINT_GEN_YOUTUBE_LIST_CAN_CONVERT
  const random = Math.floor(Math.random() * [...API_ENDPOINT_LIST].length);
  const RANDOM_API_ENDPOINT = API_ENDPOINT_LIST[random];
  // const RANDOM_API_ENDPOINT = "https://vd6s.com"; // https://an10.genyoutube.online * orginal
  logger?.log(RANDOM_API_ENDPOINT)
  options = {
    headers: {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "Referer": `${RANDOM_API_ENDPOINT}/`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
      // "User-Agent": navigator.userAgent,
      // "sec-ch-ua": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
    },
    ...options,
  }
  let dt = {} as DataEnqueueTaskYouTube;
  if(typeof data === 'string'){
    dt.url = data
  } else {
    dt = {...data}
  }
  const videoUrl = encodeURIComponent(dt.url);
  const domain = dt.url.replace(/(\:\/\/web.|\:\/\/www.|\:\/\/m.)/g,'\:\/\/')
  const extractor = new URL(domain).host.split('.')[0].toLowerCase();

  if(typeof data === 'string'){
    const api = `${RANDOM_API_ENDPOINT}/mates/en/analyze/ajax?retry=undefined&platform=${extractor}`
    const res = await apiPost(api, {
      headers: options.headers, data: `url=${videoUrl}&ajax=1&lang=en`
    }).catch(err => ({errorCode: 1, message: (err as Error).message || "Unsupported URL"}));
    // logger?.log(res)
    return res as any;
  }

  const filename = dt.filename || dt.title || `download-${extractor}-${getYouTubeID(videoUrl)||Date.now()}`;
  const convertId = dt.convertId || dt.format_id?.split("|")?.[0];
  const quality = dt.quality;
  const format = dt.format || dt.format_note || "";
  const ext = dt.ext || "mp4";

  if(!convertId){
    return {errorCode: 1, message: "Format ID is require"}
  }

  let dataResp: DataResponse | undefined;
  const fetchOptions = {
    ...options,
    headers: {
      ...options.headers,
      "x-note": quality,
    },
    data: `platform=${extractor}&url=${videoUrl}&title=${filename}&id=${encodeURIComponent(convertId)}&ext=${ext}&note=${quality}&format=${format}`
  }
  const api = (path='') => `${RANDOM_API_ENDPOINT}/mates/en/convert${path}?id=${convertId}`;
  
  let res = () => apiPost(api(), fetchOptions);
  if(isAudioExt(ext)){
    dataResp = (await res()) as any
    return dataResp
  }

  dataResp = await new Promise(async(resolve, reject) => {
    res().then(data => {
      dataResp = {...dataResp, ...data} as any;
      resolve(dataResp);
    }).catch(err => reject({errorCode: 1, message: (err as Error).message}));
    await sleep(3);
  
    if(isObject(dataResp)){
      resolve(dataResp)
      return dataResp
    }
    dataResp = (await pollTaskYouTube(api('/status'), fetchOptions.data, { ...fetchOptions })) as any;
  })
  // Task is done (Cached).
  return dataResp;
}

export async function fetchYouTubeInfo(videoUrl: string, options?: Partial<PollOptions>) {
  const data = (await enqueueTaskYouTube(videoUrl, options)) as DataResponse;
  if(data.status === "success" && typeof data.result === 'string' && /googlevideo.com\/videoplayback/.test(data.result)){
    let audioOnly = [] as (OriginalVideoExtractFormat & {quality: string})[];
    let videoOnly = [] as (OriginalVideoExtractFormat & {quality: string})[];
    let videos = [] as (OriginalVideoExtractFormat & {quality: string})[];

    const htmlResult = `<div><div>${data.result}</div></div>`
    const $element = $(htmlResult);

    let text_nfunc = '';
    $element.find('script[type="text/javascript"]').each(function(){
      const $this = $(this);
      const text_script = $this.text()
      if(text_script.includes('nfunc(') && text_script.includes('enhanced_except') && text_script.includes('function fillN')){
        text_nfunc = text_script.split('function fillN')[0]
      }
    })
    let filename = $element.find('#video_title').text();
    let thumbnail = $element.find('img.img-thumbnail').attr('src');
    let duration = durationFormatToSecond($element.find('div.caption > p').text().split(" ")[1].trim());
    $element.find('table.table tr').each(function(){
      const $this = $(this);

      const data = {} as OriginalVideoExtractFormat & {quality: string};
      // logger?.log($this)
      $this.children().each(function(){
        const $td = $(this);
        const text = $td.text()?.trim()

        const $dataChild = $td.children()
        const href = $dataChild.attr('href');
        if((text.toLowerCase() === 'download' && !href)){
          const dataClick = $dataChild.attr('onclick')?.match(/(download\(\').*?(\'\))/);
          if(dataClick){
            ([...JSON.parse(`[${dataClick[0].trim().replace('download\(', '').replace(/\'/g, '"').slice(0,-1)}]`)] as string[]).map((v,i) => {
              switch (`${i}`) {
                case '0':
                  data.url = v
                  data.protocol = 'original'
                  break;
                case '1':
                  data.title = v
                  break;
                case '2':
                  data.format_id = v
                  break;
                case '3':
                  data.ext = v
                  break;
                case '4':
                  if(typeof v === 'number'){
                    data.filesize = v;
                  }
                  break;
                case '5':
                  data.quality = v
                  break;
                case '6':
                  data.format_note = v
                  if(data.format_id){
                    data.format_id = data.format_id + "|" + (data.format_note || `none${i}`)
                  }
                  break;
                default:
                  break;
              }
            });
            if(isAudioExt(data.ext)){
              data.vcodec = "none"
              data.acodec = data.quality
              if(data.quality){
                data.resolution = `audio only ${data.quality}`
              }
              audioOnly.push(data)
            } else {
              data.vcodec = data.quality
              data.acodec = "none"
              data.resolution = data.quality
              if(data?.quality.includes('p'))
              data.height = Number(data.quality.split('p')[0])
              videoOnly.push(data)
            }
          }
        } else {
          const textArr = text.split('(.');
          if(text.includes(')') && textArr.length > 1){
            data.ext = textArr[1].replace(')','')
            data.quality = textArr[0].trim()
          } else if(text.toLowerCase() !== 'download'){
            data.filesize = sizeToBytes(text)
          }
          let isHref = false;
          let isHrefUpgrade = false;
          const noAudio = $td.parent().hasClass('noaudio');
          if(href && href.includes('googlevideo.com/videoplayback') && !noAudio){
            isHref = true;
            data.url = !text_nfunc ? href : fixYouTubeVideoPlayback(href, text_nfunc);
          }
          else if(href){
            isHrefUpgrade = true
            data.ext = data.ext.split(' ')[0].trim()
            data.url = noAudio ? fixYouTubeVideoPlayback(href, text_nfunc) : 'upgrade'
            if(noAudio){
              data.isDownloadable = true
            }
          }
          if(isHref || isHrefUpgrade) {
            data.title = filename;
            data.vcodec = data.quality
            data.acodec = isHrefUpgrade ? 'none' : "mp3"
            data.protocol = isHrefUpgrade && !noAudio ? 'original' : 'https'
            data.format_id = `${data.quality}${data.filesize}`
            data.resolution = data.quality
            if(data?.quality.includes('p')){
              data.height = Number(data.quality.split('p')[0])
            }
            if(isHrefUpgrade){
              videoOnly.push(data)
            } else {
              videos.push(data)
            }
          }
        }
      })
    });
    if(videoOnly.length){
      videoOnly = videoOnly.sort((a,b) => Number(a.height) - Number(b.height)).reverse()
    }
    const formats = [...audioOnly, ...videoOnly, ...videos]
    const videoId = getYouTubeID(videoUrl) as string;
    const downloadableUrl = videos?.[0]?.url;
    return {
      id: videoId,
      title: filename,
      thumbnail,
      duration,
      formats,
      hd: downloadableUrl,
      sd: downloadableUrl,
      original_url: videoUrl,
      webpage_url: videoUrl,
    }
  } else {
    const message = $(data.result as string).find('[role="alert"]').text().trim() || data?.message;
    return { errorCode: 1, message };
  }
}

export interface DataEnqueueTaskKuaishou {
	err: number;
	title: "..." | (string&{});
	source: number;
	url: string;
	type: number;
	cover: string;
	video: string;
	music?: string;
	images: {
    url: string;
    size: number;
    quality: string;
  }[];
	videos: {
    url: string;
    size: number;
    mute: boolean;
    quality: string;
  }[];
	musics: any[];
}
// Enqueue a task to be processed by the workers
export async function enqueueTaskKuaishou(url: string, options?: Partial<PollOptions>){
  options = {
    headers: {
      "accept": "*/*",
      "sec-fetch-site": "same-site",
      "Referer": "https://tiqu.cc/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    ...options,
  }
  let token = 'bfa95f704ce74c5cba31820ea1c0da05';
  try {
    const html = (await apiRequest("https://tiqu.cc/", { headers: options.headers }, { responseType: "text"})).data as string;
    token = $(html).find('meta[name="token"]').attr('content') || token
  } catch (error) {
    logger?.log("error",error);
  }
  let obj = {
    url: url,
    t: Date.now(),
  } as any
  function generateSignature() {
    const CryptoJS = CryptoJs();
    let keys = Object.keys(obj).sort();
    let query = keys.map(k => "".concat(k, "=").concat(obj[k])).join("&");
    return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(query, token))
  }
  obj.sign = generateSignature();

  const domain = url.replace(/(\:\/\/web.|\:\/\/www.|\:\/\/m.)/g,'\:\/\/')
  const extractor = new URL(domain).host.split('.')[0].toLowerCase();

  const api = `${API_ENDPOINT_TIQU}/api/all/?`.concat(new URLSearchParams(obj).toString())
  const res = (await apiPost(api, { method: "GET", headers: options.headers })) as any
  // .catch(err => ({errorCode: 1, message: (err as Error).message || "Unsupported URL"}));
  const data = res as DataEnqueueTaskKuaishou
  if(data.video && data.url){
    const splitText = extractor.includes('kuaishou') ? '/short-video/' : '/video/'
    const videoId = data.url.includes(splitText) ? data.url.split(splitText)[1] : data.url.split('?')[0].split('/').at(-1);
    const title = data.title && data.title !== '...' ? data.title : videoId
    const formats = data.videos.map((dt,i) => {
      return {
        title: title,
        vcodec: dt.quality || "mp4",
        acodec: "mp3",
        protocol: 'https',
        format_id: `${i}-${dt.quality}-${dt.size || videoId}`,
        resolution: dt.quality,
        filesize: dt.size > 0 ? dt.size : undefined,
        url: dt.url,
        ext: "mp4",
        quality: dt.quality,
      }
    });
    return {
      id: videoId,
      title: title,
      thumbnail: data.cover || data.images?.[0].url,
      formats,
      extractor_key: extractor,
      hd: formats[0]?.url,
      sd: formats[0]?.url,
      original_url: data.url,
      webpage_url: data.url,
    }
  } else {
    return {errorCode: 1, message: "Invalid URL"}
  }
}

export function fetchKuaishouInfo(url: string, options?: Partial<PollOptions>){
  return enqueueTaskKuaishou(url, options)
}

export function fetchInfoFromServer(url: string, options?: Partial<PollOptions>){
  return enqueueTaskKuaishou(url, options)
}

export interface SimpleFormat extends Record<string,any> {
  title: string
  url: string
  ext: string
  vcodec: "none" | (string&{})
  acodec: "none" | (string&{})
  protocol: 'https'|'original'|(string&{})
  format_id: string
  width?: number | null
	height?: number | null
  resolution?: string | null
  filesize?: number | null
  quality?: string | null
}
export interface FetchYouTubeOrInstagramFormat {
	formatId: number;
	label: string;
	type: "audio"|"video_only"|"video_with_audio"| (string&{});
	ext: string;
	width?: number;
	height?: number;
	url: string;
	bitrate: number;
	fps?: number;
	audioQuality?: string;
	audioSampleRate?: string;
	mimeType: string;
}
export async function fetchYouTubeOrInstagram(
  url: string, 
  options?: Partial<PollOptions>,
) {
  const API_ENDPOINT = API_ENDPOINT_SUBMAGIC;
  options = {
    headers: {
      "accept": "*/*",
      "content-type": "application/json",
      "sec-fetch-site": "same-origin",
      "Referer": `${API_ENDPOINT}/`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    ...options,
  }

  const domain = url.replace(/(\:\/\/web.|\:\/\/www.|\:\/\/m.)/g,'\:\/\/')
  const extractor = new URL(domain).host.split('.')[0].toLowerCase();
  const isYouTube = domain.includes("youtube") || domain.includes("youtu.be");

  const api = `${API_ENDPOINT}/api/${isYouTube ? "youtube-info" : "instagram-download"}`
  let data = await apiPost(api, {
    headers: options.headers, data: {url}
  }).catch(err => ({errorCode: 1, message: (err as Error).message || "Please try again"})) as any;
  // logger?.log(data)
  if(!data.errorCode && isArray(data.formats) && data.formats.length){
    const videoId = isYouTube ? getYouTubeID(url) : new URL(url).pathname.split('/reel/').at(-1)?.replace(/\//g,'')
    const title = data.title
    let formats = (data.formats as FetchYouTubeOrInstagramFormat[])
    formats = removeDuplicateObjArray(formats, 'formatId')
    let dlUrl = '';
    let defaultFormat = formats.find(f => f.formatId === data.defaultFormatId);
    if(defaultFormat){
      dlUrl = defaultFormat.url
    }
    data = {
      id: videoId,
      title: title,
      thumbnail: data.thumbnailUrl,
      duration: Number(data.duration),
      formats: data.formats,
      extractor_key: extractor,
      hd: dlUrl,
      sd: dlUrl,
      original_url: url,
      webpage_url: url,
    }
    data.formats = formats.map(f => {
      let format = {
        title: title,
        url: f.url,
        ext: f.ext,
        format_id: `${f.formatId}`,
        width: f.width,
        height: f.height,
        resolution: f.width && f.height ? `${f.width}x${f.height}` : "",
        fps: f.fps,
        bitrate: f.bitrate,
        filesize: f.bitrate ? getBytesByBitrate(data.duration, f.bitrate) : undefined,
      } as FetchYouTubeOrInstagramFormat & SimpleFormat
      let codecs = ''
      let codecsMatches = f.mimeType.match(/(codecs=").*?(")/g)
      if(codecsMatches){
        codecs = codecsMatches[0].replace(/(codecs=\"|\")/g,'')
      }
      switch (f.type) {
        case 'audio':
          format.vcodec = 'none'
          format.acodec = codecs || format.ext
          break;
        case 'video_only':
          format.vcodec = codecs || format.ext
          format.acodec = 'none'
          break;
        case 'video_with_audio':
          format.vcodec = codecs.split(',')[0]
          format.acodec = codecs.split(',')?.[1]?.trim() || "m4a"
          break;
      
        default:
          break;
      }
      return format
    })
  }
  return data;
}
