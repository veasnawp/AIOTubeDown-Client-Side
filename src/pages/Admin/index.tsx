import { useEffect, useState } from "react";
import DataTable, { TableColumnDef } from "@/components/data-table";
import { ActionIcon, Avatar, Box, Button, Card, Checkbox, Collapse, Divider, Flex, Group, LoadingOverlay, Menu, Select, Stack, Text, Textarea, TextInput, Tooltip } from "@mantine/core";

import { IconArrowsUpDown, IconChevronUp, IconCopy, IconCopyCheck, IconDots, IconEdit, IconEye, IconHeart, IconPlus, IconSearch, IconSortAscendingLetters, IconSortDescendingLetters } from "@tabler/icons-react";
import { useAuth, useDownload, useLicenseRecord } from "@/contexts";
import { defaultHeaders } from "@/api/backend/config";
import axios from "axios";
import { useFetch, useSetState } from "@mantine/hooks";
import { MainDashboard } from "../Dashboard/dashboard";
import logger from "@/helper/logger";
import { useNavigate } from "react-router-dom";
import { ModalComponent, useModalState } from "@/components/mantine-reusable/ModalComponent";
import { getOneProductFilter } from "../Profile";
import { addDays, dataProducts, getActivationDays, getNewExpireDate } from "../Products/data";
import { discountList, DiscountString, selectDataPrice } from "../Products/AIOTubeDown";
import { paymentMethodData } from "@/contexts/license-records";


interface TableMetaOptions {
  useAuthData: ReturnType<typeof useAuth>
  useLicenseRecordData: ReturnType<typeof useLicenseRecord>
  dataCurrentRow?: UserPayload
  setDataCurrentRow: React.Dispatch<React.SetStateAction<UserPayload | undefined>>
  // setEditRecord: React.Dispatch<React.SetStateAction<FinancialRecord>>
  // deleteRecord: (record: FinancialRecord) => void
}

const columns: TableColumnDef<UserPayload>[] = [
  {
    id: "select",
    className: {
      header: "w-12",
      cell: "w-12",
    },
    header: ({ table }) => (
      <Tooltip label="Select all" disabled={table.options.data.length <= 0}>
        <Checkbox
          color="green"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={(e) =>
            table.toggleAllPageRowsSelected(!!e.currentTarget.checked)
          }
          aria-label="Select all"
        />
      </Tooltip>
    ),
    cell: ({ row }) => (
      <Tooltip label={`Select row ${row.index+1}`}>
        <Checkbox
          color="green"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.currentTarget.checked)}
          aria-label="Select row"
        />
      </Tooltip>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    className: {
      header: "text-xs sm:text-sm text-left",
      cell: 'group'
    },
    header: ({ column }) => {
      // const columnDef = column.columnDef as TableColumnDef<IYouTube>
      // const filename = columnDef.accessorKey
      const sorted = column.getIsSorted();
      const IconArrowUpDown = sorted === "asc" ? IconSortAscendingLetters : sorted === "desc" ? IconSortDescendingLetters : IconArrowsUpDown
      return (
        <div className="flex gap-1 items-center justify-start text-xs sm:text-sm py-2">
          {`User`}
          <Tooltip
            label={`${sorted ? "Sorted": "Sort"} by User's Name ${sorted === "desc" ? "descending" : "ascending"}`}
          >
            <IconArrowUpDown
              size={14} color="currentColor"
              className={"cursor-pointer".concat(sorted ? " text-green-600":"")}
              onClick={() => column.toggleSorting()}
            />
          </Tooltip>
        </div>
      );
    },
    cell: ({ row, table }) => {
      const {
        useAuthData,
        useLicenseRecordData,
        dataCurrentRow, setDataCurrentRow
      } = table.options.meta as TableMetaOptions
      const { stateHelper } = useAuthData;
      const { user } = useAuthData;

      let $user = row.original

      const isUserDesktopApp = $user.email.endsWith('@aiotubedown.com') && $user.email.replace('@aiotubedown.com',' | Machine ID');
      return (
        <div>
          <Flex gap={'xs'}>
            <Group gap="sm" align="center" className="grow">
              <Avatar size={30} src={$user.avatar} radius={30} />
              <Flex gap={4} direction={'column'}>
                <Text size="sm" fw={500}>
                  {$user.name}
                </Text>
                <Text size="sm" fw={500}>
                  {isUserDesktopApp ? isUserDesktopApp : $user.email}
                </Text>
              </Flex>
            </Group>
            {}
            <Flex direction={'column'} justify={'center'} align={'center'}>
              <Box ml={16}>
                <Group gap="sm" align="center">
                  <ActionIcon title="Action"
                    variant="filled" color="green"
                    size={30}
                    radius={'100%'}
                    onClick={()=> setDataCurrentRow($user)}
                  >
                    <IconEdit style={{width: '80%', height: '80%'}} />
                  </ActionIcon>
                  <TableActionMenu data={$user} />
                </Group>
              </Box>
            </Flex>
          </Flex>
        </div>
      )
    },
  },
  // {
  //   className: {
  //     header: "text-xs sm:text-sm text-right",
  //     cell: "relative text-right",
  //   },
  //   header: "Action",
  //   cell() {
      
  //     return (
  //       <div>
  //         <TableActionMenu />
  //       </div>
  //     )
  //   },
  // },
];

