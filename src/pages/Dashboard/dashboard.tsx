import { AppShell, Badge, Box, Burger, Card, Divider, Flex, Paper, rem, ScrollArea, Text } from '@mantine/core'
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { MainHeader } from './header';
import { NavBarMenu } from './NavBarSection';
import { useEffect, useState } from 'react';

import { isDesktopApp } from '@/App/electron/ipc';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppName, AppVersion } from '@/App/config';
import { ContextMenu, useContextMenu } from '@/components/ContextMenu';
import { formatDate } from '@/utils/dateFormat/date-format';
import { useAuth, useLicenseRecord } from '@/contexts';
import { dataProducts } from '../Products/data';
import { getOneProductFilter } from '../Profile';

interface DashboardProps {
  children?: React.ReactNode
  renderAboveContent?: React.ReactNode
  renderBelowContent?: React.ReactNode
  classNames?: {
    header?: string
    nav?: string
    wrapper?: string
    inner?: string
  }
  scrollAreaProps?: React.ComponentProps<typeof ScrollArea>
}

export const MainDashboard = ({
  children,
  renderAboveContent,
  renderBelowContent,
  classNames,
  scrollAreaProps
}: DashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hash = location.hash;

  const isNotDashboardPage = !location.pathname.startsWith('/dashboard');
  const isNotAccountPage = !location.pathname.startsWith('/account');
  const isNotProductPage = !location.pathname.startsWith('/products');
  const isDownloadTab = hash === '#download' && !isNotDashboardPage

  const { currentDate } = useAuth();
  const { licenseRecords } = useLicenseRecord();

  const [openedNavbar, { toggle: toggleBurger, close: closeNavbar }] = useDisclosure();
  
  const { showContextMenu, points, onContextMenu } = useContextMenu();

  const [zoom, setZoom] = useLocalStorage({key: 'zoom-factor', defaultValue: 1})
  useEffect(() => {
    if(isDesktopApp){
      window.electron.on("zoom-in", () => {
        setZoom(1.3)
      });
      window.electron.on("zoom-out", () => {
        setZoom(0.9)
      });
      window.electron.on("reset-zoom", () => {
        setZoom(1)
      });
    } else if(zoom) {
      localStorage.removeItem('zoom-factor')
    }
  }, [])

  scrollAreaProps = {
    ...scrollAreaProps,
    className: cn('grow', !isNotProductPage ? 'h-[calc(100vh-0px)]' : isDesktopApp ? 'h-[calc(100vh-100px)]' : 'h-[calc(100vh-96px)]', scrollAreaProps?.className)
  }

  return (
    <AppShell
      header={{ height: isDesktopApp ? 50 : 60 }}
      navbar={{
        width: isNotDashboardPage ? 0 : 260 - 60,
        breakpoint: 'sm',
        collapsed: { mobile: !openedNavbar },
      }}
      padding={zoom > 1 ? 32 : zoom < 1 ? 'md' : 'md'}
      onContextMenu={onContextMenu}
    >
      <AppShell.Header className={cn('flex flex-col transition-all', classNames?.header)} style={{zoom: zoom}}>
        <MainHeader
          menuIcon={
            // isNotDashboardPage
            // ? <Link to={'/dashboard'}><IconHome/></Link>
            // : 
            !isNotDashboardPage &&
            <Burger opened={openedNavbar} onClick={toggleBurger} hiddenFrom="sm" size="sm" />
          }
        />
      </AppShell.Header>

      <AppShell.Navbar
        hidden={isNotDashboardPage}
        mt={zoom !== 1 && !openedNavbar ? 32 : "md"} 
        style={{
          '--app-shell-navbar-width': rem(260 - 60)
        }} 
      className={cn('space-y-4 rounded-tr-sm shadow-md', classNames?.nav)} 
      withBorder={false}
      >
        <AppShell.Section grow>
          <NavBarMenu />
        </AppShell.Section>
        <AppShell.Section>
          <Flex justify={'space-between'} direction={'column'} gap={4} >
            <Box>
              { 
                licenseRecords.length > 0 && isDesktopApp &&
                [...dataProducts].map(item => {
                  const {
                    product, isTrailOrExpired, isPending, isActivated, isExpired, isLifeTime,
                    statusColor, viewMoreText, 
                    expiredDays, expiredText, expiredColor
                  } = getOneProductFilter(licenseRecords, item.productId, currentDate);
                  return (
                    <Flex key={item.productId} px={16} justify={'center'} align={'center'} gap={4}>
                      <Text fz='lg' span c={expiredColor}>{expiredText}</Text>
                      {
                        isExpired && isLifeTime &&
                        <Badge size='lg' color={'green'} style={{cursor: 'pointer'}} title='Renew License'
                          onClick={()=> navigate('/products/' + item.slug)}
                        >Renew</Badge>
                      }
                      {
                        isLifeTime && 
                        <Badge size='lg' color={'green'}>Unlimited</Badge>
                      }
                    </Flex>
                  )
                })
              }
            </Box>
            {
              isDesktopApp && 
              <Box>
                <Flex px={16} justify={'center'} className=' bg-slate-300/10'>
                  <Text unstyled span c={'gray'} ff={'monospace'}>{`v2 (${AppVersion})`}</Text>
                </Flex>
              </Box>
            }
          </Flex>
        </AppShell.Section>
        <div className='scrollbar-width-5 overflow-y-auto p-0'></div>
      </AppShell.Navbar>

      <AppShell.Main onClick={() => openedNavbar && closeNavbar()}>
        {
          isDesktopApp &&
          <Flex px={16} justify={'center'} opacity={0.7}
            hidden={
              !isNotDashboardPage ? openedNavbar 
              : isNotAccountPage
              // !(openedNavbar || isNotDashboardPage || isNotAccountPage)
            } 
            pos={'absolute'} bottom={0} left={0} style={{zIndex:1}}>
            <Text unstyled span c={'gray'} ff={'monospace'}>{`v2 (${AppVersion})`}</Text>
          </Flex>
        }
        <div className={cn('dashboard-wrapper -mx-4 flex', classNames?.wrapper)}>
        { renderAboveContent }
          <ScrollArea
            // className={cn('grow', !isNotProductPage ? 'h-[calc(100vh-0px)]' : isDesktopApp ? 'h-[calc(100vh-100px)]' : 'h-[calc(100vh-96px)]', scrollAreaProps?.className)} 
            // h={!isNotProductPage ? 'calc(100vh - 0px)' : isDesktopApp ? 'calc(100vh - 100px)' : 'calc(100vh - 96px)'} 
            {...scrollAreaProps}
          >
            <div className={cn('dashboard-inner-content space-y-4 *:shadow-md px-4', classNames?.inner)}>
              { children }
            </div>
          </ScrollArea>
        </div>
        { renderBelowContent }
        <ContextMenu showContextMenu={showContextMenu} points={points}/>
        {/* <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'green', type: 'dots', size: 'xl' }}  /> */}
        <div className='hidden'><DigitalClock/></div>
      </AppShell.Main>
    </AppShell>
  )
}

