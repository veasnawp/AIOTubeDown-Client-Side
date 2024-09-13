import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { categories, childCategories, paymentMethodData, useFinancialRecord } from "@/contexts"
import { CircleDollarSignIcon, X } from "lucide-react"
import { v4 as uuid } from 'uuid';

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isNumber, sleep } from "@/utils"
import { Select } from "@/components/select"
import { countryFlagIcons as Icons } from "./icons"
import { Box } from "@/components/box"

interface DrawerAddMoneyProps {
  title: string;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open:boolean) => void;
  editRecord?: FinancialRecord;
  drawerTriggerProps?: React.ComponentProps<typeof DrawerTrigger>
}

export function DrawerAddMoney({
  title,
  open,
  onClose,
  onOpenChange,
  editRecord,
  drawerTriggerProps
}: DrawerAddMoneyProps) {
  const {addRecord, updateRecord, exchangeRateData} = useFinancialRecord();
  const [isOpen, setIsOpen] = React.useState(open || false);

  const __isIncome = title === "Money In" || title === "Income"
  const [isIncome, setIsIncome] = React.useState(__isIncome);

  const __record = {
    paymentMethod: paymentMethodData[0],
    preAmount: ''
  } as FinancialRecord & {preAmount?: string}
  const [record, setRecord] = React.useState(__record);
  const handleRecordChange = (updateRecord: Partial<typeof record>) => {
    const recordUpdated = {...record, ...updateRecord}
    setRecord({...recordUpdated, amount: Number(recordUpdated.preAmount)});
    return recordUpdated;
  }
  const [isRequire, setIsRequire] = React.useState(false);

  const [exchangeRate, setExchangeRate] = React.useState({
    currency: 'USD',
    amount: ''
  });
  const currency = exchangeRate.currency
  const isUSD = currency === 'USD'
  if(record.preAmount){
    const rate = isUSD
    ? exchangeRateData.default 
    : 1 / exchangeRateData.default

    exchangeRate.amount = ((Number(record.preAmount) * rate).toFixed(2)).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
  }

  const onSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if(!(record.amount && isNumber(record.amount) && record.amount !== 0) || !record.category){
      setIsRequire(true);
      return;
    }
    if(record.id){
      const updateEditRecord = {...record, currency}
      if(!isIncome){
        updateEditRecord.amount = record.amount * -1
      }
      updateEditRecord.originalAmount = updateEditRecord.amount
      if(!isUSD){
        updateEditRecord.amount = updateEditRecord.amount / exchangeRateData.default
      }
      for await (const _ of Array(3).fill(0)){
        const records = await updateRecord(record.id, updateEditRecord);
        if(records){
          break;
        } else {
          await sleep(0.1);
        }
      }
    } else {
      const newRecord = {
        ...record,
        id: uuid(),
        date: new Date().toISOString(),
        currency
      }
      if(!isIncome){
        newRecord.amount = record.amount * -1
      }
      newRecord.originalAmount = newRecord.amount
      if(!isUSD){
        newRecord.amount = newRecord.amount / exchangeRateData.default
      }
      for await (const _ of Array(3).fill(0)){
        const records = await addRecord(newRecord);
        if(records){
          break;
        } else {
          await sleep(0.2);
        }
      }
    } 
    setIsOpen(false);
    onOpenChange?.(open || isOpen);
  }


  return (
    <Drawer
      onClose={() => {
        setRecord(__record);
        setIsRequire(false);
        onClose?.()
      }}
      open={open || isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        onOpenChange?.(open);
        if(editRecord){
          let record = editRecord
          let amount = record.amount
          setIsIncome(amount > 0)
          if(amount < 0){
            amount = amount * -1
          }
          let preAmount = String(amount);

          let originalAmount = record.originalAmount
          if(originalAmount){
            if(originalAmount < 0){
              originalAmount = originalAmount * -1
            }
            preAmount = String(originalAmount)
            record.originalAmount = originalAmount
          }
          const _exchangeRate = exchangeRate
          if(record.currency){
            _exchangeRate.currency = record.currency.toUpperCase()
          } else {
            _exchangeRate.currency = "USD"
          }
          setExchangeRate(_exchangeRate)
          setRecord({...record, amount, preAmount});
        }
      }}
    >
      <DrawerTrigger asChild {...(drawerTriggerProps||{})} />
      <DrawerContent className={"h-full".concat(
        // record.category ? ' overflow-y-auto' : ''
      )}>
        <div className={"mx-auto w-full min-w-80 max-w-sm".concat(
        record.category ? ' overflow-y-auto [&::-webkit-scrollbar]:w-0' : ''
      )}>
          <DrawerHeader className={record.category ? "sticky top-0 bg-background":""}>
            <DrawerTitle>{
            record.id ? "Edit " + (isIncome ? "Income":"Expense") : title
            }</DrawerTitle>
            <DrawerDescription>{
              isIncome ? "Where did the money come from?" : "Where did you use money for?"
            }</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <div>
              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className={isRequire && !record.category ? "text-destructive" : ""}>Category *</Label>
                    <Select
                      className={record.category ? " text-teal-600":""}
                      placeholder="Select One"
                      onValueChange={(value) => {
                        if(isIncome){
                          handleRecordChange({
                            category: value
                          });
                        } else {
                          handleRecordChange({
                            category: value,
                            childCategory: undefined
                          });
                        }
                        setIsRequire(false);
                      }}
                      value={record.category||""}
                      itemsContent={(Item) => {
                        return (
                          categories.map((category) => 
                            <Item key={category} value={category}>
                              {category}
                            </Item>
                          )
                        )
                      }}
                    />
                  </div>
                  {
                    ((!isIncome && record.category) || (record.id && record.childCategory)) &&
                    <div className="space-y-1">
                      <Label className={isRequire && !record.childCategory ? "text-destructive" : ""}>Spend money on *</Label>
                      <Select
                        className={record.childCategory ? " text-teal-600":""}
                        placeholder="Select One"
                        onValueChange={(value) => {
                          handleRecordChange({
                            childCategory: value
                          });
                          setIsRequire(false);
                        }}
                        value={record.childCategory||""}
                        itemsContent={(Item) => {
                          return (
                            childCategories[record.category as keyof typeof childCategories].map((category) => 
                              <Item key={`${record.category}:${category}`} value={category}>
                                {category}
                              </Item>
                            )
                          )
                        }}
                      />
                    </div>
                  }
                  <div className="space-y-1">
                    <Label>Payment method *</Label>
                    <Select
                      className={"focus:ring-0".concat( record.paymentMethod ? " text-teal-600":"")}
                      placeholder="Select One"
                      onValueChange={(value)=>{
                        handleRecordChange({paymentMethod: value});
                      }}
                      defaultValue={paymentMethodData[0]}
                      value={record.paymentMethod||""}
                      itemsContent={(Item) => {
                        return (
                          paymentMethodData.map((method) => 
                            <Item key={method} value={method}>
                              {method}
                            </Item>
                          )
                        )
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Add a note</Label>
                    <Input className="focus-visible:ring-0 focus:border-teal-600" placeholder="Type a note"
                      onChange={(e) => {
                        const note = e.currentTarget.value
                        handleRecordChange({note});
                      }}
                      value={record.note||""}
                    />
                    <Label className="text-xs text-muted-foreground">This can help you track any details</Label>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Box 
                      variant={'outline'}
                      className="p-1.5 h-auto hover:bg-muted aria-checked:bg-green-600/20 aria-checked:border-green-600/20 cursor-pointer"
                      aria-checked={!isUSD}
                      onClick={()=> setExchangeRate({...exchangeRate, currency: 'RIEL'})}
                    >
                      <Icons.cam />
                    </Box>
                    <Box 
                      variant={'outline'} className="p-1.5 h-auto hover:bg-muted aria-checked:bg-green-600/20 aria-checked:border-green-600/20 cursor-pointer"
                      aria-checked={isUSD}
                      onClick={()=> setExchangeRate({...exchangeRate, currency: 'USD'})}
                    >
                      <Icons.usd />
                    </Box>
                  </div>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <div className="relative grow">
                      <Input type="text" placeholder="add amount"
                        className={
                          "focus-visible:ring-0 pl-6 ".concat(
                            isRequire && !(record.amount && isNumber(record.amount)) ? "border-destructive ":"focus:border-teal-600"
                          )
                        }
                        value={record.preAmount || record.amount || ""}
                        onChange={(e) => {
                          let val = e.currentTarget.value.replace(/[^\d.-]/g, '')
                          if(isNumber(val) && Number(val) !== 0){
                            if(val.length <= 13)
                            handleRecordChange({preAmount: val})
                            setIsRequire(false);
                          } else{
                            handleRecordChange({preAmount: ''})
                          }
                        }}
                      />
                      {
                        isUSD 
                        ? 
                          <CircleDollarSignIcon size={16} className="absolute top-[30%] left-1.5 text-muted-foreground" />
                        : 
                        <picture>
                          <source type="image/webp" srcSet="/img/circle-riel-sign.webp"/>
                          <img alt="Cambodia riel sign icon" loading="lazy" src="/img/circle-riel-sign.webp" className="w-4 h-4 absolute top-[30%] left-1.5 opacity-60"/>
                        </picture>
                      }
                    </div>
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-600/90">Done</Button>
                  </div>
                  {
                    record.preAmount && 
                    <p>
                      {/* {Number(record.preAmount).toFixed(2)}
                      {isUSD ? ' $' : ' ៛'} */}
                      {' = '}
                      {isUSD ? '៛' : '$'}
                      {exchangeRate.amount}
                    </p>
                  }
                  <div className="mt-6">
                    <div>Rate: USD/KHR</div>
                    <div>
                      <span className="text-red-700">
                        Buy: {exchangeRateData.ABA?.buy?.toFixed(2)} ៛
                      </span>{" | "}
                      <span className="text-green-700">
                        Sell: {exchangeRateData.ABA?.sell?.toFixed(2)} ៛
                      </span>{" | "}
                      <span className=" text-sky-700 font-semibold">
                        ABA
                      </span>
                    </div>
                    <div>
                      <span className="text-red-700">
                        Buy: {exchangeRateData.ACLEDA?.buy?.toFixed(2)} ៛
                      </span>{" | "}
                      <span className="text-green-700">
                        Sell: {exchangeRateData.ACLEDA?.sell?.toFixed(2)} ៛
                      </span>{" | "}
                      <span className=" text-sky-700 font-semibold">
                        ACLEDA
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        <DrawerClose asChild className="absolute top-2 right-2">
          <Button variant={null} size={null} className="group hover:bg-red-600/10 hover:transition-colors p-0.5 rounded-full">
            <X className="text-red-600 group-hover:transition-colors" size={16} />
            <span className="sr-only">Close</span>
          </Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  )
}
