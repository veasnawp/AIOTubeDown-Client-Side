import { useEffect, useState } from "react";
import DataTable, { TableColumnDef } from "@/components/data-table";
import { Card, Checkbox, SegmentedControl, Tooltip } from "@mantine/core";
// import { fetchApi, headers } from "@/contexts/auth";
import logger from "@/helper/logger";

const data = [
  { title: 'title', mass: 12.011, symbol: "C", filename: "filename" },
];

const columns: TableColumnDef<typeof data[0]>[] = [
  {
    id: "select",
    className: {
      header: "w-12",
      cell: "w-12"
    },
    header: ({ table }) => (
      <Tooltip label='Select all'>
        <Checkbox
          color="green"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.currentTarget.checked)}
          aria-label="Select all"
        />
      </Tooltip>
    ),
    cell: ({ row }) => (
      <Tooltip label='Select row'>
        <Checkbox
          color="green"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.currentTarget.checked)}
          aria-label="Select row"
        />
      </Tooltip>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    className: {
      header: "text-xs sm:text-sm text-left",
    },
    header: "Filename",
  },
  {
    accessorKey: "symbol",
    className: {
      header: "text-xs sm:text-sm text-center",
      cell: "relative text-center"
    },
    header: "Symbol",
  },
  {
    accessorKey: "mass",
    className: {
      header: "text-xs sm:text-sm text-right",
      cell: "relative text-right"
    },
    header: "Action",
  },
]

const dataTabs = ['Downloading', 'Completed', 'Uncompleted'] as const;

export function PostsData() {
  const downloadTabs = [...dataTabs];
  const [downloadTab, setDownloadTab] = useState<(typeof dataTabs)[number] | (string & {})>(dataTabs[0]);

  useEffect(()=> {

  },[])
  
  return (
    <>
    <Card p={4} className="sticky top-4 z-10">
      <SegmentedControl fullWidth size="sm" 
        data={downloadTabs}
        value={downloadTab}
        onChange={setDownloadTab}
      />
    </Card>
    <Card>
      {
        downloadTabs.map(tab => (
          <DataTable
            key={tab}
            className={downloadTab !== tab ? "hidden" : ""}
            columns={columns}
            data={data}
            // reactTableProps={{
            //   meta: {
            //     tableActionMenu,
            //     setTableActionMenu,
            //     setEditRecord,
            //     deleteRecord,
            //   },
            // }}
            disableDefaultAdvancedFilter
          />
        ))
      }
    </Card>
    </>
  );
}
