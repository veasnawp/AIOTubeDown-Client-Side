import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "@tanstack/react-form"
import React, { useEffect, useState } from "react"
import { useAuth, useLicenseRecord } from "@/contexts"
import { v4 as uuid } from "uuid";
import logger from "@/helper/logger"
import { accessTokenRedirect } from "@/api/blogger/google.connect"
import { ipcToggleColorScheme, useEffectColorScheme } from "./main"
import ToggleDarkMode from "@/components/mantine-reusable/ColorSchemes/ToggleDarkMode"
import { Box, Button, Card, Flex, PasswordInput, ScrollArea, Text, TextInput, Title } from "@mantine/core"
import { IconAt, IconLock, IconUserCircle } from "@tabler/icons-react";
import { AppLogo } from "@/App/logo";
import { CopyrightFooter } from "./Dashboard/dashboard";
import { ContextMenu, useContextMenu } from "@/components/ContextMenu";
import { ipcRendererInvoke, isDesktopApp, webContentSend } from "@/App/electron/ipc";
import { isArray } from "@/utils";


type SVGProps = React.SVGProps<SVGSVGElement>
export const GoogleIcon = ({...props}: SVGProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      fill="none"
      viewBox="0 0 24 24"
      {...props}
      // https://medium.com/
    >
      <g id="google">
        <g id="google-vector" fillRule="evenodd" clipRule="evenodd">
          <path
            id="Shape"
            fill="#4285F4"
            d="M20.64 12.205q-.002-.957-.164-1.84H12v3.48h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615"
          />
          <path
            id="Shape_2"
            fill="#34A853"
            d="M12 21c2.43 0 4.468-.806 5.957-2.18L15.05 16.56c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H3.958v2.332A9 9 0 0 0 12.001 21"
          />
          <path
            id="Shape_3"
            fill="#FBBC05"
            d="M6.964 13.712a5.4 5.4 0 0 1-.282-1.71c0-.593.102-1.17.282-1.71V7.96H3.957A9 9 0 0 0 3 12.002c0 1.452.348 2.827.957 4.042z"
          />
          <path
            id="Shape_4"
            fill="#EA4335"
            d="M12 6.58c1.322 0 2.508.455 3.441 1.346l2.582-2.58C16.463 3.892 14.427 3 12 3a9 9 0 0 0-8.043 4.958l3.007 2.332c.708-2.127 2.692-3.71 5.036-3.71"
          />
        </g>
      </g>
    </svg>
  )
}

