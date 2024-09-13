import { AppLogo } from "@/App/logo";
import cx from "clsx";
import { useEffect, useState } from "react";
import {
  Avatar,
  UnstyledButton,
  Group,
  Text,
  Menu,
  rem,
  useMantineTheme,
  Flex,
  ActionIcon,
  ActionIconProps,
  PolymorphicComponentProps,
  Indicator,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconLogout,
  IconChevronDown,
  IconShoppingBag,
  IconRefresh,
  IconUserCircle,
  IconHome,
} from "@tabler/icons-react";
import classes from "./Header.module.css";
import { useAuth, useLicenseRecord } from "@/contexts";
import { AppName } from "@/App/config";
import ToggleDarkMode, { computedColorScheme } from "@/components/mantine-reusable/ColorSchemes/ToggleDarkMode";
import { isDesktopApp } from "@/App/electron/ipc";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { avatarUrl, fetchPyServer } from "@/contexts/auth";

interface HeaderProps {
  menuIcon?: React.ReactNode
}

export const MainHeader = ({
  menuIcon
}: HeaderProps) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isProductPage = location.pathname.startsWith('/products');
  const colorScheme = computedColorScheme();

  const LogoElement = () => {
    return (
      <>
      <AppLogo style={{ height: 30 }} darkMode={colorScheme === 'dark'} />
      <div className="grow font-semibold ml-2">{AppName}</div>
      </>
    )
  }

  return (
    <Flex className={classes.header} justify={"space-between"} align={"center"} h={"100%"}>
      <Group h="100%" px="md">
        {
          isDesktopApp ? 
          <>
            <div className="flex items-center">
              <div className="flex items-center" data-header-drag="true"><LogoElement/></div>
              {
                isProductPage &&
                <ActionIcon component={Link} to={'/dashboard'} variant='light' ml={16}>
                  <IconHome/>
                </ActionIcon>
              }
            </div>
          </>
          :
          <Link to={isLoggedIn ? '/dashboard' : '/'} className="flex items-center">
            <LogoElement/>
          </Link>
        }
        {menuIcon}
      </Group>
      <div className="grow h-full" data-header-drag="true"></div>
      <Group h="100%" px="md" gap={0}>
        { isDesktopApp &&
          <RefreshComponent
            onClick={()=>{
              console.clear();
              navigate('/refresh');
            }}
          />
        }
        <ToggleDarkMode />
        { isLoggedIn &&
          <div>
            <UserDropdownMenu />
          </div>
        }
      </Group>
      <div id="titleBarOverlay" className={isDesktopApp ? "w-32" : ""}></div>
    </Flex>
  );
};

const RefreshComponent = ({
  ...props
}: PolymorphicComponentProps<'button', ActionIconProps>) => {
  useEffect(()=> {
    const timer = setInterval(async()=> {
      await fetchPyServer()
    }, 30 * 60000);

    return () => {
      clearInterval(timer);
    }
  },[])

  return (
    <ActionIcon
      title={'Refresh'}
      variant="transparent"
      {...props}
    >
      <IconRefresh stroke={1.5} />
    </ActionIcon>
  )
}

const user = {
  name: "Jane Spoonfighter",
  email: "janspoon@fighter.dev",
  avatar:
    "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png",
};

export function UserDropdownMenu() {
  const navigate = useNavigate();
  const { user, logOut, updateUser } = useAuth();
  const { licenseRecords } = useLicenseRecord();
  const isTrailOrExpired = licenseRecords.filter(dt => dt.status === 'trial' || dt.status === 'expired').length > 0;
  const isPending = licenseRecords.filter(dt => dt.status === 'pending').length > 0;
  const isActivated = licenseRecords.filter(dt => dt.status === 'activated' || dt.status === 'full').length > 0;

  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);

  useEffect(()=>{
    if(userMenuOpened){
      setTimeout(()=>{
        console.clear()
      },20)
    }
  },[userMenuOpened]);
  
  let avatar = avatarUrl(user.avatar);
  return (
    <Menu
      width={260}
      position="bottom-end"
      transitionProps={{ transition: "pop-top-right" }}
      onClose={() => setUserMenuOpened(false)}
      onOpen={() => setUserMenuOpened(true)}
      withinPortal
      shadow="md"
    >
      <Menu.Target>
        <UnstyledButton
          className={cx(classes.user, { [classes.userActive]: userMenuOpened }, 'hover:shadow-sm')}
        >
          <Group gap={7}>
            <Indicator 
              inline processing={isPending} size={8} offset={3.5}
              color={
                isTrailOrExpired ? "red" 
                : isPending ? "orange"
                : isActivated ? "green" 
                : 
                'transparent'
              }
            >
              <Avatar className="shadow-sm" src={avatar } alt={user.name} radius="xl" size={30} />
            </Indicator>
            <Text className={classes.username} fw={500} size="sm" lh={1} mr={3}>
              {user.name}
            </Text>
            <IconChevronDown
              className={classes.username}
              style={{ width: rem(12), height: rem(12) }}
              stroke={1.5}
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={
            <IconUserCircle
              style={{ width: rem(18), height: rem(18) }}
              color={theme.colors.yellow[6]}
              stroke={1.5}
            />
          }
          fz={rem(18)}
          onClick={()=>{
            navigate('/account/profile')
          }}
        >
          Profile
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconShoppingBag
              style={{ width: rem(18), height: rem(18) }}
              color={theme.colors.blue[6]}
              stroke={1.5}
            />
          }
          fz={rem(18)}
          onClick={()=>{
            navigate('/account/products')
          }}
        >
          Products
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={
            <IconLogout
              style={{ width: rem(18), height: rem(18) }}
              stroke={1.5}
            />
          }
          fz={rem(18)}
          onClick={logOut}
        >
          Logout
        </Menu.Item>

        {/* <Menu.Label>Settings</Menu.Label>
        <Menu.Item
          leftSection={
            <IconSettings
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
          onClick={()=>{
            navigate('/account/profile')
          }}
        >
          Account settings
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconSwitchHorizontal
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
        >
          Change account
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconLogout
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
          onClick={logOut}
        >
          Logout
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Danger zone</Menu.Label>
        <Menu.Item
          leftSection={
            <IconPlayerPause
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
        >
          Pause subscription
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={
            <IconTrash
              style={{ width: rem(16), height: rem(16) }}
              stroke={1.5}
            />
          }
        >
          Delete account
        </Menu.Item> */}
      </Menu.Dropdown>
    </Menu>
  );
}


