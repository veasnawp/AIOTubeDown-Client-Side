import { Title, Text, Button, Container, Flex, Box, SimpleGrid, Stack, rem, Paper, useMantineTheme, Badge, alpha, Card, Modal, LoadingOverlay, ScrollArea, Group, Avatar, Skeleton, Loader, ThemeIcon } from '@mantine/core';
import classes from '../HeroText.module.css';
import { Dots } from '../Dot';
import { AppName } from '@/App/config';
import { IconCheck, IconShoppingCartFilled } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { isDesktopApp, preloadJs, webContentSend } from '@/App/electron/ipc';
import { useDisclosure, useSetState } from '@mantine/hooks';
import logger from '@/helper/logger';
import { isDev } from '@/api/backend/config';
import { useAuth, useLicenseRecord } from '@/contexts';
import { addDays, dataProducts, getActivationDays, getNewExpireDate } from '../data';
import { useLocation, useNavigate } from 'react-router-dom';
import { CopyrightFooter } from '@/pages/Dashboard/dashboard';
import { avatarUrl } from '@/contexts/auth';
import { formatDuration } from '@/utils/format';
import { encodeJsonBtoa } from '@/utils';

const headers = {
  "accept": "application/json",
  "accept-language": "en-US,en;q=0.9",
  "content-type": "application/json",
}

export const discountList = ["50percent", "30percent", "15percent", "10percent"] as const
export type DiscountString = (typeof discountList)[number] | (string & {})

interface Price {
	discount: string;
	regular: string;
}

type DefaultPricePlan = Prettify<{
	plan: string;
	price: Price;
	linkId: string;
	promotion: Record<DiscountString,{ linkId: string; price: string; }>;
}>

type LifetimePricePlan = Omit<DefaultPricePlan, 'promotion'>


export const dataPricePlanABA = [
  {
    plan: '1 Month',
    price: { discount: '7.95', regular: '14.95' },
    linkId: 'ABAPAY32230720a',
    promotion: {
      '50percent': { linkId: 'ABAPAYoK230809E', price: '3.97' },
      '30percent': { linkId: 'ABAPAYax230810A', price: '5.56' },
      '15percent': { linkId: 'ABAPAYMN230811W', price: '6.75' },
      '10percent': { linkId: 'ABAPAYNM230812I', price: '7.15' }
    }
  },
  {
    plan: '3 Months',
    price: { discount: '19.95', regular: '34.95' },
    linkId: 'ABAPAYEI230721b',
    popular: true,
    promotion: {
      '50percent': { linkId: 'ABAPAYjc2308137', price: '9.97' },
      '30percent': { linkId: 'ABAPAYwf2308141', price: '13.96' },
      '15percent': { linkId: 'ABAPAYyb230815Q', price: '16.95' },
      '10percent': { linkId: 'ABAPAYul230816E', price: '17.95' }
    }
  },
  {
    plan: '1 Year',
    price: { discount: '29.95', regular: '59.95' },
    linkId: 'ABAPAYnR230722n',
    promotion: {
      '50percent': { linkId: 'ABAPAYow230817U', price: '14.97' },
      '30percent': { linkId: 'ABAPAYLw230818w', price: '20.96' },
      '15percent': { linkId: 'ABAPAYY3230819U', price: '25.45' },
      '10percent': { linkId: 'ABAPAYRt230820d', price: '26.95' }
    }
  },
  {
    plan: "Lifetime",
    price: {discount: "49.95", regular: "99.95"},
    linkId: "ABAPAYcw230723A", popular: true,
  },
  {
    plan: "Family",
    price: {discount: "59.95", regular: "135.95"},
    linkId: "ABAPAYRG230724l"
  },
];

export const dataPricePlanPlisio = [
  {
    plan: '1 Month',
    price: { discount: '7.95', regular: '14.95' },
    linkId: '662ad4f65763e2ec4d031cfd',
    promotion: {
      '50percent': { linkId: '662ad5260f116331e10d1c38', price: '3.97' },
      '30percent': { linkId: '662ad5640f116331e10d1c3b', price: '5.56' },
      '15percent': { linkId: '662ad58dea3e633d910b07f3', price: '6.75' },
      '10percent': { linkId: '662ad5ca5a6ad912b307cfd2', price: '7.15' }
    }
  },
  {
    plan: '3 Months',
    price: { discount: '19.95', regular: '34.95' },
    linkId: '662ad5e0e8679d5ba40a0d09',
    popular: true,
    promotion: {
      '50percent': { linkId: '662ad601ee4d763e780850a8', price: '9.97' },
      '30percent': { linkId: '662ad61b4d8c63f8ae08825f', price: '13.96' },
      '15percent': { linkId: '662ad6520c28d23f0f0f35e4', price: '16.95' },
      '10percent': { linkId: '662ad668de22a37d3c085667', price: '17.95' }
    }
  },
  {
    plan: '1 Year',
    price: { discount: '29.95', regular: '59.95' },
    linkId: '662ad684e18f9b279609649e',
    promotion: {
      '50percent': { linkId: '662ad6980a2e3b038e0a5e46', price: '14.97' },
      '30percent': { linkId: '662ad70f1d736e750d0ab151', price: '20.96' },
      '15percent': { linkId: '662ad72e68472cf5b306add7', price: '25.45' },
      '10percent': { linkId: '662ad73f9a85b79332090541', price: '26.95' }
    }
  },
  {
    plan: "Lifetime",
    price: {discount: "49.95", regular: "99.95"},
    linkId: "662ad75b0bea627fbc062e24", popular: true,
  },
  {
    plan: "Family",
    price: {discount: "59.95", regular: "135.95"},
    linkId: "662ad77467b3c08b400a8a2a"
  },
];