export function AuthenticationForm() {
  const colorScheme = useEffectColorScheme();

  const { signUp, signIn, onUserChange } = useAuth();
  const { getLicenseRecords } = useLicenseRecord();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams()
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  const [checkAccount, setCheckAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: ''
    },
    async onSubmit({ value }) {
      setIsLoading(true);
      const profileObj = {...value, userId: "user__" + uuid(), provider: 'credentials'} as UserPayload
      let user = await (
        isLoginPage
        ? signIn(profileObj, async (err) => setCheckAccount(
          err.message === 'User not found' 
          ? "this email is not registered" 
          : err.message === "Incorrect password" 
          ? "wrong password" : "something wrong"
        ))
        : signUp(profileObj)
      )
      logger?.log("user", user);

      setTimeout(()=> {
        setIsLoading(false);
      },1000)
      if (user) {
        if (isRegisterPage && user.email === value.email && user.error) {
          const errorCode = user.error as string;
          if(errorCode.includes("already registered")){
            setCheckAccount('this email already registered!')
          } else if(errorCode.includes("created many accounts")){
            setCheckAccount('Please don\'t created many accounts')
          }
        } else {
          if (user._id && isArray(user.licenses) && user.licenses.length > 0) {
            const licenses = await getLicenseRecords(user._id);
            onUserChange({...user, licenses: licenses || user.licenses});
          }

          setTimeout(()=>{
            const from = searchParams.get('from');
            if(from){
              navigate(from, {replace: true})
            } else {
              navigate('/dashboard', {replace: true})
            }
            ipcToggleColorScheme(colorScheme);
          },500)
          // if(isDesktopApp){
          // } else {
          //   window.location.href = `${window.origin}/dashboard`
          // }
        }
      }
    },
  })


  const handleOAuthClick = (to:"signup"|"login") => {
    // const callbackUrl = `${window.location.origin}/oauth/next/${to}`;
    // const CLIENT_ID = "253304259079-6nscmle6s965c73j7hl0fgapnuk0pu8k.apps.googleusercontent.com";
    // const targetUrl = `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${encodeURIComponent(
    //   callbackUrl
    // )}&include_granted_scopes=true&response_type=token&client_id=${CLIENT_ID}&scope=https%3A//www.googleapis.com/auth/blogger&state=pass-through%20value`;
    // // 'openid%20email%20profile%'
    // window.location.href = targetUrl;
    if(isDesktopApp){
      accessTokenRedirect(to, (oauthUrl)=>{
        ipcRendererInvoke('win:child', oauthUrl, 
          {
            // devTool: isDev ? true : false, 
            modal: false,
            // minimizable: false, maximizable: false, resizable: false,
          },
          // {device: "mobile"}
        )
      })
    } else {
      accessTokenRedirect(to)
    }
  };

  // fetch('https://www.googleapis.com/blogger/v3/blogs/8070105920543249955/posts/', {
  //   method: "POST", 
  //   headers: {
  //     Authorization: 'Bearer',
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     "kind": "blogger#post",
  //     "blog": {
  //       "id": "8070105920543249955"
  //     },
  //     "title": "A new post",
  //     "content": "With <b>exciting</b> content..."
  //   })
  // }).then(res => console.log(res.json()))
  // .catch(err => console.log(err))

  useEffect(() => {
    if(checkAccount)
    setCheckAccount('')
    if(isDesktopApp && ['/login','/register'].some(p => p === location.pathname)){
      webContentSend("get-value:successful-login", ()=> {
        // logger?.log("data",data)
        ipcRendererInvoke("win:child-CLOSE-APP");
        setIsLoading(true);
        setTimeout(()=>{
          setIsLoading(false);
          // navigate('/dashboard', {replace: true});
          window.location.href = window.origin + '/dashboard'
        },1000)
      })
    }
  },[location])


  return (
    <div className="form-inner-content relative z-[2] pt-12">
      <Flex id="headerDrag" justify={'center'} align={'center'} gap={8} mb={16} className="cursor-default w-full">
        <div>
          <AppLogo style={{ height: 34 }}  />
        </div>
        <Title className="text-3xl text-green-600">AIOTubeDown</Title>
      </Flex>
      <Card p={32} className="dark:border-gray-50/15 border border-slate-400/15 backdrop-blur-[2px] dark:backdrop-blur-[6px] bg-slate-400/30 dark:bg-transparent">
        <Box mb={16}>
          <div className="text-2xl text-gray-300">{isLoginPage ? "Log in to your account" : "Create your account"}</div>
          {
            !isLoginPage ?
            <Text c="dimmed" fz='sm'>
              Have an account?{" "}
              <Link to="/login" replace className="text-blue-600 font-semibold">
                Log in now
              </Link>
            </Text>
          : <Text c="dimmed" fz='sm'>
              Don't have an account?{" "}
              <Link to="/register" replace className="text-blue-600 font-semibold">
                Sign Up
              </Link>
            </Text>
          }
        </Box>
        <Box className="relative">
          <div className="space-y-4">
            <Button fullWidth variant={'default'} size="lg" className="border-slate-400/15 hover:bg-slate-50/90 bg-slate-100/80 dark:bg-slate-100/5 dark:hover:bg-slate-50/10 shadow-inner hover:transition-colors select-none"
              onClick={()=> {
                handleOAuthClick(isLoginPage ? "login" : "signup");
              }}
            >
              <div className="flex items-center gap-2">
                <GoogleIcon width={24} height={24} />
                <span>{isLoginPage ? "Login" : "Sign up"} with Google</span>
              </div>
            </Button>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit()
              }}
            >
              {
                !isLoginPage ?
                <form.Field
                  name="name"
                  validators={{
                    onChangeAsyncDebounceMs: 1000,
                    onChangeAsync: ({ value }) => {
                      if(!isLoginPage){
                        if(!value){
                          return "please fill your name"
                        }
                        if(value.length > 40){
                          return "your name is too long"
                        }
                      }
                      if (checkAccount) {
                        setCheckAccount('')
                      }
                    }
                  }}
                  children={(field) => form.getFieldValue('name') !== undefined &&
                    <TextInput
                      label='Full Name'
                      classNames={{
                        label: 'text-gray-300',
                        input: 'placeholder:text-gray-500 dark:border-slate-400/15 dark:focus-within:border-[var(--input-bd-focus)] dark:focus:border-[var(--input-bd-focus)] bg-slate-100/70 dark:bg-transparent',
                      }}
                      placeholder="Your name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      leftSection={<IconUserCircle/>}
                      required
                      size="lg"
                      error={field.state.meta.errorMap.onChange?.toString()}
                    />
                  }
                /> : ''
              }
              <form.Field
                name="email"
                validators={{
                  onChangeAsyncDebounceMs: 1000,
                  onChangeAsync: ({ value }) => {
                    if (!isValidEmail(value)) {
                      return "incorrect email"
                    }
                    if(value.length > 40){
                      return "email is too long"
                    }
                    if (checkAccount) {
                      setCheckAccount('')
                    }
                  }
                }}
                children={(field) =>
                  <TextInput
                    label="Email"
                    classNames={{
                      label: 'text-gray-300',
                      input: 'placeholder:text-gray-500 dark:border-slate-400/15 dark:focus-within:border-[var(--input-bd-focus)] dark:focus:border-[var(--input-bd-focus)] bg-slate-100/70 dark:bg-transparent',
                    }}
                    type="email" placeholder="me@example.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    leftSection={<IconAt/>}
                    required
                    size="lg"
                    error={
                      checkAccount === "error" || checkAccount.includes('email') ?
                        <span className="text-red-500 text-sm">
                          {checkAccount}
                        </span>
                      : field.state.meta.errorMap.onChange?.toString()
                    }
                  />
                }
              />
              <form.Field
                name="password"
                validators={{
                  onChangeAsyncDebounceMs: 1000,
                  onChangeAsync: ({ value }) => {
                    if (value.length < 6) {
                      return "Password must be at least 6 characters long";
                    }

                    if (!/[A-Z]/.test(value)) {
                      return "Password must contain at least one uppercase letter";
                    }

                    if (!/[a-z]/.test(value)) {
                      return "Password must contain at least one lowercase letter";
                    }

                    if (!/[0-9]/.test(value)) {
                      return "Password must contain at least one number";
                    }
                    if (value.length > 60) {
                      return "Password is too long";
                    }
                  }
                }}
                children={(field) =>
                  <div>
                    <PasswordInput
                      label="Password"
                      classNames={{
                        label: 'text-gray-300',
                        input: 'placeholder:text-gray-500 dark:border-slate-400/15 dark:focus-within:border-[var(--input-bd-focus)] dark:focus:border-[var(--input-bd-focus)] bg-slate-100/70 dark:bg-transparent',
                      }}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      leftSection={<IconLock/>}
                      required
                      size="lg"
                      error={
                        checkAccount === "error" || checkAccount.includes('password') ?
                          <span className="text-red-500 text-sm">
                            {checkAccount}
                          </span>
                        : field.state.meta.errorMap.onChange?.toString()
                      }
                    />
                  </div>
                }
              />
              <Button 
                type="submit" 
                fullWidth variant={'default'} size="lg" mt={24}
                className="border-slate-400/15 bg-slate-100 hover:bg-slate-50/90 bg-slate-100/80 dark:bg-slate-100/5 dark:hover:bg-slate-50/10 shadow-inner hover:shadow-sm hover:transition-colors select-none"
                loading={isLoading}
                // onClick={()=> {
                //   form.handleSubmit();
                // }}
              >
                {isLoginPage ? "Login" : "Sign up"}
              </Button>
            </form>
          </div>
        </Box>
        <div className={"absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex items-center h-full w-full".concat(isLoading ? '' : ' hidden')}>
          <div className="absolute z-[1] h-full w-full bg-muted-foreground/50 backdrop-blur-sm"></div>
          <div className="z-[2] flex flex-col items-center w-full">
            <div className="flex flex-row gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 animate-bounce [animation-delay:.7s]"></div>
              <div className="w-4 h-4 rounded-full bg-green-500 animate-bounce [animation-delay:.3s]"></div>
              <div className="w-4 h-4 rounded-full bg-green-500 animate-bounce [animation-delay:.7s]"></div>
            </div>
          </div>
        </div>
      </Card>
      <CopyrightFooter/>
    </div>
  )
}

