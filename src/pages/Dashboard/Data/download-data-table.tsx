import { useEffect, useState } from "react";
import DataTable, { TableColumnDef } from "@/components/data-table";
import { ActionIcon, Box, Card, Checkbox, Collapse, Flex, Image, Menu, Progress, SegmentedControl, Text, Tooltip } from "@mantine/core";
// import { fetchApi, headers } from "@/contexts/auth";
import logger from "@/helper/logger";
import { IconArrowsUpDown, IconChevronDown, IconChevronUp, IconClockHour3, IconDots, IconDownload, IconEye, IconFolderCode, IconHeart, IconMessageCircle, IconPlayerPlay, IconSortAscendingLetters, IconSortAZ, IconSortDescendingLetters, IconSortZA, IconWorld } from "@tabler/icons-react";
import { useDownload } from "@/contexts";
import { ContentEmbed } from "@/components/mantine-reusable/ContentEmbed";
import { defaultHeaders, localhostApi, staticIcons } from "@/api/backend/config";
import { formatDuration } from "@/utils/format";
import { encodeJsonBtoa, removeDuplicateObjArray } from "@/utils";
import axios from "axios";
import { dataTabs } from "@/contexts/download-data";
import {
  Table as TanstackTable,
} from "@tanstack/react-table";
import { ipcRendererInvoke, isDesktopApp } from "@/App/electron/ipc";

const data: IYouTube[] = [...Array(10).keys()].map((n) => ({
  progressId: "download-progressId-1234-" + (n + 1),
  info_dict: {
    id: "videoId-1234-" + (n + 1),
    title: "video title " + (n + 1),
    duration: Math.round(Math.random() * 100 * (n + 1)),
  },
}));

export interface TableMetaOptions {
  useDownloadData: ReturnType<typeof useDownload>
  dataCurrentRow?: IYouTube
  setDataCurrentRow: React.Dispatch<React.SetStateAction<IYouTube | undefined>>
  // setEditRecord: React.Dispatch<React.SetStateAction<FinancialRecord>>
  // deleteRecord: (record: FinancialRecord) => void
}