export const dataPricePlan = [
  {
    plan: "1 day",
    price: {discount: "0", regular: "0.85"},
    linkId: "ABAPAYeY231734K",
  },
  {
    plan: "1 day",
    price: {discount: "0.25", regular: "0.85"},
    linkId: "ABAPAYeY231734K",
  },
  {
    plan: "3 days",
    price: {discount: "1.00", regular: "1.85"},
    linkId: "ABAPAYeY231734K",
  },
  {
    plan: "7 days",
    price: {discount: "2.00", regular: "2.75"},
    linkId: "ABAPAYeY231734K",
  },
  ...dataPricePlanABA
]

export function selectDataPrice(discount?:DiscountString, payWith?:LicenseRecord['paymentMethod']){
  return (dataPricePlan as DefaultPricePlan[]).map(dt => {
    let price = dt.price.discount;
    if(discount && discountList.some(v => v === discount) && dt?.promotion){
      price = dt.promotion[discount].price
    }
    return {
      plan: dt.plan,
      price: price,
      payWith: payWith || "QR Code",
    }
  })
}

const dataPricePlanTesting = {
  plan: "3 day",
  linkId: {
    aba: "ABAPAYeY231734K", plisio: "662bce362f0d539e9108d2f5"
  },
  price: "1",
}

const dataPricePlanTesting10c = {
  plan: "3 day",
  linkId: {
    aba: "ABAPAYMG293530z", plisio: "662bce362f0d539e9108d2f5"
  },
  price: "0.1",
}


