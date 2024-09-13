import DataTable from "@/components/data-table"
import { columns } from "./columns"

import {
  ChevronLeftCircle,
  ChevronRightCircle,
  File,
  ListFilter,
  X,
} from "lucide-react"


import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { categories, useFinancialRecord } from "@/contexts"
import * as React from "react"
import { isObject, toCapitalized } from "@/utils"
import { cn } from "@/lib/utils"

import {CSVLink} from 'react-csv';
import { DrawerAddMoney } from "@/pages/AddMoney"
import { DatePickerWithRange } from "@/components/date-picker"
// import { formatDistance } from "date-fns"

export function formatDate(value?: string | number | Date, mask?:string){
  const date = value ? new Date(value) : new Date();
  return date.format(mask || 'yyyy-mm-dd')
}

export function previousNextCurrentDate(count:number, value?:string|number|Date, type:"Date"|"Month"|"Year"="Date"){
  const currentDate = value ? new Date(value) : new Date();
  if(type === "Month"){
    return new Date(currentDate.setMonth(currentDate.getMonth() + count))
  } else if(type === "Year"){
    return new Date(currentDate.setFullYear(currentDate.getFullYear() + count))
  }
  
  return new Date(currentDate.setDate(currentDate.getDate() + count))
}

declare global {
  type TabFilterByDate = "day" | "week" | "month" | "year"| "custom" | (string&{})
}

type FilterByDateType = {
  tab: TabFilterByDate;
  count: number;
  date: string;
  timestamp: number;
  previousDate: Date;
  nextDate: Date;
  countWeek: number;
  dateWeek: number[];
  countMonth: number;
  month: string;
  timestampMonth: number;
  previousMonth: Date;
  nextMonth: Date;
  countYear: number;
  year: string;
  timestampYear: number;
  previousYear: Date;
  nextYear: Date;
  useCustomDate: boolean;
  customDate: Date[];
}


interface TransactionsProps {
  className?: string;
  finalRecords: FinancialRecord[];
  onFilterByDate?: (recordsFilterByDate: FinancialRecord[], filterByDate: {count:number,date:string}) => void;
  defaultFilter: FilterByDateType;
  filterByDate: FilterByDateType;
  setFilterByDate: (value: FilterByDateType) => void;
  onFilterByDateChange: (previous?: boolean) => void;
  finalFilterTracking: {
    $income: number; 
    $expense: number; 
    $totalBalance: number
  },
  switchByDate<T>(obj: DefaultSwitchType<T>): T
}