interface TableActionMenuProps {
  data: UserPayload
}
function TableActionMenu({
  data,
}: TableActionMenuProps){

  const [state, setState] = useSetState({
    isCopy: false,
  })

  const defaultMenu = (label:string, copyText?:string)=>{
    return {
      label: label,
      icon: function () {
        const Icon = state.isCopy ? IconCopyCheck : IconCopy;

        return <Icon
          size={18}
          stroke={1.5}
          color={state.isCopy ? 'green':undefined}
        />
      },
      onClick(){
        if(copyText){
          window.navigator.clipboard.writeText(copyText);
          setState({isCopy: true});
          setTimeout(()=> setState({isCopy: false}), 1500)
        }
      }
    }
  }

  let dataMenus = [
    defaultMenu('Copy ObjectId', data._id),
    defaultMenu('Copy Name', data.name),
    defaultMenu('Copy Email', data.email),
    defaultMenu('Copy Machine ID', data.options?.machineId),
  ];

  return (
    <Menu transitionProps={{ transition: 'pop' }} position="left-end" withinPortal shadow="sm">
      <Menu.Target>
        <ActionIcon title="Action"
          variant="light"
          // color={theme.primaryColor}
          size={30}
          radius={'100%'}
          // className={classes.menuControl}
        >
          <IconDots  />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {
          [...dataMenus].map(item => {

            return (
              <Menu.Item key={item.label} fw={600}
                leftSection={
                  <Text unstyled span c={'blue'}>
                    <item.icon/>
                  </Text>
                }
                onClick={item.onClick}
              >
                {item.label}
              </Menu.Item>
            )
          })
        }
      </Menu.Dropdown>
    </Menu>
  )
}

// export function useAbortController() {
//   const [controller] = useState(() => new AbortController());

//   // Abort the request on component unmount
//   useEffect(() => () => controller.abort(), [controller]);

//   return controller;
// }

