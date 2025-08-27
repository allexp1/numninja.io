'use client';

import React, { useState } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { CDRRecord, SMSRecord, exportToCSV, exportSMSToCSV } from '@/lib/cdr';

interface ExportButtonProps {
  data: CDRRecord[] | SMSRecord[];
  type: 'cdr' | 'sms';
  filename?: string;
}

export default function ExportButton({ data, type, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const getFilename = (format: 'csv' | 'json') => {
    const defaultName = type === 'cdr' ? 'call-logs' : 'sms-logs';
    const baseName = filename || defaultName;
    const date = new Date().toISOString().split('T')[0];
    return `${baseName}-${date}.${format}`;
  };

  const exportAsCSV = () => {
    setIsExporting(true);
    try {
      let csvContent: string;
      if (type === 'cdr') {
        csvContent = exportToCSV(data as CDRRecord[]);
      } else {
        csvContent = exportSMSToCSV(data as SMSRecord[]);
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', getFilename('csv'));
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const exportAsJSON = () => {
    setIsExporting(true);
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', getFilename('json'));
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const exportAsPDF = () => {
    // For PDF export, we'll create a simple HTML table and use browser's print function
    setIsExporting(true);
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${type === 'cdr' ? 'Call Logs' : 'SMS Logs'}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { margin-bottom: 20px; }
            .summary { margin: 10px 0; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${type === 'cdr' ? 'Call Detail Records' : 'SMS Message Logs'}</h1>
            <div class="summary">
              Generated on: ${new Date().toLocaleString()}<br>
              Total records: ${data.length}
            </div>
          </div>
      `;

      if (type === 'cdr') {
        const cdrData = data as CDRRecord[];
        htmlContent += `
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Direction</th>
                <th>From</th>
                <th>To</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        cdrData.forEach(record => {
          htmlContent += `
            <tr>
              <td>${new Date(record.start_time).toLocaleString()}</td>
              <td>${record.direction}</td>
              <td>${record.from_number}</td>
              <td>${record.to_number}</td>
              <td>${record.duration_formatted}</td>
              <td>${record.status}</td>
              <td>$${record.cost.toFixed(2)}</td>
            </tr>
          `;
        });
      } else {
        const smsData = data as SMSRecord[];
        htmlContent += `
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Direction</th>
                <th>From</th>
                <th>To</th>
                <th>Message</th>
                <th>Status</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        smsData.forEach(record => {
          htmlContent += `
            <tr>
              <td>${new Date(record.created_at).toLocaleString()}</td>
              <td>${record.direction}</td>
              <td>${record.from_number}</td>
              <td>${record.to_number}</td>
              <td>${record.message.substring(0, 50)}${record.message.length > 50 ? '...' : ''}</td>
              <td>${record.status}</td>
              <td>$${record.cost.toFixed(2)}</td>
            </tr>
          `;
        });
      }

      htmlContent += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting || data.length === 0}
        className={`
          px-4 py-2 rounded-lg font-medium transition-colors
          flex items-center gap-2
          ${data.length === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {showMenu && data.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={exportAsCSV}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <TableCellsIcon className="h-4 w-4" />
                Export as CSV
              </button>
              <button
                onClick={exportAsJSON}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <DocumentTextIcon className="h-4 w-4" />
                Export as JSON
              </button>
              <button
                onClick={exportAsPDF}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <DocumentTextIcon className="h-4 w-4" />
                Print/PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}