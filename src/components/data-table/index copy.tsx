// import React, { useEffect, useState } from "react";

// import {
//   ColumnDef,
//   ColumnFiltersState,
//   ColumnOrderState, //HERE
//   flexRender,
//   getCoreRowModel,
//   getFacetedRowModel,
//   getFacetedUniqueValues,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   SortingState,
//   Table as TanstackTable,
//   TableOptions,
//   useReactTable,
//   VisibilityState,
// } from "@tanstack/react-table";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableFooter,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// import { Button } from "@/components/ui/button";
// import { DataTableFacetedFilter } from "@/components/reusable/faceted-filter";
// import { cn, getDropDownValues } from "@/lib/utils";
// import { DataTablePagination } from "@/components/reusable/pagination-controls";

// export type TableColumnDef<TData extends unknown, TValue = unknown> = ColumnDef<TData, TValue> & Record<string, any>

// type CustomTableColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
//   className?: {
//     header?: string
//     cell?: string
//   };
// }

// interface DataTableProps<TData, TValue> {
//   className?: string;
//   columns: TableColumnDef<TData, TValue>[];
//   data: TData[];
//   reactTableProps?: Omit<TableOptions<TData>, "data"|"columns"|"getCoreRowModel">;
//   disableDefaultAdvancedFilter?: boolean;
//   onTableChange?: (data: TanstackTable<TData>, resetTable: VoidFunction) => void;
//   onRowSelection?: (data: TanstackTable<TData>, resetTable: VoidFunction) => void;
//   deps?: React.DependencyList
//   tableProps?: {
//     table?: React.ComponentProps<typeof Table>;
//     header?: React.ComponentProps<typeof TableHeader>;
//     headerRow?: React.ComponentProps<typeof TableRow>;
//     body?: React.ComponentProps<typeof TableBody>;
//     bodyRow?: React.ComponentProps<typeof TableRow>;
//     footer?: React.ComponentProps<typeof TableFooter>;
//     footerRow?: React.ComponentProps<typeof TableRow>;
//     noResultRow?: React.ComponentProps<typeof TableRow>;
//     noResultCell?: React.ComponentProps<typeof TableCell>;
//   }
//   allowPagination?: boolean;
//   paginationProps?: Omit<React.ComponentProps<typeof DataTablePagination>, "table"> & {showRowsPerPageAsTooltip?: boolean};
//   renderAboveTable?: (table: TanstackTable<TData>, dataTableFacetedFilter: typeof DataTableFacetedFilter, isFiltered: boolean, resetTable:VoidFunction) => React.ReactNode
//   renderBelowTable?: (table: TanstackTable<TData>, resetTable:VoidFunction) => React.ReactNode
// }

// export default function DataTable<TData, TValue>({
//   className,
//   columns,
//   data,
//   reactTableProps,
//   disableDefaultAdvancedFilter=false,
//   onTableChange,
//   onRowSelection,
//   deps,
//   tableProps,
//   allowPagination=true,
//   paginationProps,
//   renderAboveTable,
//   renderBelowTable
// }: DataTableProps<TData, TValue>) {
//   //STATES:
//   const [sorting, setSorting] = useState<SortingState>([]);
//   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
//   const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
//   const [rowSelection, setRowSelection] = useState({});
//   const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

//   const table = useReactTable({
//     data,
//     columns: columns as ColumnDef<TData, TValue>[],
//     getCoreRowModel: getCoreRowModel(),
//     //row selection
//     onRowSelectionChange: setRowSelection,
//     //sorting:
//     onSortingChange: setSorting,
//     getSortedRowModel: getSortedRowModel(),
//     state: {
//       sorting,
//       columnFilters,
//       columnVisibility,
//       rowSelection,
//       columnOrder,
//     },
//     //pagination:
//     getPaginationRowModel: getPaginationRowModel(),
//     //Order of columns
//     onColumnOrderChange: setColumnOrder,

//     //filters
//     onColumnFiltersChange: setColumnFilters,
//     getFilteredRowModel: getFilteredRowModel(),

//     //Faceted filters:
//     getFacetedUniqueValues: getFacetedUniqueValues(),
//     getFacetedRowModel: getFacetedRowModel(),

//     //Visibility:
//     onColumnVisibilityChange: setColumnVisibility,

//     //Control pagination. Default is 10
//     initialState: {
//       pagination: { pageSize: 10 },
//     },

//     //This can be added to insert custom functions, accessible :table.options.meta.methodName
//     meta: {
//       myOwnMethod: () => {},
//     },
//     ...(reactTableProps||{})
//   });


//   type CustomColumnDef = CustomTableColumnDef<TData, TValue>

//   // On Reset Table
//   const resetTable = () => {
//     table.resetRowSelection(),
//     table.resetColumnFilters(),
//     table.resetColumnVisibility();
//     table.resetColumnOrder()
//   }
//   //Used to show reset button
//   const isFiltered = table.getState().columnFilters.length > 0;

//   const hasAboveContent = !!renderAboveTable || !disableDefaultAdvancedFilter;

//   const tableFooter = table.getFooterGroups()[0].headers?.map(header => header.column.columnDef.footer).filter(footer => footer);

//   // const isSomeRowSelected
//   useEffect(()=> {
//     onRowSelection?.(table, resetTable)
//   },[rowSelection])

//   useEffect(()=> {
//     onTableChange?.(table, resetTable)
//   },deps||[])

//   const showRowsPerPageAsTooltip = paginationProps?.showRowsPerPageAsTooltip || false;
 