export default function AdminPage() {
  const navigate = useNavigate();
  const useAuthData = useAuth();
  const useLicenseRecordData = useLicenseRecord();
  const useDownloadData = useDownload();
  const { user, stateHelper, setStateHelper } = useAuthData;
  const { addLicenseRecord, updateLicenseRecord } = useLicenseRecordData;
  const { downloadSettings } = useDownloadData;


  const [role, setRole] = useState<(typeof user)['role']>();

  const [dataCurrentRow, setDataCurrentRow] = useState<UserPayload>();
  
  const [stateFetch, setStateFetch] = useSetState({
    start: 0, end: 10,
    licenseRecords: [] as LicenseRecord[],
    licenseSelected: undefined as LicenseRecord | undefined,
    currentLicenseByToolName: '',
    planAndPrice: '',
    plan: '',
    price: '',
    discount: '' as DiscountString,
    dataProduct: {} as DataProduct,
    payWith: 'QR Code' as LicenseRecord['paymentMethod'],
    loadingUpdateLicense: false,
    collapse: true,
    userInfoForUpdate: {} as Partial<UserPayload>,
    loadingUpdateUserInfo: false,
  });
  const { data, loading, error, refetch, abort } = useFetch<UserPayload[]>(
    `/api/v1/users?_start=${stateFetch.start}&_end=${stateFetch.end}&_with_licenses=true`, { method: "GET", headers: defaultHeaders.headers}
  );
  // const data = [user], loading = false, refetch = () => {}
  const [stateData, setStateData] = useSetState({
    data: [...(data||[])] as UserPayload[],
    pushNewData: [] as UserPayload[],
    inputUserId: '',
    loading: false,
  });

  let dataTable = [...stateData.data, ...stateData.pushNewData];

  if(stateData.inputUserId){
    dataTable = dataTable.filter(dt => dt._id === stateData.inputUserId)
  }

  useEffect(()=>{
    if(data){
      setStateData({data: [...data]})
    }
  },[data, refetch])


  const { 
    stateModalManager, 
    openModalManager, closeModalManager 
  } = useModalState();

  useEffect(()=>{
    if(dataCurrentRow){
      const $user = dataCurrentRow;
      const licenses = $user.licenses || [];
      const options = $user.options;
      let license: LicenseRecord | undefined;
      if(licenses.length > 0){
        license = licenses.filter(l => l.toolName === (stateFetch.currentLicenseByToolName || licenses[0]?.toolName))?.[0];
      }
      stateFetch.licenseSelected = license;
      
      const isUserDesktopApp = $user.email.endsWith('@aiotubedown.com') && $user.email.replace('@aiotubedown.com',' | Machine ID');
      openModalManager({
        title: `Edit User's Data`,
        childrenWithScrollArea: true,
        children: (
          <Stack p={16} mb={100}>
            <Group>
              <Text className="min-w-32">Name: </Text>
              <TextInput className="grow" readOnly value={$user.name} />
            </Group>
            <Group>
              <Text className="min-w-32">Username: </Text>
              <TextInput className="grow" readOnly value={$user.username.endsWith('aiotubedown.com')?"":$user.username} />
            </Group>
            <Group>
              <Text className="min-w-32">Email: </Text>
              <TextInput className="grow" readOnly value={isUserDesktopApp ? isUserDesktopApp : $user.email} />
            </Group>
            <Group justify="space-between">
              <Group>
                <Text className="min-w-32">Role: </Text>
                <TextInput className="grow" readOnly value={$user.role} />
                <Select
                  className="grow"
                  placeholder='Select One'
                  value={stateFetch.userInfoForUpdate?.role || $user.role}
                  onChange={(val) => {
                    if(val){
                      setStateFetch({ userInfoForUpdate: {...stateFetch.userInfoForUpdate, role: val} }) 
                    }
                  }}
                  data={['admin','moderator','user']}
                  checkIconPosition='right'
                  comboboxProps={{withinPortal: false, shadow: 'md'}}
                  w={130}
                  miw={100}
                />
              </Group>
              <Group>
                <Text className="min-w-32">Provider: </Text>
                <TextInput className="grow" readOnly value={$user.provider} />
              </Group>
            </Group>
            <Group justify="space-between">
              <Group>
                <Text className="min-w-32">Created At: </Text>
                <TextInput className="grow" readOnly value={new Date($user.createdAt as string).format("yyyy-mm-dd | h:MM:ss TT")} />
              </Group>
              <Group>
                <Text className="min-w-32">Updated At: </Text>
                <TextInput className="grow" readOnly value={new Date($user.updatedAt as string).format("yyyy-mm-dd | h:MM:ss TT")} />
              </Group>
            </Group>
            <Button
              size="lg" w={'fit-content'}
              loading={stateFetch.loadingUpdateUserInfo}
              onClick={()=> {
                setStateFetch({loadingUpdateUserInfo: true});
              }}
            >{"Update User Info"}</Button>
            <Divider/>
            <Flex align={'center'} justify={'center'} >
              <Text fz={'xl'} fw={700} c={'cyan'}>Product License</Text>
            </Flex>
            <Group>
              <Text className="min-w-32">Select Product: </Text>
              <Select
                className="grow"
                placeholder='Select One'
                value={stateFetch.currentLicenseByToolName || license?.toolName}
                onChange={(val) => { 
                  const dataProduct = [...dataProducts].filter(dt => dt.productName === val)?.[0];
                  setStateFetch((v) => ({dataProduct, currentLicenseByToolName: val || v.currentLicenseByToolName})) }
                }
                data={[...dataProducts].map(dt => ({value: dt.productName, label: dt.productName + " | " + dt.productId}))}
                checkIconPosition='right'
                comboboxProps={{withinPortal: false, shadow: 'md'}}
                w={130}
                miw={100}
              />
            </Group>
            {
              license && (
                function(){
                  const {
                    product, isTrailOrExpired, isPending, isActivated, isExpired, isLifeTime,
                    statusColor, viewMoreText, 
                    expiredDays, expiredText, expiredColor
                  } = getOneProductFilter(licenses, license.productId)
                  return(
                    <>
                    <Group>
                      <Text className="min-w-32">Expire At: </Text>
                      <TextInput className="grow transition-all" readOnly
                        classNames={{
                          input: ''.concat(isActivated ? 'text-green-500' : isPending ? 'text-orange-500' : 'text-red-500')
                        }}
                        value={new Date(license.expiresAt).format("yyyy-mm-dd | h:MM:ss TT") + ' | ' + expiredText}
                      />
                    </Group>
                      <Box>
                        <Textarea
                          readOnly
                          value={
                            JSON.stringify(license, null, 4)
                          }
                          autosize={!stateFetch.collapse}
                          maxRows={22}
                          rightSection={
                            <ActionIcon variant="light" className="transition-all"
                              onClick={()=> setStateFetch({collapse: !stateFetch.collapse})}
                            ><IconChevronUp/></ActionIcon>
                          }
                          rightSectionProps={{className: ''.concat(stateFetch.collapse ? '' : 'top-2.5 block transition-all')}}
                        />
                      </Box>
                    <Collapse in={!stateFetch.collapse} >  
                    </Collapse>

                    </>
                  )
                }
              )()
            }
            <Group>
              <Text className="min-w-32">{license ? "Update License: " : "Add New License"}</Text>
              <Select
                className="grow"
                placeholder='Select Plan'
                value={stateFetch.planAndPrice || (license?.currentPlan && license?.currentPrice ? license.currentPlan + ' | ' + license.currentPrice : "")}
                onChange={(val) => {
                  if(val?.includes('|')){
                    const planAndPriceSplit = val.split('|');
                    const plan = planAndPriceSplit[0]?.trim();
                    const price = Number(planAndPriceSplit[1]?.trim()).toFixed(2);
                    setStateFetch({ planAndPrice: val, plan, price }) 
                  }
                }}
                data={
                  [...selectDataPrice(stateFetch.discount, stateFetch.payWith)]
                  .map(val => ({value: val.plan + ' | ' + val.price, label: val.plan + ' | ' + (val.price === '0' ? "Free Trial":val.price)}))
                }
                checkIconPosition='right'
                comboboxProps={{withinPortal: false, shadow: 'md'}}
              />
            </Group>
            <Group justify="space-between">
              <Group>
                <Text className="min-w-32">Pay With: </Text>
                <Select
                  className="grow"
                  placeholder='Select One'
                  value={stateFetch.payWith}
                  onChange={(val) => {
                    if(val){
                      setStateFetch({ payWith: val }) 
                    }
                  }}
                  data={[...paymentMethodData]}
                  checkIconPosition='right'
                  comboboxProps={{withinPortal: false, shadow: 'md'}}
                  w={130}
                  miw={100}
                />
              </Group>
              <Group>
                <Text className="min-w-20">Discount: </Text>
                <Select
                  className="grow"
                  placeholder='Select Discount'
                  value={stateFetch.discount}
                  onChange={(val) => {
                    if(val){
                      setStateFetch({ discount: val }) 
                    }
                  }}
                  data={['0percent',...discountList].map(v => ({value: v, label: v.replace('percent','%')}))}
                  checkIconPosition='right'
                  comboboxProps={{withinPortal: false, shadow: 'md'}}
                  w={160}
                  miw={100}
                />
              </Group>
            </Group>
            <Button
              w={'fit-content'} size="lg"
              loading={stateFetch.loadingUpdateLicense}
              onClick={()=> {
                setStateFetch({loadingUpdateLicense: true});
              }}
            >{license ? "Update Now" : "Add New"}</Button>

          </Stack>
        )
      })
    }
  },[dataCurrentRow, stateFetch])


  useEffect(()=>{
    (async function() {
      const $user = dataCurrentRow;
      if(stateFetch.loadingUpdateUserInfo && $user && $user._id){
        const data = {...stateFetch.userInfoForUpdate}
        const res = await axios.put('/api/v1/users/'+$user._id, data, defaultHeaders);
        logger?.log(res.data)
        if(res.data?._id){
          setDataCurrentRow({...$user, ...res.data})
        }
        setTimeout(()=>{
          setStateFetch({loadingUpdateUserInfo: false});
        },2000)
      }
      })()
  },[stateFetch.loadingUpdateUserInfo]);

  useEffect(()=>{
    (async function() {
      const $user = dataCurrentRow;
      if(stateFetch.loadingUpdateLicense && $user && $user._id){
        logger?.log(stateFetch, $user);
        const state = {plan: stateFetch.plan, price: stateFetch.price, payWith: stateFetch.payWith};
        const status = stateFetch.price === "0.00" ? "trial" : undefined;
        let dataProductUpdated: LicenseRecord[]|undefined;
        if(stateFetch.licenseSelected){
          const product = stateFetch.licenseSelected;
          dataProductUpdated = await updateProductLicense(updateLicenseRecord, $user, product, state, status)
        } else {
          dataProductUpdated = await addNewProductLicense(addLicenseRecord, $user._id, stateFetch.dataProduct, state, status)
        }
        logger?.log("dataProductUpdated",dataProductUpdated)
        setDataCurrentRow(undefined);
        setStateFetch({loadingUpdateLicense: false, collapse: true});
        closeModalManager();
      }
      })()
  },[stateFetch.loadingUpdateLicense]);


  useEffect(()=>{
    setRole(user.role);
    if(user.role === 'user'){
      navigate('/dashboard', {replace: true})
    }
  },[user]);


  return (
    <MainDashboard
      classNames={{
        inner: "*:shadow-none"
      }}
      renderBelowContent={
        <>
        <ModalComponent
          size={'100%'}
          closeOnEscape={false} closeOnClickOutside={false} topRightCloseButton
          onClose={()=>{
            setDataCurrentRow(undefined);
            setStateFetch({collapse:true})
            closeModalManager();
          }}
          {...stateModalManager}
        />
        </>
      }
    >
      {
        role !== "admin" ? 
        <LoadingOverlay 
          visible={true} zIndex={1000} 
          overlayProps={{ radius: "sm", blur: 4 }} 
          loaderProps={{ color: 'green', type: 'oval', size: 'xl' }}  
        />
        : (
          <>
          <Card>
            <Button loading={loading}
              onClick={()=> refetch()}
            >Refresh Data</Button>
          </Card>
          <Card>
            <Group>
              <TextInput
                className="grow"
                placeholder="Enter User's ID"
                value={stateData.inputUserId}
                onChange={(e)=> {
                  const userId = e.currentTarget.value;
                  setStateData({inputUserId: userId})
                }}
              />
              <Button px={6} color={'green'} loading={stateData.loading} title="Push User Data To Table"
                onClick={async(e)=>{
                  const userId = stateData.inputUserId;
                  setStateData({loading:true});
                  let pushNewData = stateData.pushNewData;
                  if(userId){
                    e.preventDefault();
                    const res = await axios.post('/api/v1/users/'+userId+'?_with_licenses=true', { headers: defaultHeaders.headers});
                    if(res.status === 200 && res.data._id){
                      pushNewData = [...pushNewData, res.data]
                    }
                  }
                  setStateData({pushNewData, loading:false});
                }}
              ><IconPlus/></Button>
            </Group>
          </Card>
          <Card>
            <DataTable
              // className={""}
              columns={columns}
              data={dataTable}
              // onTableChange={(table, resetTable) => {
              //   // table.resetRowSelection();
              // }}
              // deps={[]}
              // onRowSelection={(table, resetTable) => {
              //   // table.resetRowSelection();
              // }}
              reactTableProps={{
                meta: {
                  useAuthData,
                  useLicenseRecordData,
                  dataCurrentRow,
                  setDataCurrentRow,
                },
              }}
              disableDefaultAdvancedFilter
            />
          </Card>
          </>
        )
      }
    </MainDashboard>
  )
}




