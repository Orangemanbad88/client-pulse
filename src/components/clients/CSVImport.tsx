'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, ChevronRight, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface CSVImportProps {
  onImport: (rows: Record<string, string>[]) => void;
  onClose: () => void;
}

const EXPECTED_COLUMNS = [
  'firstName', 'lastName', 'email', 'phone', 'clientType', 'status',
  'source', 'preferredContact', 'notes', 'currentAddress',
];

const COLUMN_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  clientType: 'Client Type',
  status: 'Status',
  source: 'Lead Source',
  preferredContact: 'Preferred Contact',
  notes: 'Notes',
  currentAddress: 'Current Address',
};

const autoDetectColumn = (header: string): string | null => {
  const h = header.toLowerCase().trim().replace(/[_\-\s]+/g, '');
  const map: Record<string, string> = {
    firstname: 'firstName', first: 'firstName', fname: 'firstName',
    lastname: 'lastName', last: 'lastName', lname: 'lastName', surname: 'lastName',
    email: 'email', emailaddress: 'email', mail: 'email',
    phone: 'phone', phonenumber: 'phone', mobile: 'phone', cell: 'phone', telephone: 'phone',
    clienttype: 'clientType', type: 'clientType',
    status: 'status',
    source: 'source', leadsource: 'source', referral: 'source',
    preferredcontact: 'preferredContact', contactmethod: 'preferredContact',
    notes: 'notes', note: 'notes', comments: 'notes',
    address: 'currentAddress', currentaddress: 'currentAddress',
  };
  return map[h] || null;
};

const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { cols.push(current.trim()); current = ''; continue; }
      current += char;
    }
    cols.push(current.trim());
    return cols;
  });
  return { headers, rows };
};

export const CSVImport = ({ onImport, onClose }: CSVImportProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        setError('Could not parse CSV file');
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      const autoMap: Record<number, string> = {};
      headers.forEach((h, i) => {
        const detected = autoDetectColumn(h);
        if (detected) autoMap[i] = detected;
      });
      setColumnMapping(autoMap);
      setStep(2);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const mappedColumns = Object.values(columnMapping);
  const getMappedRows = (): Record<string, string>[] => {
    return csvRows.map((row) => {
      const obj: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([colIdx, field]) => {
        obj[field] = row[Number(colIdx)] || '';
      });
      return obj;
    });
  };

  const handleConfirmImport = () => {
    const rows = getMappedRows();
    onImport(rows);
  };

  const previewRows = getMappedRows().slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-amber-200/25 dark:border-gray-800/60 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 rounded-full bg-teal-500" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Import Clients from CSV</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 py-3 border-b border-amber-100/30 dark:border-gray-800/60 flex items-center gap-2 shrink-0">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}>
                {step > s ? <Check size={12} /> : s}
              </div>
              <span className={`text-xs font-medium ${step >= s ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>
                {s === 1 ? 'Upload' : s === 2 ? 'Map Columns' : 'Preview'}
              </span>
              {s < 3 && <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 mx-1" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragOver
                  ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-900/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700'
              }`}
            >
              <FileSpreadsheet size={40} className="text-teal-500 mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Drag & drop your CSV file here</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">or click to browse</p>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleInputChange} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors shadow-sm shadow-teal-600/20 active:scale-[0.97]"
              >
                <Upload size={13} /> Browse Files
              </button>
              {error && (
                <div className="mt-4 flex items-center gap-2 justify-center text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Map your CSV columns to ClientPulse fields. Auto-detected mappings are highlighted.
              </p>
              {csvHeaders.map((header, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-40 truncate shrink-0" title={header}>
                    {header}
                  </span>
                  <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
                  <select
                    value={columnMapping[idx] || ''}
                    onChange={(e) => {
                      setColumnMapping((prev) => {
                        const next = { ...prev };
                        if (e.target.value) {
                          next[idx] = e.target.value;
                        } else {
                          delete next[idx];
                        }
                        return next;
                      });
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
                      columnMapping[idx]
                        ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800/30 text-teal-700 dark:text-teal-400'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <option value="">— Skip —</option>
                    {EXPECTED_COLUMNS.map((col) => (
                      <option key={col} value={col} disabled={mappedColumns.includes(col) && columnMapping[idx] !== col}>
                        {COLUMN_LABELS[col] || col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Showing first {Math.min(5, csvRows.length)} of {csvRows.length} rows. Verify the data looks correct.
              </p>
              <div className="overflow-x-auto rounded-lg border border-amber-200/25 dark:border-gray-800/60">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      {Object.values(columnMapping).map((field) => (
                        <th key={field} className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {COLUMN_LABELS[field] || field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/30 dark:divide-gray-800/60">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-teal-50/20 dark:hover:bg-teal-900/5">
                        {Object.values(columnMapping).map((field) => (
                          <td key={field} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[200px] truncate">
                            {row[field] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-amber-100/30 dark:border-gray-800/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-400">
            {fileName && <span>{fileName} — {csvRows.length} rows</span>}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={Object.keys(columnMapping).length === 0}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors shadow-sm shadow-teal-600/20 active:scale-[0.97]"
              >
                Preview <ChevronRight size={13} />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg transition-colors shadow-sm shadow-teal-600/20 active:scale-[0.97]"
              >
                <Check size={13} /> Import {csvRows.length} Clients
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
