// Get the formats array

import logger from "@/helper/logger";
import { apiRequest } from "./api";
import { isDesktopApp, localBackend } from "@/App/electron/ipc";
import { encryptionCryptoJs, getDeviceId } from "@/utils/scripts/crypto-js";

// Some info objects don't have the "formats" array
export function getFormats(info:IYouTube['info_dict']) {
  // If this info object has a "formats" array
  if (info.formats && info.formats.length > 0) {
    return info.formats;
  }
  // Otherwise this info object contains 1 format that is the top level object
  else if (info.url) {
    // Return a list of 1 format
    return [info];
  }

  return [];
}

// Result type, "video", "playlist", "multi_video", "url", "url_transparent"
export function getResultType(info:any) {
  if (info) {
    // Results that don't have a "_type" key are of type "video"
    return info?._type ?? 'video';
  }

  return null;
}

// Check if a format is video only
export function isVideoOnlyFormat(format:any) {
  return format.acodec === 'none';
}

// Check if a format is audio only
export function isAudioFormat(format:any) {
  return format.vcodec === 'none';
}

// Check an extension if is an audio format
export function isAudioExt(ext:string) {
  // Some formats don't have "acodec" and "vcodec" so we check the ext
  // Source: https://en.wikipedia.org/wiki/Audio_file_format#List_of_formats
  return [
    'mp3',
    'm4a',
    'aac',
    'opus',
    'wav',
    'ogg',
    'oga',
    'wma',
    'weba',
    'flac',
    'aif',
    'aiff',
    'aa',
    'aax',
    'au',
    'ra',
    'ram',
  ].includes(ext);
}

// Create a formats object sorted by the media type
// Non downloadable formats will be skipped
export function sortFormatsByType(formats: OriginalVideoExtractFormat[]) {
  const sorted = { video: [] as OriginalVideoExtractFormat[], audio: [] as OriginalVideoExtractFormat[], videoOnly: [] as OriginalVideoExtractFormat[] };

  // Sort formats by the media type (video, audio, videoOnly)
  for (const format of formats) {
    const isAudio = isAudioFormat(format) || isAudioExt(format.ext)
    // Skip invalid formats.
    if (format.ext === 'mpd' || format.ext === 'mhtml') {
      continue;
    }
    // Video only formats (DASH video)
    if (isVideoOnlyFormat(format) || (typeof format.isDownloadable === 'boolean' && !format.isDownloadable && !isAudio)) {
      sorted.videoOnly.push(format);
    }
    // Audio only formats (DASH audio)
    // Check the file extension for common audio formats if "vcodec" is undefined
    else if (isAudio) {
      sorted.audio.push(format);
    }
    // Normal video format (video + audio)
    else {
      sorted.video.push(format);
    }
  }

  return sorted;
}

// Get the file extension from URL
export function getExt(url:string, defaultExt = '') {
  try {
    url = url.trim();

    if (url) {
      // Remove the hash fragment if present
      const hash = url.indexOf('#');

      if (hash !== -1) {
        url = url.substring(0, hash);
      }

      // Remove the query string if present
      const query = url.indexOf('?');

      if (query !== -1) {
        url = url.substring(0, query);
      }

      // Split on the dots and get the last item
      // Replace the character / if present (we have to use regex to replace all)
      return url.split('.').pop()?.replace(/\//g, '') as string;
    }

    return defaultExt;
  } catch (e) {
    return defaultExt;
  }
}

// Parse a URL using the URL API or by using the DOM
export function parseURL(url:string) {
  try {
    // Try using the URL API if available
    const parsedURL = new URL(url);

    if (!('href' in parsedURL)) {
      throw new Error('The URL API is not fully supported');
    }

    return parsedURL;
  } catch (e) {
    // We're catching all errors even "Invalid URL"
    // Use the browser's built in parser
    const anchor = document.createElement('a');
    anchor.setAttribute('href', url);
    return anchor;
  }
}

// Get the download protocol for a format
// See: YoutubeDL.utils.determine_protocol
export function getProtocol(format:any, defaultProtocol = '') {
  try {
    const { url, protocol } = format;

    // If already has a protocol key return it
    if (protocol) {
      return protocol;
    }

    // Check the URL
    if (url.startsWith('rtmp')) {
      return 'rtmp';
    } else if (url.startsWith('mms')) {
      return 'mms';
    } else if (url.startsWith('rtsp')) {
      return 'rtsp';
    }

    // Check the file extension if not available
    const ext = format.ext ?? getExt(url);

    if (ext === 'm3u8' || ext === 'f4m') {
      return ext as string;
    }

    // Otherwise get the URL scheme
    // Could be: http, https, ftp, ftps ...
    const parsedURL = parseURL(url);
    // The protocol is returned with the colon
    return parsedURL.protocol.replace(':', '');
  } catch (e) {
    return defaultProtocol;
  }
}

// Protocols of URLs directly downloadable by the user
const DL_PROTOCOLS = ['http', 'https', 'ftp', 'ftps'];

// Check if the format is directly downloadable by the user
export function isDownloadable(format:any) {
  if (format) {
    if (typeof format.isDownloadable === 'boolean') {
      return format.isDownloadable;
    }

    let { protocol } = format;

    // Get the protocol if the format doesn't have one
    if (!protocol) {
      // Use "http" as the default protocol
      protocol = getProtocol(format, 'http');
    }

    return DL_PROTOCOLS.includes(protocol);
  }

  return false;
}

// Get an object of hours, minute, seconds from a duration in seconds
export function getTimeObject(duration:number) {
  const hours = Math.floor(duration / 3600);
  // Set the variable as the remaining number of seconds
  duration %= 3600;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);

  return {
    hours,
    minutes,
    seconds,
  };
}

