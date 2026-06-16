import PDFDocument from 'pdfkit';
import type { Response } from 'express';

export type InvoiceData = {
  orderId: number;
  customerName: string;
  customerContact: string;
  templateTitle: string;
  budgetRange: string;
  projectType: string;
  status: string;
  createdAt: string;
  paymentDate?: string;
  paymentMethod?: string;
};

export async function generateInvoicePDF(
  res: Response,
  invoiceData: InvoiceData
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Invoice #${invoiceData.orderId}`,
          Author: 'Naki Code',
          Subject: `Invoice for Order #${invoiceData.orderId}`,
        },
      });

      // Pipe to response
      doc.pipe(res);

      // Header - Company Info
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#172447')
        .text('Naki Code', 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Toko Template Coding & Jasa Custom Website', 50, 80)
        .text('Email: hello@nakicode.com', 50, 95)
        .text('Website: https://nakicode.com', 50, 110);

      // Invoice Title
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#4a90e2')
        .text('INVOICE', 400, 50, { align: 'right' });

      // Invoice Number
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#333333')
        .text(`#${String(invoiceData.orderId).padStart(6, '0')}`, 400, 85, {
          align: 'right',
        });

      // Invoice Date
      const invoiceDate = new Date(invoiceData.createdAt).toLocaleDateString(
        'id-ID',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      );
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(`Tanggal: ${invoiceDate}`, 400, 105, { align: 'right' });

      // Divider line
      doc
        .strokeColor('#e0e0e0')
        .lineWidth(1)
        .moveTo(50, 140)
        .lineTo(545, 140)
        .stroke();

      // Bill To Section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#172447')
        .text('BILL TO:', 50, 160);

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#333333')
        .text(invoiceData.customerName, 50, 180)
        .text(invoiceData.customerContact, 50, 195);

      // Order Details Section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#172447')
        .text('DETAIL PESANAN:', 50, 240);

      // Table Header
      const tableTop = 270;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .rect(50, tableTop, 495, 25)
        .fill('#4a90e2');

      doc
        .fillColor('#ffffff')
        .text('Deskripsi', 60, tableTop + 8)
        .text('Tipe Project', 300, tableTop + 8)
        .text('Harga', 450, tableTop + 8);

      // Table Content
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333333')
        .text(invoiceData.templateTitle, 60, tableTop + 38, { width: 220 })
        .text(invoiceData.projectType, 300, tableTop + 38, { width: 140 })
        .text(invoiceData.budgetRange, 450, tableTop + 38, { width: 85 });

      // Table Border
      doc
        .strokeColor('#e0e0e0')
        .lineWidth(0.5)
        .rect(50, tableTop + 25, 495, 50)
        .stroke();

      // Total Section
      const totalTop = tableTop + 100;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#172447')
        .text('TOTAL:', 380, totalTop)
        .text(invoiceData.budgetRange, 450, totalTop);

      // Payment Info
      if (invoiceData.paymentDate) {
        const paymentInfoTop = totalTop + 50;
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#4a90e2')
          .text('INFORMASI PEMBAYARAN:', 50, paymentInfoTop);

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#333333')
          .text(`Status: ${invoiceData.status.toUpperCase()}`, 50, paymentInfoTop + 20)
          .text(
            `Tanggal Bayar: ${new Date(invoiceData.paymentDate).toLocaleDateString('id-ID')}`,
            50,
            paymentInfoTop + 35
          );

        if (invoiceData.paymentMethod) {
          doc.text(`Metode: ${invoiceData.paymentMethod}`, 50, paymentInfoTop + 50);
        }
      }

      // Footer
      const footerTop = 700;
      doc
        .strokeColor('#e0e0e0')
        .lineWidth(1)
        .moveTo(50, footerTop)
        .lineTo(545, footerTop)
        .stroke();

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#999999')
        .text(
          'Terima kasih telah menggunakan layanan Naki Code!',
          50,
          footerTop + 15,
          { align: 'center', width: 495 }
        )
        .text(
          'Untuk pertanyaan, hubungi hello@nakicode.com',
          50,
          footerTop + 30,
          { align: 'center', width: 495 }
        );

      // Finalize PDF
      doc.end();

      // Resolve when done
      doc.on('end', resolve);
      doc.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}
