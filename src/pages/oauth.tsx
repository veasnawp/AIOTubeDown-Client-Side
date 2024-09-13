import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts"
import { v4 as uuid } from "uuid";
import logger from "@/helper/logger"
import { getAccessToken, getAuthCode } from "@/api/blogger/google.connect";
import { Card, Flex, Title } from "@mantine/core";
import { AppName } from "@/App/config";
import { AppLogo } from "@/App/logo";
import { useEffectColorScheme } from "./main";

export function GoogleOAuth({
  wLocation = {} as Location,
  authCode = undefined as string | undefined,
  isLoginPage=true
}) {
  const colorScheme = useEffectColorScheme();
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegisterPage = !isLoginPage

  const hash = wLocation.hash || ''
  const search = wLocation.search || ''

  let resolveMultiLoad = true;
  useEffect(() => {
    if(resolveMultiLoad){
      resolveMultiLoad = false
      setTimeout(()=> {
        resolveMultiLoad = true
      },1000)
      ;(async () => {
        // logger?.log(wLocation, '\nhash', hash, '\nsearch', search)
        const accessTokenRegex = /access_token=([^&]+)/;
        const isMatch = hash.match(accessTokenRegex);
    
        if (isMatch && isMatch.length > 0) {
          const accessToken = isMatch[1];
          logger?.log("accessToken", isMatch);
          if(!hash.includes('www.googleapis.com/auth/userinfo')){
            return navigate('/login')
          }
          else {
            try {
              const res = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`)
              var data = await res.json();
              if(data.error){
                return navigate('/login')
              }

              logger?.log("data from token", data)

              const profileObj = data as UserPayload & GoogleUserInfo;
              profileObj.userId = "user__" + uuid()
              profileObj.avatar = profileObj.picture
              profileObj.provider = 'oauth';
              profileObj.withSocial = true;
              
              let isError = false;
              let user = await (
                isLoginPage ? signIn(profileObj, async(err)=> {
                  logger?.log("error",err)
                  if(err.message === 'User not found'){
                    isError = true;
                    await signUp(profileObj);
                  }
                }) : signUp(profileObj)
              );

              logger?.log("user",user)

              if(!user && !isError){
                return navigate('/login')
              }

              const userExists = isRegisterPage && user && user.error && user.email === profileObj.email
              if(userExists){
                user = await signIn(profileObj)
              }

              if(user){
                window.location.href = window.origin
              }
            } catch (error) {
              logger?.log("error", error)
              return navigate('/login')
            }
          }
        } 
        else {
          if(!isRegisterPage && authCode) {
            const code = authCode
            getAccessToken({
              code,
              async onSuccess(data) {
                const accessToken = data.access_token
                try {
                  localStorage.setItem('bloggerToken', JSON.stringify(data))
                  const res = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`)
                  var userData = await res.json();
                  if(userData.error){
                    logger?.log("error get user data", userData.error)
                    return navigate('/login')
                  }
  
                  logger?.log("data from token with Blogger Connection", userData)
  
                  if(userData){
                    window.location.href = window.origin
                  }
                } catch (error) {
                  logger?.log("error catch", error)
                  return navigate('/login')
                }
              },
              onError(err) {
                logger?.log('Error', err);
                navigate('/login')
              },
            })
          } else {
            navigate('/login')
          }
        }
      })();
    }
  }, []);


  return (
    <div className="flex items-center w-full h-screen transition-all-child">
      <Card className="mx-auto min-w-80 sm:min-w-[480px] space-y-4">
        <Flex justify={'center'} align={'center'} gap={8} mb={16} className="cursor-default w-full">
          <div>
            <AppLogo style={{ height: 34 }} darkMode={colorScheme === 'dark'} />
          </div>
          <Title className="text-3xl text-green-600">AIOTubeDown</Title>
        </Flex>
        <div className="flex flex-col items-center">
          <div className="flex flex-row gap-2">
            <div className="w-4 h-4 rounded-full bg-slate-400 animate-bounce [animation-delay:.7s]"></div>
            <div className="w-4 h-4 rounded-full bg-slate-400 animate-bounce [animation-delay:.3s]"></div>
            <div className="w-4 h-4 rounded-full bg-slate-400 animate-bounce [animation-delay:.7s]"></div>
          </div>
        </div>
      </Card>
    </div>
  )
}
