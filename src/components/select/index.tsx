
import {
  Select as SimpleSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import React from "react"
import Tooltip, { TooltipContentType } from "@/components/tooltip"
import { cn } from "@/lib/utils"

interface SelectProps extends React.ComponentProps<typeof SimpleSelect> {
  className?: string
  title?: string
  placeholder?: React.ReactNode
  triggerProps?: React.ComponentProps<typeof SelectTrigger>
  selectContentProps?: React.ComponentProps<typeof SelectContent>
  itemsContent: (Item: typeof SelectItem) => React.ReactNode
  tooltip?: TooltipContentType
  tooltipProps?: React.ComponentProps<typeof Tooltip>
}

export const Select = ({
  className,
  title,
  placeholder,
  triggerProps,
  selectContentProps,
  itemsContent,
  tooltip,
  tooltipProps,
  ...props
}: SelectProps) => {

  return (
    <SimpleSelect {...props}>
      <Tooltip
        tooltip={tooltip}
        disable={!tooltip}
        className="cursor-pointer"
        delayDuration={100}
        triggerProps={{
          asChild: true
        }}
        {...(tooltipProps||{})}
      >
        <SelectTrigger title={!tooltip ? title : undefined} {...(triggerProps||{})} className={cn("focus:ring-0", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </Tooltip>
      <SelectContent className='max-h-80' {...(selectContentProps||{})}>
        {itemsContent(SelectItem)}
      </SelectContent>
    </SimpleSelect>
  )
}