export function LoginForm() {
  const { showContextMenu, points, onContextMenu } = useContextMenu();

  return (
      <div className="form-wrapper flex items-center w-full h-screen transition-all-child"
        style={{
          // backgroundColor: "#11284b",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundImage: 'linear-gradient(250deg, rgba(130, 201, 30, 0) 0%, #062343 85%), url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8&auto=format&fit=crop&w=1080&q=80)',
          // backgroundSize: "11px 11px",
          // background: 'rgba(29, 31, 32, 0.904) radial-gradient(rgba(255, 255, 255, 0.712) 10%, transparent 1%)',
        }}
        onContextMenu={onContextMenu}
      >
        {/* <Overlay color="#fff" opacity={0.2} zIndex={1} /> */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2">
            <ToggleDarkMode />
            <div id="titleBarOverlay" className={isDesktopApp ? "w-32" : "hidden"}></div>
          </div>
        </div>
        <ScrollArea className='mx-auto min-w-80 sm:min-w-[480px] max-w-[calc(100%-20px)] xxs:max-w-full' h={'calc(100vh - 0px)'} scrollbarSize={0}>
          <AuthenticationForm/>
        </ScrollArea>
        <ContextMenu showContextMenu={showContextMenu} points={points}/>
      </div>
  )
}

export const isValidEmail = (email: string) => {

  // /^\S+@\S+$/ /?_end=([0-9])&_start=([0-9])$/
  return /^(([^<>()[\]\\.,;:#\s@"]+(\.[^<>()[\]\\.,;:#\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    .test(email.toLowerCase())
}