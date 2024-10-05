import { isDesktopApp, machineId } from "@/App/electron/ipc";
import { useAuth, useLicenseRecord } from "@/contexts";
import { getUserSession, removeUserStorage } from "@/contexts/auth";
import logger from "@/helper/logger";
import { isArray } from "@/utils";
import { decryptionCryptoJs, encryptionCryptoJs } from "@/utils/scripts/crypto-js";
import { useLocalStorage } from "@mantine/hooks";
import { useEffect } from "react";
import { v4 as uuid } from "uuid";
import { addDays, getActivationDays } from "./Products/data";
import { isLocationForHideNotification } from "./main";


export const isFirstUserOnDesktop = ()=>{
  return isDesktopApp && window?.localStorage?.getItem('__first__')
}
export const isFirstUserTrialExpired = ()=>{
  const isFirstUser = isFirstUserOnDesktop();
  let isTrialExpired = true;
  let expireDays = 0
  if(isFirstUser){
    try {
      const trialExpiredDate = isFirstUser;
      const expiresAt = decryptionCryptoJs(JSON.parse({trialExpiredDate}.trialExpiredDate))?.expiresAt
      const currentDate = new Date()
      isTrialExpired = currentDate.getTime() > new Date(expiresAt).getTime();
      expireDays = getActivationDays(currentDate, new Date(expiresAt))
    } catch {}
  }
  return {isTrialExpired, expireDays};
}

export const useCheckLoggedInSession = () => {
  const { isLoggedIn, user, onUserChange, signIn, signUp, logOut, setStateHelper } = useAuth();
  const { getLicenseRecords } = useLicenseRecord();

  const [authPassword, setAuthPassword] = useLocalStorage({
    key: "__auth__", defaultValue: window?.localStorage?.getItem('__auth__'), 
    getInitialValueInEffect: true
  })
  const [trialExpiredDate, setTrialExpiredDate] = useLocalStorage({
    key: "__first__", defaultValue: window?.localStorage?.getItem('__first__'), 
    getInitialValueInEffect: true
  })
  if(!isDesktopApp && window?.localStorage?.getItem('__first__')){
    window?.localStorage?.removeItem('__first__')
  }

  let resolveUseEffectMultiLoad = true;
  useEffect(()=>{
    const locationForHideNotification = isLocationForHideNotification(window.location as any)
    if(resolveUseEffectMultiLoad && !locationForHideNotification){
      resolveUseEffectMultiLoad = false;
      useEffectFunc();
    }
  },[])

  async function useEffectFunc() {
    if(isDesktopApp && machineId){
      let session: UserPayload | undefined
      if(authPassword){
        session = await getUserSession();
        logger?.log("session", session)
        if(session && !session?.error){
          const user = session;
          onUserChange(session);
          if (user._id && isArray(user.licenses) && user.licenses.length > 0) {
            const licenses = await getLicenseRecords(user._id);
            onUserChange({...user, licenses: licenses || user.licenses});
          }
          if(trialExpiredDate){
            try {
              const expiresAt = decryptionCryptoJs(JSON.parse({trialExpiredDate}.trialExpiredDate))?.expiresAt
              const isTrialExpired = new Date().getTime() > new Date(expiresAt).getTime();
              setStateHelper({isTrialExpired})
              if(isTrialExpired){
                window?.localStorage?.removeItem('__first__')
              }
            } catch {}
          }
        } else {
          session = undefined
        }
      }
      if(!session){
        const email = `${machineId}@aiotubedown.com`;
        const password = `@Aio${machineId.split('-')[0]}1688`;
        const value = {
          name: '',
          email,
          password,
        }
        const profileObj = {...value, userId: "user__" + uuid(), provider: 'credentials'} as UserPayload
        let user = await (
          authPassword
          ? signIn(profileObj, async (err) => {
            logger?.log("signIn error", err)
          })
          : signUp(profileObj)
        )
        logger?.log("user", user);
  
        if (user) {
          let isSignIn = false;
          if (!authPassword && user.email === value.email && user.error) {
            const errorCode = user.error as string;
            if(errorCode.includes("already registered")){
              user = await signIn(profileObj, async (err) => {
                logger?.log("signIn error", err)
              })
              isSignIn = true
            } else if(!window?.localStorage?.getItem('__first__')) {
              setTimeout(()=>{
                const encodedExpiredDate = encryptionCryptoJs({expiresAt: addDays(7)})
                setTrialExpiredDate(encodedExpiredDate)
              },1000)
            }
          } else {
            isSignIn = true
          }
  
          if(isSignIn && user) {
            setAuthPassword('yes')
            if (user._id && isArray(user.licenses) && user.licenses.length > 0) {
              const licenses = await getLicenseRecords(user._id);
              onUserChange({...user, licenses: licenses || user.licenses});
            }
  
            // setTimeout(()=>{
            //   const from = searchParams.get('from');
            //   if(from){
            //     navigate(from, {replace: true})
            //   } else {
            //     navigate('/dashboard', {replace: true})
            //   }
            //   ipcToggleColorScheme(colorScheme);
            // },500)
          }
        }
      }
    } 
    else {
      const session = await getUserSession();
      logger?.log("session", session, isLoggedIn)
      if(session && !session?.error){
        const user = session;
        onUserChange(session);
        if (user._id && isArray(user.licenses) && user.licenses.length > 0) {
          const licenses = await getLicenseRecords(user._id);
          onUserChange({...user, licenses: licenses || user.licenses});
        }
      } else {
        if(!['/register','/login'].some(v => window?.location?.pathname.startsWith(v))){
          logOut();
        } else {
          onUserChange({});
          removeUserStorage();
        }
      }
    }
  }
}