// Format seconds to HH:MM:SS string
// Source: https://stackoverflow.com/a/1322798/1209328
// Supports formatting more than 23 hours in the string
export function formatSeconds(totalSeconds:number) {
  const time = getTimeObject(totalSeconds);

  // Don't show the hours part if it's 0
  const h = time.hours !== 0 ? String(time.hours) + ':' : '';
  // If hours is 0 do not pad start the minutes with 0
  const m =
    time.hours !== 0
      ? String(time.minutes).padStart(2, '0')
      : String(time.minutes);
  const s = String(time.seconds).padStart(2, '0');

  return `${h}${m}:${s}`;
}

// Format resolution (see: YoutubeDL.format_resolution)
export function formatResolution(format:any) {
  // Some formats alread have a resolution
  if (format.resolution) {
    return format.resolution;
  }

  if (format.height) {
    if (format.width) {
      // Width and height
      return `${format.width}x${format.height}`;
    } else {
      // Height only
      return `${format.height}p`;
    }
  } else if (format.width) {
    // Only width is available
    return `${format.width}x?`;
  }

  return null;
}

// Get quality from width and height
// See: https://en.wikipedia.org/wiki/Graphics_display_resolution
export function qualityString(width:number, height:number) {
  if(width < height){
    let w = width, h = height;
    width = h, height = w;
  }
  // logger?.log(width, height)
  if (height >= 144 && height < 360) {
    return 'QVGA';
  } else if (height >= 360 && height <= 576) {
    return 'SD';
  } else if (height > 576 && height <= 768) {
    return 'HD';
  } else if (height >= 1080 && height < 1440) {
    return 'Full HD';
  } else if ((width === 2048 || !width) && (height === 1440)) {
    return 'DCI 2K';
  } else if ((width === 2560 || !width) && height === 1440) {
    return 'Quad HD';
  } else if (height >= 1440 && height < 2160) {
    return '2K';
  } else if ((width === 3840 || !width) && height === 2160) {
    return '4K Ultra HD';
  } else if (width === 4096 || (!width && height >= 2160 && height < 4320)) {
    return 'DCI 4K';
  } else if (width === 7680 || (!width && height >= 4320)) {
    return '8K Ultra HD';
  }

  return null;
}

// Match video quality, eg: 320p, 480p, 1080P, hd720
// Match numbers of 3 digits or more starting with "sh", "hd" or ending with "p"
const QUALITY_RE = /[shd]+(\d{3,})|(\d{3,})p/i;

// Get the format resolution type (SD, HD, Full HD, 4K, 8K)
export function getQuality(format?:any) {
  if (!format) {
    return null;
  }

  // If we have at least height or width
  if (format.height || format.width) {
    return qualityString(format.width, format.height);
  }
  // Some formats don't have a height and width
  // But sometimes we can find the quality in format_note or format_id
  else {
    let match = null;

    // Match quality string, eg: 320p, 480P, hd720
    if (format.format_note) {
      match = format.format_note.match(QUALITY_RE);
    }

    // If we didn't get a match from format_note, try format_id
    if (!match && format.format_id) {
      match = format.format_id.match(QUALITY_RE);
    }

    if (match) {
      // group 1 will match "hd720", group 2 will match "320p"
      const height = match[1] || match[2];
      return qualityString(0, Number(height));
    }
  }

  return null;
}

export function getThumbnail(info:IYouTube['info_dict']) {
  if (info.thumbnail) {
    return info.thumbnail;
  }
  // Some extractors have a "thumbnails" array without "thumbnail"
  else if (info.thumbnails && info.thumbnails.length > 1) {
    // Return the last thumnbail which has the best quality
    return info.thumbnails[info.thumbnails.length - 1].url;
  }

  return null;
}

