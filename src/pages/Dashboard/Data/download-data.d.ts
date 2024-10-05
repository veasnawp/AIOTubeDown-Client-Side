
export interface PreIYouTube extends OptionIYouTube {
  progressId: string;
  info_dict: {
    id: string;
    title: string;
    url_dl?: string;
    music?: string;
    hd?: string;
    sd?: string;
    url?: string;
    original_url?: string;
    webpage_url?: string;
    thumbnail?: string;
    thumbnail_base64?: string;
    duration: number;
    upload_date?: string;
    view_count?: number;
    like_count?: number;
    comment_count?: number;
    timestamp?: number
    release_timestamp?: number
    uploader?: string;
    uploader_url?: string;
    extractor_key?: string;
    requested_formats?: Record<string, any>[];
    video_only?: VideoExtractFormat[];
    audio_only?: VideoExtractFormat[];
    both?: VideoExtractFormat[];
    formats?: any[];
    user_info?:
      | {
          username: string;
          name: string;
          profile_pic_url: string;
          avatar: string;
          avatar_base64?: string;
        }
      | Record<string, any>;
  } & Record<string, any>;
  // onDownloading?: (videoId: string, formatIndex: number) => void;
  // completed?: any;
  // selected?: boolean;
}

export interface OptionIYouTube extends Record<string, any> {
  url_dl?: string;
  linkDL?: string;
  video_only?: VideoExtractFormat[];
  audio_only?: VideoExtractFormat[];
  both?: VideoExtractFormat[];
  requested_download?: VideoExtractFormat[];
  onDownloading?: (videoId: string, formatIndex: number) => void;
  completed?: "downloading" | "completed" | "uncompleted" | (string&{});
  justExtracting?: boolean;
  selected?: boolean;
  output_path?: string;
  output_file_path?: string;
  output_filename?: string;
  logfile?: string;
  translateOption?: {
    from?: string
    text: string
  }
  createTime?: number;
  metadata?: FileMetadata | null
}

export interface SimpleVideoExtractFormat {
	url: string;
	ext: string;
	format: string;
	format_id: string;
	protocol: string;
}
export interface DefaultVideoExtractFormat {
	url: string;
	ext: string;
	format: string;
	format_id: string;
	format_note: string;
	width: number;
	height: number;
	aspect_ratio: number;
	resolution: string;
	dynamic_range: string;
  filesize: number
  filesize_approx: number
	fps: number;
	tbr: number;
	vbr: number;
  abr: number;
	asr: number;
	acodec: string;
	vcodec: string;
	container: string;
	title: string;
	protocol: string;
	duration: number;
	isDownloadable: boolean;
}
declare global {
  type IYouTube = Prettify<PreIYouTube>;
  type OriginalVideoExtractFormat = Partial<DefaultVideoExtractFormat> & SimpleVideoExtractFormat
  type VideoExtractFormat = {
    tbr?: number;
    fps?: number;
    title: string;
    ext?: string;
    filesize?: string;
    filesize_num?: number;
    duration?: number;
    url: string;
    width: number;
    height: number;
    resolution: string;
    format_id?: string;
    video?: string;
  } & Record<string,any>;
  type VideoFormat = {
    ext: string;
    filesize: string;
    filesize_num: number;
    width: number;
    height: number;
    resolution: string;
    url: string;
    video?: string;
    file_path?: string;
    output_path?: string;
    folder_path?: string;
    duration?: number;
  };
  
  interface FileMetadata extends Record<string, any> {
    duration: number;
    ext: string;
    filename: string;
    filepath: string;
    filenameUri: string;
    fileSize: number;
    fileSizeString: string;
    folderPath: string;
    height: number;
    resolution: string;
    title: string;
    width: number;
    bitRate: number;
    frameRate?: number | null;
  }
  // interface FileMetadata extends Record<string, any> {
  //   duration: number;
  //   ext: string;
  //   filename: string;
  //   filepath: string;
  //   filename_uri: string;
  //   filesize: string;
  //   filesize_num: number;
  //   folder_path: string;
  //   height: number;
  //   resolution: string;
  //   title: string;
  //   width: number;
  //   bit_rate: number;
  //   frame_rate: number;
  // }
  type DownloadProgressProps = Prettify<{
    progress: number;
    speedBytes: number;
    speed: string;
    remainingBytes: number;
    remaining: string;
    totalBytes: number;
    total: string;
    downloadedBytes: number;
    downloaded: string;
    averageSpeed: string;
    stopDownload?: boolean;
    completed?: "downloading" | "completed" | "uncompleted" | (string&{});
  }> & Record<string, any>;

  type FFmpegDataProgressProps = {
    bitrate: number;
    drop: number;
    dup: number;
    eta: number;
    fps: null | number;
    frame: null | string | number;
    progress: number;
    psnr: any[];
    quality: any[];
    size: number;
    speed: null | number;
    time: number;
  }
}