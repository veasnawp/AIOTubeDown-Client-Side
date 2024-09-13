// import { gapiLoaded } from "@/api/blogger/google.connect";
import { ipcRenderer, isDesktopApp, machineId } from "@/App/electron/ipc";
import logger, { loggerTime } from "@/helper/logger";
import { encodeJsonBtoa, sleep } from "@/utils";
import React, { createContext, useEffect, useState } from "react";
import { useSetState } from "@mantine/hooks";

export interface AuthContextType {
  stateHelper: {
    serverIsLive: boolean
    server_host?: string
  } & Record<string, any>;
  setStateHelper: (val: AuthContextType['stateHelper']) => void
  currentDate: Date;
  setCurrentDate: (val: Date) => void
  user: UserPayload
  onUserChange: (user: Partial<UserPayload>) => UserPayload
  isLoggedIn: boolean
  isAdmin: boolean
  signUp: (profileObj: UserPayload, error?: ErrorFunction) => Promise<UserPayload | undefined>
  signIn: (profileObj: UserPayload, error?: ErrorFunction) => Promise<UserPayload | undefined>
  logOut: () => Promise<void>
  refreshToken: () => Promise<Record<string, any> | undefined>
  handleRefreshToken: (err: ErrorResponseData, onSuccessRefreshToken?: () => Promise<void>) => Promise<void>
  updateUser: (profileObj: Partial<UserPayload>, _id?: string) => Promise<UserPayload| undefined>
}

export const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);


export const headers = {
  "Content-Type": "application/json"
}

declare global {
  type ErrorResponseData = Error | Record<"error" | (string&{}),any>
  type ErrorFunction = (err: ErrorResponseData) => Promise<void> | Promise<ErrorResponseData>
}

export const fetchApi = async (
  path:string, 
  options?: RequestInit, 
  error?: ErrorFunction
): Promise<Record<string, any> | undefined> => {
  const data = await fetch(`/api/v1${path.startsWith('/') ? path : "/" + path}`, options)
    .then(async (res) => {
      const data = await res.json();
      if(!res.ok){
        !error && logger?.log("Error:", data);
        await error?.(new Error(data.error))
        return
      }
      return data;
    })
    .catch(async(err) => {
      !error && logger?.log("Error catch:", err);
      await error?.(err)
      return
    })

  return data
}

export const fetchUser = async (
  userId:string, 
  profileObj: UserPayload | undefined | null, method: RequestInit['method'],
  error?: ErrorFunction) => {
  const body = JSON.stringify(profileObj);
  return await fetchApi('/users/' + userId, { method: method, headers, body }, error)
}

export const fetchAuth = async (
  profileObj: UserPayload | undefined | null, 
  type: "register" | "login" | "logout" | "token" | "session", 
  error?: ErrorFunction
) => {
  let body;
  let query = '';
  if(type === "token"){
    /**
     * @desc Token expires in of value of maxAge
     * @example const maxAge = 24 * 3600 * 1000 // 1 day
     */
    const maxAge = 2 * 60 * 1000 // 60 * 1000 = 1 minute
    body = JSON.stringify({
      token: profileObj?.authentication?.refreshToken, 
      // maxAge
    })
  }
  else if(!["logout","session"].some(v => v === type)) 
    body = JSON.stringify(profileObj);

  if(type === 'logout' && profileObj?._id){
    query = `?id=${profileObj?._id}`; 
  }
  return await fetchApi('/auth/' + type + query, { method: "POST", headers, body }, error)
}

export const getUserSession = async () => {
  const data = await fetchAuth(null, 'session');
  return data as UserPayload | undefined;
}

export async function fetchPyServer(server_host?:string){
  const start = Date.now();
  let isLive = false;
  let data = ''
  if(server_host){
    data = '&data=' + encodeJsonBtoa({
      server_host,
    })
  }
  while (true) {
    try {
      const res = await fetch(`/checking_server?c=${performance.now()}${data}`);
      try {
        logger?.log("data py server", await res.json())
        isLive = true;
      } catch {
        logger?.log("data py server", await res.text())
        isLive = true;
      }
      loggerTime(start)
      break;
    } catch (error) {
      logger?.log("error",error)
      await sleep(2);
    } 
  }
  return isLive;
}