// Format bytes size
export function formatBytes(bytes:number, decimals=2) {
  if (bytes === 0) {
    return '0 Bytes';
  }

  decimals = decimals <= 0 ? 0 : decimals || 2;

  const kb = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(kb));
  const sizes = [
    'Bytes',
    'KiB',
    'MiB',
    'GiB',
    'TiB',
    'PiB',
    'EiB',
    'ZiB',
    'YiB',
  ];

  const size = parseFloat((bytes / kb ** i).toFixed(decimals));

  return `${size} ${sizes[i]}`;
}

// Array.sort() compare function to sort the formats by downloadable first
export function downloadableFirst(a:any, b:any) {
  const ad = isDownloadable(a);
  const bd = isDownloadable(b);

  // If the first item is downloadable and the second is not
  if (ad && !bd) {
    // Treat the first as less than the second (should go before)
    return -1;
  } else {
    // Otherwise keep them in their current positions
    return 0;
  }
}

// Accepts a sorted formats object (from sortFormatsByType)
// and sorts the formats by downloadable first
export function sortByDownloadable<T>(formats:T):T|undefined {
  const entries = Object.entries(formats as Record<string,any>).map(([type, formats]) => [
    type,
    [...formats].sort(downloadableFirst),
  ]);

  return Object.fromEntries(entries);
}

export function getFilename(text:string) {
  const t = text.match(/([\w-]+\.(?:jpg|mp4))$/i);
  return t ? t[1] : ""
}

interface HandleVideoMetadataProps extends Record<string,any> {
  width?: number
  height?: number
  url?: string
}
export async function handleVideoMetadata<T>(info: T & HandleVideoMetadataProps){
  if(!info?.width && !info?.height && info.url?.startsWith('http')){
    let isError = false;
    const pollMetadata = (url?:string) => new Promise(async (resolve, reject) => {
      try {
        var video = document.createElement('video'); 
        video.innerHTML = `<source src="${url || info.url}" type="video/mp4" />`
        video.onloadedmetadata = function(){
          logger?.dir(video);
          if(!isNaN(video.duration)){
            var width = video.videoWidth
            var height = video.videoHeight
            var resolution = `${width}x${height}`
            var duration = video.duration
            
            var metadata = {
              width, height, resolution,
              duration,
            }
            info = {
              ...info,
              ...metadata,
            }
          }
          // logger?.log(info)
          resolve(info);
        }
      } catch (error) {
        isError = true
        logger?.log("error poll metadata",error)
        reject(error)
      }
    })
    await pollMetadata();
    if(isError){
      try {
        const url = await apiRequest(info.url, {
          method: 'GET',
        }, {encodeResponse: true, returnData: true, useData: 'buffer'})
        logger?.log("url",url)
        await pollMetadata(url)
      } catch (error) {
        logger?.log("error poll metadata fetch",error)
      }
    }
  }
  return info
}

interface VideoFileLinksType {
  type?: "music" | "video" | (string&{}) | null
  url: string
}
export async function getVideoMetadataByRequest(videoFileLinks: VideoFileLinksType[]){
  let dataRedirectUrls = (await Promise.all(
    videoFileLinks.map(async({type, url}) => {
      const ext = type === 'music' ? "mp3" : "mp4"
      let res: Promise<any>
      if(isDesktopApp){
        res = fetch(`${localBackend}/data_redirect_url?url=`+encodeURIComponent(url)).then(r => r.json())
      } else {
        res = apiRequest(url, {
          method: 'GET',
        }, {encodeResponse: true, returnData: false})
        .then(data => {
          return data
        })
      }
      return await res.catch(err => ({errorCode: 1, ...err})) as any;
    })
  )).filter(dt => dt.url && (dt.ok || dt.status === 200) && dt.headers);
  if(dataRedirectUrls.length){
    const formats = dataRedirectUrls.map((dt,i) => {
      const headers = dt.headers
      const filesize = Number(headers['content-length'] || headers['Content-Length'])
      const type = headers['content-type'] || headers['Content-Type']
      let extArr = type?.split('/')
      let ext = type?.includes('audio/mp4') ? "m4a" : extArr?.[1];
      const format_id = `${i}-${filesize}-${ext}`;
      const isAudio = isAudioExt(ext);
      let url = dt.url as string;
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
    return formats;
  }
}

interface DataRedirectProps {
  title: string
  redirect: boolean
}
export function gotoOtherUrl(url: string, data?: Partial<DataRedirectProps>){
  let __data = {
    url: url,
    redirect: true,
    ...data
  }
  const dataEncoded = encryptionCryptoJs(__data);
  return `/api/download?data=${dataEncoded}&__sig=${getDeviceId(14)}`;
}