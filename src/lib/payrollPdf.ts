import { jsPDF } from 'jspdf';
import type { PayrollRecord } from '../types/erp';

export function amountInWords(value: number): string {
  const ones = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const underThousand = (number: number): string => {
    const parts: string[] = [];
    if (number >= 100) {
      parts.push(`${ones[Math.floor(number / 100)]} hundred`);
      number %= 100;
    }
    if (number >= 20) {
      parts.push(`${tens[Math.floor(number / 10)]}${number % 10 ? `-${ones[number % 10]}` : ''}`);
    } else if (number > 0) {
      parts.push(ones[number]);
    }
    return parts.join(' ');
  };
  const integer = Math.floor(Math.max(0, value));
  const paise = Math.round((value - integer) * 100);
  let remainder = integer;
  const groups = [
    { divisor: 10_000_000, label: 'crore' },
    { divisor: 100_000, label: 'lakh' },
    { divisor: 1_000, label: 'thousand' },
    { divisor: 1, label: '' },
  ];
  const words = groups.flatMap(({ divisor, label }) => {
    const group = Math.floor(remainder / divisor);
    remainder %= divisor;
    return group > 0 ? [`${underThousand(group)}${label ? ` ${label}` : ''}`] : [];
  }).join(' ');
  return `Indian rupees ${words || 'zero'}${paise ? ` and ${underThousand(paise)} paise` : ''} only`;
}

export function maskBankAccountNumber(accountNumber: string): string {
  const account = accountNumber.trim();
  if (!account) return '';
  if (account.length <= 4) return '••••';
  return `•••• ${account.slice(-4)}`;
}

