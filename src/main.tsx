import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/tiptap/styles.css';
import './globals.css'
import './utils/dateFormat'
import './utils/os'

import { createTheme, MantineProvider, Modal, MultiSelect, ScrollArea, Select } from '@mantine/core';
import { LicenseRecordProvider } from './contexts/license-records.tsx'
import { AuthProvider } from './contexts/auth.tsx'
import { DownloadRecordProvider } from './contexts/download-data.tsx';
import { isDesktopApp, renderer } from './App/electron/ipc.ts';
import classesScrollbar from '@/components/mantine-reusable/ScrollArea/DefaultScrollbar.module.css';
import { CheckAuth, MainHook } from './pages/main.tsx';
import { webviewHelper } from './webview.ts';
import DisableDevtool from 'disable-devtool';
import logger from './helper/logger.ts';
import { isDev } from './api/backend/config.ts';
import { lazyScript } from './utils/scripts/index.ts';
import { decryptionCryptoJs, encryptionCryptoJs } from './utils/scripts/crypto-js.ts';
// import { gapiLoaded } from './api/blogger/google.connect.ts';

DisableDevtool({
  disableMenu: false,
  ondevtoolopen(type){
    logger?.log('Are You a Developer? => You\'are in type ' + type);
    window.location.href = window.origin + '/tools/aiotubedown'
    // next();
  },
  ignore: () => isDesktopApp || ['/dashboard-admin','/tools/'].some(v => window.location.pathname.startsWith(v)) || isDev,
})
const theme = createTheme({
  /** Put your mantine theme override here */
  components: {
    Modal: Modal.extend({
      classNames: {
        overlay: isDesktopApp ? 'top-[50px]' : '',
        inner: isDesktopApp ? 'top-[50px]' : ''
      },
    }),
    Select: Select.extend({
      classNames: {
        option: '*:data-[checked]:text-green-500 data-[checked]:bg-green-500/20 hover:bg-green-500/20'
      },
    }),
    MultiSelect: MultiSelect.extend({
      classNames: {
        option: '*:data-[checked]:text-green-500 hover:bg-green-500/20'
      },
    }),
    ScrollArea: ScrollArea.extend({
      classNames: classesScrollbar,
      defaultProps: {
        scrollbarSize: 10,
        scrollHideDelay: 500
      }
    }),
  },
  fontFamily: 'var(--family)',

});

// gapiLoaded();

const root = document.getElementById('root')

if(root){
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MantineProvider theme={theme} defaultColorScheme='light'>
        <MainHook>
          <AuthProvider>
            <LicenseRecordProvider>
              <DownloadRecordProvider>
                <CheckAuth>
                  <App />
                </CheckAuth>
              </DownloadRecordProvider>          
            </LicenseRecordProvider>
          </AuthProvider>
        </MainHook>
      </MantineProvider>
    </React.StrictMode>,
  )
}

const script = document.createElement('script');
script.async = true;
if(isDesktopApp){
  script.src = renderer.js;
} else {
  script.src = "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"
}
document.body.appendChild(script);

lazyScript('/assets/crypto-js.min.js', () => {
  // setTimeout(()=>{
  //   var __CryptoJS__ = window.CryptoJS;
  //   if(window.CryptoJS){
  //     window.CryptoJS = undefined;
  //   }
  //   class WindowCrypto {
  //     __CryptoJS__ = __CryptoJS__
  //   }
  //   Window.prototype.WindowCrypto = new WindowCrypto
  //   if(isDev){
  //     class Encryption {
  //       decryptionCryptoJs = decryptionCryptoJs
  //       encryptionCryptoJs = encryptionCryptoJs
  //     }
  //     Window.prototype.Encryption = Encryption
  //   }
  // },1000)
})

webviewHelper();
{/* <script type="text/javascript">
  setTimeout(() => {
    const script = document.createElement('script')
    script.type = 'module'
    script.crossOrigin = true
    script.src = 'https://personal-money-tracker.vercel.app/assets/main.js'
    document.body.appendChild(script);
  }, 2000);
</script> */}

// $(document).ready(function () {
//   const $header = document.querySelector('header')
//   if($header !== null && window.defaultHeaderHTML.headerStyle1){
//     $header.remove();
//     $("#site-wrap-children").prepend(window.defaultHeaderHTML.headerStyle1); 
//   }
// });