//   return (
//     <div className={cn(hasAboveContent ? "" : " -m-2 mb-0", className)}>
//       {
//         renderAboveTable?.(table, DataTableFacetedFilter, isFiltered, resetTable)
//         ??
//         <>
//         {
//           !disableDefaultAdvancedFilter && 
//           <>
//           <div className="flex justify-between py-4">
//             <div className="flex gap-3">
//               {/* <Input
//                 placeholder="Filter by name"
//                 value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
//                 onChange={(event) =>
//                   table.getColumn("name")?.setFilterValue(event.target.value)
//                 }
//                 className="max-w-sm"
//               /> */}
//               <div className="flex-col">
//                 {table.getColumn("category") && (
//                   <DataTableFacetedFilter
//                     column={table.getColumn("category")}
//                     title="Category"
//                     options={getDropDownValues(data, "category")}
//                   />
//                 )}
//               </div>

//               {isFiltered && (
//                 <Button
//                   variant="ghost"
//                   onClick={() => table.resetColumnFilters()}
//                   className="w-40 p-2"
//                 >
//                   Clear filters
//                 </Button>
//               )}
//             </div>

//             <Button
//               onClick={resetTable}
//               variant="outline"
//               className="text-red-800 border-red-800"
//             >
//               Reset table
//             </Button>
//           </div>

//           {/* Column selection button */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline" className="ml-auto">
//                 Select columns
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end">
//               {table
//                 .getAllColumns()
//                 .filter((column) => column.getCanHide())
//                 .map((column) => {
//                   return (
//                     <DropdownMenuCheckboxItem
//                       key={column.id}
//                       className="capitalize"
//                       checked={column.getIsVisible()}
//                       onCheckedChange={(value) => column.toggleVisibility(!!value)}
//                     >
//                       {column.id}
//                     </DropdownMenuCheckboxItem>
//                   );
//                 })}
//             </DropdownMenuContent>
//           </DropdownMenu>
//           </>
//         }
//         </>
//       }

//       <div className={hasAboveContent 
//         ? "mt-3 border rounded-md" 
//         : "border-b dark:border-b-gray-500"
//       }>
//         <Table {...(tableProps?.table||{})}>
//           <TableHeader {...(tableProps?.header||{})}>
//             {table.getHeaderGroups().map((headerGroup) => (
//               <TableRow key={headerGroup.id} className={cn('dark:border-b-gray-500 hover:bg-transparent', tableProps?.headerRow?.className)} {...(tableProps?.headerRow||{})}>
//                 {headerGroup.headers.map((header) => {
//                   const columnDef = header.column.columnDef as CustomColumnDef
//                   return (
//                     <TableHead key={header.id} className={columnDef.className?.header}>
//                       {header.isPlaceholder
//                         ? null
//                         : flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                     </TableHead>
//                   );
//                 })}
//               </TableRow>
//             ))}
//           </TableHeader>
//           <TableBody {...(tableProps?.body||{})}>
//             {table.getRowModel().rows?.length ? (
//               table.getRowModel().rows.map((row, i) => (
//                 <TableRow
//                   className={cn(
//                     "group dark:border-b-gray-500 data-[state=selected]:bg-green-600/20".concat(i % 2 === 0 ? " bg-accent" : ""),
//                     tableProps?.bodyRow?.className
//                   )}
//                   key={row.id}
//                   data-state={row.getIsSelected() && "selected"}
//                   {...(tableProps?.bodyRow||{})}
//                 >
//                   {row.getVisibleCells().map((cell) => {
//                     const columnDef = cell.column.columnDef as CustomColumnDef
//                     return(
//                       <TableCell key={cell.id} className={columnDef.className?.cell}>
//                         {flexRender(
//                           columnDef.cell,
//                           cell.getContext()
//                         )}
//                       </TableCell>
//                     )
//                   })}
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow {...(tableProps?.noResultRow||{})}>
//                 <TableCell
//                   colSpan={columns.length}
//                   className={cn("h-24 text-center font-medium", tableProps?.noResultCell?.className)}
//                 >
//                   {tableProps?.noResultCell?.children || "No records found"}
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>

//           { tableFooter?.length > 0 &&
//             <TableFooter {...(tableProps?.footer||{})}>
//             {table.getFooterGroups().map(footerGroup => (
//               <TableRow key={footerGroup.id} {...(tableProps?.footerRow||{})}>
//                 {footerGroup.headers.map(header => (
//                   <TableCell key={header.id}>
//                     {header.isPlaceholder
//                       ? null
//                       : flexRender(
//                           header.column.columnDef.footer,
//                           header.getContext()
//                       )}
//                       </TableCell>
//                 ))}
//                 </TableRow>
//             ))}
//             </TableFooter>
//           }
//         </Table>
//       </div>
//       {
//         allowPagination && 
//         <div className={"flex items-center justify-end pt-2".concat(
//           hasAboveContent ? "" : " px-2"
//         )}>
//           {
//             table.getAllColumns().some(col => col.id === "select") ?
//             <div className={"flex-1 text-sm text-muted-foreground".concat(table.getFilteredSelectedRowModel().rows.length > 0 ? "" : " hidden")}>
//               {table.getFilteredSelectedRowModel().rows.length} of{" "}
//               {table.getFilteredRowModel().rows.length} row(s) selected.
//             </div>
//             : <p className={"text-sm text-muted-foreground font-medium mr-2".concat(
//               showRowsPerPageAsTooltip ? " hidden" : ""
//             )}>Rows per page</p>
//           }
//           <DataTablePagination 
//             table={table} 
//             tooltip={showRowsPerPageAsTooltip}
//             {...(paginationProps||{})}
//           />
//         </div>
//       }
//       {renderBelowTable?.(table, resetTable)}
//     </div>
//   );
// }