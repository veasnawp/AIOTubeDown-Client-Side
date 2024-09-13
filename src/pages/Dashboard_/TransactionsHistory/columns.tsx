import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { Toast } from "@/components/reusable/Toast";
import { Badge } from "@/components/ui/badge";
import Tooltip from "@/components/tooltip";
import { ArrowDownZA, ArrowUpAZ, ArrowUpDown, Ellipsis, FilePenLine, Trash2 } from "lucide-react";
import { toCapitalized } from "@/utils";

export type TableColumnDef<TData extends unknown, TValue = unknown> = ColumnDef<TData, TValue> & {
  className?: TValue;
  accessorKey: string;
}

export interface TableMetaOptions {
  tableActionMenu?: string
  setTableActionMenu: React.Dispatch<React.SetStateAction<string | undefined>>
  setEditRecord: React.Dispatch<React.SetStateAction<FinancialRecord>>
  deleteRecord: (record: FinancialRecord) => void
}

export const columns: TableColumnDef<FinancialRecord>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "category",
    // invertSorting: true,
    header: ({ column }) => {
      const columnDef = column.columnDef as TableColumnDef<FinancialRecord>
      const category = columnDef.accessorKey
      const sorted = column.getIsSorted();
      const IconArrowUpDown = sorted === "asc" ? ArrowUpAZ : sorted === "desc" ? ArrowDownZA : ArrowUpDown
      return (
        <div className="flex gap-1 items-center justify-center text-xs sm:text-sm py-2">
          {toCapitalized(category)}
          <Tooltip
            tooltipProps={{
              className: "font-normal"
            }}
            tooltip={`${sorted ? "Sorted": "Sort"} by ${toCapitalized(category)} ${sorted === "desc" ? "descending" : "ascending"}`}
          >
            <IconArrowUpDown
              className={"w-4 h-4 ml-2 cursor-pointer".concat(sorted ? " text-green-600":"")}
              onClick={() => column.toggleSorting()}
            />
          </Tooltip>
        </div>
      );
    },
    cell: ({ row }) => {
      const record = row.original;
      const isIncome = record.amount > 0
      const isExpense = record.childCategory && !isIncome
      return (
        <Tooltip
          tooltipProps={{className: 'text-xs sm:text-sm'}}
          tooltip={record.note}
        >
          <div className="text-xs sm:text-sm">
            {
              isExpense &&
              <div className="text-muted-foreground inline">
                {record.category}
              </div>
            }
            <div className="font-medium">{
              isExpense
              ? record.childCategory
              : record.category
            }</div>
            <div className="text-muted-foreground inline">
              {new Date(record.date).format("ddd dd mmm hh:MM tt")}
            </div>
          </div>
        </Tooltip>
      )
    }
  },
  {
    accessorKey: "paymentMethod",
    className: {
      header: "text-xs sm:text-sm text-center",
      cell: "relative min-w-28 p-0"
    },
    header: "Account",
    cell: ({row, table}) => {
      const {
        tableActionMenu, setTableActionMenu,
        setEditRecord, deleteRecord
      } = table.options.meta as TableMetaOptions
      const record = row.original;
      return (
        <div className="absolute top-0 h-full w-full">
          <div className="relative flex items-center justify-center h-full">
            <div className="flex">
              <Badge variant="outline">{record.paymentMethod}</Badge>
            </div>
            <DropdownMenu
              open={tableActionMenu === record.id}
              onOpenChange={(open)=>{
                if(open)
                setTableActionMenu(record.id);
                else setTableActionMenu(undefined)
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size={null}
                  className="absolute -right-5 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100"
                  style={{opacity: tableActionMenu === record.id ? 1 : ''}}
                >
                  <Ellipsis size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-center">Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e)=> {
                    e.preventDefault();
                    setEditRecord(record);
                  }}
                >
                <FilePenLine size={18} className="text-green-600 mr-2" />
                <span>Edit</span>
                {/* <DropdownMenuShortcut>Edit</DropdownMenuShortcut> */}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e)=> {
                    e.preventDefault();
                    const id = record.id
                    if(id){
                      deleteRecord(record);
                    }
                  }}
                >
                  <Trash2 size={18} className="text-red-600 mr-2" />
                  <span>Delete</span>
                  {/* <DropdownMenuShortcut>⌘ Delete</DropdownMenuShortcut> */}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "amount",
    className: {
      header: "text-xs sm:text-sm text-right",
      cell: "text-right",
    },
    header: "Amount",
    cell: ({row}) => {
      const record = row.original;
      const isIncome = record.amount > 0
      return (
        <>
        <div className={"font-semibold ".concat(
          isIncome ? "text-green-600":"text-red-600 "
        )}>
          {(()=>{
            const isUSD = !(record.currency && record.currency !== "USD")
            const $amount = isUSD ? record.amount : record.originalAmount || record.amount;
            const prefix = $amount < 0 ? "-" : ""
            const amount = $amount < 0 ? $amount * -1 : $amount
            return `${prefix}${isUSD?"$":"៛"}${amount}`
          })()}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">{isIncome ? "Income":"Expense"}</div>
        </>
      )
    },
    // footer: ({ column, table }) => {
    //   return (
    //     <div className="flex flex-row gap-4">
    //       <HiOutlineArrowLeftCircle
    //         className="w-4 h-4 ml-2 cursor-pointer"
    //         onClick={() =>
    //           table.setColumnOrder(
    //             moveColumnsUp(table.getAllLeafColumns(), column.id),
    //           )}
    //       >
    //       </HiOutlineArrowLeftCircle>
    //       <HiOutlineArrowRightCircle
    //         className="w-4 h-4 mr-2 cursor-pointer"
    //         onClick={() =>
    //           table.setColumnOrder(
    //             moveColumnsDown(table.getAllLeafColumns(), column.id),
    //           )}
    //       >
    //       </HiOutlineArrowRightCircle>
    //     </div>
    //   );
    // },
    
  },
  // ...
];