const columns: TableColumnDef<(typeof data)[0]>[] = [
  {
    id: "select",
    className: {
      header: "w-12",
      cell: "w-12",
    },
    header: ({ table }) => (
      <Tooltip label="Select all" disabled={table.options.data.length <= 0}>
        <Checkbox
          color="green"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={(e) =>
            table.toggleAllPageRowsSelected(!!e.currentTarget.checked)
          }
          aria-label="Select all"
        />
      </Tooltip>
    ),
    cell: ({ row }) => (
      <Tooltip label={`Select row ${row.index+1}`}>
        <Checkbox
          color="green"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.currentTarget.checked)}
          aria-label="Select row"
        />
      </Tooltip>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "info_dict.title",
    className: {
      header: "text-xs sm:text-sm text-left",
      cell: 'group'
    },
    header: ({ column }) => {
      // const columnDef = column.columnDef as TableColumnDef<IYouTube>
      // const filename = columnDef.accessorKey
      const sorted = column.getIsSorted();
      const IconArrowUpDown = sorted === "asc" ? IconSortAscendingLetters : sorted === "desc" ? IconSortDescendingLetters : IconArrowsUpDown
      return (
        <div className="flex gap-1 items-center justify-start text-xs sm:text-sm py-2">
          {`Filename`}
          <Tooltip
            label={`${sorted ? "Sorted": "Sort"} by Filename ${sorted === "desc" ? "descending" : "ascending"}`}
          >
            <IconArrowUpDown
              size={14} color="currentColor"
              className={"cursor-pointer".concat(sorted ? " text-green-600":"")}
              onClick={() => column.toggleSorting()}
            />
          </Tooltip>
        </div>
      );
    },
    cell: ({ row, table }) => {
      const {
        useDownloadData,
        dataCurrentRow, setDataCurrentRow
      } = table.options.meta as TableMetaOptions
      const { downloadSettings, downloadProgressBar } = useDownloadData

      let data = row.original as (IYouTube & DownloadProgressProps)
      const info = data.info_dict;
      const req_dl = data.requested_download;
      const req_dl_info = req_dl && req_dl.length > 0 ? (req_dl[0] ?? info) : info;
      let duration = req_dl_info.duration || info.duration;

      const extractor = info.extractor_key?.toLowerCase() as string;
      const favicon = ExtractorFavicon(extractor);

      type Key = "like_count" | "view_count" | "comment_count"
      const countType = (key: Key) => InfoCountType(info, key)

      const progressId = data.progressId;
      const progressIdTime = `${data.progressId}-${data.createTime}`;
      let downloadProgressBarId = (
        downloadProgressBar?.[`progressBar-${progressIdTime}`] || (typeof data.progress === "number" ? data : {})
      ) as typeof data;
      // logger?.log("[downloadProgressBarId]", downloadProgressBarId)
      let completed = downloadProgressBarId?.completed;
      let isCompleted = completed === "completed" && downloadProgressBarId.progress >= 100
      if(downloadProgressBar?.[`progressBar-${progressIdTime}`]) {
        downloadProgressBarId = {
          ...data,
          ...downloadProgressBarId,
        }
        data = downloadProgressBarId;
        // logger?.log("[downloadProgressBarId] Progressing", data)
      }

      const isWaiting = data.completed === 'downloading'
      const isUncompleted = data.completed === 'uncompleted'
      const speedDownload = data.averageSpeed || data.speed
      const isProgressing = Boolean(data && typeof data.progress === "number" && speedDownload)
      // logger?.log("isProgressing === ", isProgressing)

      let metadata = (data.metadata || null) as FileMetadata | null;
      let isCompletedWithMetadata = isCompleted && metadata
      
      let videoDuration = ""
      if(metadata && metadata.duration){
        duration = metadata.duration
      }
      if(duration){
        videoDuration = formatDuration(duration)
      }

      let title = info.title
      if(isCompletedWithMetadata){
        title = metadata?.filename as string
      }
      const titleTranslation =
        data.translateOption && data.translateOption.from
        ? info.title + "\n[translate]: " + data.translateOption.text :
        info.title;

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

      let currentDate = new Date()
      // if(data.createTime){
      //   const linkExpired = new Date(data.createTime).toISOString().split('T')[0] < currentDate.toISOString().split('T')[0]
      //   if(linkExpired && ['tiktok'].some(v => extractor === v)){
      //     thumbnail = info.thumbnail as string
      //   }
      // }
      // if(['instagram'].some(v => extractor === v)){
      //   thumbnail = `/goto/api/v1/embed-media?url=${encodeURIComponent(thumbnail)}`
      // }

      const isYouTube = extractor === 'youtube'
      const isHighResolution = Number(downloadSettings.videoResolution) > 720

      const isCurrentData = `${dataCurrentRow?.progressId}-${dataCurrentRow?.createTime}` === progressIdTime
      return (
        <Box pos={'relative'}>
          {
            // isCompletedWithMetadata && (
            //   <ActionIcon className="hidden group-hover:block"
            //     title={isCurrentData ? "Hide Info" : "Show Info"}
            //     unstyled pos={'absolute'} c={'blue'} top={25} left={-28} style={{zIndex:9}}
            //     onClick={() => {
            //       setDataCurrentRow(isCurrentData ? undefined : data)
            //     }}
            //   >
            //     {isCurrentData ? <IconChevronUp /> : <IconChevronDown />}
            //   </ActionIcon>
            // )
          }
          <div className="">
            <Flex gap={'xs'}>
              <ContentEmbed
                className="group"
                title={isCompletedWithMetadata ? "Open File" : undefined}
                filePath={isCompleted ? metadata?.filepath : undefined}
                url={info.original_url}
              >
                <img 
                  className={isCompletedWithMetadata ? "" : "group-hover:filter-none"} alt={info.title}
                  src={thumbnail}
                />
              </ContentEmbed>
              {/* <div className="flex items-center justify-center w-[150px] h-[70px] bg-muted">
                <Image
                  radius="md"
                  src={info.thumbnail || null}
                  w={150}
                  h={70}
                  fallbackSrc={info.thumbnail || "https://placehold.co/600x400?text=Placeholder"}
                />
              </div> */}
              <Flex direction={'column'} justify={'space-between'} className="grow">
                <div>
                  <span title={titleTranslation} className="line-clamp-1 cursor-default leading-6">{title}</span> 
                </div>
                <DownloadingProgressBar
                  downloadProgressBarId={data}
                  metadata={metadata}
                  isProgressing={isProgressing}
                  isUncompleted={isUncompleted}
                  isWaiting={isWaiting}
                  averageSpeed={speedDownload}
                  videoDuration={videoDuration}
                />
                <div>
                  <Flex
                    styles={{
                      root: {
                        gap: 16,
                        marginTop: 5,
                        paddingTop: 5,
                        borderTop: `1px dashed rgb(193 194 197 / 50%)`,
                      }
                    }}
                  >
                    { extractor !== "generic" &&
                      (
                        [
                          {icon:IconClockHour3, text: videoDuration},
                          {icon:IconHeart, text: countType("like_count"), color: 'pink'},
                          {icon:IconEye, text: !info.view_count ? `${countType("like_count")}+` : countType("view_count")},
                          {icon:IconMessageCircle, text: countType("comment_count")},
                        ].slice(duration ? 0 : 1)
                      ).map((item, i) => {

                        return (
                          <Flex key={i} align={"center"} justify={"center"} gap={4}>
                            <Text unstyled span c={item.color || 'blue'}>
                              <item.icon size={15} color="currentColor" />
                            </Text>
                            <Text span fz={12.5} lh={0}>
                              {item.text}
                            </Text>
                          </Flex>
                        )
                      })
                    }
                    <Flex align={"center"} justify={"center"} gap={4}>
                      {
                        favicon
                        ? <img src={favicon} width={16} height={16} />
                        : <IconWorld size={15} />
                      }
                      <Text span fz={12.5} lh={0}>{favicon || extractor !== "generic" ? info.extractor_key : (() => {
                        let domain = String(info.webpage_url_domain)
                        let domainSplit = domain.split(".")
                        if (domainSplit.length >= 3 && domain.length > 30){
                          domainSplit = domainSplit.slice(1)
                        }
                        return domainSplit.join(".")
                      })()}</Text>
                    </Flex>
                  </Flex>
                </div>
              </Flex>
              {
                isDesktopApp ? (
                  isCompletedWithMetadata ? (
                    <Flex direction={'column'} justify={'center'} align={'center'}>
                      <Box ml={16}>
                        <TableActionMenu metadata={metadata} />
                      </Box>
                    </Flex>
                  )
                  : isWaiting ? (
                    <Flex direction={'column'} justify={'center'} align={'center'}>
                      <Box ml={16}>
                        <ActionIcon unstyled title="Stop Download"
                          onClick={()=> {
                            ipcRendererInvoke("write-text-loop", "logger.txt", progressIdTime);
                          }}
                        >
                          <IconPlayerPlay color={"orange"} />
                        </ActionIcon>
                      </Box>
                    </Flex>
                  )
                  : ''
                ) 
                  // : isCompleted && data.progress >= 100 ? (
                  //   <Flex direction={'column'} justify={'center'} align={'center'}>
                  //     <Box ml={16}>
                  //     <ActionIcon 
                  //       title="Click to download"
                  //       variant="filled" color="green"
                  //       size={30}
                  //       radius={'100%'}
                  //       onClick={async()=>{
                  //         const linkDL = data.linkDL;
                  //         if(linkDL){
                  //           // const res = await fetch(linkDL + '&redirect=true');
                  //           // logger?.log(res.url)
                  //           // window.open(res.url);
                  //           try {
                  //             let ext = 'mp4'
                  //             const res = await fetch(linkDL + '&redirect=true');
                  //             const type = res.headers.get('content-type');
                  //             if(type && !type.includes('text')){
                  //               ext = type?.split('/')[1]?.split(';')[0];
                  //               const blob = await res.blob();
                  //               var a = document.createElement("a");
                  //               a.href = window.URL.createObjectURL(blob);
                  //               logger?.log(a.href)
                  //               a.download = `${data.output_filename || info.title.substring(0,155)}.${ext}`;
                  //               a.click();
                  //             } else {
                  //               logger?.log("content-type",type)
                  //             }
                  //           } catch (error) {
                  //             logger?.log("open download error", error)
                  //           }
                  //         }
                  //       }}
                  //     >
                  //       <IconDownload  />
                  //     </ActionIcon>
                  //     </Box>
                  //   </Flex>
                // ) 
                : ''
              }
              {
                // isCompletedWithMetadata && (
                //   <Flex direction={'column'} justify={'center'} align={'center'}>
                //     <Box ml={16}>
                //       <ActionIcon unstyled title="Stop Download"
                //         onClick={()=> {
                //           if(isHighResolution && isYouTube){

                //           } else {
                //             ipcRendererInvoke("write-text-loop", "logger.txt", progressIdTime);
                //           }
                //         }}
                //       >
                //         <IconPlayerPlay color={"orange"} />
                //       </ActionIcon>
                //     </Box>
                //   </Flex>
                // )
              }
            </Flex>
            {
              // isCompletedWithMetadata && (
              // <Collapse in={isCurrentData}>
              // <Box mt={16} p={10}>
              //   <Text>{metadata ? metadata.filepath : ''}</Text>
              //   <Text>{metadata ? metadata.folderPath : ''}</Text>
              // </Box>
              // </Collapse>
              // )
            }
          </div>
        </Box>
      )
    },
  },
  // {
  //   className: {
  //     header: "text-xs sm:text-sm text-right",
  //     cell: "relative text-right",
  //   },
  //   header: "Action",
  //   cell() {
      
  //     return (
  //       <div>
  //         <TableActionMenu />
  //       </div>
  //     )
  //   },
  // },
];

