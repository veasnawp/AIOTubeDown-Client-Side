import { CopyrightFooter, MainDashboard } from '../Dashboard/dashboard'
import { ActionIcon, alpha, Anchor, Avatar, Badge, Box, Breadcrumbs, Button, Card, Divider, Flex, Grid, Group, Image, rem, SimpleGrid, Stack, Tabs, Text, TextInput, useMantineTheme } from '@mantine/core'
import { IconCashRegister, IconCheck, IconHome, IconListDetails, IconLock, IconLockOpen, IconLogout, IconUser, IconUsersGroup, IconX } from '@tabler/icons-react'
import { useEffectMainInterface } from '../main';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSetState } from '@mantine/hooks';
import { useForm } from "@mantine/form";
import { useEffect, useRef, useState } from 'react';
import { useAuth, useLicenseRecord } from '@/contexts';
import logger from '@/helper/logger';
import { notifications } from '@mantine/notifications';
import { Dropzone } from '@mantine/dropzone';
import { addDays, dataProducts, getActivationDays, getNewExpireDate } from '../Products/data';
import { avatarUrl } from '@/contexts/auth';
import { isDesktopApp } from '@/App/electron/ipc';


interface TabProps extends React.ComponentProps<typeof Tabs.Tab> {
  href?: string
  to?: string
}
const Tab = ({...props}: TabProps) => <Tabs.Tab {...(props as any)} />

export default function ProfilePage() {
  const theme = useMantineTheme();
  let { tabProfile } = useParams();
  const currentPath = tabProfile || 'profile'

  const dataTabs = [
    {value: "profile", label: "Profile", icon: IconUser, content: Profile},
    {value: "products", label: "Products", icon: IconListDetails, content: Products},
    // {value: "payment", label: "Payments & billing", icon: IconCashRegister, content: ()=> <div></div>},
    // {value: "affiliate", label: "Affiliate program", icon: IconUsersGroup, content: ()=> <div></div>},
    // {value: "logout", label: "Log out", icon: IconLogout, content: ()=> <div></div>},
  ];
  const currentTab = dataTabs.filter(dt => dt.value === currentPath)?.[0]
  if(currentTab?.value !== tabProfile){
    return <Navigate to={'/dashboard'} replace />
  }


  return (
    <MainDashboard classNames={{
      inner: "*:shadow-none"
    }}>
      <Card>
        <Breadcrumbs separator='>>'>
          <ActionIcon component={Link} to={'/dashboard'} variant='default' size={22}>
            <IconHome/>
          </ActionIcon>
          <Flex align={'center'} gap={8}>
            <ActionIcon component={Link} to={`/account/${currentPath||'profile'}`} key={currentTab?.value}
              variant='outline' size={20}
            >
              <currentTab.icon/>
            </ActionIcon>
            <Anchor component={Link} to={`/account/${currentPath||'profile'}`}>{currentTab.label}</Anchor>
          </Flex>
        </Breadcrumbs>
      </Card>
      <Card>
        <Tabs defaultValue="profile"  orientation="vertical" color={alpha(theme.colors.blue[6], 0.6)}
          variant='pills'
          value={currentPath}
          className='flex-col md:flex-row gap-4 md:gap-0'
        >
          <Tabs.List className='border-r-0 dark:border-r-gray-500 pr-0 md:pr-4 md:border-r flex-row md:flex-col'>
            {
              dataTabs.map(item => {
                // const props = item.value === 'logout' ? {} : {component: Link, to: `/account/${item.value}`}
                return (
                  <Tab
                    className={'p-2 text-sm md:p-4 md:text-base'.concat(item.value !== currentPath ? ' hover:bg-[var(--mantine-color-blue-light-hover)]' : '')}
                    key={item.value}
                    value={item.value} 
                    leftSection={<item.icon />}
                    component={Link} to={`/account/${item.value}`}
                    // disabled={item.disabled}
                  >
                    {item.label}
                  </Tab>
                )
              })
            }
          </Tabs.List>
            {
              dataTabs.map(item => {
                return (
                  <Tabs.Panel key={item.value} value={item.value} className='pl-0 md:pl-4'>
                    <Divider className='block md:hidden pb-4'  />
                    <item.content/>
                  </Tabs.Panel>
                )
              })
            }
        </Tabs>
        <div className='mb-10'></div>
      </Card>
      <Box py={30}>
        {!isDesktopApp && <CopyrightFooter/>}
      </Box>
    </MainDashboard>
  )
}

