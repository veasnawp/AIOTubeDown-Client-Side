async function AppApiNotFound() {
  return { error: "Application API has not been found" };
}
export const renderer = window.appASar?.renderer;
export const preloadJs = window.appASar?.preload;
export const machineId = window.electron?.process?.machineId;
export const localBackend = window.electron?.backend;
export const localServer = window.electron?.server;
export const ipcRenderer = window.electron?.ipcRenderer;
export const ipcRendererInvoke = ipcRenderer?.invoke ?? AppApiNotFound;
export const ipcRendererSend = window.electron?.send ?? AppApiNotFound;
export const webContentSend = window.electron?.on ?? AppApiNotFound;

export const isDesktopApp = Boolean(renderer && ipcRenderer && localBackend);

export const path = window.node?.path;

export function fileParse(filePath: string) {
  let filename = '', filepath = '', folderPath = '', ext = ''
  if (ipcRenderer && window.node) {
    const fileParse = window.node.path.parse(filePath);
    folderPath = fileParse.dir
    filename = fileParse.name
    ext = fileParse.ext.replace('.','')
    filepath = path.join(folderPath, fileParse.base)
  }
  return {filename, filepath, folderPath, ext}
}

export const electronAppPath = window.electron?.appPath;