export function downloadPayslipPdf(record: PayrollRecord): void {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 11;
  const contentWidth = pageWidth - margin * 2;
  const navy: [number, number, number] = [24, 52, 92];
  const paleBlue: [number, number, number] = [241, 246, 252];
  const border: [number, number, number] = [214, 225, 239];
  const muted: [number, number, number] = [91, 109, 132];
  const money = (value: number) => value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  let y = 11;

  pdf.setFillColor(...navy);
  pdf.roundedRect(margin, y, 13, 13, 3, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('A', margin + 6.5, y + 9.2, { align: 'center' });
  pdf.setTextColor(23, 36, 58);
  pdf.setFontSize(11);
  pdf.text('AAV Innovation Labs', margin + 17, y + 5.2);
  pdf.setTextColor(...muted);
  pdf.setFontSize(6.5);
  pdf.text('P E O P L E   &   P A Y R O L L', margin + 17, y + 10);
  pdf.setTextColor(...navy);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(17);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PAYSLIP', pageWidth - margin, y + 5.2, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...muted);
  pdf.setFontSize(8);
  pdf.text(`${record.month} ${record.year} - Revision ${record.revision}`, pageWidth - margin, y + 10, { align: 'right' });
  y += 18;
  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, pageWidth - margin, y);

  y += 9;
  pdf.setTextColor(23, 36, 58);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(pdf.splitTextToSize(record.employeeName, contentWidth - 28), margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...muted);
  pdf.setFontSize(8);
  pdf.text(`${record.designation} - ${record.department} - ${record.employeeCode}`, margin, y + 6);
  pdf.setDrawColor(125, 183, 151);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(pageWidth - margin - 16, y - 4, 16, 7, 1.5, 1.5, 'S');
  pdf.setTextColor(33, 116, 74);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.text(record.status.toUpperCase(), pageWidth - margin - 8, y + 0.6, { align: 'center' });
  y += 13;

  const summaryGap = 3;
  const summaryWidth = (contentWidth - summaryGap * 2) / 3;
  const summaryHeight = 18;
  const summaryItems = [
    { label: 'Gross earnings', value: `INR ${money(record.totalEarnings)}`, fill: [255, 255, 255] as [number, number, number] },
    { label: 'Total deductions', value: `INR ${money(record.totalDeductions)}`, fill: [255, 255, 255] as [number, number, number] },
    { label: 'Net pay', value: `INR ${money(record.netPay)}`, fill: navy },
  ];
  summaryItems.forEach((item, index) => {
    const x = margin + index * (summaryWidth + summaryGap);
    pdf.setFillColor(...item.fill);
    pdf.roundedRect(x, y, summaryWidth, summaryHeight, 2.5, 2.5, 'F');
    pdf.setDrawColor(...border);
    pdf.roundedRect(x, y, summaryWidth, summaryHeight, 2.5, 2.5, 'S');
    pdf.setTextColor(...(index === 2 ? [199, 216, 241] as [number, number, number] : muted));
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(item.label, x + 5, y + 5);
    pdf.setTextColor(...(index === 2 ? [255, 255, 255] as [number, number, number] : [23, 36, 58] as [number, number, number]));
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(item.value, x + 5, y + 13.5);
  });
  y += summaryHeight + 6;

  const detailsTop = y;
  const detailsHeight = 47;
  pdf.setFillColor(...paleBlue);
  pdf.setDrawColor(...border);
  pdf.roundedRect(margin, detailsTop, contentWidth, detailsHeight, 2, 2, 'FD');
  pdf.setTextColor(...navy);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('EMPLOYEE & PAYMENT DETAILS', margin + 4, y + 5);
  pdf.setDrawColor(...border);
  pdf.setLineWidth(0.25);
  pdf.line(margin + 4, y + 8, pageWidth - margin - 4, y + 8);
  y += 13;
  const detailColumns = [
    [
      ['Joining date', record.joiningDate],
      ['Bank', record.bankName || 'Not provided'],
      ['PF no.', record.providentFundNumber || 'Not provided'],
    ],
    [
      ['Location', record.location],
      ['Account no.', record.bankAccountNumber ? maskBankAccountNumber(record.bankAccountNumber).replace(/•/g, '*') : 'Not provided'],
      ['PF UAN', record.providentFundUan || 'Not provided'],
    ],
    [
      ['Work days - LOP', `${record.effectiveWorkDays} - ${record.lossOfPayDays}`],
      ['PAN', record.panNumber || 'Not provided'],
      ['Other', record.otherDetails || '-'],
    ],
  ];
  const detailColumnWidth = contentWidth / 3;
  const fitText = (value: string, width: number) => {
    let text = value;
    while (text && pdf.getTextWidth(`${text}...`) > width) text = text.slice(0, -1);
    return text.length < value.length ? `${text}...` : value;
  };
  detailColumns.forEach((column, columnIndex) => {
    const x = margin + columnIndex * detailColumnWidth;
    column.forEach(([label, value], rowIndex) => {
      const top = y + rowIndex * 10.5;
      pdf.setTextColor(...muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(label, x + 1, top);
      pdf.setTextColor(23, 36, 58);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.text(fitText(value, detailColumnWidth - 5), x + 1, top + 4.5);
    });
  });
  y = detailsTop + detailsHeight + 8;

  const earningLines: Array<[string, number, number]> = [
    ['Basic salary', record.basicSalaryMaster, record.basicSalary],
    ['HRA', record.hraMaster, record.hra],
    ['Special allowance', record.specialAllowanceMaster, record.specialAllowance],
    ['Bonus', record.bonusMaster, record.bonus],
  ];
  const deductionLines: Array<[string, number]> = [
    ['Provident Fund', record.providentFund],
    ['Professional Tax', record.professionalTax],
    ['Income Tax', record.incomeTax],
  ];
  const tableGap = 10;
  const tableWidth = (contentWidth - tableGap) / 2;
  const leftX = margin;
  const rightX = margin + tableWidth + tableGap;
  const headerY = y;
  pdf.setTextColor(...navy);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('EARNINGS (INR)', leftX, headerY);
  pdf.text('DEDUCTIONS (INR)', rightX, headerY);
  y += 8;
  pdf.setTextColor(...muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('Component', leftX, y);
  pdf.text('Master', leftX + tableWidth - 30, y, { align: 'right' });
  pdf.text('Actual', leftX + tableWidth, y, { align: 'right' });
  pdf.text('Component', rightX, y);
  pdf.text('Actual', rightX + tableWidth, y, { align: 'right' });
  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y + 2, leftX + tableWidth, y + 2);
  pdf.line(rightX, y + 2, rightX + tableWidth, y + 2);
  y += 6;
  pdf.setFontSize(7.5);
  for (let index = 0; index < earningLines.length; index += 1) {
    const [label, master, actual] = earningLines[index];
    const deduction = deductionLines[index];
    pdf.setTextColor(31, 47, 69);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, leftX, y + 3.5, { maxWidth: 34 });
    pdf.text(money(master), leftX + tableWidth - 30, y + 3.5, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(money(actual), leftX + tableWidth, y + 3.5, { align: 'right' });
    if (deduction) {
      pdf.setFont('helvetica', 'normal');
      pdf.text(deduction[0], rightX, y + 3.5, { maxWidth: tableWidth - 28 });
      pdf.setFont('helvetica', 'bold');
      pdf.text(money(deduction[1]), rightX + tableWidth, y + 3.5, { align: 'right' });
    }
    pdf.setDrawColor(...border);
    pdf.line(leftX, y + 5, leftX + tableWidth, y + 5);
    pdf.line(rightX, y + 5, rightX + tableWidth, y + 5);
    y += 8;
  }
  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.35);
  pdf.line(leftX, y - 1, leftX + tableWidth, y - 1);
  pdf.line(rightX, y - 1, rightX + tableWidth, y - 1);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...navy);
  pdf.text('Total earnings', leftX, y + 4);
  pdf.text(money(record.basicSalaryMaster + record.hraMaster + record.specialAllowanceMaster + record.bonusMaster), leftX + tableWidth - 30, y + 4, { align: 'right' });
  pdf.text(money(record.totalEarnings), leftX + tableWidth, y + 4, { align: 'right' });
  pdf.text('Total deductions', rightX, y + 4);
  pdf.text(money(record.totalDeductions), rightX + tableWidth, y + 4, { align: 'right' });
  y += 14;

  pdf.setFillColor(...paleBlue);
  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.45);
  pdf.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, 'FD');
  pdf.setTextColor(...navy);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('N E T   P A Y   ( G R O S S   -   D E D U C T I O N S )', margin + 6, y + 8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...muted);
  pdf.setFontSize(7);
  pdf.text(amountInWords(record.netPay), margin + 6, y + 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...navy);
  pdf.setFontSize(14);
  pdf.text(`INR ${money(record.netPay)}`, pageWidth - margin - 6, y + 10, { align: 'right' });

  const footerY = pageHeight - 12;
  pdf.setDrawColor(...border);
  pdf.setLineWidth(0.25);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  pdf.setTextColor(...muted);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.text('Confidential. System-generated pay slip, no signature required.', margin, footerY);
  pdf.text(`AAV Innovation Labs - Payslip ${record.month} ${record.year} - Rev ${record.revision} - Page 1 of 1`, pageWidth - margin, footerY, { align: 'right' });

  const monthNumber = String(new Date(`${record.month} 1, ${record.year}`).getMonth() + 1).padStart(2, '0');
  pdf.save(`${record.employeeCode}-payslip-${record.year}-${monthNumber}-r${record.revision}.pdf`);
}
