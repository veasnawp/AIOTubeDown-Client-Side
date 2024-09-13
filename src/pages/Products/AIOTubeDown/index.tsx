import { Title, Text, Button, Container, Flex, Box, SimpleGrid, Stack, rem, Paper, useMantineTheme, Badge, alpha, Card, Modal, LoadingOverlay } from '@mantine/core';
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
import { useNavigate } from 'react-router-dom';
import { CopyrightFooter } from '@/pages/Dashboard/dashboard';

type DiscountString = "50percent" | "30percent" | "15percent" | "10percent" | (string & {})

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


const dataPricePlanABA = [
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

const dataPricePlanPlisio = [
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

const dataPricePlanTesting = {
  plan: "3 day",
  linkId: {
    aba: "ABAPAYeY231734K", plisio: "662bce362f0d539e9108d2f5"
  },
  price: "$1",
}

const dataPricePlanTesting10c = {
  plan: "3 day",
  linkId: {
    aba: "ABAPAYMG293530z", plisio: "662bce362f0d539e9108d2f5"
  },
  price: "$1",
}


export function AIOTubeDownPage({...other}) {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dataProduct = dataProducts[0];
  const { licenseRecords, addLicenseRecord, updateLicenseRecord } = useLicenseRecord();
  const product = (licenseRecords.filter(dt => dt.productId === dataProduct.productId)?.[0] || {}) as Partial<LicenseRecord>;

  const currentPromotion = {
    promotion: {
      lifeTimePlan: false,
      discount: 15,
    }
  };

  const [openedModal, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [state, setState] = useSetState({
    link: '',
    plan: '',
    price: '',
    payWith: 'QR Code' as LicenseRecord['paymentMethod'],
    activePayment: false,
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


  async function updateLicense(){
    const pricePlan = state.plan;
    const currentDate = new Date().toISOString();
    const newExpireDate = getNewExpireDate(pricePlan);

    if(user._id){
      if(!product._id){
        return await addLicenseRecord({
          userId: user._id,
          status: 'activated',
          modifyDateActivated: currentDate,
          activationDays: getActivationDays(currentDate, newExpireDate),
          expiresAt: newExpireDate,
          currentPlan: pricePlan,
          historyLicenseBough: [`${currentDate}|${newExpireDate}|${state.price}`],
          toolName: dataProduct.productName,
          productId: dataProduct.productId,
          category: dataProduct.category,
          paymentMethod: state.payWith,
        })
      } else {
        const historyLicenseBough = product.historyLicenseBough || [];
        return await updateLicenseRecord(product._id, {
          status: 'activated',
          modifyDateActivated: currentDate,
          activationDays: getActivationDays(currentDate, newExpireDate),
          expiresAt: newExpireDate,
          currentPlan: pricePlan,
          historyLicenseBough: [...historyLicenseBough, `${currentDate}|${newExpireDate}|${state.price}`],
        })
      }
    }
  }

  // useEffect(()=>{
  //   logger?.log("state",state)
  // },[state])

  useEffect(()=>{
    if(openedModal){
      setTimeout(()=>{
        const webview = document.querySelector('webview') as Element & {openDevTools: () => void};
        if(webview){
          webview.addEventListener('dom-ready', () => {
            if(isDev)
            webview.openDevTools()
          })
        }
      },2000)

      webContentSend("get-value:payment-is-paid", (_:any) => {
        let timer = setTimeout(async () => {
          clearTimeout(timer);
          const dataSuccess = await updateLicense()
          console.clear();
          if(dataSuccess){
            logger?.log("payment success", dataSuccess);
            navigate('/dashboard');
          }
          closeModal();
        }, 2000)
      })
      webContentSend("get-value:payment-is-expired", (__expiredSession) => {
        const expiredSession = __expiredSession as string;
        logger?.log(expiredSession)
        const link = state.link
        setState({link: ''})
        closeModal();
        setTimeout(()=>{
          openModal();
          setState({link: link})
        },1500)
      })
    }
  },[openedModal])

  

  const linkPayment = (id:string) => (state.payWith === 'QR Code' ? 'https://link.payway.com.kh/'+id : `https://plisio.net/invoice/${id}?ttcodettool=true&disable-cdn=true&disable-main-js=true&executeScript=true`);


  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    setTimeout(()=>{
      setLoading(false)
    },1500)
  },[])

  // if(loading){
  //   return (
  //     <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'green', type: 'dots', size: 100 }}  />
  //   )
  // }

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
                              setState({link, plan, price})
                              if(!isDesktopApp){
                                window.open(link)
                              } else {
                                setTimeout(()=>{
                                  openModal();
                                },10)
                              }
                            }}>
                            <IconShoppingCartFilled style={{ marginRight: 8 }} />
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
                          
                          setState({link, plan, price})
                          if(!isDesktopApp){
                            window.open(link)
                          } else {
                            setTimeout(()=>{
                              openModal();
                            },10)
                          }
                        }}>
                        <IconShoppingCartFilled style={{ marginRight: 8 }} />
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

          {
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
          //           setState({link, plan, price})
          //           if(!isDesktopApp){
          //             window.open(link)
          //           } else {
          //             setTimeout(()=>{
          //               openModal();
          //             },10)
          //           }
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
        size="100%" centered 
        py={rem(10)}
        classNames={{
          header: 'py-0 px-2 !min-h-10',
          body: 'p-0',
          inner: '',
          content: 'overflow-hidden bg-[var(--web-wash)]'
        }}
        opened={openedModal} onClose={closeModal}
        closeOnClickOutside={false} closeOnEscape={false} withCloseButton={true} 
      >
        {state.link && isDesktopApp &&
          <webview 
            src={state.link} preload={preloadJs?.replace('atom','file')} 
            style={{height: "calc(100vh - 0px)"}}
          ></webview>
        }
      </Modal>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'green', type: 'dots', size: 100 }}  />
    </div>
  );
}