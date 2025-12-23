import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 * @param {Array} columns - Optional array of column definitions {key, label}
 */
export const exportToCSV = (data, filename, columns = null) => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // If columns provided, use them; otherwise use all keys from first object
  const headers = columns
    ? columns.map((col) => col.label)
    : Object.keys(data[0]);

  const keys = columns ? columns.map((col) => col.key) : Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      keys.map((key) => {
        const value = row[key] || "";
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 * @param {string} sheetName - Name of the sheet
 * @param {Array} columns - Optional array of column definitions
 */
export const exportToExcel = (data, filename, sheetName = "Data", columns = null) => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Transform data if columns are specified
  let exportData = data;
  if (columns) {
    exportData = data.map((row) => {
      const newRow = {};
      columns.forEach((col) => {
        newRow[col.label] = row[col.key];
      });
      return newRow;
    });
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export data to PDF format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 * @param {string} title - Title of the document
 * @param {Array} columns - Array of column definitions {key, label}
 */
export const exportToPDF = (data, filename, title = "Report", columns) => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  // Prepare table data
  const headers = columns.map((col) => col.label);
  const rows = data.map((row) => columns.map((col) => row[col.key] || ""));

  // Add table
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
};

/**
 * Export multiple sheets to Excel
 * @param {Array} sheets - Array of {data, sheetName, columns}
 * @param {string} filename - Name of the file
 */
export const exportMultiSheetExcel = (sheets, filename) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ data, sheetName, columns }) => {
    let exportData = data;
    if (columns) {
      exportData = data.map((row) => {
        const newRow = {};
        columns.forEach((col) => {
          newRow[col.label] = row[col.key];
        });
        return newRow;
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
