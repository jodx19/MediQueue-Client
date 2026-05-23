import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {
  async exportToExcel(data: any[], filename: string, sheetName = 'Report'): Promise<void> {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const maxWidth = data.reduce((w, r) =>
      Math.max(w, ...Object.values(r).map(v => String(v).length)), 10);
    ws['!cols'] = Object.keys(data[0] ?? {}).map(() => ({ wch: Math.min(maxWidth, 30) }));
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  async exportToPDF(columns: string[], rows: any[][], filename: string, title: string): Promise<void> {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text('MediQueue EMR', doc.internal.pageSize.width - 14, 28, { align: 'right' });
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 250, 252] },
    });
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
