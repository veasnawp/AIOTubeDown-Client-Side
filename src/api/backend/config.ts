import { isDesktopApp, localBackend } from "@/App/electron/ipc";
import { encodeJsonBtoa } from "@/utils";

export const isDev = process.env.NODE_ENV !== "production";

export const localhostApi = (path?: string, port?: number) => {
    if((localBackend && isDesktopApp)){
        const p = isDesktopApp ? (port || 49006) : 49007;
        return `${path || ''}`;
    } else {
      // if(isDev){
      //   return `http://localhost:49006${path || ''}`;
      // }
      return `${path || ''}`
    }
}

export const isDevServerHost = [
  'h', 't', 't', 'p', ':', '/', '/', 
  'l', 'o', 'c', 'a', 'l', 'h', 'o', 's', 't', ':', 
  '4', '9', '0', '0', '6'
].join('')
  
export const localhost = (path?: string) => `${window.location.origin}${path || ''}`;
export const defaultHeaders = { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } };

export const staticIcons = (icon: string, server_host?:string) => {
  let data = '';
  if(isDev || server_host){
    data = '?data=' + encodeJsonBtoa({server_host: isDev ? isDevServerHost : server_host})
  }
  return localhostApi(`/static/icons/${icon}${data}`)
};
export const staticImages = (image: string, server_host?:string) => {
  let data = '';
  if(isDev || server_host){
    data = '?data=' + encodeJsonBtoa({server_host: isDev ? isDevServerHost : server_host})
  }
  return localhostApi(`/static/images/${image}${data}`)
};