export function AIOTubeDownPage({...other}) {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useAuth();
  const dataProduct = {...dataProducts[0]};
  const { licenseRecords, addLicenseRecord, updateLicenseRecord } = useLicenseRecord();
  const product = (licenseRecords.filter(dt => dt.productId === dataProduct.productId)?.[0] || {}) as Partial<LicenseRecord>;

  const currentPromotion = {
    promotion: {
      discount: 15,
      lifeTimePlan: false,
    }
  };
  const mainAssets = window?.mainAssets
  if(isDesktopApp){
    if(mainAssets && mainAssets?.dev$settings?.promotion){
      currentPromotion.promotion = mainAssets?.dev$settings?.promotion
    }
  }
  const ABALinkId = mainAssets?.dev$settings?.ABALinkId;

  const [openedModal, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [state, setState] = useSetState({
    link: '',
    plan: '',
    price: '',
    payWith: 'QR Code' as LicenseRecord['paymentMethod'],
    activePayment: false,
    qrCodeImage: '',
    loading: false,
  })
  const dataPricePlan = state.payWith === 'QR Code' ? dataPricePlanABA : dataPricePlanPlisio

  const lifeTimePlan = dataPricePlan.slice(-2)[0] as LifetimePricePlan
  const defaultPlan = dataPricePlan[1] as DefaultPricePlan

  const __promotion = {
    lifeTimePlan: (currentPromotion?.promotion?.lifeTimePlan || false) as boolean,
    discount: (currentPromotion?.promotion?.discount || 0) as number,
    discountString: `0percent` as DiscountString,
  }
  __promotion["discountString"] = `${__promotion["discount"]}percent`
  const [promotion, setPromotion] = useState<typeof __promotion & Record<string, any>>(__promotion);

  const hasPromotion = typeof promotion.discount === 'number' && [50,30,15,10].some(v => v === promotion.discount)


  // async function updateLicense(){
  //   const pricePlan = state.plan;
  //   const currentDate = new Date().toISOString();
  //   const newExpireDate = getNewExpireDate(pricePlan);

  //   if(user._id){
  //     if(!product._id){
  //       return await addLicenseRecord({
  //         userId: user._id,
  //         status: 'activated',
  //         modifyDateActivated: currentDate,
  //         activationDays: getActivationDays(currentDate, newExpireDate),
  //         expiresAt: newExpireDate,
  //         currentPlan: pricePlan,
  //         historyLicenseBough: [`${currentDate}|${newExpireDate}|${state.price}`],
  //         toolName: dataProduct.productName,
  //         productId: dataProduct.productId,
  //         category: dataProduct.category,
  //         paymentMethod: state.payWith,
  //       })
  //     } else {
  //       const historyLicenseBough = product.historyLicenseBough || [];
  //       return await updateLicenseRecord(product._id, {
  //         status: 'activated',
  //         modifyDateActivated: currentDate,
  //         activationDays: getActivationDays(currentDate, newExpireDate),
  //         expiresAt: newExpireDate,
  //         currentPlan: pricePlan,
  //         historyLicenseBough: [...historyLicenseBough, `${currentDate}|${newExpireDate}|${state.price}`],
  //       })
  //     }
  //   }
  // }

  const handleBuyNow = async (dataState:Partial<typeof state>) => {
    // dataState.price = Number('0.1').toFixed(2);
    dataState.price = Number(dataState.price).toFixed(2);
    setState({...dataState, loading: true});
    if(isLoggedIn){
      await PreCheckout(
        ABALinkId,
        {amount: dataState.price, full_name: user.name, email: user.email}, 
        (isSuccessful, data)=>{
        if(isSuccessful){
          setState({...dataState, qrCodeImage: data.download_qr, loading: false})
          setTimeout(()=>{
            openModal();
          },50)
        }
      })
    } else {
      setState({...dataState, loading: false});
      setTimeout(()=>{
        openModal();
      },50)
    }
  }

  const handleTryAgain = () => {
    const link = state.link
    const price = state.link
    const plan = Number(state.price).toFixed(2);
    setState({link: '', price, plan, loading: true})
    closeModal();
    setTimeout(()=>{
      openModal();
      handleBuyNow({link, price: state.price, plan, loading: false})
    },2000)
  }

  // useEffect(()=>{
  //   if(openedModal){
  //     if(isDesktopApp){
  //       setTimeout(()=>{
  //         const webview = document.querySelector('webview') as Element & {openDevTools: () => void};
  //         if(webview){
  //           webview.addEventListener('dom-ready', () => {
  //             if(isDev)
  //             webview.openDevTools()
  //           })
  //         }
  //       },2000)
  
  //       webContentSend("get-value:payment-is-paid", (_:any) => {
  //         let timer = setTimeout(async () => {
  //           clearTimeout(timer);
  //           const dataSuccess = await updateLicense()
  //           console.clear();
  //           if(dataSuccess){
  //             logger?.log("payment success", dataSuccess);
  //             navigate('/dashboard');
  //           }
  //           closeModal();
  //         }, 2000)
  //       })
  //       webContentSend("get-value:payment-is-expired", (__expiredSession) => {
  //         const expiredSession = __expiredSession as string;
  //         logger?.log(expiredSession)
  //         handleTryAgain();
  //       })
  //     }
  //   }
  // },[openedModal])

  

  const linkPayment = (id:string) => (state.payWith === 'QR Code' ? 'https://link.payway.com.kh/'+id : `https://plisio.net/invoice/${id}?ttcodettool=true&disable-cdn=true&disable-main-js=true&executeScript=true`);


  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    setTimeout(()=>{
      setLoading(false)
    },1500)
  },[])

  useEffect(()=>{
    const isOffline = !Boolean(window?.navigator?.onLine);
    let count = 0;
    let timer = setInterval(()=>{
      if(isOffline){
        if(!Boolean(window?.navigator?.onLine)){
          count++;
        } else if(count > 1) {
          if(isOffline){
            window.location.reload();
          }
        }
      } else {
        clearInterval(timer);
      }
    },3000)
    return () => {
      clearInterval(timer)
    }
  },[])


  return (
    <div {...other}>
      <Container className={classes.wrapper} size={1400}>
        <Dots className={classes.dots} style={{ left: 0, top: 0 }} />
        <Dots className={classes.dots} style={{ left: 60, top: 0 }} />
        <Dots className={classes.dots} style={{ left: 0, top: 140 }} />
        <Dots className={classes.dots} style={{ right: 0, top: 60 }} />

        <div className={''.concat(classes.inner, ' space-y-24')}>
          <Box mb={100}>
            <Title className={''.concat(classes.title)}>
              Purchase a license{' '}
              <Text component="span" className={classes.highlight} inherit>
                {AppName}
              </Text>{' '}
              for {window.os === 'Mac OS' ? 'Mac' : 'Windows'}
            </Title>

            <Container p={0} size={600}>
              <Flex justify={'center'} gap={20}>
                <Flex>
                  <Text span unstyled mr={5} c={'green'}>
                    <IconCheck />
                  </Text>
                  <Text c="dimmed" className={classes.description.concat(' ', 'text-sm xs:text-base')}>
                    Free Customer Support
                  </Text>
                </Flex>
                <Flex>
                <Text span unstyled mr={5} c={'green'}>
                    <IconCheck />
                  </Text>
                  <Text c="dimmed" className={classes.description.concat(' ', 'text-sm xs:text-base')}>
                    Lifetime Free Updates
                  </Text>
                </Flex>
              </Flex>
            </Container>
          </Box>

          <Box>
            <Flex justify={'center'} align={'center'} direction={'column'}>
              <SimpleGrid
                cols={{ base: 1, 'xs': 2, 'sm': 2, 'md': 3 }}
                spacing={{ base: 'sm', 'md': 'md' }}>
                {dataPricePlan.slice(0,3).map((item, index) => {
                  let discountPrice = item.price.discount
                  let linkId = item.linkId
                  let hasDiscountPromotion = false
                  const discount = promotion.discount
                  if(typeof discount === 'number'){
                    if(discount === 50){
                      discountPrice = item.promotion?.['50percent'].price as string
                      linkId = item.promotion?.['50percent'].linkId as string
                      hasDiscountPromotion = true
                    }
                    else if(discount === 30){
                      discountPrice = item.promotion?.['30percent'].price as string
                      linkId = item.promotion?.['30percent'].linkId as string
                      hasDiscountPromotion = true
                    }
                    else if(discount === 15){
                      discountPrice = item.promotion?.['15percent'].price as string
                      linkId = item.promotion?.['15percent'].linkId as string
                      hasDiscountPromotion = true
                    }
                    else if(discount === 10){
                      discountPrice = item.promotion?.['10percent'].price as string
                      linkId = item.promotion?.['10percent'].linkId as string
                      hasDiscountPromotion = true
                    }
                  }
                  return (
                    <Box
                      key={item.plan + ' ' + index}
                      className={'bg-muted '.concat(
                        classes.cardPricing, ' m-0', item.popular ? ' md:my-[-30px]':''
                      )}
                      style={{
                        paddingTop: item.popular ? undefined : rem(48),
                        margin: item.popular ? undefined : 0,
                        border: item.popular ? undefined : `1px solid ${alpha(theme.colors.gray[6], 0.15)}`,
                      }}
                      >
                      {item.popular && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: '100%',
                            backgroundColor: 'rgb(232 89 12 / 15%)',
                            zIndex: 1
                          }}></div>
                      )}
                      {item.popular && (
                        <Box
                          style={{
                            padding: `0 ${rem(16)}`,
                            paddingBottom: rem(16),
                            position: 'relative',
                            zIndex: 2
                          }}>
                          <Text
                            fz={20}
                            ta="center"
                            bg="orange"
                            style={{
                              borderRadius: '0 0 6px 6px',
                              color: '#ffffff'
                            }}>
                            POPULAR CHOICE
                          </Text>
                        </Box>
                      )}
                      <Stack style={{ position: 'relative', zIndex: 2 }}>
                        <Title ta="center">{item.plan.concat(' Plan')}</Title>
                        <Text
                          display={'flex'}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: rem(40),
                            fontWeight: 700
                          }}>
                          {'$' + item.price.discount}
                          <Text span c={'gray'} fz={'md'} ml={10} td={'line-through'} >
                            {'$' + item.price.regular}
                          </Text>
                        </Text>
                        {
                          hasDiscountPromotion &&
                          <Flex align={"center"} justify={"center"} direction={"column"}>
                            <Flex pos={"relative"} align={"center"} justify={"center"} direction={"column"}>
                              <Badge variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 105 }}
                                styles={{
                                  root: {
                                    width: 120, height: 40, fontSize: 26,
                                  },
                                  label: {
                                    display: "flex", alignItems: "center", justifyContent: "center", height: 40
                                  },
                                  // "& > span": {
                                  //   display: "flex", alignItems: "center", justifyContent: "center", height: 40
                                  // }
                                }}
                              >{`$${discountPrice}`}</Badge>
                              <Box style={{
                                position: "absolute",
                                top: "-15px",
                                right: "-15px",
                                backgroundColor: theme.colors.pink[7],
                                color: theme.white,
                                borderRadius: "50px",
                                width: "34px",
                                height: "34px",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 600,
                              }}>{`${promotion.discount}%`}</Box>
                            </Flex>
                          </Flex>
                        }
                        <div>
                          <Button
                            variant='filled'
                            color="orange"
                            size='md'
                            fullWidth
                            onClick={async (e) => {
                              e.preventDefault();
                              const link = linkPayment(linkId);
                              const plan = item.plan;
                              const price = discountPrice;
                              handleBuyNow({link, plan, price})
                            }}>
                              {
                                state.loading && state.price === discountPrice
                                ? <Loader color="rgba(255, 255, 255, 1)" size="sm"  style={{ marginRight: 8 }}/> 
                                : <IconShoppingCartFilled style={{ marginRight: 8 }} />
                              }
                            Buy Now
                          </Button>
                        </div>
                        <div>
                          {[
                            ['Lifetime', 'Family'].some((v) => v === item.plan)
                              ? 'One-time fee.'
                              : 'Renew any time',
                            'All features for 1 PC.',
                            `License valid for ${item.plan.replace('Family', 'Lifetime')}.`
                          ].map((text, i) => {
                            return (
                              <Flex key={item.plan.concat('-', text, '-', `${i}`)}>
                                <div style={{ marginRight: 5 }}>
                                  <IconCheck color={theme.colors.green[6]} />
                                </div>
                                <Text
                                  size="lg" ta='left'
                                  // c={theme.colors.gray[7]}
                                  className='text-gray-600 dark:text-gray-400'
                                >
                                  {text}
                                </Text>
                              </Flex>
                            );
                          })}
                        </div>
                      </Stack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Flex>
          </Box>

          <Card p={0} pos={'relative'} className=' border border-gray-600/15 bg-muted' >
            {
              (hasPromotion || promotion.lifeTimePlan) &&
              <Box className='absolute top-0 right-0 z-[99]'>
                <svg width="172px" height="146px" viewBox="0 0 172 146" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                    <title>AIOTubeDown</title>
                    <g id="page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                        <g id="AIOTubeDown-inner" transform="translate(-1428.000000, -900.000000)">
                            <g id="inner-7" transform="translate(1428.000000, 862.657005)">
                                <g id="inner-6" transform="translate(2.883573, 0.000000)">
                                    <polygon id="polygon" fill="#ED5C5C" transform="translate(100.102078, 89.529910) rotate(40.000000) translate(-100.102078, -89.529910) " points="45.9246354 66.945968 169.707805 65.115518 210.289952 113.479437 -10.0857971 113.944301"></polygon>
                                    <text id="50%-OFF" transform="translate(104.569662, 94.477402) rotate(40.000000) translate(-104.569662, -94.477402) " fontFamily="Arial-BoldMT, Arial" fontSize="30" fontWeight="bold" fill="#FFFFFF">
                                        <tspan x="40.0696617" y="104.977402">{promotion.lifeTimePlan?"Lifetime":`${promotion.discount}% OFF`}</tspan>
                                    </text>
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
              </Box>
            }
            <div className='absolute bottom-0 left-0 w-full h-full z-0 bg-[url(../img/aiotubedown-bundle-box.png)] bg-right bg-cover opacity-10'></div>
            <Flex className=' relative z-10'
              justify={'center'}
              align={'center'}
              direction={'column'}>
              <Stack justify={'center'} align={'center'}>
                <Box p={20} className='mt-0 md:mt-10 transition-all'>
                  <img
                    loading="lazy"
                    src={("/img/aiotubedown-bundle-box.png")}
                    alt={`${AppName} bundle box`}
                    style={{width: "600px", height: "auto"}}
                  />
                </Box>
                <Box px={20}>
                  <Flex justify={'center'} align={'center'} direction={'column'} mb={20} >
                    <Text fw={700} mb={20} className='text-xl xs:text-2xl'>
                      {"Buy "}
                      <Text span c={theme.colors.orange[6]} inherit unstyled>{AppName}</Text>
                      {promotion.lifeTimePlan ? " Lifetime Promotion" : " Now"}
                    </Text>
                    <Text ta={'center'} className='text-sm xs:text-base'>{`Unlimited Download and convert HD, 2k, 4k, 8k videos from YouTube`}<br/>
                    {`and other popular websites like Facebook, Instagram, TikTok, Vimeo, DailyMotion...`}<br/>
                    {`and support any chinese social media sites ( Douyin, Kuaishou... )`}</Text>
                  </Flex>
                  <Flex 
                    className='border border-slate-400 border-dashed rounded-md p-4 mb-8'
                    justify={'center'} align={'center'} direction={'column'}
                  >
                    {
                      promotion.lifeTimePlan
                      ? <Text>Buy one license Lifetime for Your PC now</Text>
                      : <Text>{`Buy ${defaultPlan.plan.toLowerCase()} license for Your PC now`}</Text>
                    }
                    <Text
                      fz={40} fw={700}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {'$' + (
                        promotion.lifeTimePlan ? lifeTimePlan.price.discount : defaultPlan.price.discount
                      )}
                      <Text span c={'gray'} fz={'md'} ml={10} td={'line-through'}>
                        {'$' + (promotion.lifeTimePlan ? lifeTimePlan.price.regular : defaultPlan.price.regular)}
                      </Text>
                    </Text>
                    {
                      hasPromotion &&
                      <Flex pos={"relative"} align={"center"} justify={"center"} direction={"column"} mb={20}>
                        <Badge variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 105 }}
                          styles={{
                            root: {width: 120, height: 40, fontSize: 26},
                            label: {
                              display: "flex", alignItems: "center", justifyContent: "center", height: 40, width: "100%",
                            }
                          }}
                        >{`$${
                          promotion.lifeTimePlan ? lifeTimePlan.price.discount :
                          defaultPlan.promotion?.[promotion.discountString].price
                          }`}</Badge>
                        <Box style={{
                          position: "absolute",
                          top: "-15px",
                          right: "-15px",
                          backgroundColor: theme.colors.pink[7],
                          color: theme.white, 
                          borderRadius: "50px",
                          width: "34px",
                          height: "34px",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                        }}>{`${promotion.discount}%`}</Box>
                      </Flex>
                    }
                    <Box mb={30}>
                      <Button
                        variant='filled'
                        color="orange"
                        size='lg'
                        onClick={async (e) => {
                          e.preventDefault();
                          const linkId = promotion.lifeTimePlan 
                            ? lifeTimePlan.linkId
                            : hasPromotion ? defaultPlan.promotion?.[promotion.discountString].linkId as string
                            : defaultPlan.linkId
                            
                          const link = linkPayment(linkId);
                          const plan = promotion.lifeTimePlan ? lifeTimePlan.plan : defaultPlan.plan;
                          const price = promotion.lifeTimePlan 
                            ? lifeTimePlan.price.discount : defaultPlan.promotion?.[promotion.discountString].price;
                          
                          handleBuyNow({link, plan, price})
                        }}>
                        {
                          state.loading && state.price === (promotion.lifeTimePlan 
                          ? lifeTimePlan.price.discount : defaultPlan.promotion?.[promotion.discountString].price)
                          ? <Loader color="rgba(255, 255, 255, 1)" size="sm"  style={{ marginRight: 8 }}/> 
                          : <IconShoppingCartFilled style={{ marginRight: 8 }} />
                        }
                        Buy Now
                      </Button>
                    </Box>
                  </Flex>
                </Box>
              </Stack>
            </Flex>
          </Card>

          <Box mb={60}>
            <Flex align={"center"} justify={"center"} direction={"column"}>
              <Text fz={18} fw={600} mb={20}>We Accept</Text>
              <Flex gap={8} justify={"space-around"}>
                {
                  [
                    {img: "khqr.png", label: "KHQR Logo"},
                    {img: "aba-logo.jpg", label: "ABA BANK Logo"},
                    {img: "acleda-logo.webp", label: "ACLEDA BANK Logo"},
                    {img: "wing-logo.png", label: "WING BANK Logo"},
                    {img: "true-money.png", label: "TRUE MONEY BANK Logo"},
                  ].map(item => {

                    return (
                      <div key={item.label}>
                        <img
                          loading='lazy' decoding='async'
                          width={40} height={40}
                          src={'/img/'.concat(item.img)} alt={item.label}
                          style={{
                            borderRadius: 8
                          }}
                        />
                      </div>
                    )
                  })
                }
              </Flex>
            </Flex>
          </Box>

          {/* TESTING */}
          {
            // isDev &&
            // <Box
            //   style={{
            //     position: "sticky",
            //     bottom: isDesktopApp ? 80 : 0,
            //     left: 0,
            //     zIndex: 99
            //   }}
            // >
            //   <Flex gap={10}>
            //     {
            //       state.payWith === 'QR Code' &&
            //       <Button
            //         variant='filled'
            //         color="orange"
            //         size='lg'
            //         onClick={async (e) => {
            //           e.preventDefault();
            //           const dataPricePlan = dataPricePlanTesting10c;
            //           const linkId =state.payWith === 'QR Code' 
            //             ? dataPricePlan.linkId.aba : dataPricePlan.linkId.plisio
            //           const link = linkPayment(linkId);
            //           const plan = dataPricePlan.plan;
            //           const price = dataPricePlan.price;
            //           handleBuyNow({link, plan, price})
            //         }}>
            //           3 Days Testing
            //       </Button>
            //     }
            //     {/* <Box>
            //       <MySelect
            //         title={`Select Payment`}
            //         value={state.payWith || 'QR Code'}
            //         // onChange={setVideoResolution}
            //         onChange={(e) => {
            //           handlePayment({ payWith: e })
            //           setDataPricePlan(e === 'QR Code' ? dataPricePlanABA : dataPricePlanPlisio)
            //         }}
            //         data={
            //           ['QR Code',"CRYPTO"]
            //           .map((val) => ({value: val, label: "Pay with " +(val === 'QR Code' ? 'QR Code' : "Crypto Currency")}))
            //         }
            //         w={240}
            //         maxDropdownHeight={200}
            //         radius="md"
            //         size='md'
            //       />
            //     </Box> */}
            //   </Flex>
            // </Box>
          }
          <CopyrightFooter/>
        </div>
      </Container>

      <Modal
        size={"md"}
        centered 
        py={rem(10)}
        classNames={{
          header: 'py-0 px-2 !min-h-10',
          body: 'p-0',
          inner: '',
          content: 'overflow-hidden bg-transparent'
        }}
        opened={openedModal} onClose={closeModal}
        closeOnClickOutside={false} closeOnEscape={false} 
        withCloseButton={!isLoggedIn}
        // scrollAreaComponent={!isDesktopApp ? ScrollArea.Autosize : undefined}
      >
        {/* {state.link && isDesktopApp ?
          <webview 
            src={state.link} preload={preloadJs?.replace('atom','file')} 
            style={{height: "calc(100vh - 0px)"}}
          ></webview>
          : (
          )
        } */}
        {!isLoggedIn ?
          <div className='bg-[var(--web-wash)]'>
            <Flex className='space-y-4 px-4 py-8' align="center" justify="center" direction={'column'} mih={240} >
              <div>
                <Text fz={'sm'} ta="center">
                  You need to login first<br/>
                  click button below to login.
                </Text>
              </div>
              <Flex justify={'center'}>
                <Button variant='filled'
                  onClick={()=>{
                    navigate('/login?from='+encodeURIComponent(location.pathname.replace('/tools/','/products/')))
                  }}
                >Goto Login</Button>
              </Flex>
            </Flex>
          </div>
          : (
            <div>
              <ScrollArea className='grow h-[calc(100vh-60px)]' scrollbarSize={0}>
                <div className='flex flex-col items-center space-y-2.5 px-4 rounded mt-10 bg-[var(--web-wash)]'>
                  <Box  mt={-40} className='space-y-2.5 z-10'>
                    <Group justify="center">
                      <div
                        style={{
                          padding: 4,
                          borderRadius: "100%",
                          boxShadow: "rgba(151, 65, 252, 0.2) 0 15px 30px -5px",
                          backgroundImage: "linear-gradient(144deg,#AF40FF, #5B42F3 50%,#00DDEB)"
                        }}
                      >
                        <Avatar
                          src={avatarUrl(user.avatar)} alt={user.name} 
                          style={{ pointerEvents: 'all' }} size={80}
                        />
                      </div>
                    </Group>
                    <div>
                      <Text ta={'center'}>You access to pro membership for {state.plan} plan.</Text>
                    </div>
                  </Box>
                  {(function(){
                    const __state = {plan: state.plan, price: state.price, payWith: state.payWith};
                    const __dataProduct = {...dataProduct} as Partial<typeof dataProduct>;
                    for(let key of (['dashboardTab','description'] as const)){
                      if(key in __dataProduct){
                        delete __dataProduct[key]
                      }
                    }
                    return(
                      <QrCodePaymentComponent
                        stateDataProduct={encodeJsonBtoa({state: __state, dataProduct: __dataProduct, product})}
                        qrCodeImage={state.qrCodeImage}
                        closeModal={closeModal}
                        handleTryAgain={handleTryAgain} 
                      />
                    )
                  })()}
                </div>
              </ScrollArea>
            </div>
          )
        }
      </Modal>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'green', type: 'dots', size: 100 }}  />
    </div>
  );
}

