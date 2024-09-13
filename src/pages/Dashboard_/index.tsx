import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DrawerAddMoney } from "../AddMoney"
import { useLocation, useNavigate } from "react-router-dom"
import { useFinancialRecord } from "@/contexts"
import { Select } from '@/components/select'
import Transactions, { formatDate, previousNextCurrentDate } from './TransactionsHistory'
import MainActivePage from '@/components/main'
import logger from '@/helper/logger'
import { useDisableBodyScroll } from '@/hook/use-disable-body-scroll'


declare global {
  type DefaultSwitchType<T> = {
    defaultValue(): T
    day?: () => T
    week?: () => T
    month?: () => T
    year?: () => T
    custom?: () => T
    final?: () => T
  }
}
  

export function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAddIncome = location.pathname === "/add-income"
  const isAddExpense = location.pathname === "/add-expense"

  const {records, onTypeofDataRecordsChange, onExchangeRateData} = useFinancialRecord();
  let finalRecords = records;

  const [currentDate, setCurrentDate] = React.useState(new Date());

  const today = currentDate.format("dddd dS mmmm yyyy");
  const defaultFilterByDate = {
    tab: 'day' as TabFilterByDate,
    count: 0,
    date: today,
    timestamp: currentDate.getTime(),
    countWeek: 0,
    dateWeek: [
      previousNextCurrentDate(-6).getTime(),
      currentDate.getTime(), 
    ],
    countMonth: 0,
    month: previousNextCurrentDate(0, "", "Month").format("mmmm yyyy"),
    timestampMonth: previousNextCurrentDate(0, "", "Month").getTime(),
    countYear: 0,
    year: previousNextCurrentDate(0, "", "Year").format("yyyy"),
    timestampYear: previousNextCurrentDate(0, "", "Year").getTime(),
    useCustomDate: false,
    customDate: [currentDate]
  }
  function handlePreviousNextFilterByDate(filterByDate: typeof defaultFilterByDate){
    return {
      previousDate: previousNextCurrentDate(-1, filterByDate.timestamp),
      nextDate: previousNextCurrentDate(1, filterByDate.timestamp),
      previousMonth: previousNextCurrentDate(-1, filterByDate.timestampMonth, "Month"),
      nextMonth: previousNextCurrentDate(1, filterByDate.timestampMonth, "Month"),
      previousYear: previousNextCurrentDate(-1, filterByDate.timestampYear, "Year"),
      nextYear: previousNextCurrentDate(1, filterByDate.timestampYear, "Year"),
      }
  }

  const defaultFilter = {
    ...defaultFilterByDate,
    ...handlePreviousNextFilterByDate(defaultFilterByDate)
  }
  const [filterByDate, setFilterByDate] = React.useState(() => {
    return defaultFilter
  })

  function switchByDate<T>(obj: DefaultSwitchType<T>){
    let value = obj.defaultValue?.()
    switch (filterByDate.tab) {
      case 'day':
        value = obj.day?.() || value
        break;
      case 'week':
        value = obj.week?.() || value
        break;
      case 'month':
        value = obj.month?.() || value
        break;
      case 'year':
        value = obj.year?.() || value
        break;
      case 'custom':
        value = obj.custom?.() || value
        break;
      default:
        break;
    }
    return obj.final?.() || value;
  }

  const onFilterByDateChange = (previous=true) => {
    const n = previous ? -1 : 1

    let filterByDateObj = filterByDate;
    const {
      previousDate, nextDate, 
      previousMonth, nextMonth,
      previousYear, nextYear
    } = handlePreviousNextFilterByDate(filterByDate);
    if(filterByDate.tab !== "custom"){
      filterByDateObj.useCustomDate = false
    }


    switch (filterByDate.tab) {
      case 'day':
        const count = filterByDate.count + (1*n);
        const _date = (previous ? previousDate : nextDate)
        const date = _date.format('dddd dS mmmm yyyy');
        const timestamp = _date.getTime();
        filterByDateObj = {...filterByDateObj, count, date, timestamp}
        filterByDateObj = {
          ...filterByDateObj,
          ...handlePreviousNextFilterByDate(filterByDateObj)
        }
        break;   
      case 'week':
        const countWeek = filterByDate.countWeek + (7*n);
        const _valueDate = filterByDate.dateWeek[previous ? 0 : 1]
        const _dWeek1 = previousNextCurrentDate((1*n), _valueDate)
        const _dWeek2 = previousNextCurrentDate((6*n), _dWeek1.format("yyyy-mm-dd"))
        let dateWeek = [
          _dWeek2.getTime(),
          _dWeek1.getTime(),
        ];
        if(!previous){
          dateWeek = dateWeek.reverse()
        }
        filterByDateObj = {...filterByDateObj, countWeek, dateWeek}
        break;
      case 'month':
        const countMonth = filterByDate.countMonth + (1*n);
        const _month = (previous ? previousMonth : nextMonth)
        const month = _month.format('mmmm yyyy');
        const timestampMonth = _month.getTime();
        filterByDateObj = {
          ...filterByDateObj, 
          countMonth, month, timestampMonth
        }
        filterByDateObj = {
          ...filterByDateObj,
          ...handlePreviousNextFilterByDate(filterByDateObj)
        }
        break;  
      case 'year':
        const countYear = filterByDate.countYear + (1*n);
        const _year = (previous ? previousYear : nextYear)
        const year = _year.format('yyyy');
        const timestampYear = _year.getTime();
        filterByDateObj = {
          ...filterByDateObj, 
          countYear, year, timestampYear
        }
        filterByDateObj = {
          ...filterByDateObj,
          ...handlePreviousNextFilterByDate(filterByDateObj)
        }
        break;
      case 'custom':
        break;
    
      default:
        break;
    }
    setFilterByDate(filterByDateObj);
  }
  
  switchByDate({
    defaultValue: () => finalRecords,
    day(){
      finalRecords = records.filter(v => formatDate(v.date, "dddd dS mmmm yyyy") === filterByDate.date)
      return finalRecords
    },
    week(){
      finalRecords = records.filter(v => 
        formatDate(v.date) >= formatDate(filterByDate.dateWeek[0]) &&
        formatDate(v.date) <= formatDate(filterByDate.dateWeek[1])
      )
      return finalRecords
    },
    month(){
      finalRecords = records.filter(v => formatDate(v.date, "mmmm yyyy") === filterByDate.month)
      return finalRecords
    },
    year(){
      finalRecords = records.filter(v => formatDate(v.date, "yyyy") === filterByDate.year)
      return finalRecords
    },
    custom(){
      const customDate = filterByDate.customDate
      if (customDate.length > 1)
      finalRecords = records.filter(v => 
        formatDate(v.date) >= formatDate(customDate[0]) &&
        formatDate(v.date) <= formatDate(customDate[1])
      )
      else if (customDate.length === 1){
        finalRecords = records.filter(v => 
          formatDate(v.date) === formatDate(customDate[0])
        )
      }
      return finalRecords
    },
  });


  function getRecordsByDate(records:FinancialRecord[]){
    const recordsIncome = records.filter(v => v.id && v.amount > 0);
    const recordsExpense = records.filter(v => v.id && v.amount < 0);
  
    const $income = recordsIncome.length && recordsIncome.map(v=>v.amount).reduce((a,b) => a + b)
  
    const $expense = recordsExpense.length && recordsExpense.map(v=>v.amount).reduce((a,b) => a + b)
  
    const $totalBalance = $income+$expense

    return {$income, $expense, $totalBalance}
  }

  // Current Records Filter
  const {$income, $expense, $totalBalance} = getRecordsByDate(finalRecords)

  // Previous Records Filter
  let previousRecordsFilterByDate = records.filter(v => 
    new Date(v.date).format('dddd dS mmmm yyyy') === previousNextCurrentDate(filterByDate.count-1).format('dddd dS mmmm yyyy')
  );

  switchByDate({
    defaultValue: () => {},
    week() {
      previousRecordsFilterByDate = records.filter(v => 
        formatDate(v.date) >= formatDate(previousNextCurrentDate(-7, filterByDate.dateWeek[0])) &&
        formatDate(v.date) <= formatDate(previousNextCurrentDate(-7, filterByDate.dateWeek[1]))
      );
    },
    month() {
      previousRecordsFilterByDate = records.filter(v =>
        formatDate(v.date, 'mmmm yyyy') === formatDate(previousNextCurrentDate(filterByDate.countMonth-1, filterByDate.timestampMonth, "Month"), 'mmmm yyyy')
      );
    },
    year() {
      previousRecordsFilterByDate = records.filter(v =>
        formatDate(v.date, 'yyyy') === formatDate(previousNextCurrentDate(filterByDate.countYear-1, filterByDate.timestampYear, "Year"), 'yyyy')
      );
    },
  })

  const $recordsPreviousDate = getRecordsByDate(previousRecordsFilterByDate)
  const $incomePreviousDate = $recordsPreviousDate.$income;
  const $expensePreviousDate = $recordsPreviousDate.$expense;
  const $totalBalancePreviousDate = $recordsPreviousDate.$totalBalance;

  function percentageCompare(income:number, incomePreviousDate:number){
    let percentageCompare = (((income / incomePreviousDate) - 1) * 100).toFixed(2)
    if([-1,-2].every(v => percentageCompare.at(v) === "0")){
      percentageCompare = percentageCompare.slice(0, -3)
    }
    if(!percentageCompare.startsWith("-")){
      percentageCompare = "+"+percentageCompare
    }


    if(filterByDate.count === 0 && filterByDate.tab === "day"){
      percentageCompare = percentageCompare + "% from yesterday"
    } else {
      let previousDate = previousNextCurrentDate(-1, filterByDate.timestamp).format('ddd d mmmm')
      switchByDate({
        defaultValue: () => {},
        week() {
          previousDate = "last week"
        },
        month() {
          previousDate = previousNextCurrentDate(-1, filterByDate.timestampMonth, "Month").format('mmmm yyyy')
        },
        year() {
          previousDate = previousNextCurrentDate(-1, filterByDate.timestampYear, "Year").format('yyyy')
        },
      })
      percentageCompare = percentageCompare + "% from " + previousDate
    }
    if(income === 0 || percentageCompare.includes("Infinity")){
      percentageCompare = ". . ."
    }

    return percentageCompare
  }

  let percentageCompare$Income = percentageCompare($income, $incomePreviousDate);
  let percentageCompare$Expense = percentageCompare($expense, $expensePreviousDate);
  let percentageCompare$TotalBalance = percentageCompare($totalBalance, $totalBalancePreviousDate);


  React.useEffect(() => {
    logger?.log("Original Records: ", records)
    // logger?.log("filtered Records: ", finalRecords)
  },[records]);

  const [alert, setAlert] = React.useState(false);

  useDisableBodyScroll(alert)

  return (
    <MainActivePage name='dashboard'>
      <div className="flex gap-4 flex-col">
        <div className='flex items-center justify-between text-xs sm:text-sm'>
          <div>
            <DigitalClock
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              onExchangeRateData={onExchangeRateData}
            />
            <div>
              <span className='font-semibold'>Today: </span>
              <span>{currentDate.format("dddd dS mmmm")}</span>
            </div>
          </div>
          <div>
            <Select
              className='text-xs sm:text-sm'
              onValueChange={(val) => {
                onTypeofDataRecordsChange(val);
                setAlert(val === "Cloud Storage")
              }}
              defaultValue="Local Storage"
              placeholder="Select Storage"
              itemsContent={(Item) => {
                return (
                  ["Local Storage","Cloud Storage"].map((category) => 
                    <Item key={category} value={category} className='text-xs sm:text-sm'>
                      {category}
                    </Item>
                  )
                )
              }}
            />
          </div>
        </div>
        <div className="grid gap-2 grid-cols-4 mb-8">
          <Card className={"col-span-4 ".concat(
            $totalBalance === 0
            ? ""
            : $totalBalance > 0 ? "shadow-green-600":"shadow-red-600"
          )}>
            <CardHeader className="p-2 text-center">
              <CardDescription className="text-2xl sm:text-3xl font-bold text-blue-600">Your Balance</CardDescription>
              <CardTitle className={"text-xl sm:text-2xl ".concat(
                $totalBalance === 0
                ? ""
                : $totalBalance > 0 ? " text-green-600":"text-red-600"
              )}>
                {(()=>{
                  const prefix = $totalBalance < 0 ? "-" : ""
                  const balance = $totalBalance < 0 ? $totalBalance * -1 : $totalBalance
                  return `${prefix}$${balance}`
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
              <div className="text-xs text-muted-foreground">
                { percentageCompare$TotalBalance }
              </div>
              <div>
                {
                  $totalBalance === 0 || !percentageCompare$TotalBalance.includes("%")
                  ? ""
                  : percentageCompare$TotalBalance.startsWith("+")
                  ? <ChevronUp className="text-green-600" />
                  : <ChevronDown className="text-red-600" />
                }
              </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader className="p-2 text-center">
              <CardDescription className="text-xl sm:text-2xl font-bold text-green-600">Income</CardDescription>
              <CardTitle className="text-xl sm:text-2xl">{`$${$income}`}</CardTitle>
            </CardHeader>
            <CardContent className="relative pb-10">
              <div className="text-xs text-center text-muted-foreground">
                {percentageCompare$Income}
              </div>
              <div className="absolute -bottom-6 left-0 w-full">
                <div className="w-full flex items-center justify-center">
                <DrawerAddMoney
                  title="Money In"
                  open={isAddIncome || undefined}
                  onClose={()=> navigate('/', {replace: true})}
                  onOpenChange={() => navigate('/', {replace: true})}
                  drawerTriggerProps={{
                    asChild: true,
                    children: <Button className="group bg-blue-100 hover:bg-blue-100 hover:transition-all w-12 sm:w-14 h-12 sm:h-14 p-0 rounded-full shadow-s1 hover:shadow-inset border border-black/0 hover:border-black/10"><ArrowUp className="text-green-600 group-hover:transition-transform group-hover:duration-200 group-hover:-translate-y-1" /></Button>
                  }} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader className="p-2 text-center">
              <CardDescription className="text-xl sm:text-2xl font-bold text-red-600">Expense</CardDescription>
              <CardTitle className="text-xl sm:text-2xl">
              {(()=>{
                  const prefix = $expense < 0 ? "-" : ""
                  const expense = $expense < 0 ? $expense * -1 : $expense
                  return `${prefix}$${expense}`
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pb-10">
              <div className="text-xs text-center text-muted-foreground">
                { percentageCompare$Expense }
              </div>
              <div className="absolute -bottom-6 left-0 w-full">
                <div className="w-full flex items-center justify-center">
                  <DrawerAddMoney
                    title="Money Out"
                    open={isAddExpense || undefined}
                    onClose={()=> navigate('/', {replace: true})}
                    onOpenChange={() => navigate('/', {replace: true})}
                    drawerTriggerProps={{
                      asChild: true,
                      children: <Button className="group bg-blue-100 hover:bg-blue-100 hover:transition-all w-12 sm:w-14 h-12 sm:h-14 p-0 rounded-full shadow-s1 hover:shadow-inset border border-black/0 hover:border-black/10"><ArrowDown className="text-red-600 group-hover:transition-transform group-hover:duration-200 group-hover:translate-y-1" /></Button>
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
        <Transactions
          defaultFilter={defaultFilter}
          finalRecords={finalRecords}
          filterByDate={filterByDate}
          setFilterByDate={setFilterByDate}
          onFilterByDateChange={onFilterByDateChange}
          finalFilterTracking={{$income, $expense, $totalBalance}}
          switchByDate={switchByDate}
        /></div>
      </div>
      <div className={"absolute z-[99] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] items-center h-full w-full ".concat(alert ? 'flex' : 'hidden')}>
        <div className="absolute z-[1] h-full w-full bg-muted-foreground/50 backdrop-blur-sm"></div>
        <div aria-modal={alert} className="z-[2] flex flex-col items-center w-full max-w-[600px] mx-auto p-6 aria-[modal]:duration-500 aria-[modal]:opacity-100 aria-[modal]:ease-out transition-all opacity-0">
          <div id="alert-additional-content-1" className="p-4 mb-4 text-blue-800 border border-pink-600/30 rounded-lg bg-blue-50" role="alert">
            <div className="flex items-center">
              <svg className="flex-shrink-0 w-4 h-4 me-2 text-pink-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
              </svg>
              <span className="sr-only">Info</span>
              <h3 className="text-lg font-medium text-pink-600">Free Cloud Storage</h3>
            </div>
            <div className="mt-2 mb-4 text-sm space-y-2">
              <p>This is a free Cloud Storage, so it doesn't work sometime.</p>
              <p>Please switch to Local Storage!!!</p>
            </div>
            <div className="flex justify-end">
              <Button variant={null} className='border border-pink-300 bg-pink-100 hover:bg-pink-200' data-hs-overlay="#hs-scroll-inside-body-modal"
                onClick={() => setAlert(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainActivePage>
  )
}


/**
 * @DIGITAL_CLOCK
 * 
 * @access
*/
function DigitalClock({
  currentDate,
  setCurrentDate,
  onExchangeRateData
}:{
  currentDate: Date
  setCurrentDate: (date: Date) => void
  onExchangeRateData: () => any
}){
  const [clock, setClock] = React.useState(currentDate.format('h:MM:ss TT'));
  React.useEffect(()=> {
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
        onExchangeRateData();
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