// import {
//   FiChevronLeft,
//   FiChevronRight,
//   FiChevronsLeft,
//   FiChevronsRight,
// } from "react-icons/fi";
// import { Table } from "@tanstack/react-table";

// import { Button } from "@/components/ui/button";
// import { Select } from "@/components/select";
// import { cn } from "@/lib/utils";
// import Tooltip from "@/components/tooltip";


// interface DataTablePaginationProps<TData> {
//   table: Table<TData>;
//   selectPageRowsProps?: Omit<React.ComponentProps<typeof Select>, "itemsContent">;
//   tooltip?: boolean
//   tooltipProps?: React.ComponentProps<typeof Tooltip>
//   /**
//    * @param rowsPerPageOptions list of number or list of string number
//    * @example const rowsPerPageOptions = [5,10,15,20,25,30,50,100] || ["5","10","15","20","25","30","50","100"]
//    */
//   rowsPerPageOptions?: string[] | number[]
// }

// export function DataTablePagination<TData>({
//   table,
//   tooltip,
//   tooltipProps,
//   selectPageRowsProps,
//   rowsPerPageOptions
// }: DataTablePaginationProps<TData>) {

//   const SelectComponent = () => (
//     <Select
//       title="Rows per page"
//       tooltip={tooltip ? "Rows per page" : undefined}
//       tooltipProps={tooltipProps}
//       className={cn("focus:ring-0 font-medium min-w-16", selectPageRowsProps?.className)}
//       onValueChange={(value) => {
//         if(table.getState().pagination.pageSize !== Number(value))
//         table.setPageSize(Number(value));
//       }}
//       value={String(table.getState().pagination.pageSize)}
//       selectContentProps={{className: 'max-h-60'}}
//       itemsContent={(Item) => {
//         return (
//           (rowsPerPageOptions || [5,10,15,20,25,30,50,100]).map((pageSize) => 
//             <Item key={String(pageSize)} value={String(pageSize)} >
//               {String(pageSize)}
//             </Item>
//           )
//         )
//       }}
//       {...(selectPageRowsProps||{})}
//     />
//   )

//   return (
//     <div className="flex items-center space-x-2 lg:space-x-4 text-muted-foreground">
//       <div className="flex items-center space-x-2">
//         {/* <p className="text-sm font-medium">Rows per page</p> */}
//         <SelectComponent />
//         { }
//       </div>
//       <div className="flex w-[100px] items-center justify-center text-sm font-medium">
//         Page {table.getState().pagination.pageIndex + 1} of{" "}
//         {table.getPageCount()}
//       </div>
//       <div className="flex items-center space-x-2">
//         <Button
//           variant="outline"
//           className="hidden h-8 w-8 p-0 lg:flex"
//           onClick={() => table.setPageIndex(0)}
//           disabled={!table.getCanPreviousPage()}
//         >
//           <span className="sr-only">Go to first page</span>
//           <FiChevronsLeft className="h-4 w-4" />
//         </Button>
//         <Button
//           variant="outline"
//           className="h-8 w-8 p-0"
//           onClick={() => table.previousPage()}
//           disabled={!table.getCanPreviousPage()}
//         >
//           <span className="sr-only">Go to previous page</span>
//           <FiChevronLeft className="h-4 w-4" />
//         </Button>
//         <Button
//           variant="outline"
//           className="h-8 w-8 p-0"
//           onClick={() => table.nextPage()}
//           disabled={!table.getCanNextPage()}
//         >
//           <span className="sr-only">Go to next page</span>
//           <FiChevronRight className="h-4 w-4" />
//         </Button>
//         <Button
//           variant="outline"
//           className="hidden h-8 w-8 p-0 lg:flex"
//           onClick={() => table.setPageIndex(table.getPageCount() - 1)}
//           disabled={!table.getCanNextPage()}
//         >
//           <span className="sr-only">Go to last page</span>
//           <FiChevronsRight className="h-4 w-4" />
//         </Button>
//       </div>
//     </div>
//   );
// }