function Profile() {
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const [state, setState] = useSetState({
    lockEmailChange: true,
  });
  const [checkAccount, setCheckAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openRef = useRef<() => void>(null);

  const form = useForm({
    initialValues: {
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || '',
    },
    onValuesChange(){
      setCheckAccount('')
    }
  })

  useEffect(()=>{
    if((!form.getValues().email || location) && user.email){
      form.setValues({
        name: user.name || '', 
        email: user.email, 
        avatar: avatarUrl(user.avatar)
      });
    }
    if(!state.lockEmailChange){
      setState({lockEmailChange: true})
    }
  },[user, location])

  return (
    <div className='space-y-4'>
      <Text fz={'h2'} fw={600} mb={16}>Profile</Text>
      <Box mb={32}>
        <Text fz={'h3'} fw={600}>Account Settings</Text>
        <Text>Update your personal information</Text>
      </Box>
      <form
        onSubmit={form.onSubmit(async(values)=> {
          setIsLoading(true);
          let { name, email } = values;
          name = name.trim(), email = email.trim();
          if((name !== user.name || email !== user.email) && ![name,email].every(v => v === '')){
            const updateValue = {email,name} as Partial<UserPayload>;
            // updateValue.options = {...user.options, machineId: "BADC861D-2662-480E-89FD-E08BAE2EB4F3"}
            const userUpdate = await updateUser(updateValue);
            const isErrorUpdate = !(userUpdate && !userUpdate.error)
            const Icon = isErrorUpdate ? IconX : IconCheck
            notifications.show({
              loading: false,
              color: isErrorUpdate ? 'red' : 'teal',
              title: isErrorUpdate ? 'Your information cannot change' : 'Successful',
              message: isErrorUpdate ? ((userUpdate?.error || '') as string) : 'Your personal information was successful changed.',
              icon: <Icon style={{ width: rem(18), height: rem(18) }} />,
              autoClose: 5000,
              withCloseButton: true,
            });
            logger?.log("userUpdate", userUpdate)
          }
          setTimeout(()=>{
            setIsLoading(false);
          },500)
        })}
      >
        <Stack>
          <div className='mx-auto min-w-80'>
            <Dropzone
              className='bg-muted dark:bg-muted/30'
              openRef={openRef} 
              onDrop={async(files) => {
                const blob = files[0] as Blob;
                if(!blob) return;
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
                  localStorage.setItem('avatar', avatarUrl)
                  form.setFieldValue('avatar', avatarUrl);
                }
              }}
              activateOnClick={false}
              accept={[
                'image/png',
                'image/jpeg',
                'image/sgv+xml',
                'image/gif',
              ]}
            >
              <Group justify="center">
                <div
                 
                  style={{
                    padding: 4,
                    borderRadius: "100%",
                    boxShadow: form.values.avatar ? "rgba(151, 65, 252, 0.2) 0 15px 30px -5px" : '',
                    backgroundImage: form.values.avatar ? "linear-gradient(144deg,#AF40FF, #5B42F3 50%,#00DDEB)" : ''
                  }}
                >
                  <Avatar
                    title='Upload Photo' 
                    src={form.values.avatar || null} alt={form.values.avatar ? user.name : 'Upload Photo'} 
                    style={{ pointerEvents: 'all' }} size={180}
                    onClick={() => openRef.current?.()}
                  />
                </div>
              </Group>
            </Dropzone>
          </div>

          <TextInput
            label="Name"
            placeholder="Your name"
            value={form.values.name}
            onChange={(event) =>
              form.setFieldValue("name", event.currentTarget.value)
            }
            size='md' radius="md"
            error={form.errors.name}
          />

          <TextInput
            label="Email"
            placeholder="me@example.com"
            value={form.values.email}
            onChange={(event) =>
              form.setFieldValue("email", event.currentTarget.value)
            }
            error={
              checkAccount.includes('email') ? 
              <span className="text-red-500 text-sm">
                {checkAccount}
              </span> : undefined
            }
            size='md' radius="md"
            disabled={state.lockEmailChange}
            rightSection={
              <ActionIcon
                title={state.lockEmailChange ? 'Click to edit email':undefined}
                variant='light' color={state.lockEmailChange ? 'blue':'teal'}
                onClick={()=> setState(val => ({lockEmailChange: !val.lockEmailChange}))}
              >{state.lockEmailChange ? <IconLock/> : <IconLockOpen/>}</ActionIcon>
            }
          />
        <div>
          <Button type="submit" fullWidth size='md' radius="md" variant='filled' color={'green'} loading={isLoading}>
            Save changes
          </Button>
        </div>
        </Stack>

      </form>
    </div>
  )
}

