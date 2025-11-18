import React, { useState, useMemo, ChangeEvent } from 'react';

export type Column<T extends object> = {
  header: string;
  accessor: keyof T;
  className?: string;
  cell?: (value: T[keyof T], row: T, rowIndex: number) => React.ReactNode;
};

type DataTableProps<T extends object> = {
  data: T[];
  columns: Column<T>[];
  search: string;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  onDownload?: (data: T[]) => void;
  title: string;
  subtitle?: string;
};

function renderCellValue(value: any): React.ReactNode {
  if (value === null || value === undefined) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return value.toString();
  if (React.isValidElement(value)) return value;
  return String(value);
}

export function DataTable<T extends object>({
  data,
  columns,
  search,
  rowsPerPageOptions = [5, 10, 20],
  defaultRowsPerPage = 10,
  onDownload,
  title,
  subtitle,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | 'index' | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  
  const autoColumns: Column<T>[] = useMemo(() => {
    if (columns && columns.length > 0) return columns;
    if (data.length === 0) return [];

    const keys = Object.keys(data[0]) as (keyof T)[];
    return keys.map((key) => ({
      header: String(key).charAt(0).toUpperCase() + String(key).slice(1),
      accessor: key,
    }));
  }, [columns, data]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((row) =>
      autoColumns.some((col) => {
        if (col.accessor === 'index') return false;
        const val = row[col.accessor];
        if (val === undefined || val === null) return false;
        return val.toString().toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, search, autoColumns]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    const key = sortConfig.key;
    if (key === 'index') return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === 'asc'
        ? aVal.toString().localeCompare(bVal.toString())
        : bVal.toString().localeCompare(aVal.toString());
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const currentPageData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  function handleSort(key: keyof T | 'index') {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  }

  function onChangeRowsPerPage(e: ChangeEvent<HTMLSelectElement>) {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }

  return (
    <section className="bg-white rounded-lg shadow-lg ring-1 ring-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-cyan-900">{title}</h3>
          {subtitle && <p className="text-cyan-600">{subtitle}</p>}
        </div>
        {onDownload && (
          <button
            onClick={() => onDownload(data)}
            className="
              inline-flex items-center gap-2
              bg-gradient-to-r from-cyan-500 to-blue-500
              hover:from-cyan-600 hover:to-blue-600
              active:scale-95
              text-white font-semibold
              px-4 py-2 rounded-lg shadow-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-cyan-400
              focus:ring-offset-2 focus:ring-offset-white
            "
            aria-label={`Download full ${title} CSV`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            <span>Download CSV</span>
          </button>

        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-gray-700">
          <thead className="bg-cyan-100 text-cyan-900">
            <tr>
              {autoColumns.map((col) => (
                <th
                  key={String(col.accessor)}
                  onClick={() => handleSort(col.accessor)}
                  className="px-4 py-3 font-medium cursor-pointer select-none user-select-none"
                  title={`Sort by ${col.header}`}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {sortConfig.key === col.accessor &&
                      (sortConfig.direction === 'asc' ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 15l-6-6-6 6" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentPageData.length === 0 ? (
              <tr>
                <td
                  colSpan={autoColumns.length}
                  className="px-4 py-6 text-center text-gray-400 italic"
                >
                  No data found.
                </td>
              </tr>
            ) : (
              currentPageData.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-200 hover:bg-cyan-50 transition cursor-pointer"
                  style={{
                    backgroundColor:
                      search &&
                      autoColumns.some((col) => {
                        if (col.accessor === 'index') return false;
                        const val = row[col.accessor];
                        if (val === undefined || val === null) return false;
                        return val
                          .toString()
                          .toLowerCase()
                          .includes(search.toLowerCase());
                      })
                        ? 'rgba(6, 182, 212, 0.1)'
                        : '',
                  }}
                >
                  {autoColumns.map((col) => (
                    <td
                      key={String(col.accessor)}
                      className={`px-4 py-3 ${col.className || ''}`}
                    >
                      {col.accessor === 'index'
                        ? i + 1 + (page - 1) * rowsPerPage
                        : col.cell
                        ? col.cell(row[col.accessor], row, i)
                        : renderCellValue(row[col.accessor])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <label htmlFor="rowsPerPage" className="font-medium">
            Rows per page:
          </label>
          <select
            id="rowsPerPage"
            value={rowsPerPage}
            onChange={onChangeRowsPerPage}
            className="border border-gray-300 rounded-md px-3 py-1 pr-8 leading-6 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
            aria-label="Select number of rows per page"
          >
            {rowsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700 select-none">
          <button
            onClick={() => setPage((old) => Math.max(old - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-md border border-gray-300 hover:bg-cyan-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            &lt;
          </button>
          <span>
            Page <span className="font-semibold">{page}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage((old) => Math.min(old + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 hover:bg-cyan-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </div>
    </section>
  );
}

export default DataTable;