export async function updateProductLicense(
  updateLicenseRecord: ReturnType<(typeof useLicenseRecord)>['updateLicenseRecord'],
  user: UserPayload,
  product: LicenseRecord,
  state: {plan: string; price: string, payWith: string} & Record<string,any>,
  status?: LicenseRecord['status'],
){
  const pricePlan = state.plan;
  const currentDate = new Date();
  let newExpireDate = getNewExpireDate(pricePlan);

  const license = (user.licenses?.length ? user.licenses.filter(l => l._id === product._id)?.[0] : {}) as LicenseRecord
  if(license && license.expiresAt){
    const isExpired = currentDate.getTime() > new Date(license.expiresAt).getTime();
    if(!isExpired){
      const expireDaysLeft = getActivationDays(currentDate, license.expiresAt)
      const addMoreExpireDays = getActivationDays(currentDate, newExpireDate)
      newExpireDate = addDays(expireDaysLeft+addMoreExpireDays)
    }
  }

  const historyLicenseBough = product.historyLicenseBough || [];
  return await updateLicenseRecord(product._id as string, {
    status: status || 'activated',
    modifyDateActivated: currentDate.toISOString(),
    activationDays: getActivationDays(currentDate, newExpireDate),
    expiresAt: newExpireDate,
    currentPlan: pricePlan,
    historyLicenseBough: [...historyLicenseBough, `${currentDate}|${newExpireDate}|${state.price}`],
    paymentMethod: state.payWith,
  }, user._id)
}

export async function addNewProductLicense(
  addLicenseRecord: ReturnType<(typeof useLicenseRecord)>['addLicenseRecord'],
  userId: string,
  dataProduct: DataProduct,
  state: {plan: string; price: string, payWith: string} & Record<string,any>,
  status?: string
){
  const pricePlan = state.plan;
  const currentDate = new Date().toISOString();
  const newExpireDate = getNewExpireDate(pricePlan);

  return await addLicenseRecord({
    userId: userId,
    status: status || 'activated',
    modifyDateActivated: currentDate,
    activationDays: getActivationDays(currentDate, newExpireDate),
    expiresAt: newExpireDate,
    currentPlan: pricePlan,
    historyLicenseBough: [`${currentDate}|${newExpireDate}|${state.price}`],
    toolName: dataProduct.productName,
    productId: dataProduct.productId,
    category: dataProduct.category,
    paymentMethod: state.payWith,
  }, userId)
}