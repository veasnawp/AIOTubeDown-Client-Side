import { useHotkeys } from '@mantine/hooks';
import { Dashboard } from './Dashboard'
import { ipcRendererInvoke, isDesktopApp, webContentSend } from '@/App/electron/ipc';
import { computedColorScheme } from '@/components/mantine-reusable/ColorSchemes/ToggleDarkMode';
import { useEffect } from 'react';
import { notifications, Notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { rem } from '@mantine/core';
import { useAuth, useDownload } from '@/contexts';
import { fetchPyServer } from '@/contexts/auth';
import { isDev, isDevServerHost } from '@/api/backend/config';
import { useCheckLoggedInSession } from './useCheckSession';
import { useLocation } from 'react-router-dom';
import { decryptionCryptoJs, encryptionCryptoJs } from '@/utils/scripts/crypto-js';

export const ipcToggleColorScheme = (colorScheme:string) => {
  if(isDesktopApp){
    ;(async()=>{
      let titleBarOverlay = {
        color: "rgba(40, 49, 66, 0)",
        symbolColor: "#ffffff",
        height: 50-2,
      }
      if(colorScheme === 'light'){
        titleBarOverlay.color = '#ffffff'
        titleBarOverlay.symbolColor = '#000000'
      };
      await ipcRendererInvoke('toggle-color-scheme', titleBarOverlay, colorScheme)
    })()
  }
}
export const useEffectColorScheme = () => {
  const wLocation = window?.location;
  const isLoginPage = ['/login', '/register'].some(p => p === wLocation?.pathname)
  const colorScheme = computedColorScheme();
  

  useEffect(() => {
    if(!window){
      return
    }
    if(isDesktopApp){
      const bodyClassName = document.body.classList
      if(!bodyClassName.contains('isDesktopApp')){
        bodyClassName.add('isDesktopApp')
      }
    }

    // ;(async()=>{
    //   let url = 'https://v16m.tiktokcdn.com/2cf8d325b4d17f58ef2456df1baf1dbe/66a7d359/video/tos/alisg/tos-alisg-pve-0037c001/ooIUEQAvIr4SAyBzciy3fdDdFc5CKiIwqilsAd/?a=1233&bti=M0BzMzU8OGYpNzo5Zi5wIzEuLjpkNDQwOg%3D%3D&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0%7C0%7C0%7C&cv=1&br=3502&bt=1751&cs=0&ds=6&ft=pfue3M9h8Zmo0yGpU-4jVsN5O6LrKsd.&mime_type=video_mp4&qs=4&rc=Mzk6OjY5aWlpaWY2ZTZkNEBpanc1OnM5cjhkdDMzODczNEBgMjViXjVjNTQxYDEwMmEyYSMvMWNiMmRjcF5gLS1kMTFzcw%3D%3D&vvpl=1&l=20240729113648E5F1FB2F058A70089B62&btag=e00088000&cc=3'
    //   // const res = await ipcRendererInvoke("fetch", url, {})
    //   // console.log("response", res)
    // })()
    if(colorScheme){
      const html = document.querySelector('html')
      if(colorScheme === 'dark'){
        html?.classList.add('dark')
      } else if(html?.classList.contains('dark')) {
        html?.classList.remove('dark')
      }
      if(isDesktopApp){
        ;(async()=>{
          let titleBarOverlay = {
            color: "rgba(40, 49, 66, 0)",
            symbolColor: "#ffffff",
            height: 50-2,
          }
          if(colorScheme === 'light' && !isLoginPage){
            titleBarOverlay.color = '#ffffff'
            titleBarOverlay.symbolColor = '#000000'
          };
          await ipcRendererInvoke('toggle-color-scheme', titleBarOverlay, colorScheme)
        })()
      }
    }
  }, [colorScheme])

  return colorScheme;
}

export const useEffectMainInterface = () => {
  const isLoginPage = ['/login', '/register'].some(p => p === location?.pathname)
  if(isDesktopApp)
  useHotkeys([
    ['mod+-', () => {
      if(isLoginPage){
        ipcRendererInvoke("reset-zoom")
      } else {
        ipcRendererInvoke("zoom-in")
      }
    }],
    ['mod+=', () => {
      if(isLoginPage){
        ipcRendererInvoke("reset-zoom")
      } else {
        ipcRendererInvoke("zoom-out")
      }
    }],
    // ['ctrl+shift+=', () => ipcRendererInvoke("zoom-out")],
    ['mod+0', () => ipcRendererInvoke("reset-zoom")],
    ['mod+r', async () => {
      // let titleBarOverlay = {
      //   color: "rgba(40, 49, 66, 0)",
      //   symbolColor: "#ffffff",
      //   height: 50 - 2,
      // }
      // await ipcRendererInvoke('toggle-color-scheme', titleBarOverlay);
      // window.location.href = window.location.origin
    }],
  ])
  // const { setColorScheme } = useMantineColorScheme();
  return useEffectColorScheme()
}

export const MainHook = ({children}: Readonly<{
  children: React.ReactNode;
}>) => {
  useEffectMainInterface();

  useEffect(()=>{
    let timer = setInterval(()=>{
      var __CryptoJS__ = window.CryptoJS;
      if(__CryptoJS__){
        clearInterval(timer);
        window.CryptoJS = undefined;
      }
      class WindowCrypto {
        __CryptoJS__ = __CryptoJS__
      }
      Window.prototype.WindowCrypto = new WindowCrypto
      if(isDev){
        class Encryption {
          decryptionCryptoJs = decryptionCryptoJs
          encryptionCryptoJs = encryptionCryptoJs
        }
        Window.prototype.Encryption = Encryption
      }
    },1000)

    return ()=> {
      clearInterval(timer)
    }
  },[])
  return <>{children}</>
}

export const MainInterface = () => {
  return (
    <>
    <Dashboard />
    </>
  )
}

export const CheckAuth = ({children}: Readonly<{
  children: React.ReactNode;
}>) => {
  useCheckLoggedInSession();
  return <>{children}</>
}

export const isLocationForHideNotification = (location: ReturnType<typeof useLocation>) => {
  return ['/tools/'].some(path => location.pathname.startsWith(path)) || location.pathname === '/'
}

export const CheckPyServerComponent = () => {
  const { isLoggedIn, stateHelper, setStateHelper } = useAuth();
  const { simpleData, updateSimpleData } = useDownload();
  const location = useLocation();

  const locationForHideNotification = isLocationForHideNotification(location)

  // const navigate = useNavigate();

  // let oneTimeLoad = true;

  let resolveUseEffectMultiLoad = true
  useEffect(()=>{
    if(!stateHelper.serverIsLive && resolveUseEffectMultiLoad){
      resolveUseEffectMultiLoad = false;
      let id = '';
      if(!locationForHideNotification){
        id = notifications.show({
          loading: true,
          color: 'orange',
          title: 'Checking Server . . .',
          message: 'Please waiting until it\'s live',
          autoClose: false,
          withCloseButton: false,
        });
      }
      (async()=>{
        let server_host = isDev ? isDevServerHost : stateHelper.server_host
        const isLive = await fetchPyServer(server_host);
        // console.log("isLive", isLive);
        let timer = setTimeout(() => {
          clearTimeout(timer);
          if(isLoggedIn && !locationForHideNotification){
            notifications.update({
              id,
              color: 'teal',
              title: 'Server is Live',
              message: 'Enjoy Your Time',
              icon: <IconCheck style={{ width: rem(18), height: rem(18) }} />,
              loading: false,
              autoClose: 3500,
            });
          }
          // setTimeout(()=>{
          //   let refreshPage = window.localStorage.getItem('refreshPage')
          //   if(oneTimeLoad){
          //     oneTimeLoad = false;
          //     if(isDesktopApp){
          //       if(refreshPage === null){
          //         window.localStorage.setItem('refreshPage','true')
          //         navigate('/')
          //       }
          //     } else {
          //       navigate('/refresh', {replace: true})
          //     }
          //   }
          // },5000)
        }, 1500);
        if(isLive){
          setStateHelper({serverIsLive: isLive})
          if(simpleData.downloadTab !== 'Completed'){
            updateSimpleData({downloadTab: 'Completed'})
          }
        }
        resolveUseEffectMultiLoad = true;
      })();
    }
  },[stateHelper.serverIsLive]);

  // if(isDesktopApp){
  //   webContentSend("win:before-quit", ()=>{
  //     let refreshPage = window.localStorage.getItem('refreshPage')
  //     if(refreshPage){
  //       window.localStorage.removeItem('refreshPage')
  //     }
  //   })
  // }

  useEffect(()=> {
    const mn = isDesktopApp ? 30 : 10;
    const timer = setInterval(()=> {
      if(resolveUseEffectMultiLoad && !isDesktopApp){
        setStateHelper({serverIsLive: false})
      }
    }, mn*60*1000)

    return () => {
      clearInterval(timer);
    }
  },[])


  return (
    <></>
  )
}

