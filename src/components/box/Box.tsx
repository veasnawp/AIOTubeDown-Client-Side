import { VariantProps } from "class-variance-authority"
import { buttonVariants } from "../ui/button"
import { Slot } from "@radix-ui/react-slot"
import * as React from "react"
import { cn } from "@/lib/utils"

export interface BoxProps
    extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof buttonVariants> {
    component?: string
    asChild?: boolean
}

const Box = React.forwardRef<HTMLElement, BoxProps>(
    ({ className, component, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : component || "div"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Box.displayName = "Box"

export { Box }