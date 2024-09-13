import { Table } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Group, Pagination, Select, Tooltip } from "@mantine/core";


interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  selectPageRowsProps?: Omit<React.ComponentProps<typeof Select>, "itemsContent">;
  tooltip?: boolean
  tooltipProps?: React.ComponentProps<typeof Tooltip>
  /**
   * @param rowsPerPageOptions list of number or list of string number
   * @example const rowsPerPageOptions = [5,10,15,20,25,30,50,100] || ["5","10","15","20","25","30","50","100"]
   */
  rowsPerPageOptions?: string[] | number[]
}

export function DataTablePagination<TData>({
  table,
  // tooltip,
  // tooltipProps,
  selectPageRowsProps,
  rowsPerPageOptions
}: DataTablePaginationProps<TData>) {

  const pageSize = table.getState().pagination.pageSize;
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const canPrevOrNext = (canPreviousPage || canNextPage)
  const pageIndex = table.getState().pagination.pageIndex;

  const totalPages = canPrevOrNext ? (table.getPageCount() < 3 ? table.getPageCount() : 3) : 1

  const SelectComponent = () => (
    <Select
      title="Rows per page"
      // tooltip={tooltip ? "Rows per page" : undefined}
      // tooltipProps={tooltipProps}
      className={cn("focus:ring-0 font-medium min-w-12", selectPageRowsProps?.className)}
      onChange={(value) => {
        if(pageSize !== Number(value))
        table.setPageSize(Number(value));
      }}
      value={String(pageSize)}
      classNames={{
        dropdown: 'max-h-60',
        input: 'p-0 text-center'
      }}
      comboboxProps={{width: 'fit-content'}}
      rightSectionWidth={0}
      w={48}
      data={(rowsPerPageOptions || [5,10,15,20,25,30,50,100]).map(v=>String(v))}
      {...(selectPageRowsProps||{})}
    />
  )

  return (
    <div className="flex items-center space-x-2 lg:space-x-4 text-muted-foreground">
      <div className="flex items-center space-x-2">
        {/* <p className="text-sm font-medium">Rows per page</p> */}
        <SelectComponent />
        { }
      </div>
      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
        Page {pageIndex + 1} of{" "}{table.getPageCount()}
      </div>
      <Pagination.Root total={totalPages} boundaries={1} disabled={!canPrevOrNext}
        onChange={(val)=> {table.setPageIndex(val - 1)}}
        value={pageIndex + 1}
      >
        <Group gap={5} justify="center">
          <Pagination.First title="First"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPreviousPage}
          />
          <Pagination.Previous title="Previous"
            onClick={() => table.previousPage()}
            disabled={!canPreviousPage}
          />
          <Pagination.Items />
          <Pagination.Next title="Next"
            onClick={() => table.nextPage()}
            disabled={!canNextPage}
          />
          <Pagination.Last title="Last"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!canNextPage}
          />
        </Group>
      </Pagination.Root>
      {/* <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to first page</span>
          <FiChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to previous page</span>
          <FiChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to next page</span>
          <FiChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to last page</span>
          <FiChevronsRight className="h-4 w-4" />
        </Button>
      </div> */}
    </div>
  );
}