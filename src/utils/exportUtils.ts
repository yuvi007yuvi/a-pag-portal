import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToJPEG = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        canvas.toBlob((blob) => {
            if (blob) {
                saveAs(blob, `${fileName}.jpeg`);
            }
        }, 'image/jpeg', 0.95); // 0.95 quality
    } catch (error) {
        console.error('Error exporting to JPEG:', error);
    }
};

export const exportToPDF = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileName}.pdf`);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
    }
};

export const exportToExcel = (data: any[], fileName: string) => {
    try {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(dataBlob, `${fileName}.xlsx`);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
    }
};
