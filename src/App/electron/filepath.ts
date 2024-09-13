import { ipcRendererInvoke } from "./ipc";


declare global {
    type EnvName =
        | "home"
        | "appData"
        | "userData"
        | "sessionData"
        | "temp"
        | "exe"
        | "module"
        | "desktop"
        | "documents"
        | "downloads"
        | "music"
        | "pictures"
        | "videos"
        | "recent"
        | "logs"
        | "crashDumps" 
        // | (string & {});
}


export const readFile = async (text:string, basename:string, name: EnvName = "appData") => {
  const filepath = await ipcRendererInvoke("environ-path", "\\" + basename, name)
  const data = await ipcRendererInvoke("read-file", `custom:${filepath}`, text)
  return {filepath, data}
}

export const writeEnvironFile = async (text:string, basename:string, name: EnvName = "appData") => {
  const filepath = await ipcRendererInvoke("environ-path", "\\" + basename, name)
  const data = await ipcRendererInvoke("write-file", `custom:${filepath}`, text)
  return {filepath, data}
}

export const makeDirectory = async (path: string) => {
  const folderPathSplit = path.split('\\')
  const folderPaths = folderPathSplit.map((_,i) => folderPathSplit.slice(0, i+1).join('\\'))

  for await (let folderPath of folderPaths){
    try {
      await ipcRendererInvoke("create-folder", folderPath)
    } catch {}
  }
}