export function getOneProductFilter(
  licenseRecords: LicenseRecord[], 
  productId: (typeof dataProducts)[number]['productId'], 
  currentDate?:number | string | Date
){
  const product = (licenseRecords.filter(dt => dt.productId === productId)?.[0] || {}) as Omit<LicenseRecord, "status"> & {status?: LicenseRecord['status']};
  const isTrailOrExpired = product.status === 'trial' || product.status === 'expired';
  const isPending = product.status === 'pending';
  const isActivated = product.status === 'activated' || product.status === 'full'
  const isLifeTime = product.currentPlan === 'Lifetime'
  let statusColor = '';
  let viewMoreText = product.status && product.currentPlan !== 'Lifetime' ? 'Upgrade Now' : 'View Product';
  if(isTrailOrExpired){
    statusColor = 'orange'
  } else if(isPending){
    statusColor = 'pink'
  } else if(isActivated){
    statusColor = 'green'
  }
  let expiredDays = product.expiresAt ? getActivationDays(currentDate||new Date(), product.expiresAt) : 0
  let isExpired = expiredDays <= 0
  let expiredText = 'Expired'
  let expiredColor = 'red'
  if(expiredDays > 3 && expiredDays <= 7){
    expiredColor = 'pink'
  } else if(expiredDays > 7){
    expiredColor = 'green'
  }
  if(expiredDays > 0){
    expiredText = `Expire: ${expiredDays} day${expiredDays > 1 ? "s":""} left`
  }
  if(isLifeTime){
    expiredColor = 'green'
    expiredText = 'Lifetime'
  }

  return { 
    product, isTrailOrExpired, isPending, isActivated, isExpired, isLifeTime,
    statusColor, viewMoreText, 
    expiredDays, expiredText, expiredColor
  }
}

function Products() {
  const { currentDate } = useAuth();
  const { licenseRecords } = useLicenseRecord();

  return (
    <div className='space-y-4'>
      <Text fz={'h2'} fw={600} mb={16}>Products</Text>
      <Box mb={32}>
        <Text fz={'h3'} fw={600}>All Products</Text>
      </Box>
      <Card className='bg-[var(--web-wash)]'>
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 4 }}
          spacing={{ base: 'md', sm: 'md' }}
          verticalSpacing={{ base: 'xl', sm: 'xl' }}
        >
          {
            [...dataProducts].map(item => {
              const { 
                product, isTrailOrExpired, isPending, isActivated, 
                statusColor, viewMoreText, 
                expiredDays, expiredText, expiredColor
              } = getOneProductFilter(licenseRecords, item.productId, currentDate);

              return (
                <Card key={item.productName} shadow="sm" padding="lg" radius="md" withBorder>
                  <Card.Section pos={'relative'}>
                    {
                      product.status && 
                      <Flex pos={'absolute'} top={4} right={4} gap={4}>
                        <Badge tt='unset' color={expiredColor}>{expiredText}</Badge>
                        {
                          product.status !== 'expired' &&
                          <Badge color={statusColor}>{product.status}</Badge>
                        }
                      </Flex>
                    }
                    <Image
                      src="/img/aiotubedown-bundle-box.png"
                      height={160}
                      alt="aiotubedown bundle"
                    />
                  </Card.Section>

                  <Group justify="space-between" mt="md" mb="xs">
                    <Text fw={500}>{item.productName}</Text>
                    <Badge color="pink">On Sale</Badge>
                  </Group>

                  <Text size="sm" c="dimmed">{item.description}</Text>

                  <Button component={Link} to={'/products/'.concat(item.slug)} color="orange" size='lg' fullWidth mt="md" radius="md">
                    {viewMoreText}
                  </Button>
                </Card>
              )
            })
          }
        </SimpleGrid>
      </Card>
    </div>
  )
}