{/* <Menu.Item
          leftSection={
            <IconHeart
              style={{ width: rem(16), height: rem(16) }}
              color={theme.colors.red[6]}
              stroke={1.5}
            />
          }
          onClick={() => {
            const bloggerTokenStorage = localStorage.getItem('bloggerToken');
            if(bloggerTokenStorage){
              const bloggerToken = JSON.parse(bloggerTokenStorage);
              const date = new Date();
              // fetch('https://www.googleapis.com/blogger/v3/blogs/756905182019864145/posts/7937931851105491827/revert', {
              //   method: "POST",
              //   headers: {
              //     Authorization: "Bearer " + bloggerToken.access_token,
              //     "Accept": "application/json",
              //     "Content-Type": "application/json",
              //   },
              //   // body: JSON.stringify({
              //   //   "kind": "blogger#post",
              //   //   "id": "7937931851105491827",
              //   //   "blog": {
              //   //     "id": "756905182019864145"
              //   //   },
              //   //   // "selfLink": "https://www.googleapis.com/blogger/v3/blogs/756905182019864145/posts/7937931851105491827",
              //   //   "title": "An updated post " + date.toISOString(),
              //   //   "url": "https://buildnewblogger.blogspot.com/2024/06/test-update-post-1.html",
              //   //   "content": "With really <b>exciting</b><br/>content is updated DRAFT at " + date.toISOString(),
              //   //   "labels": ["blogger-api","test-api"],
              //   //   "status": "DRAFT", // "LIVE" | "DRAFT" | "SCHEDULED" | "SOFT_TRASHED"
              //   // })
              // })
              // .then(async(res) => {
              //   const data = await res.json();
              //   console.log("data", data)
              // })
              // .catch(err => console.log("error blogger", err))
              const api = 'https://www.googleapis.com/blogger/v3/blogs/756905182019864145/posts/7937931851105491827' // ?publish=true
              fetch(api, {
                method: "PUT",
                headers: {
                  Authorization: "Bearer " + bloggerToken.access_token,
                  "Accept": "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  "kind": "blogger#post",
                  "id": "7937931851105491827",
                  "blog": {
                    "id": "756905182019864145"
                  },
                  // "selfLink": "https://www.googleapis.com/blogger/v3/blogs/756905182019864145/posts/7937931851105491827",
                  "title": "An updated post " + date.toISOString(),
                  "url": "https://buildnewblogger.blogspot.com/2024/06/test-update-post-1.html",
                  "content": "With really <b>exciting</b><br/>content is updated LIVE at " + date.toISOString(),
                  "labels": ["blogger-api","test-api"],
                  "status": "LIVE", // "LIVE" | "DRAFT" | "SCHEDULED" | "SOFT_TRASHED"
                })
              })
              .then(async(res) => {
                const data = await res.json();
                console.log("data", data)
              })
              .catch(err => console.log("error blogger", err))
            }
            // updatePost({
            //   blogId: '756905182019864145',
            //   postId: '7937931851105491827',
            //   requestBody: {
            //     blog: {
            //       id: '756905182019864145'
            //     },
            //     id: '7937931851105491827',
            //     title: "An updated post",
            //     content: "With really <b>exciting</b> content..."
            //   },
            //   callback(data, response) {
            //     console.log("data", data)
            //     console.log("response", response)
            //   },
            //   error(err) {
            //     console.log("Error BlogResponse", err)
            //   },
            // })
          }}
        >
          Test Blogger API
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconHeart
              style={{ width: rem(16), height: rem(16) }}
              color={theme.colors.red[6]}
              stroke={1.5}
            />
          }
          onClick={() => {
            accessTokenRedirectTypeOffline('login')
          }}
        >
          Connect Blogger
        </Menu.Item>
        <Menu.Item
          leftSection={
            <IconStar
              style={{ width: rem(16), height: rem(16) }}
              color={theme.colors.yellow[6]}
              stroke={1.5}
            />
          }
          onClick={() => {
            const bloggerTokenStorage = localStorage.getItem('bloggerToken');
            if(bloggerTokenStorage){
              const bloggerToken = JSON.parse(bloggerTokenStorage);
              refreshToken({
                token: bloggerToken.access_token,
                onSuccess(data){
                  console.log("data refresh token", data)
                  localStorage.setItem('bloggerToken', JSON.stringify(data))
                },
                onError(err){
                  console.log("error refresh token", err)
                },
              })
            }
          }}
        >
          Refresh Token
        </Menu.Item> */}