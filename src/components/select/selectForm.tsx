import { zodResolver } from "@hookform/resolvers/zod"
import { ControllerRenderProps, FieldValues, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import React from "react"
import { cn } from "@/lib/utils"

const FormSchema = z.object({
  email: z
    .string({
      required_error: "Please select an email to display.",
    })
    .email(),
})


type TData = Record<string,any>
type FormSchemaType = z.ZodObject<TData>;

interface SelectFormProps {
  className?: string;
  formSchema: FormSchemaType;
  onSubmit: (formSchema: z.infer<FormSchemaType>) => void;
  formFieldProps: Omit<React.ComponentProps<typeof FormField>, "render">;
  selectItems?: (data: typeof SelectItem) => React.ReactNode;
  formDescription?: (data: typeof FormDescription) => React.ReactNode;
  formItem?: (
    field: ControllerRenderProps<FieldValues, string>,
    // formLabel: typeof FormLabel, 
    // select: typeof Select, 
    // formControl: typeof FormControl, 
    // selectTrigger: typeof SelectTrigger, 
    // selectValue: typeof SelectValue, 
    // selectContent: typeof SelectContent, 
    // selectItem: typeof SelectItem, 
    // formDescription: typeof FormDescription, 
    // formMessage: typeof FormMessage
  ) => React.ReactNode;
  submitButton?: (button: typeof Button) => React.ReactNode
}

export function SelectForm({
  className,
  formSchema,
  onSubmit,
  formFieldProps,
  formItem,
  submitButton,
}: SelectFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
        <FormField
          control={form.control}
          render={({ field }) => (
            <FormItem>
              {formItem?.(field)}
              {/* <FormLabel>Email</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {selectItems?.(SelectItem)}
                </SelectContent>
              </Select>

              {formDescription?.(FormDescription)}
              <FormMessage /> */}
            </FormItem>
          )}
          {...formFieldProps}
        />
        {submitButton?.(Button)}
        {/* <Button type="submit">Submit</Button> */}
      </form>
    </Form>
  )
}
