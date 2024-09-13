"use client"

import * as React from "react"
// import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { ActiveModifiers, DateRange, SelectRangeEventHandler } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import Tooltip from "@/components/tooltip"
import { Box } from "@/components/box"


type SetDateStateAction = React.Dispatch<React.SetStateAction<DateRange | undefined>>

type OnSelectProps = {
  date: DateRange | undefined, 
  selectedDay: Date, 
  activeModifiers: ActiveModifiers, 
  event: React.MouseEvent<Element, MouseEvent>
}

interface DatePickerWithRangeProps extends Omit<React.ComponentProps<typeof Popover>,"children"> {
  className?: string
  classNameButton?: string
  dateRange: DateRange | undefined
  onSelect?: (value: OnSelectProps, handleHelperOnChange: (value: Record<string, any>) => void) => void
  onOpen?: (open:boolean) => void
  onClose?: (setDate: SetDateStateAction, defaultDateRange: DateRange|undefined, helperValue: Record<string, any>) => void
  renderContentOnPickADate?: (date: DateRange | undefined, helperValue: Record<string, any>) => React.ReactNode
  renderContentBelowCalendar?: (date: DateRange | undefined, helperValue: Record<string, any>) => React.ReactNode
  popoverContentProps?: React.ComponentProps<typeof PopoverContent>
}

export function DatePickerWithRange({
  className,
  classNameButton,
  dateRange,
  onSelect,
  renderContentOnPickADate,
  renderContentBelowCalendar,
  onOpen,
  onClose,
  popoverContentProps,
  ...props
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(dateRange);

  const tabs = ["Date From", "Date To"]
  const [tab, setTab] = React.useState("Date From");

  const defaultHelperValue = {
    isTheSameCurrentMonthAndYear: true,
    selectedDateIsGreaterThanCurrentDate: false,
  }
  const [helper, setHelper] = React.useState(defaultHelperValue);
  const handleHelperOnChange = (value: Partial<typeof helper>) => {
    setHelper({...helper, ...value})
  }
  const {isTheSameCurrentMonthAndYear, selectedDateIsGreaterThanCurrentDate} = helper;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover
        onOpenChange={(open)=>{
          if(!open){
            onClose?.(setDate, dateRange, helper)
            setHelper(defaultHelperValue);
          } 
          onOpen?.(open)
        }} {...props}
      >
        <PopoverTrigger asChild>
          <Box
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-center text-left font-normal",
              !date && "text-muted-foreground", classNameButton
            )}
          >
            <Tooltip
              tooltip={"Select Custom Date"}
              className="cursor-pointer"
              tooltipProps={{sideOffset: 14}}
            >
              <div>
              {
                renderContentOnPickADate ? renderContentOnPickADate?.(date, helper) :
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {date.from.format('mmm dd, yyyy')} -{" "}
                          {date.from.format('mmm dd, yyyy')}
                        </>
                      ) : (
                        date.from.format('mmm dd, yyyy') // format(date.from, "LLL dd, y") from "date-fns" module
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </>
              }</div>
            </Tooltip>
          </Box>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" align="center" {...(popoverContentProps||{})}>
          <Tabs defaultValue={tabs[0]} className={'sm:hidden'}>
            <div className="flex items-center">
              <TabsList className="w-full">
                {
                  tabs.map(v => 
                    <TabsTrigger key={v} className="w-full"
                      onClick={()=> setTab(v)}
                      value={v}
                    >
                      {v}
                    </TabsTrigger>
                  )
                }
              </TabsList>
            </div>
          </Tabs>
          { selectedDateIsGreaterThanCurrentDate &&
            <div className="text-xs text-center text-red-600 pt-1">Please select older than current date.</div>
          }
          <Calendar
            classNames={{
              caption_start: "sm:!block " + (tab === tabs[0] ? "block" : "hidden"),
              caption_end: "!mt-0 sm:!block " + (tab === tabs[1] ? "block" : "hidden"),
              nav_button_next: isTheSameCurrentMonthAndYear ? "hidden" : "absolute right-1",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-green-100/50 [&:has([aria-selected])]:bg-green-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 hover:bg-green-100 hover:rounded-md",
              day_range_middle: "aria-selected:bg-green-100 aria-selected:text-accent-foreground",
              day: cn(
                buttonVariants({ variant: null }),
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
              ),
            }}
            initialFocus
            
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(value, selectedDay, activeModifiers, event) => {
              const currentDate = new Date();
              const currentDateFormat = currentDate.format('yyyy-mm-dd');
              let date = (value || {}) as DateRange
              let {from, to} = value || {}
              const isFromGreaterThanCurrentDate = from && from.format('yyyy-mm-dd') > currentDateFormat
              if(isFromGreaterThanCurrentDate){
                from = dateRange?.from
                date.from = from
              }
              const isFromSmallerThanCurrentDate = from && from.format('yyyy-mm-dd') < currentDateFormat
              if(to && to.format('yyyy-mm-dd') > currentDateFormat){
                date.to = undefined
                if(isFromSmallerThanCurrentDate){
                  date.to = currentDate
                }
              }

              let _selectedDateIsGreaterThanCurrentDate = false;
              if(selectedDateIsGreaterThanCurrentDate){
                _selectedDateIsGreaterThanCurrentDate = false;
                handleHelperOnChange({selectedDateIsGreaterThanCurrentDate: false})
              }
              if(!isFromGreaterThanCurrentDate && selectedDay.format('yyyy-mm-dd') > currentDateFormat){
                _selectedDateIsGreaterThanCurrentDate = true;
                handleHelperOnChange({selectedDateIsGreaterThanCurrentDate: true})
              }
              setDate(date);
              onSelect?.({date, selectedDay, activeModifiers, event}, (value: Record<string, any>) => {
                handleHelperOnChange({
                  selectedDateIsGreaterThanCurrentDate: _selectedDateIsGreaterThanCurrentDate, 
                  ...value
                })
              });
            }}
            numberOfMonths={2}
            onMonthChange={(date) => {
              const currentDate = new Date();
              const isTheSameCurrentMonthAndYear = currentDate.getMonth() === date.getMonth() + 1 && currentDate.getFullYear() === date.getFullYear()
              handleHelperOnChange({isTheSameCurrentMonthAndYear})
            }}
          />
          {renderContentBelowCalendar?.(date, helper)}
        </PopoverContent>
      </Popover>
    </div>
  )
}