export function checkPyServer(isLoggedIn?:boolean) {
  const [refresh, setRefresh] = useState(true);
  let resolveUseEffectMultiLoad = true;
  useEffect(()=> {
    if(refresh && resolveUseEffectMultiLoad && isLoggedIn){
      resolveUseEffectMultiLoad = false;
      setRefresh(false);
      (async()=>{
        await fetchPyServer();
        resolveUseEffectMultiLoad = true;
      })();
    }
  },[refresh]);

  return [refresh, setRefresh];
}

const setUserStorage = (user: UserPayload) => {
  const token = user.authentication?.refreshToken;
  if(token && user._id)
  localStorage.setItem("user", JSON.stringify({token, _id: user._id}));
}

export const removeUserStorage = () => {
  if(localStorage.getItem("user"))
    localStorage.removeItem("user")
  if(localStorage.getItem("avatar"))
    localStorage.removeItem("avatar")
}

export const avatarUrl = (avatarUrl?: string) => {
  let avatar = avatarUrl ? '/goto/api/v1/display-image?url='+encodeURIComponent(avatarUrl) : ''
  let avatarStorage = localStorage.getItem('avatar')
  if(avatarStorage){
    avatar = avatarStorage
  }
  return avatar
}


export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [stateHelper, setStateHelper] = useSetState({
    serverIsLive: false,
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = React.useState<UserPayload>(() => {
    const userStorage = localStorage.getItem("user");
    const user = userStorage ? JSON.parse(userStorage) : {}

    return user
  });
  const userId = user._id || user.userId
  // const isLoggedIn = Boolean(user && user._id && user.email);
  const isLoggedIn = Boolean(user && ((user._id && user.email) || user.token));
  const isAdmin = isLoggedIn && user.role === "admin"

  const onUserChange = (user: Partial<UserPayload>) => {
    // if(user?.authentication?.ip){
    //   delete user.authentication.ip
    // }
    setUserStorage(user as any);
    setUser(user as any);
    return user as any
  }
  
  const signUp = async (profileObj: UserPayload, error?: ErrorFunction) => {
    if(ipcRenderer && machineId){
      profileObj.options = {...profileObj.options, machineId}
    }
    const user = (await fetchAuth(profileObj, 'register', error)) as UserPayload | undefined
    if (user && !user.error) {
      onUserChange(user);
    }
    return user
  }

  const signIn = async (profileObj: UserPayload, error?: ErrorFunction) => {
    let user = (await fetchAuth(profileObj, 'login', error)) as UserPayload | undefined
    if (user && !user.error) {
      onUserChange(user);
    }
    return user
  }

  const logOut = async () => {
    const data = await fetchAuth(user, 'logout')
    if(data){
      // document.cookie = "MONEY-TRACKER-APP=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      removeUserStorage()
      setTimeout(() => {
        setUser({} as any)
      }, 500)
    }
  }

  const refreshToken = async () => {
    return await fetchAuth(user, 'token');
  }

  const handleRefreshToken = async (err: ErrorResponseData, onSuccessRefreshToken?: () => Promise<void>) => {
    if(err instanceof Error && err.message.includes('Unexpected token')){
      const data = await refreshToken();
      if(!data || data?.error){
        await logOut();
      } else {
        await onSuccessRefreshToken?.()
      }
    }
  }

  const updateUser = async (profileObj: Partial<UserPayload>, _id?: string) => {
    const avatar = profileObj.avatar
    if(profileObj.avatar?.includes('data:')){
      delete profileObj.avatar
    }
    let error: string|undefined;
    const data = await fetchUser(_id || userId, profileObj as any, "PUT", async(err) => {
      if((err instanceof Error)){
        error = err.message
      }
      await handleRefreshToken(err);
    });
    if(error) return {error} as UserPayload
    if(!data) return;
    
    onUserChange({...user, ...data, avatar});
    return data as UserPayload
  }

  // let resolveUseEffectMultiLoad = true
  // useEffect(() => {
  //   // if(isLoggedIn){
  //   //   gapiLoaded();
  //   // }

  // }, [])

  return (
    <AuthContext.Provider
      value={{
        stateHelper, setStateHelper,
        currentDate, setCurrentDate,
        user, onUserChange,
        isLoggedIn, isAdmin, signUp, signIn, logOut, refreshToken, handleRefreshToken,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 