interface DownloadingProgressBarProps {
  downloadProgressBarId: IYouTube & DownloadProgressProps
  metadata: IYouTube['metadata']
  isProgressing: boolean
  isUncompleted: boolean
  isWaiting: boolean
  videoDuration: string
  averageSpeed?: string
}
function DownloadingProgressBar({
  downloadProgressBarId,
  metadata,
  isProgressing,
  isUncompleted,
  isWaiting,
  averageSpeed,
  videoDuration
}: DownloadingProgressBarProps){

  return (
    <>
    {
      isProgressing || (isUncompleted && typeof downloadProgressBarId.progress === 'number') ?
        <div style={{
          position:"relative", height: 15,
          display: "flex", alignItems: "center",
          justifyContent: "center",
        }}>
          <Text 
            fz={metadata ? 13 : 11} fw={600} c='white' 
            pos={'absolute'} lineClamp={1} lh={2.55} 
            style={{
              zIndex: 9,
            }}
          >{
            downloadProgressBarId.progress >= 100
            ? (
                metadata ? <span>
                  <Box component='span' mx={2} >{videoDuration}</Box>{` ‧ `}
                  <Box component='span' mx={2} >{metadata.fileSizeString}</Box>{` ‧ `}
                  <Box component='span' mx={2}>{metadata.ext.toUpperCase()}</Box>
                  {
                    metadata.width > 0 && metadata.height > 0 ? (
                      <>
                      {` ‧ `}
                      <Box component='span' mx={2}>{metadata.width > metadata.height ? metadata.height : metadata.width}p</Box>
                      </>
                    ) : ""
                  }
                  {
                    metadata.frameRate ? (
                      <>
                      {` ‧ `}
                      <Box component='span' mx={2}>{String(metadata.frameRate).slice(0,5)}fps</Box>
                      </>
                    ) : ""
                  }
                </span> :
                "completed".toUpperCase() + ` ~ average speed: ${averageSpeed}`
              )
            : (
              `${downloadProgressBarId.progress}`.slice(0, downloadProgressBarId.progress >= 10?2:1) + "% ‧ " +
              `${downloadProgressBarId.downloaded} of ${downloadProgressBarId.total}` +
              (downloadProgressBarId.timeLeftFormat ? ` ‧ ${downloadProgressBarId.timeLeftFormat}` : "") +
              ` ‧ ${downloadProgressBarId.speed}${downloadProgressBarId.frag ? ` ‧ ${downloadProgressBarId.frag}` : ""}`
            )
          }</Text>
          <Progress
            style={{
              position: "absolute",
              width: "100%",
              height: 20
            }}
            size="xl" 
            // value={data.completed === "progressing" ? progressNum : 100}
            value={downloadProgressBarId.progress}
            bg={'gray'}
            color={
              isUncompleted && !downloadProgressBarId.progress ? "gray"
              : (
                downloadProgressBarId.progress <= 15 ? "yellow"
                : downloadProgressBarId.progress <= 30 ? "orange"
                : downloadProgressBarId.progress <= 50 ? "pink"
                : downloadProgressBarId.progress <= 70 ? "grape"
                : downloadProgressBarId.progress <= 80 ? "violet"
                : downloadProgressBarId.progress <= 90 ? "teal"
                : downloadProgressBarId.progress >= 100 ? "green"
                : undefined
              )
            }
            animated={
              // rowIndex === iDownloading &&
              downloadProgressBarId.progress < 100
            }
          />
        </div>
        : (
          isWaiting || isUncompleted ?
          <div>
            <Progress
              size="lg" bg={'gray'}
              value={100}
              color={"cyan"}
              animated={true}
            />
          </div> : ''
        )
    }
    </>
  )
}

