import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../assets/logo.png';
import { numberToWords } from './numberToWords';

export const generateFactureOrDevisPDF = async (type, item) => {
  const isDevis = type === 'devis';
  const doc = new jsPDF();
  
  let currentY = 15;

  // Load logo
  try {
    const response = await fetch(logoImg);
    const blob = await response.blob();
    const base64data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
    
    // Draw black rectangle for logo background to match the style
    doc.setFillColor(0, 0, 0);
    doc.rect(14, 10, 42, 24, 'F');
    // Draw logo inside
    doc.addImage(base64data, 'PNG', 15, 11, 40, 22);
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  // Right Header Info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  const rightX = 110;
  doc.text('SOCIETE SAGA - Events et Service', rightX, 20);
  doc.setFont(undefined, 'normal');
  doc.text('MOB : (+216)54532532 / (+216)54680886', rightX, 25);
  doc.text('E-mail :', rightX, 30);
  doc.setTextColor(112, 173, 221); // light blue link
  doc.text('saga.evts@gmail.com', rightX + 14, 30);
  doc.setTextColor(0, 0, 0);
  doc.text('MF : 1378995/E/A/M/000', rightX, 35);

  currentY = 60;

  // TITLE
  doc.setFontSize(26);
  doc.setFont('times', 'italic');
  doc.text(isDevis ? 'DEVIS' : 'FACTURE', 85, currentY);
  currentY += 10;
  
  if (!isDevis) {
    doc.setFontSize(18);
    doc.text(`N°${item.numero.replace('2026/', '')}`, 90, currentY); // Example formatting, you can just show N°001443
    currentY += 15;
  }

  // Date
  doc.setFontSize(11);
  doc.setFont('times', 'bolditalic');
  // underline date
  doc.text(`Date : ${item.date_creation.split('-').reverse().join('/')}`, 155, currentY);
  doc.setLineWidth(0.3);
  doc.line(155, currentY + 1, 185, currentY + 1);
  currentY += 10;

  // Client Info
  const clientName = item.type_client === 'physique' ? `${item.nom} ${item.prenom}` : item.raison_sociale;
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text(`Client : ${clientName}`, 14, currentY);
  doc.line(14, currentY + 1, 26, currentY + 1); // underline "Client"
  currentY += 8;

  // Objet (Using notes field for Objet if it exists)
  doc.text(`Objet : ${item.notes || 'Prestation de services'}`, 14, currentY);
  doc.line(14, currentY + 1, 25, currentY + 1); // underline "Objet"
  currentY += 8;

  doc.text(`MF : 1685697J/A/M/000`, 14, currentY);
  doc.line(14, currentY + 1, 22, currentY + 1);
  currentY += 8;

  doc.text(`RIB : 04 139 2210035 73159 5 05`, 14, currentY);
  doc.line(14, currentY + 1, 22, currentY + 1);
  currentY += 8;

  // Table Setup
  const tableHead = [['Qté', 'Désignation', 'Prix HT', 'Total HT']];
  const tableBody = item.items.map(i => [
    String(i.quantite).padStart(2, '0'),
    i.description,
    Number(i.prix_unitaire).toFixed(3),
    Number(i.total).toFixed(3)
  ]);

  // WATERMARK setup
  // We use willDrawPage or didDrawPage, or just draw it before the table? 
  // It's better to draw it before the table, but if table is transparent, wait table has white background by default.
  // We can use didDrawPage to draw the watermark OVER the table, with very light opacity, OR set table cells to transparent.
  // Actually, jsPDF autotable cells have white backgrounds by default unless transparent.
  // We'll set fillColor to transparent or draw watermark in didDrawPage.

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 12,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      fillColor: false, // transparent cells so watermark is visible
    },
    headStyles: {
      fillColor: false, // transparent header
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    didDrawPage: function (data) {
      // Draw watermark SAGA
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({opacity: 0.1}));
      doc.setFontSize(150);
      doc.setFont('times', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('SAGA', 30, 200);
      doc.restoreGraphicsState();
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Totals Box (Right aligned)
  const totalsHead = [];
  const totalsBody = [
    ['TOTAL HT', Number(item.total_ht).toFixed(3)],
    ['TVA 19%', Number(item.tva).toFixed(3)],
    ['Timbre', '1.000'],
    ['TOTAL TTC', Number(item.total_ttc).toFixed(3)]
  ];

  autoTable(doc, {
    startY: currentY,
    body: totalsBody,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 12,
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      fillColor: false
    },
    margin: { left: 114 }, // Align to the right to match the last two columns
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 35, halign: 'right' }
    },
    didDrawPage: function (data) {}
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // Arreter la facture...
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  const typeText = isDevis ? 'le devis' : 'la Facture';
  const amountInWords = numberToWords(item.total_ttc);
  doc.text(`Arrêter ${typeText} à la somme de : ${amountInWords}.`, 14, currentY);
  currentY += 15;

  // Signature
  doc.setFontSize(16);
  doc.text('Signature', 150, currentY);
  currentY += 10;

  return doc;
};
