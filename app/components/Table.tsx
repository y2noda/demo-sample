import {
    ColumnDef,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    Download,
    Moon,
    Plus,
    RefreshCw,
    Search,
    Sun,
    Upload,
    X,
} from "lucide-react";
import Papa from "papaparse";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip";

type Person = {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    visits: number;
    progress: number;
    status: "relationship" | "complicated" | "single";
    [key: string]: string | number;
};

const columnHelper = createColumnHelper<Person>();

const generatePerson = (id: number): Person => ({
    id,
    firstName: `First${id}`,
    lastName: `Last${id}`,
    age: Math.floor(Math.random() * 80),
    visits: Math.floor(Math.random() * 100),
    progress: Math.floor(Math.random() * 100),
    status: ["relationship", "complicated", "single"][
        Math.floor(Math.random() * 3)
    ] as Person["status"],
});

const generateData = (length: number) => {
    return Array.from({ length }, (_, i) => generatePerson(i + 1));
};

export default function Component() {
    const [data, setData] = useState(() => generateData(10000));
    const [columns, setColumns] = useState<ColumnDef<Person, any>[]>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [newColumnName, setNewColumnName] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [lastAddedColumn, setLastAddedColumn] = useState<string | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [isCompactMode, setIsCompactMode] = useState(false);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.toggle("dark", isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        if (lastAddedColumn) {
            setTimeout(() => setLastAddedColumn(null), 5000);
        }
    }, [lastAddedColumn]);

    useEffect(() => {
        // Initialize columns
        setColumns([
            columnHelper.accessor("firstName", {
                cell: (info) => info.getValue(),
                header: () => <span>First Name</span>,
            }),
            columnHelper.accessor((row) => row.lastName, {
                id: "lastName",
                cell: (info) => info.getValue(),
                header: () => <span>Last Name</span>,
            }),
            columnHelper.accessor("age", {
                header: () => "Age",
                cell: (info) => info.renderValue(),
            }),
            columnHelper.accessor("visits", {
                header: () => <span>Visits</span>,
            }),
            columnHelper.accessor("status", {
                header: "Status",
            }),
            columnHelper.accessor("progress", {
                header: "Profile Progress",
                cell: (info) => (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${info.getValue()}%` }}
                        ></div>
                    </div>
                ),
            }),
        ]);
    }, []);

    const addColumn = () => {
        if (newColumnName) {
            const newColumn = columnHelper.accessor(newColumnName, {
                header: () => newColumnName,
                cell: (info) => info.getValue() || "N/A",
            });
            setColumns((prevColumns) => [...prevColumns, newColumn]);
            setData((currentData) =>
                currentData.map((person) => ({
                    ...person,
                    [newColumnName]: `Value for ${newColumnName}`,
                }))
            );
            setNewColumnName("");
            setLastAddedColumn(newColumnName);
        }
    };

    const removeColumn = (columnId: string) => {
        setColumns((prevColumns) => {
            const updatedColumns = prevColumns.filter((col) => {
                if ("accessorKey" in col) {
                    return col.accessorKey !== columnId;
                }
                if ("accessorFn" in col) {
                    return col.id !== columnId;
                }
                return true;
            });
            return updatedColumns;
        });

        setData((prevData) =>
            prevData.map((row) => {
                const { [columnId]: removed, ...rest } = row;
                return rest;
            })
        );
    };

    const moveColumn = (columnId: string, direction: "left" | "right") => {
        setColumns((prevColumns) => {
            const columnIndex = prevColumns.findIndex(
                (column) => column.id === columnId
            );
            if (columnIndex === -1) return prevColumns;

            const newColumns = [...prevColumns];
            const [removedColumn] = newColumns.splice(columnIndex, 1);

            if (direction === "left" && columnIndex > 0) {
                newColumns.splice(columnIndex - 1, 0, removedColumn);
            } else if (
                direction === "right" &&
                columnIndex < prevColumns.length - 1
            ) {
                newColumns.splice(columnIndex + 1, 0, removedColumn);
            } else {
                newColumns.splice(columnIndex, 0, removedColumn);
            }

            return newColumns;
        });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                complete: (results) => {
                    const parsedData = results.data as Person[];
                    if (parsedData.length > 0) {
                        const newColumns = Object.keys(parsedData[0]).map(
                            (key) =>
                                columnHelper.accessor(key as keyof Person, {
                                    header: () => key,
                                    cell: (info) => info.getValue(),
                                })
                        );
                        setColumns(newColumns);
                        setData(parsedData);
                    }
                },
                header: true,
                dynamicTyping: true,
            });
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            Papa.parse(file, {
                complete: (results) => {
                    const parsedData = results.data as Person[];
                    if (parsedData.length > 0) {
                        const newColumns = Object.keys(parsedData[0]).map(
                            (key) =>
                                columnHelper.accessor(key as keyof Person, {
                                    header: () => key,
                                    cell: (info) => info.getValue(),
                                })
                        );
                        setColumns(newColumns);
                        setData(parsedData);
                    }
                },
                header: true,
                dynamicTyping: true,
            });
        }
    };

    const downloadCSV = () => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "table_data.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const refreshData = () => {
        setData(generateData(10000));
    };

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
    });

    const { rows } = table.getRowModel();
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 35, // 行の高さの推定値
        overscan: 10,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();

    const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
    const paddingBottom =
        virtualRows.length > 0
            ? totalSize - (virtualRows[virtualRows.length - 1].end || 0)
            : 0;

    return (
        <TooltipProvider>
            <div className="flex flex-col h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
                <div className="flex-none p-6 space-y-4">
                    <div className="flex justify-between w-full max-w-4xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Global filter"
                                value={globalFilter ?? ""}
                                onChange={(e) =>
                                    setGlobalFilter(e.target.value)
                                }
                                className="pl-10 max-w-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 ease-in-out"
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() =>
                                            setIsDarkMode(!isDarkMode)
                                        }
                                        className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                                    >
                                        {isDarkMode ? (
                                            <Sun className="h-5 w-5" />
                                        ) : (
                                            <Moon className="h-5 w-5" />
                                        )}
                                        <span className="sr-only">
                                            {isDarkMode
                                                ? "Light mode"
                                                : "Dark mode"}
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        {isDarkMode
                                            ? "Switch to light mode"
                                            : "Switch to dark mode"}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="compact-mode">Compact</Label>
                                <Switch
                                    id="compact-mode"
                                    checked={isCompactMode}
                                    onCheckedChange={setIsCompactMode}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Input
                            placeholder="New column name"
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            className="max-w-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 ease-in-out"
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={addColumn}
                                    className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Add Column
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Add a new column to the table</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="flex space-x-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
                                >
                                    <Upload className="h-5 w-5 mr-2" />
                                    Upload CSV
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Upload a CSV file to populate the table</p>
                            </TooltipContent>
                        </Tooltip>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".csv"
                            className="hidden"
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={downloadCSV}
                                    className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
                                >
                                    <Download className="h-5 w-5 mr-2" />
                                    Download CSV
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Download the current table data as a CSV
                                    file
                                </p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={refreshData}
                                    className="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
                                >
                                    <RefreshCw className="h-5 w-5 mr-2" />
                                    Refresh Data
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Generate new random data for the table</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                <div className="flex-grow overflow-hidden px-6 pb-6">
                    <div className="h-full flex flex-col border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                        <div
                            ref={tableContainerRef}
                            className="flex-grow overflow-auto relative"
                        >
                            <Table className="w-full">
                                <TableHeader className="bg-slate-100 dark:bg-slate-700 sticky top-0 z-10">
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup) => (
                                            <TableRow
                                                key={headerGroup.id}
                                                className="border-b border-slate-200 dark:border-slate-600"
                                            >
                                                {headerGroup.headers.map(
                                                    (header) => {
                                                        const isNewColumn =
                                                            header.id ===
                                                            lastAddedColumn;
                                                        return (
                                                            <TableHead
                                                                key={header.id}
                                                                className={`py-4 px-6 text-left text-sm font-medium text-slate-700 dark:text-slate-200 uppercase tracking-wider relative
                                                        ${
                                                            isNewColumn
                                                                ? "bg-blue-100 dark:bg-blue-900"
                                                                : ""
                                                        }`}
                                                                style={{
                                                                    position:
                                                                        "sticky",
                                                                    top: 0,
                                                                }}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span
                                                                        onClick={header.column.getToggleSortingHandler()}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {flexRender(
                                                                            header
                                                                                .column
                                                                                .columnDef
                                                                                .header,
                                                                            header.getContext()
                                                                        )}
                                                                        {{
                                                                            asc: " 🔼",
                                                                            desc: " 🔽",
                                                                        }[
                                                                            header.column.getIsSorted() as string
                                                                        ] ??
                                                                            null}
                                                                    </span>
                                                                    <Tooltip>
                                                                        <TooltipTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={(
                                                                                    e
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    removeColumn(
                                                                                        header
                                                                                            .column
                                                                                            .id
                                                                                    );
                                                                                }}
                                                                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-full absolute right-2"
                                                                                aria-label="列を削除"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>
                                                                                列を削除
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                            </TableHead>
                                                        );
                                                    }
                                                )}
                                            </TableRow>
                                        ))}
                                </TableHeader>
                                <TableBody>
                                    {paddingTop > 0 && (
                                        <tr>
                                            <td
                                                style={{
                                                    height: `${paddingTop}px`,
                                                }}
                                            />
                                        </tr>
                                    )}
                                    {virtualRows.map((virtualRow) => {
                                        const row = rows[virtualRow.index];
                                        return (
                                            <TableRow
                                                key={row.id}
                                                className={`hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer ${
                                                    isCompactMode
                                                        ? "h-8"
                                                        : "h-12"
                                                }`}
                                                onClick={() =>
                                                    setSelectedPerson(
                                                        row.original
                                                    )
                                                }
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map((cell) => {
                                                        const isNewColumn =
                                                            cell.column.id ===
                                                            lastAddedColumn;
                                                        return (
                                                            <TableCell
                                                                key={cell.id}
                                                                className={`py-2 px-6 text-sm border-b border-slate-200 dark:border-slate-700
                                                            ${
                                                                isNewColumn
                                                                    ? "bg-blue-50 dark:bg-blue-900 animate-pulse"
                                                                    : ""
                                                            }`}
                                                            >
                                                                {flexRender(
                                                                    cell.column
                                                                        .columnDef
                                                                        .cell,
                                                                    cell.getContext()
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                            </TableRow>
                                        );
                                    })}
                                    {paddingBottom > 0 && (
                                        <tr>
                                            <td
                                                style={{
                                                    height: `${paddingBottom}px`,
                                                }}
                                            />
                                        </tr>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
                <div className="flex-none p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <Button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </Button>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Page{" "}
                        <span className="font-semibold">
                            {table.getState().pagination.pageIndex + 1}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold">
                            {table.getPageCount()}
                        </span>
                    </div>
                    <Button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </Button>
                </div>
            </div>
            <Dialog
                open={!!selectedPerson}
                onOpenChange={() => setSelectedPerson(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Person Details</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        {selectedPerson && (
                            <div className="space-y-2">
                                {Object.entries(selectedPerson).map(
                                    ([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex justify-between"
                                        >
                                            <span className="font-medium">
                                                {key}:
                                            </span>
                                            <span>{value}</span>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </DialogDescription>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
