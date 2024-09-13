import {
  Tooltip as SimpleTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import React from "react"

export type TooltipContentType = string | ((content: typeof TooltipContent) => React.ReactNode)

interface TooltipProps extends React.ComponentProps<typeof SimpleTooltip> {
  className?: string;
  tooltip?: TooltipContentType;
  tooltipProps?: Prettify<React.ComponentProps<typeof TooltipContent>>
  disable?: boolean,
  triggerProps?: React.ComponentProps<typeof TooltipTrigger>
  asChild?: boolean
}

const Tooltip = ({
  className,
  children,
  tooltip,
  tooltipProps,
  disable,
  triggerProps,
  asChild,
  ...props
}: TooltipProps) => {

  return (
    disable ? children :
    <TooltipProvider delayDuration={300} {...props}>
      <SimpleTooltip>
        <TooltipTrigger asChild={asChild} className={cn("cursor-default", className)} {...(triggerProps||{})}>
          {children}
        </TooltipTrigger>
        {
          tooltip && typeof tooltip === "string" ?
          <TooltipContent {...(tooltipProps||{})}>{tooltip}</TooltipContent>
          : typeof tooltip === "function"
          ? tooltip(TooltipContent)
          : ""
        }
      </SimpleTooltip>
    </TooltipProvider>
  )
}

export default Tooltip;