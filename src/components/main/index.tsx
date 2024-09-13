import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { BadgeDollarSign, CircleUser, DollarSign, Pencil, Trash2, Upload, Wallet } from 'lucide-react'
import { useAuth } from '@/contexts'
import { cn } from '@/lib/utils'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { DrawerSheet } from '../sheet'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { useForm } from '@tanstack/react-form'
import { useRef, useState } from 'react'
import Tooltip from '../tooltip'
import { Box } from '../box'

interface MainActivePageProps {
  name?: string
  className?: string
  renderBelowContent?: () => React.ReactNode
  children?: React.ReactNode
}

export default function MainActivePage({
  name,
  className,
  renderBelowContent,
  children
}: MainActivePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditProfilePage = location.pathname === '/settings/profile'
  const { user, logOut, updateUser } = useAuth();

  const [usernameExists, setUsernameExists] = useState(false);

  const form = useForm({
    defaultValues: {
      name: user.name || '',
      username: user.username || '',
      email: user.email,
      userId: user.userId,
      avatar: user.avatar,
    },
    async onSubmit({ value }) {
      for await (const _ of Array(2).fill(0)){
        const _user = await updateUser(value);
        if(_user) {
          setUsernameExists(!!_user.error || false);
          if(!_user.error){
            navigate('/', {replace: true})
          }
          break;
        };
      }
    }
  })

  const inputFile = useRef<HTMLInputElement>(null)

  const Avatar = ({ avatar = user.avatar, width = 28, height = 28, className = "" }) => !avatar
    ?
    <CircleUser className={cn("h-6 w-6 text-muted-foreground", className)} />
    :
    <picture>
      <source srcSet={avatar || "/img/placeholder-user.webp"} />
      <img
        src={avatar || "/img/placeholder-user.webp"}
        alt={avatar ? user.name : "user avatar"}
        width={width} height={height}
        className={cn('overflow-hidden rounded-full select-none', className)}
      />
    </picture>

  return (
    <>
    <div className={`${name || 'home'}-container `.concat('max-w-[600px] mx-auto p-6')}>
      <div className={`${name || 'home'}-wrapper `.concat('flex flex-col gap-4')}>
        <header className='sticky top-1 z-30 h-14 flex justify-between items-center gap-4 border-b rounded-md bg-blue-100 sm:static px-2 shadow-md'>
          <div className='flex items-center'>
            <div className='relative flex items-center mr-2 p-2 rounded-full border-2 border-green-600/50 h-10 w-10 shadow-md'>
              <Wallet className='absolute left-1 z-[2] text-green-600 -mt-1' />
              <BadgeDollarSign size={18} className='absolute z-[1] text-slate-700' />
              <Wallet className='relative -right-0.5 text-red-600/70 -mb-1.5' />
            </div>
            <div className='relative grow border-y border-dashed border-muted-foreground *:inline-block *:font-semibold group *:hover:animate-wave *:transition-transform cursor-pointer'>
              <Link to="/" className='absolute top-0 w-full h-full z-[1] opacity-0 !animate-none'>
                <h1 className="text-center text-[15px] font-bold ">MONEY TRACKER</h1>
              </Link>
              <span className='text-green-600 group-hover:Delay-[calc(.1s_*_1)]'>M</span>
              <span className='text-gray-900 group-hover:Delay-[calc(.1s_*_2)]'>O</span>
              <span className='text-pink-600 group-hover:Delay-[calc(.1s_*_3)]'>N</span>
              <span className='text-slate-400 group-hover:Delay-[calc(.1s_*_4)]'>E</span>
              <span className='text-blue-600 group-hover:Delay-[calc(.1s_*_5)] mr-1'>Y</span>
              <span className='text-green-600 group-hover:Delay-[calc(.1s_*_6)]'>T</span>
              <span className='text-gray-900 group-hover:Delay-[calc(.1s_*_7)]'>R</span>
              <span className='text-pink-600 group-hover:Delay-[calc(.1s_*_8)]'>A</span>
              <span className='text-slate-400 group-hover:Delay-[calc(.1s_*_9)]'>C</span>
              <span className='text-blue-600 group-hover:Delay-[calc(.1s_*_10)]'>K</span>
              <span className='text-red-600 group-hover:Delay-[calc(.1s_*_11)]'>E</span>
              <span className='text-green-600 group-hover:Delay-[calc(.1s_*_12)]'>R</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={null} size={null} className={"rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 bg-primary-foreground hover:bg-muted p-1 shadow-md"}>
                {/* <CircleUser className="h-5 w-5" /> */}
                <Avatar />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className='min-w-56'>
              <DropdownMenuLabel className='bg-blue-100/60 -mx-1 -mt-1'>
                <div className='flex items-center'>
                  <div className='p-1 mr-2'>
                    <Avatar />
                  </div>
                  <div className="space-y-1 grow">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    {
                      user.username &&
                      <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
                    }
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className='mt-0 h-0.5' />
              <DropdownMenuItem onClick={() => navigate('/settings/profile', { replace: true })}>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='hover:text-red-700 focus:text-red-700 hover:bg-red-100 focus:bg-red-100 cursor-pointer'
                onClick={() => logOut()}
              >Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className={cn('flex flex-col', className)}>
          {children}
        </main>
        <DrawerSheet
          open={isEditProfilePage}
          onOpenChange={(open) => {
            if (!open) {
              navigate('/', { replace: true })
            }
          }}
          contentProps={{
            className: ' overflow-y-auto'
          }}
          content={({ Header, Title }) => {
            return (
              <>
                <Header>
                  <Title>Your Profile</Title>
                  {/* <Desc>
                  Make changes to your profile here. Click save when you're done.
                </Desc> */}
                </Header>
                <div className="grid gap-4 py-4">
                  <form
                    className="grid gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <form.Field
                      name="name"
                      children={(field) =>
                        <div className="grid gap-2">
                          <Label>Your Name</Label>
                          <Input id="name" type="text" placeholder="Your name"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            required
                            className="focus-visible:ring-slate-300"
                          />
                        </div>
                      }
                    />
                    <form.Field
                      name="username"
                      children={(field) =>
                        <div className="grid gap-2">
                          <Label>Username</Label>
                          <Input id="username" type="text" placeholder="Your name"
                            value={field.state.value}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                              if (usernameExists) {
                                setUsernameExists(false);
                              }
                            }}
                            required
                            className="focus-visible:ring-slate-300"
                          />
                          {
                            usernameExists &&
                            <p className="text-red-500 text-sm">
                              Username already exists
                            </p>
                          }
                        </div>
                      }
                    />
                    <form.Field
                      name="email"
                      children={(field) =>
                        <div className="grid gap-2">
                          <Label>Email</Label>
                          <Input id="email" type="email"
                            value={field.state.value}
                            readOnly required disabled
                            className=" disabled:border-muted-foreground !cursor-default"
                          />
                        </div>
                      }
                    />
                    <form.Field
                      name='avatar'
                      children={(field) => {
                        const avatar = field.state.value;
                        return (
                          <div className="grid gap-2">
                            <Label>Profile picture</Label>
                            <Input id="avatar" type="file"
                              ref={inputFile}
                              onChange={async (e) => {
                                const blob = e.target.files?.[0] as Blob
                                if (!blob) return;

                                const base64 = await new Promise((resolve, reject) => {
                                  try {
                                    const reader = new FileReader();
                                    reader.onload = function () {
                                      const dataUrl = reader.result as string | null;
                                      const base64 = dataUrl?.split(',')[1];
                                      resolve(base64);
                                    };
                                    reader.readAsDataURL(blob);
                                  } catch {
                                    reject(null)
                                  }
                                });
                                if (base64) {
                                  const avatarUrl = `data:image/png;base64,${base64}`
                                  field.handleChange(avatarUrl);
                                }
                              }}
                              className="hidden"
                            />
                            <div className='flex'>
                              <div className='flex flex-col gap-4 items-center justify-center'>
                                <Avatar avatar={avatar} className='w-20 h-20 sm:w-24 sm:h-24 select-text' />
                                <div className='flex gap-2'>
                                  <Tooltip tooltip={"Upload a photo"}>
                                    <Box variant={null} size={null} className={"rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 bg-slate-400/70 hover:bg-slate-300 p-1 shadow-inset cursor-pointer"}
                                      onClick={() => {
                                        inputFile.current?.click()
                                      }}
                                    >
                                      <Upload />
                                    </Box>
                                  </Tooltip>
                                  <Tooltip tooltip={"Remove photo"}>
                                    <Box variant={null} size={null} className={"rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 text-destructive bg-red-200 hover:bg-slate-300 p-1 shadow-inset cursor-pointer"}
                                      onClick={() => {
                                        form.setFieldValue('avatar', '')
                                      }}
                                    >
                                      <Trash2 />
                                    </Box>
                                  </Tooltip>
                                </div>
                              </div>
                              <div className='grow'></div>
                            </div>
                          </div>
                        )
                      }
                      }
                    />
                  </form>
                </div>
                <Button type="submit" className="bg-green-600 hover:bg-green-600/90 shadow-inner hover:shadow-sm hover:transition-colors select-none"
                  onClick={form.handleSubmit}
                >
                  Update profile
                </Button>
                {/* <Close asChild>
                <Button type="submit" className='bg-green-600 hover:bg-green-700'>
                  Update profile
                </Button>
              </Close> */}
              </>
            )
          }}
        />
        {renderBelowContent?.()}
      </div>
    </div>
    </>
  )
}