export function ExtractorFavicon(extractor:string, server_host?:string) {
  const __staticIcons = (icon:string) => staticIcons(icon, server_host)
  const favicon = extractor === "youtube"
          ? __staticIcons("youtube.png")
          : extractor === "tiktok"
          ? __staticIcons("tiktok.png")
          : extractor === "instagram"
          ? __staticIcons("instagram.png")
          : extractor === "facebook"
          ? __staticIcons("facebook.png")
          : extractor === "douyin"
          ? __staticIcons("douyin.png")
          : extractor === "kuaishou"
          ? __staticIcons("kuaishou.ico")
          : null;
  return favicon
}

type Key = "like_count" | "view_count" | "comment_count"
export function InfoCountType(info: IYouTube['info_dict'], key: Key){
  let count = info[key] ?? 0;
  let countStr: string;
  if(count === 1000) countStr = `1K`
  else if(count > 1000 && count < 1000000) countStr = `${(count/1000).toFixed(2)}K`
  else if(count === 1000000) countStr = `1M`
  else if(count > 1000000) countStr = `${(count/1000000).toFixed(2)}M`
  else countStr = `${count}`

  return countStr
}

interface TableActionMenuProps {
  metadata?: FileMetadata | null
}
function TableActionMenu({
  metadata
}: TableActionMenuProps){
  return (
    <Menu transitionProps={{ transition: 'pop' }} position="left-end" withinPortal shadow="sm">
      <Menu.Target>
        <ActionIcon title="Action"
          variant="light"
          // color={theme.primaryColor}
          size={30}
          radius={'100%'}
          // className={classes.menuControl}
        >
          <IconDots  />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          fw={600}
          leftSection={
            <Text unstyled span c={'blue'}>
              <IconFolderCode
                size={18}
                stroke={1.5}
                // color={theme.colors.blue[5]}
              />
            </Text>
          }
          onClick={async () => {
            if(metadata){
              try {
                await axios.post(localhostApi('/openfolder'), {
                  file_path: metadata.folderPath ?? ""
                }, defaultHeaders)
              } catch {}
            }
          }}
        >
          Open Folder
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

interface DownloadDataProps {
  onTableChange?: (table: TanstackTable<IYouTube>, resetTable: VoidFunction) => void;
  onRowSelection?: {
    onDownloadingTableChange: (table: TanstackTable<IYouTube>, resetTable: VoidFunction) => void;
    onCompletedTableChange: (table: TanstackTable<IYouTube>, resetTable: VoidFunction) => void;
    onUnCompletedTableChange: (table: TanstackTable<IYouTube>, resetTable: VoidFunction) => void;
  }
}

export function DownloadData({
  onTableChange,
  onRowSelection
}: DownloadDataProps) {
  const useDownloadData = useDownload()
  const { 
    downloadRecords, addManyDownloadRecords,
    simpleData, updateSimpleData,
    downloadProgressBar,
  } = useDownloadData;
  const downloadTabs = [...dataTabs];
  const downloadTab = simpleData.downloadTab || "Downloading"
  // const [downloadTab, setDownloadTab] = useState<
  //   (typeof dataTabs)[number] | (string & {})
  // >(dataTabs[1]);

  const [dataCurrentRow, setDataCurrentRow] = useState<IYouTube>()


  function filterDataTable(dt: IYouTube, completed: IYouTube['completed']){
    return filterData(downloadProgressBar, dt, completed)
  }
  const dataDownloadRecords = downloadRecords.length > 0 ? removeDuplicateObjArray(downloadRecords, 'progressIdTime') : [];
  const dataTables = [
    {
      tab: downloadTabs[0],
      data: dataDownloadRecords.filter(dt => filterDataTable(dt, 'downloading')),
      onRowSelection: onRowSelection?.onDownloadingTableChange
    },
    {
      tab: downloadTabs[1],
      data: dataDownloadRecords.filter(dt => filterDataTable(dt, 'completed')),
      onRowSelection: onRowSelection?.onCompletedTableChange
    },
    {
      tab: downloadTabs[2],
      data: dataDownloadRecords.filter(dt => filterDataTable(dt, 'uncompleted')),
      onRowSelection: onRowSelection?.onUnCompletedTableChange
    },
  ]


  return (
    <>
      <Card p={4} className="sticky top-0 z-10">
        <SegmentedControl
          fullWidth
          size="sm"
          data={downloadTabs}
          value={downloadTab}
          onChange={(val) => {
            // setDownloadTab(val);
            updateSimpleData({downloadTab: val})
          }}
        />
      </Card>
      <Card>
        {dataTables.map((dataTable) => (
          <DataTable
            key={dataTable.tab}
            className={downloadTab !== dataTable.tab ? "hidden" : ""}
            columns={columns}
            data={dataTable.data}
            onTableChange={(table, resetTable) => {
              table.resetRowSelection();
              onTableChange?.(table, resetTable);
            }}
            deps={[downloadRecords]}
            onRowSelection={dataTable.onRowSelection}
            reactTableProps={{
              meta: {
                dataCurrentRow,
                setDataCurrentRow,
                useDownloadData
              },
            }}
            disableDefaultAdvancedFilter
          />
        ))}
      </Card>
    </>
  );
}

export function filterData(downloadProgressBar: DownloadProgressBarType, dt: IYouTube, completed: IYouTube['completed']){
  const progressIdTime = `${dt.progressId}-${dt.createTime}`;
  if(downloadProgressBar?.[`progressBar-${progressIdTime}`]?.completed){
    return downloadProgressBar?.[`progressBar-${progressIdTime}`]?.completed === completed
  } else {
    return dt.completed === completed
  }
  // return dt.completed === completed
}