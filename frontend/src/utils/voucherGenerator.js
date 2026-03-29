import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import { formatCurrency } from './format';

// Función para cargar imagen y convertirla a Base64 para jsPDF
const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg');
            resolve(dataURL);
        };
        img.onerror = (e) => reject(e);
        img.src = url;
    });
};

export const generateVoucher = async (data) => {
    try {
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // 1. Cabecera (Header) con Logo
        let headerY = 30;
        try {
            // Cargar el logo desde la carpeta pública
            const logoBase64 = await loadImage('/logo.jpg');
            // Dibujar logo (centrado arriba)
            const logoWidth = 40;
            const logoHeight = 25; // Proporción estimada
            doc.addImage(logoBase64, 'JPEG', (pageWidth / 2) - (logoWidth / 2), 15, logoWidth, logoHeight);
            headerY = 45; // Bajar el texto si hay logo
        } catch (error) {
            console.warn("No se pudo cargar el logo, se omitirá en el PDF:", error);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // color-slate-800
        doc.text('HOTEL BALCÓN PLAZA', pageWidth / 2, headerY, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // color-slate-500
        doc.text('NIT: 900.000.000-1 | TEL: (604) 000-0000', pageWidth / 2, headerY + 7, { align: 'center' });
        doc.text('Calle Real # 12-34, Santa Fe de Antioquia', pageWidth / 2, headerY + 12, { align: 'center' });

        doc.setDrawColor(226, 232, 240); // color-slate-200
        doc.line(margin, headerY + 20, pageWidth - margin, headerY + 20);

        // 2. Título del Documento
        const startInfoY = headerY + 35;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // color-blue-600
        const titleText = data.tipo === 'reserva' ? 'COMPROBANTE DE RESERVA' : 'RECIBO DE ESTANCIA (CHECK-IN)';
        doc.text(titleText, margin, startInfoY);

        // 3. Información del Cliente
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // color-slate-600
        doc.text('DATOS DEL HUÉSPED', margin, startInfoY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${data.cliente_nombre}`, margin, startInfoY + 17);
        doc.text(`Identificación: ${data.identificacion || 'N/A'}`, margin, startInfoY + 22);
        doc.text(`Teléfono: ${data.telefono || 'N/A'}`, margin, startInfoY + 27);

        // 4. Información de la Estancia
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLES DE ESTANCIA', pageWidth / 2 + 10, startInfoY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Check-in: ${moment.utc(data.fecha_entrada).format('DD/MM/YYYY')}`, pageWidth / 2 + 10, startInfoY + 17);
        doc.text(`Check-out: ${moment.utc(data.fecha_salida).format('DD/MM/YYYY')}`, pageWidth / 2 + 10, startInfoY + 22);
        const noches = Math.max(1, moment.utc(data.fecha_salida).diff(moment.utc(data.fecha_entrada), 'days'));
        doc.text(`Duración: ${noches} Noches`, pageWidth / 2 + 10, startInfoY + 27);

        // 5. Tabla de Habitaciones
        const headers = [['HAB.', 'PRECIO POR NOCHE', 'SUBTOTAL']];
        const body = (data.habitaciones || []).map(h => [
            `Habitación ${h.numero || '?'}`,
            `$ ${formatCurrency(h.precio_acordado || h.precio || 0)}`,
            `$ ${formatCurrency((h.precio_acordado || h.precio || 0) * noches)}`
        ]);

        autoTable(doc, {
            startY: startInfoY + 40,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: margin, right: margin }
        });

        // 6. Resumen Financiero
        const finalY = doc.lastAutoTable.finalY + 15;
        const summaryX = pageWidth - margin - 60;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('VALOR TOTAL:', summaryX, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text(`$ ${formatCurrency(data.valor_total)}`, pageWidth - margin, finalY, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.text('TOTAL ABONADO:', summaryX, finalY + 7);
        doc.setTextColor(16, 185, 129); // emerald-600
        doc.setFont('helvetica', 'bold');
        doc.text(`$ ${formatCurrency(data.valor_abonado)}`, pageWidth - margin, finalY + 7, { align: 'right' });

        const saldo = data.valor_total - data.valor_abonado;
        doc.setTextColor(...(saldo > 0 ? [220, 38, 38] : [16, 185, 129])); // red-600 o emerald-600
        doc.text('SALDO PENDIENTE:', summaryX, finalY + 14);
        doc.setFontSize(12);
        doc.text(`$ ${formatCurrency(saldo)}`, pageWidth - margin, finalY + 14, { align: 'right' });

        // 7. Pie de página (Footer)
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, 260, pageWidth - margin, 260);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('Este documento es un comprobante informativo. Los consumos adicionales se cobrarán al check-out.', margin, 270);
        doc.text('¡Gracias por elegir Hotel Balcón Plaza!', pageWidth / 2, 280, { align: 'center' });

        // Descargar el PDF
        doc.save(`Voucher-${data.cliente_nombre.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
        console.error("Error al generar el PDF:", err);
    }
};
