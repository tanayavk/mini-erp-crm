import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportInvoicePdf = (challan) => {
  if (!challan) return;

  const doc = new jsPDF();

  // Helper for Indian Currency
  const formatINR = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 'INR 0.00';
    return `INR ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper for Indian Date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // 1. Company Header & Branding
  doc.setFillColor(15, 23, 42); // Deep Slate (#0f172a)
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('UNIFIED BUSINESS PLATFORM', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254); // Indigo Light (#c7d2fe)
  doc.text('Wholesale & Distribution Division | GSTIN: 29AABCU9603R1ZM', 14, 26);
  doc.text('Peenya Industrial Area Phase 2, Bengaluru, Karnataka - 560058', 14, 32);

  // 2. Invoice Meta Details (Right Side)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DELIVERY CHALLAN', 196, 18, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Challan #: ${challan.challan_number || 'N/A'}`, 196, 26, { align: 'right' });
  doc.text(`Date: ${formatDate(challan.created_at)}`, 196, 32, { align: 'right' });

  // 3. Customer Billing Details Block
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CUSTOMER BILLING & DISPATCH DETAILS', 14, 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(challan.customer_business_name || challan.customer_name || 'Valued Customer', 14, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Contact: ${challan.customer_name || 'N/A'} | Mobile: ${challan.customer_mobile || 'N/A'}`, 14, 61);
  doc.text(`Email: ${challan.customer_email || 'N/A'}`, 14, 66);
  doc.text(`GSTIN: ${challan.customer_gst_number || 'N/A'}`, 14, 71);

  if (challan.customer_address) {
    const splitAddress = doc.splitTextToSize(`Address: ${challan.customer_address}`, 180);
    doc.text(splitAddress, 14, 76);
  }

  // 4. Itemized Snapshot Table
  const tableData = (challan.items || []).map((item, index) => {
    const qty = parseInt(item.quantity, 10) || 0;
    const price = parseFloat(item.unit_price_snapshot) || 0;
    const lineTotal = item.line_total ? parseFloat(item.line_total) : qty * price;

    return [
      index + 1,
      item.product_name_snapshot || `Product #${item.product_id}`,
      qty,
      formatINR(price),
      formatINR(lineTotal),
    ];
  });

  const startY = challan.customer_address ? 88 : 82;

  autoTable(doc, {
    startY: startY,
    head: [['Sr.', 'Item Description', 'Qty', 'Unit Price', 'Line Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' },
      4: { cellWidth: 40, halign: 'right' },
    },
  });

  // 5. Total Valuation & Summary Block
  const finalY = doc.lastAutoTable.finalY + 10;
  const grandTotal = (challan.items || []).reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10) || 0;
    const price = parseFloat(item.unit_price_snapshot) || 0;
    return sum + (item.line_total ? parseFloat(item.line_total) : qty * price);
  }, 0);

  doc.setFillColor(248, 250, 252);
  doc.rect(120, finalY, 76, 22, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(120, finalY, 76, 22, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Dispatched Items: ${challan.total_quantity || 0} Units`, 124, finalY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Grand Total: ${formatINR(grandTotal)}`, 124, finalY + 16);

  // 6. Footer Terms & Authorized Signatory
  const footerY = finalY + 40;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Terms & Conditions:', 14, footerY);
  doc.text('1. Goods once sold/dispatched will not be taken back.', 14, footerY + 5);
  doc.text('2. This is a computer-generated delivery challan generated via Unified Business Platform.', 14, footerY + 10);

  doc.line(140, footerY + 10, 196, footerY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Authorized Signatory', 152, footerY + 16);

  // 7. Save File
  doc.save(`Invoice_${challan.challan_number || 'Challan'}.pdf`);
};