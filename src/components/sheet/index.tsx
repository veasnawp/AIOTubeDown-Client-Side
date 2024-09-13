import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { X } from "lucide-react"
import React from "react"

type SheetContentProps = {
  Header: typeof SheetHeader
  Title: typeof SheetTitle
  Desc: typeof SheetDescription
  Footer: typeof SheetFooter
  Close: typeof SheetClose
}

interface DrawerSheetProps extends React.ComponentProps<typeof Sheet> {
  trigger?: (Trigger: typeof SheetTrigger) => React.ReactNode
  content: (props: SheetContentProps) => React.ReactNode
  contentProps?: React.ComponentProps<typeof SheetContent>
}

export function DrawerSheet({
  trigger,
  content,
  contentProps,
  ...props
}: DrawerSheetProps) {
  return (
    <Sheet {...props}>
      {trigger?.(SheetTrigger)}
      <SheetContent {...contentProps}>
        {
          content({
            Header: SheetHeader,
            Title: SheetTitle,
            Desc: SheetDescription,
            Footer: SheetFooter,
            Close: SheetClose
          })
        }
        <SheetClose className="absolute right-4 top-4 group hover:bg-red-600/10 hover:transition-colors p-0.5 rounded-full">
          <X className="text-red-600 group-hover:transition-colors" size={16} />
          <span className="sr-only">Close</span>
        </SheetClose>
      </SheetContent>
    </Sheet>
  )
}