export const CopyrightFooter = () => {
  return (
    <Flex 
      justify={'center'} align={'center'} gap={8} my={16} 
      className="cursor-default text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} {AppName}. All rights reserved.
    </Flex>
  )
}


/**
 * @DIGITAL_CLOCK
 * 
 * @access
*/
export function DigitalClock({
  onExchangeRateData
}:{
  onExchangeRateData?: () => any
}){
  const { currentDate, setCurrentDate } = useAuth();
  const [clock, setClock] = useState(currentDate.format('h:MM:ss TT'));
  useEffect(()=> {
    const timer = setInterval(()=> {
      const newDate = new Date();
      setClock(newDate.format('h:MM:ss TT'))
      if(formatDate(newDate) > formatDate(currentDate)){
        // clearInterval(timer);
        setCurrentDate(newDate);
      }
      if(
        ['9:00 AM','11:00 AM','12:00 PM','1:00 PM']
        .some(h => h === newDate.format('h:MM TT'))
      ){
        onExchangeRateData?.();
      }
    },1000)

    return () => {
      clearInterval(timer);
    }
  },[])

  return (
    <div>
      <span className='font-semibold'>Time: </span>
      <span className='mr-1 ordinal'>{clock.split(' ')[0]}</span>
      <span className='font-semibold text-muted-foreground'>{clock.split(' ')[1]}</span>
    </div>
  )
}