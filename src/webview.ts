import { isDev } from "./api/backend/config";
import { ipcRendererInvoke, isDesktopApp, localServer } from "./App/electron/ipc";
import { sleep } from "./utils";
import { formatDuration } from "./utils/format";

export async function webviewHelper(){
  const server = localServer;
  let rootId = 'root';
  // rootId = 'aio-root';
  const root = document.getElementById(rootId)
  const rootPayment = document.getElementById('__nuxt')
  const paymentTitle = document.querySelector('title')
  const cryptoPayment = location.origin.includes("plisio.net")

  const params = new URLSearchParams(window.location.search.slice(1))
  const isTCodeTTool = params.get("ttcodettool") === "true"


  function logger(message?:any, ...optionalParams: any[]) {
    if(isDev){
      return console.log(message, ...optionalParams);
    }
  }

  if (root){
    return
  } else if (rootPayment && paymentTitle && paymentTitle.textContent?.startsWith('T.Code T.Tool')) {
    rootPayment.setAttribute('style', 'opacity:0;');

    (async () => {
      const currentAppPath = await ipcRendererInvoke("remove-files", `__${'AIOTubeDown'}__.txt`,)
      let appPath = ""
      logger("currentAppPath", currentAppPath)
      if(Array.isArray(currentAppPath) && currentAppPath.length > 0) {
        const filepath = currentAppPath[0].filepath
        if(typeof filepath === "string") {
          appPath = filepath.split("\\").slice(0, -1).join("\\")
        }
      }

      let $khqrDesktop = document.querySelector(".khqr-section > .khqr-desktop");
      let __awaitTimer = {delay: 1, minusTimeExpire: 3}
      if(!$khqrDesktop){
        __awaitTimer = {delay: 3, minusTimeExpire: 5}
      }
      await sleep(__awaitTimer.delay)

      $khqrDesktop = document.querySelector(".khqr-section > .khqr-desktop")
      if($khqrDesktop){
        $(".st-hosted-desktop").each(function(){
          const $this = $(this)
          $this.find(".payway-logo").attr("id","headerDrag").css("padding","0").css("height","40px").css("background","#081b37")
          $this.find(".payway-logo > div").remove()
          $this.find(".footer").remove()
          $this.find(".card-body .form-content").css("border-radius","0")
          .css("background-image", 'url("' + (`${server}/img/tcodettool-logo.png`) + '")')
          .css("background-repeat","no-repeat")
          .css("background-position","center")
          .css("background-size","cover")
          $this.find(".form-content > div:first-child").css("background-image","linear-gradient(180deg,rgba(0,0,0,.129),rgba(0,0,0,.671) 100%)")

          $this.find(".form-content > div > .uk-grid.uk-grid-collapse > div:first-child").remove()
        })

        $(".aba-khqr-form-hosted .khqr-section > .khqr-desktop").each(function() {
          const $this = $(this);
          $this.css("margin-top","40px").css("border-radius","0")
          $this.find("h3.payment-header").text('AIOTubeDown' + " KHQR")
          $this.find(".khqr-content").css("width","300px").css("height","400px").css("background", "rgb(255 255 255 / 80%)");
          $this.find(".merc-khqr-info").css("display","flex").css("align-items","center").css("justify-content","space-between");
          $this.find(".merc-khqr-info > :first-child").css("font-size","12px").css("font-weight","700")
          $this.find("canvas").css("width","250px").css("height","250px")

        })

        rootPayment.setAttribute('style', 'opacity:1;');
        $("#t-code-payment").css("display", "none")

        let expireTime = 60*3 - __awaitTimer.minusTimeExpire
        let isQrCodeScanned = false;
        let timerInterval = setInterval(() => {
          let formatTimer = formatDuration(expireTime)
          expireTime--;

          const $expireSession = document.querySelector('.session-expired .info-content h3')
          const $QrCodeScanned = document.querySelector('.st-qr-form .uk-animation-fade')
          const $paidSession = document.querySelector('.st-success-screen .uk-text-center h4.uk-text-semi-bold')
          if($expireSession || $paidSession || (!isQrCodeScanned && $QrCodeScanned)) {
            logger($expireSession, $paidSession)
            if($expireSession){
              const $innerButton = $(".session-expired .custom-btn");
              $innerButton.html('<button class="uk-width-1-1 uk-button st-button uk-flex uk-flex-center uk-flex-middle uk-button-primary" style="background: #00cdd4;height: 40px;font-size: 20px;font-weight: 600;">Try again</button>')
              $innerButton.on("click", () =>{
                // window.location.reload()
                ipcRendererInvoke("webContents:send", "payment-is-expired", 'session expired')
              })
            } else if($QrCodeScanned) {
              isQrCodeScanned = true
              $('.st-qr-form .uk-text-center').css('background','rgba(255,255,255,0.65)')
              $('.st-qr-form .uk-animation-fade img').css('height','300px')
              $('.st-qr-form .uk-text-center > p').remove()
              const html = $('.st-qr-form .uk-text-center').html()
              $('.st-qr-form .uk-text-center').html(html + '<button class="uk-width-1-1 uk-button st-button uk-flex uk-flex-center uk-flex-middle uk-button-primary" style="background: #00cdd4;height: 40px;font-size: 20px;font-weight: 600;">Try again</button>')
              $('.st-qr-form .uk-text-center > button').on("click", () =>{
                ipcRendererInvoke("webContents:send", "payment-is-expired", 'qr code scanned')
              })
            } else if($paidSession) {
              $('.st-success-screen .uk-text-center').attr('style','height: 500px; width: 340px; padding-top: 80px; display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.65);')
              .find('img').css('height','200px')
              $paidSession.setAttribute("style", "margin-top: 80px")
              ipcRendererInvoke("webContents:send", "payment-is-paid", $paidSession.outerHTML)
              // ipcRendererInvoke("win:child-CLOSE-APP")
            }
            if(!$QrCodeScanned)
            clearInterval(timerInterval)
          }
          else {
            logger(formatTimer, expireTime)
          }
        }, 1000);

      };
      return;
    })();

  } else if (cryptoPayment && location.protocol.startsWith("/invoice/") && isTCodeTTool) {
    (async () => {
      $("body").css("overflow","hidden");
      $("body > .wrap").each(function(){
        const $this = $(this);
        $this.css("padding-top","40px").css("background","#081b37");
        $this.append(`<div id="headerDrag" style="position:absolute;top:0;left:0;height:40px;width:100%"></div>`);
        $this.find("label.switch.theme-switcher").remove();
        $this.find(".invoice__header-top").remove();
        $this.find(".invoice-info__shop-name").text(" AIOTubeDown ");
        logger($this.find(".step-expired a.step-expired__confirm"))
        // $this.find(".step-expired a.step-expired__confirm").remove();
      })
    })();
  } else {
    const isTCodeTTool = params.get("ttcodettool") === "true"
    const isKuaishou = params.get("resolveLink") === "kuaishou"
    const isProfile = params.get("linkType") === "profile"
    const isVideo = params.get("linkType") === "video"

    const body = window.document.body
    if(isTCodeTTool){
      if(isKuaishou){
        body.setAttribute("style", "")
        $('html').css('max-width','unset').css('font-size','unset')
        $('#app').css('opacity','0').css('visibility','hidden').css("zoom", "0.7")
        $('#t-code-payment .tctt-Paper-root').attr('style','display:flex;align-items:center;justify-content:center')

        const root = document.querySelector(".aio-video-downloader-login-wrapper")
        if(root){
          $('#app').css('opacity','0').css('visibility','hidden').css("zoom", "1")
          await sleep(1000)

          root.innerHTML = '<div style="height:100%"><div style="margin-right: auto; margin-left: auto; width: 26.25rem; max-width: 100%; height: 100%; display: flex; -webkit-box-pack: center;display:flex;align-items:center;justify-content:center">'+
          `<button id="get-video-info" style="padding:8px;">GET VIDEO INFO</button>`
          +'</div></div>'

          $("#get-video-info").on("click", async function(){
            const headers = {
              'Accept': '*/*',
              'Accept-Encoding': 'gzip, deflate, br',
              'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
              'Connection': 'keep-alive',
              'Content-Type': 'application/json'
            }
            const payload = {'eid': '3x36h86rp4kvnzs', 'count': 30, 'pcursor': '1.707531129541E12'}
            const api = 'https://c.kuaishou.com/rest/wd/feed/profile?kpn=KUAISHOU&__NS_sig3=564602313f371060630b0809334d9d4cfe230474171715151a1b1802'
            if(isProfile){
              let feed = [];
              let count = 0;
              while (true){
                count++;
                if (count > 6){
                  break;
                }
                logger("count: " + count)
                const resData = await new Promise((resolve, reject) => {
                  fetch(api, { method: 'POST', headers, body: JSON.stringify(payload) })
                  .then(response => response.text())
                  .then(data => resolve(data))
                  .catch(error => reject(error.message));
                });
                const parseData = JSON.parse(resData as any);
                if(parseData.feed && typeof parseData.feed === 'object' && Array.isArray(parseData.feed)){
                  feed = parseData.feed
                  break;
                }
              }

              logger("success response data profile", feed);
            } else if(isVideo){
              const payload = {
                'fid': '0',
                'shareToken': 'X-4LdStDoOWOP17b',
                'shareObjectId': '5227553393333879226',
                'shareMethod': 'TOKEN', 'shareId': '17814525453396',
                'shareResourceType': 'PHOTO_OTHER',
                'shareChannel': 'share_copylink',
                'kpn': 'KUAISHOU', 'subBiz': 'BROWSE_SLIDE_PHOTO',
                'env': 'SHARE_VIEWER_ENV_TX_TRICK',
                'h5Domain': 'v.m.chenzhongtech.com',
                'photoId': '3x6r4kmmmjiv2ws',
                'isLongVideo': 'true'
              }

              const api = 'https://v.m.chenzhongtech.com/rest/wd/photo/info?kpn=KUAISHOU&__NS_sig3=8c9cd8eb759dcbbab6d1d2d3bc6072b96189dfaecdcdcfcfc0c1c2d8'
              let  resData = await new Promise((resolve, reject) => {
                fetch(api, { method: 'POST', headers, body: JSON.stringify(payload) })
                .then(response => response.json())
                .then(data => resolve(data))
                .catch(error => reject(error.message));
              });

              logger("success response data video", resData);
            }
          })

        }
      }
    }
  }
}