export default function Transactions({
  className,
  finalRecords,
  defaultFilter,
  filterByDate,
  finalFilterTracking,
  setFilterByDate,
  onFilterByDateChange,
  switchByDate
}: TransactionsProps) {
  const {records, deleteRecord, newRecordIsAdded} = useFinancialRecord();

  const [tableActionMenu, setTableActionMenu] = React.useState<string|undefined>('');
  const [editRecord, setEditRecord] = React.useState<FinancialRecord|undefined>(undefined);
  const [isOpenCalendar, setIsOpenCalendar] = React.useState(false);

  const [tabFilterByDate, setTabFilterByDate] = React.useState<TabFilterByDate>("day")

  // Records filter by category
  const [filterByCategory, setFilterByCategory] = React.useState<string[]>([]);
  let recordsFilter = filterByCategory.length ? finalRecords.filter(v => filterByCategory.some(cate => cate === v.category)) : finalRecords

  const [filterByAmount, setFilterByAmount] = React.useState<'income'|'expense'|(string&{})>('');
  if(filterByAmount === 'income'){
    recordsFilter = recordsFilter.filter(v => v.amount > 0)
  } else if(filterByAmount === 'expense'){
    recordsFilter = recordsFilter.filter(v => v.amount < 0)
  }

  
  const {$income, $expense, $totalBalance} = finalFilterTracking

  function resetAll(){
    setFilterByDate(defaultFilter);
    setTabFilterByDate('day');
    setFilterByCategory([]);
    setFilterByAmount('');
  }

  function transactionsFilterByDate(){
    let currentRecordDate = "";
    let currentRecordDateCSV = "";
    let dateRanges = [] as Date[];
    switchByDate({
      defaultValue: ()=>{},
      day() {
        currentRecordDate = filterByDate.date.slice(0,-5)
        currentRecordDateCSV = filterByDate.date
        dateRanges = [new Date(filterByDate.timestamp)]
      },
      week() {
        currentRecordDate = filterByDate.dateWeek.map(v => new Date(v).format('dddd dS mmmm')).join(" - ")
        currentRecordDateCSV = currentRecordDate
        dateRanges = filterByDate.dateWeek.map((v)=> new Date(v))
      },
      month() {
        currentRecordDate = filterByDate.month
        currentRecordDateCSV = filterByDate.month
        dateRanges = [new Date(filterByDate.timestampMonth)]
      },
      year() {
        currentRecordDate = filterByDate.year
        currentRecordDateCSV = filterByDate.year
        dateRanges = [new Date(filterByDate.timestampYear)]
      },
      custom() {
        let customDate = filterByDate.customDate;
        currentRecordDate = customDate.map(d => d.format('dddd dS mmmm')).join(' - ')
        dateRanges = filterByDate.customDate
      },
    })
    return {dateRanges, currentRecordDate, currentRecordDateCSV};
  }
  const {dateRanges, currentRecordDate, currentRecordDateCSV} = transactionsFilterByDate();

  const [currentDate, setCurrentDate] = React.useState(new Date())
  const data = recordsFilter;

  // CSV Data Export
  function csvDataExport(){
    const csvDataIncome = data.filter(r => r.amount > 0).map(r => {
      return `,${r.paymentMethod},, ${new Date(r.date).format('dd-mm-yyyy')} ,,${r.note||""},,,${r.category},,${r.childCategory||""},,$${(r.amount).toFixed(2)},`
    }).join("\n")
  
    const csvDataExpense = data.filter(r => r.amount < 0).map(r => {
      return `,${r.paymentMethod},, ${new Date(r.date).format('dd-mm-yyyy')} ,,${r.note||""},,,${r.category},,${r.childCategory||""},,$${(r.amount*-1).toFixed(2)},`
    }).join("\n")
  

    const csvData = `,,,,,      My Personal Finance Management,,,,,,
    ,,,,,,,,,,,
    ,Report for ${currentRecordDateCSV}
    ,,,,,,,,,,,
    ,INCOME,,,,,,,,,,,
    ,Account,, Date ,,Description,,,Category,,Money From,,Amount,
    ${csvDataIncome}
    
    ,,,,,,,,,Total Amount Income,,,$${$income.toFixed(2)},
    
    ,EXPENSE,,,,,,,,,,,
    ,Account,, Date ,,Description,,,Category,,Spend Money On,,Amount,
    ${csvDataExpense}
    
    ,,,,,,,,,Total Amount Expense,,,$${($expense*-1).toFixed(2)},
    
    ,,,,,,,,,Total Amount,,,$${($totalBalance < 0 ? $totalBalance * -1 : $totalBalance).toFixed(2)},
    
    ,Credit from: ${location.origin},`;

    return csvData
  }
  const csvData = csvDataExport();


  React.useEffect(() => {
    if(newRecordIsAdded){
      resetAll();
    }
  }, [newRecordIsAdded]);


  return (
    <Tabs defaultValue={"day"} value={tabFilterByDate} className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <TabsList>
          {
            ["day","week","month","year","custom"].map(v => 
              <TabsTrigger key={v} className={"text-xs sm:text-sm ".concat(v === "custom" ? "hidden" : "")}
                onClick={()=> {
                  setTabFilterByDate(v);
                  setFilterByDate({...filterByDate, tab: v})
                }}
                value={v}
              >
                {toCapitalized(v)}
              </TabsTrigger>
            )
          }
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          {
            (filterByCategory.length > 0 || !!filterByAmount) && 
            <Button
              aria-checked={filterByCategory.length > 0 || !!filterByAmount}
              title="Reset filter"
              variant="outline"
              size="sm"
              className={"h-7 gap-1 text-xs sm:text-sm bg-red-100 border-red-200 hover:bg-red-100/70 hover:border-red-200/70 hidden sm:flex"}
              onClick={()=> resetAll()}
            >
              <X className="h-3.5 w-3.5 text-red-600" />
              <span className="sr-only sm:not-sr-only">Reset</span>
            </Button>
          }
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs sm:text-sm"
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs sm:text-sm py-0">Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {
                categories.map((category) => {

                  return (
                    <DropdownMenuCheckboxItem key={category} className="text-xs sm:text-sm"
                      checked={filterByCategory.some(cate => cate === category)}
                      onClick={() => {
                        let categories = [];
                        if(filterByCategory.some(cate => cate === category)){
                          categories = filterByCategory.filter(cate => cate !== category)
                        } else {
                          categories = [...filterByCategory, category]
                        }
                        setFilterByCategory(categories)
                      }}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  )
                })
              }
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs sm:text-sm py-0">Amount</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filterByAmount} onValueChange={(val) => {
                setFilterByAmount(filterByAmount === val ? '' : val)
              }}>
                <DropdownMenuRadioItem value="income" className="text-xs sm:text-sm">Income</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="expense" className="text-xs sm:text-sm">Expense</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <CSVLink
            onClick={()=> {
              setCurrentDate(new Date())
            }}
            data={csvData}
            // data={
            //   data.map(record => (
            //     {
            //       '': '',
            //       Account: record.paymentMethod,
            //       Date: new Date(record.date).format("dd-mm-yyyy"),
            //       Description: record.note || "",
            //       Category: record.category,
            //       '': '',
            //       SpendMoneyOn: record.childCategory || "",
            //       '': '',
            //       Income: record.amount > 0 ? ` ${record.amount} ` : "",
            //       Expense: record.amount < 0 ? ` ${record.amount * -1} ` : "",
            //       OverallBalance: ` ${finalFilterTracking.$totalBalance} `
            //     }
            //   ))
            // } 
            // headers={
            //   [
            //     '','Account','Date','Description','Category', 'Spend Money On',
            //     'Income','Expense', 'Overall Balance'
            //   ].map(label => (
            //     { label, key: label.replace(/ /g, '') }
            //   ))
            // }
            filename={"my-financial-report-for-".concat(currentRecordDateCSV, '__', currentDate.format("ddmmyyyyHHMMss"),".csv")}
          >
              <Button
                title={"Export Your Records for ".concat(currentRecordDate)}
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-sm"
              >
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Export</span>
              </Button>
          </CSVLink>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Button size={null} className="rounded-full p-1"
          onClick={(e)=> {
            e.preventDefault();
            onFilterByDateChange();
          }}
          disabled={tabFilterByDate === "custom"}
        >
          <ChevronLeftCircle/>
        </Button>
        <DatePickerWithRange
          classNameButton="w-full font-medium"
          dateRange={{
            from: dateRanges?.[0],
            to: dateRanges?.[0],
          }}
          onSelect={({date}, handleHelperOnChange)=>{
            let customDate = filterByDate.customDate;
            const {from, to} = date || {};
            if(from && to){
              customDate = formatDate(from) === formatDate(to) ? [from] : [from, to]
            } else {
              const fromOrTo = from || to;
              customDate = fromOrTo ? [fromOrTo] : customDate
            }

            handleHelperOnChange({customDate})
          }}
          open={isOpenCalendar}
          onOpen={(open)=>{
            setIsOpenCalendar(open)
            if(open){
              setFilterByDate({...filterByDate, tab: 'custom'})
              setTabFilterByDate('custom')
            }
          }}
          onClose={(setDate, defaultDateRange) => {
            if(!filterByDate.useCustomDate){
              setDate(defaultDateRange);
              setFilterByDate({...filterByDate, tab: 'day'})
              setTabFilterByDate('day')
            }
          }}
          renderContentOnPickADate={(_, helperValue) => {
            let filterRecordDate = currentRecordDate;
            if(tabFilterByDate === "custom"){
              let customDate: Date[] = helperValue.customDate || filterByDate.customDate;

              filterRecordDate = customDate.map(d => d.format('dddd dS mmmm')).join(' - ')
            }

            return <span className="text-xs sm:text-sm">{filterRecordDate}</span>;
          }}
          renderContentBelowCalendar={(_, helperValue) => {
            return <Button variant={null} 
              className="w-full bg-green-600 text-white hover:bg-secondary hover:text-green-600 hover:outline hover:outline-1 hover:outline-green-600 hover:transition-colors"
              onClick={() => {
                setFilterByDate({...filterByDate, tab: 'custom', customDate: helperValue.customDate || filterByDate.customDate, useCustomDate: true})
                setTabFilterByDate('custom')
                setIsOpenCalendar(false);
              }}
            >Done</Button>
          }}
        />
        <Button size={null} disabled={(()=>{
          return switchByDate({
            defaultValue: () => false,
            day: () => filterByDate.count >= 0,
            week: () => filterByDate.countWeek >= 0,
            month: () => filterByDate.countMonth >= 0,
            year: () => filterByDate.countYear >= 0,
            custom: () => true,
          })
        })()}
          className={"rounded-full p-1"}
          onClick={(e)=> {
            e.preventDefault();
            onFilterByDateChange(false)
          }}
        >
          <ChevronRightCircle/>
        </Button>
      </div>
      <Card>
        <CardContent className="p-2">
          <DataTable
            columns={columns} data={data}
            reactTableProps={{
              meta:{
                tableActionMenu,
                setTableActionMenu,
                setEditRecord,
                deleteRecord,
              }
            }}
            disableDefaultAdvancedFilter
          />
          <DrawerAddMoney
            title="Edit Record"
            open={isObject(editRecord)}
            onClose={()=> setTableActionMenu(undefined)}
            onOpenChange={()=> setEditRecord(undefined)}
            editRecord={editRecord}
          />
        </CardContent>
      </Card>
    </Tabs>
  )
}

export function formatDateTime(value: string | number | Date){
  const date = new Date(value);
  const hours = date.getHours();
  const mins = date.getMinutes();
  // const secs = date.getSeconds();

  const time = `${hours}:${mins}${hours>=12?"pm":"am"}`;
  const d = date.toString().split(' ').slice(0,3)

  return `${d[0]} ${d[2]} ${d[1]} ${time}`
}