type AdditionalFields = {
  amount: string
  remark: string
  full_name: string
  email: string
  phone: string
}

export async function PreCheckout(
  linkId?: string, additionalFields?: Partial<AdditionalFields>,
  callback?: (isSuccessful:boolean, data: any) => void
){
  const body = JSON.stringify({
    data: encodeJsonBtoa({
      linkId: linkId || "ABAPAYqV296653F",
      additionalFields,
    })
  });
  await fetch("/api/v1/payment/gateway/pre-checkout", {method: "POST", headers, body})
  .then(async(res) => {
    const data = await res.json();
    logger?.log("data",data);
    const isSuccessful = data && data.message === "success" && data.download_qr;
    callback?.(isSuccessful, data);
  })
  .catch(err => logger?.log("error", err))
}

interface QrCodePaymentComponentProps {
  stateDataProduct: string
  qrCodeImage?: string
  openModal?: () => void
  closeModal: () => void
  handleTryAgain: () => void
}
const QrCodePaymentComponent = ({
  stateDataProduct,
  qrCodeImage,
  closeModal,
  handleTryAgain,
}: QrCodePaymentComponentProps) => {
  const [state, setState] = useSetState({
    qrCodeImage: isDev ? qrCodeImage?.split('49008')[1] : qrCodeImage,
    expiredTime: '03:00',
    action: 'request_qr'
  })

  useEffect(()=> {
    var action = 'request_qr';
    var tran_id = null;
    var tran_id_no_aba = null;

    var second = -1;
    var timer = setInterval(async()=>{
      if(second >= 180 || action === 'approved'){
        clearInterval(timer);
      }
      second++;
      if(second <= 180){
        const expiredTime = formatDuration(180-second);
        setState({expiredTime})
      }
    },1000);

    var __timer = setInterval(async()=>{
      if(second > 180 || action === 'approved'){
        clearInterval(__timer)
        if(action === 'approved'){
          setState({action})
        } else {
          action = 'expired'
          setState({action})
        }
        logger?.log("action", action)
      } else {
        const body = JSON.stringify({data: stateDataProduct})
        await fetch("/api/v1/payment/gateway/check-payment", {method: "POST", headers, body})
        .then(async(res) => {
          const __data = await res.json();
          logger?.log("check-payment data",__data);
          tran_id = __data?.status?.tran_id
          action = __data?.data?.action
          if(__data?.errorCode || __data?.error){
            second = 180
            action = 'expired'
          }
          setState({action})
          if(__data.message?.tran_id){
            tran_id_no_aba = __data.message?.tran_id
          }
        })
      }
    },3000);

    return () => {
      clearInterval(timer);
      clearInterval(__timer);
    }
  },[])

  const isExpiredOrApproved = ['approved','expired','scanned'].some(v => v === state.action);
  return (
    <div className='space-y-2.5'>
      <Box className='w-full transition-all-child'>
        <Skeleton visible={!state.qrCodeImage} mah={!state.qrCodeImage ? 400 : undefined} radius={26}>
          <Flex align={'center'} justify={'center'} direction={'column'} pos={'relative'} >
            <Flex className={'absolute top-[50px] sm:top-[70px] right-5 sm:right-6 duration-1000 '.concat(state.action === 'scanned' ? 'z-[11]':'z-[9]')}
              align={'center'} justify={'center'} 
              hidden={['00:00','03:00'].some(v => state.expiredTime.trim() === v) || !state.qrCodeImage}
            >
              <Text fz={13} fw={600} c='cyan'>{state.expiredTime}</Text>
            </Flex>
            {
              isExpiredOrApproved && (
                <Box pos={'absolute'} top={0} w={'100%'} h={'100%'} className='bg-slate-50/80 rounded-[26px] z-10 max-w-[220px] sm:max-w-72'>
                  <Flex align={'center'} justify={'center'} direction={'column'} w={'100%'} h={'100%'}>
                    <Text fz={22} fw={700} c={'cyan'}>
                    {
                      state.action === 'expired' ? "Qr Code is expired" 
                      : state.action === 'approved' ? "Your are PAID"
                      : state.action === 'scanned' ? "Qr Code is scanned"
                      : "Waiting. . ."
                    }
                    </Text>
                    { state.action === 'approved' &&
                      <Box mt={10} className='transition-all'>
                        <ThemeIcon size={100} radius={'100%'} variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 105 }}>
                          <IconCheck style={{ width: '70%', height: '70%' }} />
                        </ThemeIcon>
                      </Box>
                    }
                  </Flex>
                </Box>
              )
            }
            <Card p={0} radius={26}>
              <Box component='img' opacity={isExpiredOrApproved ? 0.3:1} src={state.qrCodeImage} alt="qr-code payment" width={300} height={400} className='w-[220px] sm:w-72 h-auto rounded-[26px]' />
            </Card>
          </Flex>
        </Skeleton>
      </Box>
      <Flex align={'center'} justify={'space-between'} mb={140} gap={16}>
        <Button variant='filled' color='red'
          onClick={closeModal}
        >Close</Button>
        <Button loading={!isExpiredOrApproved} loaderProps={{type: 'dots'}}
          onClick={()=>{
            switch (state.action) {
              case 'expired':
                handleTryAgain()
                break;
            
              case 'approved':
                window.location.href = window.origin + '/dashboard'
                break;
            
              default:
                break;
            }
          }}
        >
          {
            state.action === 'expired' ? "Try again" 
            : state.action === 'approved' ? "Goto Dashboard"
            : "Waiting. . ."
          }
        </Button>
      </Flex>
    </div>
  )
}