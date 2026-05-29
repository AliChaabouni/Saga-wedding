import React from 'react';
import { FileSpreadsheet, FileText, Palmtree } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../assets/logo.png';

export default function Dashboard({ 
  employes, dashboardData, selectedMonth, selectedYear, showToast, 
  exportEmployeId, setExportEmployeId 
}) {

  const calculateBilan = (employe, pointages, totalAvances, conges_total_pris, joursFeriesDuMois, monthStr, periodesRamadan) => {
    let joursPointes = 0; let totalDeductionsHeures = 0; let totalHN = 0; let totalHS = 0; let totalHS100 = 0; let totalHS200 = 0;
    let congesPrisCeMois = 0; let bonusFerie = 0; let montantSuppNormal = 0; let montantSuppDouble = 0; let deductionFerieNonPaye = 0;

    const isRamadan = (dateStr) => periodesRamadan.some(p => dateStr >= p.date_debut && dateStr <= p.date_fin);

    const rate = employe.categorie === 'CONTRAT' ? ((employe.salaire_mensuel || 0) / 26 / 8) : ((employe.prix_journalier || 0) / 8);
    const tauxSupp = employe.taux_horaire_supp || 0;
    const [year, month] = monthStr.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();

    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth() + 1;
    const currDay = now.getDate();
    const reqYear = parseInt(year, 10);
    const reqMonth = parseInt(month, 10);
    
    let limitDay = daysInMonth;
    const isOngoingMonth = (reqYear === currYear && reqMonth === currMonth && currDay < daysInMonth);
    if (isOngoingMonth) {
      limitDay = currDay;
    } else if (reqYear > currYear || (reqYear === currYear && reqMonth > currMonth)) {
      limitDay = 0;
    }

    let unearnedDays = 0;

    if (employe.categorie === 'CONTRAT') {
      for (let i = 1; i <= daysInMonth; i++) {
        const dStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
        const dateObj = new Date(dStr);
        const isSun = dateObj.getUTCDay() === 0;
        const isSat = dateObj.getUTCDay() === 6;
        const ferie = joursFeriesDuMois.find(jf => jf.date === dStr);
        const pt = pointages.find(p => p.date === dStr);

        if (isOngoingMonth) {
            if (i <= limitDay) {
                if (ferie && ferie.est_paye === 0) deductionFerieNonPaye += (8 * rate);
                if (!isSun && !ferie && !pt) unearnedDays += 1;
            }
        } else if (limitDay === daysInMonth) {
            if (ferie && ferie.est_paye === 0) deductionFerieNonPaye += (8 * rate);
            if (!isSun && !ferie && !pt) {
                const expected = isRamadan(dStr) ? ((isSat || isSun) ? 5 : 6) : ((isSat || isSun) ? 6 : 8);
                totalDeductionsHeures += expected * rate;
            }
        }
      }
    }

    pointages.forEach(pt => {
      const dateObj = new Date(pt.date);
      const isSun = dateObj.getUTCDay() === 0;
      const isSat = dateObj.getUTCDay() === 6;
      
      if (dateObj.getDate() > limitDay) return;

      const ferie = joursFeriesDuMois.find(jf => jf.date === pt.date);
      const expected = isRamadan(pt.date) ? ((isSat || isSun) ? 5 : 6) : ((isSat || isSun) ? 6 : 8);
      const hn = pt.heures_normales || 0;
      const hs = pt.heures_supp || 0;

      if (pt.est_conge === 1) {
        congesPrisCeMois++;
      } else {
        if (!isSun && !ferie) joursPointes++;
        else if (ferie || isSun) joursPointes++;

        totalHN += hn; totalHS += hs;

        if (ferie) {
          if (employe.categorie === 'CONTRAT') {
            if (ferie.est_paye === 1) bonusFerie += (hn * rate);
            else bonusFerie += (hn * rate * 2);
            totalHS200 += hs;
            montantSuppDouble += (hs * tauxSupp * 2);
          } else {
            if (hn < expected) totalDeductionsHeures += (expected - hn) * rate;
            totalHS100 += hs;
            montantSuppNormal += (hs * tauxSupp);
          }
        } else {
          if (employe.categorie === 'CONTRAT') {
             if (!isSun && pt.est_conge !== 1 && hn < expected) {
                 totalDeductionsHeures += (expected - hn) * rate;
             }
          } else {
             if (hn < expected) totalDeductionsHeures += (expected - hn) * rate;
          }
          totalHS100 += hs;
          montantSuppNormal += (hs * tauxSupp);
        }
      }
    });

    const congesPrisAvantCeMois = (conges_total_pris || 0) - congesPrisCeMois;
    const soldeAvantCeMois = (employe.jours_conge || 0) - congesPrisAvantCeMois;
    let congesSansSoldeCeMois = Math.max(0, congesPrisCeMois - Math.max(0, soldeAvantCeMois));
    if (soldeAvantCeMois <= 0) congesSansSoldeCeMois = congesPrisCeMois;

    const tauxJournalier = employe.categorie === 'CONTRAT' ? ((employe.salaire_mensuel || 0) / 26) : (employe.prix_journalier || 0);
    const deductionConges = congesSansSoldeCeMois * tauxJournalier;
    
    let salaireBaseNet = 0;
    let daysEarned = 26;

    if (employe.categorie === 'CONTRAT') {
      if (isOngoingMonth) {
        daysEarned = Math.min(26, limitDay - unearnedDays);
        salaireBaseNet = daysEarned * ((employe.salaire_mensuel || 0) / 26);
      } else {
        salaireBaseNet = employe.salaire_mensuel || 0;
      }
    } else {
      salaireBaseNet = (joursPointes * (employe.prix_journalier || 0));
    }

    const montantSupp = montantSuppNormal + montantSuppDouble;
    const totalBrut = salaireBaseNet - totalDeductionsHeures - deductionConges - deductionFerieNonPaye + bonusFerie + montantSupp;
    const resteAPayer = totalBrut - totalAvances;

    return { 
      joursPointes, totalDeductionsHeures, deductionConges, deductionFerieNonPaye, bonusFerie,
      salaireBaseNet, montantSuppNormal, montantSuppDouble, montantSupp, totalBrut, resteAPayer, totalHN, totalHS, totalHS100, totalHS200, congesSansSoldeCeMois, daysEarned
    };
  };

  const handleExport = async (format) => {
    if (!exportEmployeId) return showToast("Veuillez sélectionner un employé pour l'export.", "error");
    try {
      const monthStr = `${selectedYear}-${selectedMonth}`;
      const data = await window.api.getExportData({ employe_id: exportEmployeId, month: monthStr });
      const { employe, pointages, avances, conges_total_pris, joursFeries: jfMois, periodesRamadan } = data; 
      const totalAvances = avances.reduce((sum, a) => sum + a.montant, 0);
      const bilan = calculateBilan(employe, pointages, totalAvances, conges_total_pris, jfMois, monthStr, periodesRamadan);

      if (format === 'excel') await exportToExcel(employe, pointages, avances, totalAvances, monthStr, jfMois, bilan, conges_total_pris);
      if (format === 'pdf') await exportToPDF(employe, pointages, avances, totalAvances, monthStr, jfMois, bilan, conges_total_pris);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const exportToExcel = async (employe, pointages, avances, totalAvances, monthStr, jfMois, bilan, conges_total_pris) => {
    const workbook = new ExcelJS.Workbook(); 
    const worksheet = workbook.addWorksheet('Pointages');
    worksheet.columns = [
      { width: 35 }, 
      { width: 25 }, 
      { width: 20 }, 
      { width: 25 } 
    ];

    try {
      const response = await fetch(logoImg); 
      const blob = await response.blob();
      const base64data = await new Promise((resolve) => { 
        const reader = new FileReader(); 
        reader.readAsDataURL(blob); 
        reader.onloadend = () => resolve(reader.result); 
      });

      worksheet.addImage(workbook.addImage({ base64: base64data, extension: 'png' }), {
        tl: { col: 0, row: 0 }, 
        br: { col: 1, row: 3 },
        editAs: 'oneCell'
      });
    } catch (e) { console.error("Erreur logo:", e); }

    worksheet.mergeCells('B1:C3');
    const titleCell = worksheet.getCell('B1');
    titleCell.value = 'FICHE DE POINTAGE';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFD4AF37' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.getCell('A5').value = `Employé : ${employe.nom}`; 
    worksheet.getCell('A6').value = `Période : ${monthStr}`; 
    worksheet.getCell('A7').value = `Catégorie : ${employe.categorie}`;
    
    worksheet.getCell('A5').font = { bold: true }; 
    worksheet.getCell('A6').font = { bold: true };

    const startRow = 10;
    const headerRow = worksheet.getRow(startRow);
    headerRow.values = ['Jour et Date', 'Horaires (De - À)', 'Heures Normales', 'Heures Supplémentaires'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
    headerRow.alignment = { horizontal: 'center' };

    ['A', 'B', 'C', 'D'].forEach(col => { 
      const cell = worksheet.getCell(`${col}${startRow}`); 
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }; 
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; 
    });

    const congesPrisCeMoisTotal = pointages.filter(p => p.est_conge === 1).length;
    const congesPrisAvantCeMois = (conges_total_pris || 0) - congesPrisCeMoisTotal;
    const congesDetail = [];
    let tempSolde = (employe.jours_conge || 0) - congesPrisAvantCeMois;
    
    const sortedPointages = [...pointages].sort((a, b) => a.date.localeCompare(b.date));
    sortedPointages.forEach(p => {
      if (p.est_conge === 1) {
        tempSolde--;
        congesDetail.push({ date: p.date, isSansSolde: tempSolde < 0 });
      }
    });

    const [year, month] = monthStr.split('-'); 
    const daysInMonth = new Date(year, month, 0).getDate(); 
    let currentRow = startRow + 1;

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month - 1, i);
      const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
      const pt = pointages.find(p => p.date === dateStr);
      const isFerie = jfMois.find(jf => jf.date === dateStr);
      
      const isConge = pt && pt.est_conge === 1;
      let isSansSolde = false;
      if (isConge) {
        const detail = congesDetail.find(c => c.date === dateStr);
        isSansSolde = detail ? detail.isSansSolde : false;
      }

      let hnDisplay = 0, hsDisplay = 0, horaireDisplay = "-";

      if (pt) {
        if (isConge) { hnDisplay = isSansSolde ? "SANS SOLDE" : "CONGÉ"; hsDisplay = "-"; }
        else { 
          hnDisplay = pt.heures_normales; hsDisplay = pt.heures_supp || 0; 
          if (pt.heure_entree && pt.heure_sortie) horaireDisplay = `${pt.heure_entree} - ${pt.heure_sortie}`;
        }
      }

      const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(currentDate);
      const dayStrCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const ferieLabel = isFerie ? (isFerie.est_paye ? ' (Férié Payé)' : ' (Férié Non Payé)') : '';

      const row = worksheet.getRow(currentRow);
      row.values = [`${dayStrCapitalized} ${dateStr}${ferieLabel}`, horaireDisplay, hnDisplay, hsDisplay];
      row.alignment = { horizontal: 'center' };
      
      ['A', 'B', 'C', 'D'].forEach(col => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        
        if (isFerie) { 
          if (isFerie.est_paye) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5E6' } }; 
            cell.font = { color: { argb: 'FFB8860B' }, bold: true }; 
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEB' } }; 
            cell.font = { color: { argb: 'FFD32F2F' }, bold: true }; 
          }
        }
        else if (currentDate.getDay() === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        }
        else if (isConge) { 
          if (isSansSolde) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEB' } }; 
            cell.font = { color: { argb: 'FFD32F2F' }, bold: true }; 
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }; 
            cell.font = { color: { argb: 'FF2E7D32' }, bold: true }; 
          }
        }
      });
      currentRow++;
    }
    const totalRow = worksheet.getRow(currentRow);
    totalRow.values = ['TOTAL HEURES (Hors Congés)', '', bilan.totalHN, bilan.totalHS];
    totalRow.font = { bold: true }; totalRow.alignment = { horizontal: 'center' };
    ['A', 'B', 'C', 'D'].forEach(col => { worksheet.getCell(`${col}${currentRow}`).border = { top: {style:'double'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; });
    currentRow++;

    if (bilan.totalHS200 > 0) {
      const splitRow = worksheet.getRow(currentRow);
      splitRow.values = ['(Dont Heures Férié payées Double)', '', '', bilan.totalHS200];
      splitRow.font = { italic: true, color: { argb: 'FFB8860B' } };
      splitRow.alignment = { horizontal: 'center' };
      ['A', 'B', 'C', 'D'].forEach(col => { worksheet.getCell(`${col}${currentRow}`).border = { left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; });
      currentRow++;
    }
    currentRow += 1;

    if (congesDetail.length > 0) {
      worksheet.getRow(currentRow).values = ['Détail des Congés', 'Date', 'Type', ''];
      ['A', 'B', 'C', 'D'].forEach((col, idx) => {
        const cell = worksheet.getCell(`${col}${currentRow}`);
        if (idx === 1 || idx === 2) { 
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } }; 
          cell.alignment = { horizontal: 'center' }; cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; 
        } 
      });
      currentRow++;
      congesDetail.forEach(c => {
        worksheet.getRow(currentRow).values = ['', c.date, c.isSansSolde ? 'Sans Solde' : 'Payé', '']; 
        worksheet.getRow(currentRow).alignment = { horizontal: 'center' };
        ['B', 'C'].forEach(col => { worksheet.getCell(`${col}${currentRow}`).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; });
        if (c.isSansSolde) {
          worksheet.getCell(`B${currentRow}`).font = { color: { argb: 'FFD32F2F' }, bold: true };
          worksheet.getCell(`C${currentRow}`).font = { color: { argb: 'FFD32F2F' }, bold: true };
        }
        currentRow++;
      });
      currentRow += 1;
    }

    const buffer = await workbook.xlsx.writeBuffer(); 
    saveAs(new Blob([buffer]), `Pointage_${employe.nom}_${monthStr}.xlsx`);
    showToast("Fichier Excel généré !");
  };

  const exportToPDF = async (employe, pointages, avances, totalAvances, monthStr, jfMois, bilan, conges_total_pris) => {
    const doc = new jsPDF(); let currentY = 15;
    try { const response = await fetch(logoImg); const blob = await response.blob();
      const base64data = await new Promise((resolve) => { const reader = new FileReader(); reader.readAsDataURL(blob); reader.onloadend = () => resolve(reader.result); });
      doc.addImage(base64data, 'PNG', 14, currentY, 40, 25);
    } catch (e) { }

    doc.setFontSize(22); doc.setTextColor(212, 175, 55); doc.setFont(undefined, 'bold'); doc.text(`FICHE DE POINTAGE`, 90, currentY + 15); currentY += 40;
    doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'bold'); doc.text(`Employé : ${employe.nom}`, 14, currentY); currentY += 6;
    doc.text(`Période : ${monthStr}`, 14, currentY); currentY += 6; 
    doc.text(`Catégorie : ${employe.categorie}`, 14, currentY); currentY += 16;

    const congesPrisCeMoisTotal = pointages.filter(p => p.est_conge === 1).length;
    const congesPrisAvantCeMois = (conges_total_pris || 0) - congesPrisCeMoisTotal;
    const congesDetail = [];
    let tempSolde = (employe.jours_conge || 0) - congesPrisAvantCeMois;
    const sortedPointages = [...pointages].sort((a, b) => a.date.localeCompare(b.date));
    sortedPointages.forEach(p => {
      if (p.est_conge === 1) {
        tempSolde--;
        congesDetail.push({ date: p.date, isSansSolde: tempSolde < 0 });
      }
    });

    const [year, month] = monthStr.split('-'); const daysInMonth = new Date(year, month, 0).getDate(); 
    const tableRows = []; 

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month - 1, i);
      const dateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
      const pt = pointages.find(p => p.date === dateStr);
      const isFerie = jfMois.find(jf => jf.date === dateStr);
      const isConge = pt && pt.est_conge === 1;
      
      let isSansSolde = false;
      if (isConge) {
        const detail = congesDetail.find(c => c.date === dateStr);
        isSansSolde = detail ? detail.isSansSolde : false;
      }

      let hnDisplay = 0, hsDisplay = 0, horaireDisplay = "-";
      if (pt) {
        if (isConge) { hnDisplay = isSansSolde ? "SANS SOLDE" : "CONGÉ"; hsDisplay = "-"; }
        else { 
          hnDisplay = pt.heures_normales; hsDisplay = pt.heures_supp || 0; 
          if (pt.heure_entree && pt.heure_sortie) horaireDisplay = `${pt.heure_entree} - ${pt.heure_sortie}`;
        }
      }

      const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(currentDate);
      const ferieLabel = isFerie ? (isFerie.est_paye ? '\n(Férié Payé)' : '\n(Férié Non Payé)') : '';
      
      tableRows.push([`${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dateStr}${ferieLabel}`, horaireDisplay, hnDisplay, hsDisplay, isConge, isFerie, isSansSolde]);
    }
    tableRows.push(['TOTAL HEURES (Hors Congés)', '', bilan.totalHN, bilan.totalHS, false, null, false]);

    autoTable(doc, {
      startY: currentY, head: [['Jour et Date', 'Horaires', 'Heures Norm.', 'Heures Supp.']],
      body: tableRows.map(r => [r[0], r[1], r[2], r[3]]), theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center' },
      columnStyles: { 0: { cellWidth: 70 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
      willDrawCell: function (data) {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          if (rowIndex < daysInMonth) {
            const isSunday = new Date(year, month - 1, rowIndex + 1).getDay() === 0;
            const isConge = tableRows[rowIndex][4];
            const isFerie = tableRows[rowIndex][5];
            const isSansSolde = tableRows[rowIndex][6];

            if (isFerie) { 
              if (isFerie.est_paye) {
                doc.setFillColor(255, 245, 230); doc.setTextColor(184, 134, 11); doc.setFont(undefined, 'bold'); 
              } else {
                doc.setFillColor(255, 235, 235); doc.setTextColor(211, 47, 47); doc.setFont(undefined, 'bold'); 
              }
            }
            else if (isConge) { 
              if (isSansSolde) {
                doc.setFillColor(255, 235, 235); doc.setTextColor(211, 47, 47); doc.setFont(undefined, 'bold');
              } else {
                doc.setFillColor(232, 245, 233); doc.setTextColor(46, 125, 50); doc.setFont(undefined, 'bold');
              }
            } 
            else if (isSunday) doc.setFillColor(245, 245, 245);
          } else { doc.setFont(undefined, 'bold'); if (data.column.index === 0) doc.setFillColor(255, 255, 255); }
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    if (congesDetail.length > 0) {
      if (currentY > 230) { doc.addPage(); currentY = 20; }
      const congeRows = congesDetail.map(c => [c.date, c.isSansSolde ? 'Sans Solde' : 'Payé']);
      congeRows.push(['TOTAL CONGÉS CE MOIS', `${congesDetail.length} Jours`]);
      autoTable(doc, {
        startY: currentY, head: [['Détail des Congés (Ce mois)', 'Type']], body: congeRows, theme: 'grid',
        headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255], halign: 'center' }, columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' } },
        margin: { left: 70, right: 14 }, 
        willDrawCell: function(data) { 
          if (data.section === 'body') {
            if (data.row.index === congeRows.length - 1) { 
              doc.setFont(undefined, 'bold'); doc.setTextColor(46, 125, 50); 
            } else {
              const detailItem = congesDetail[data.row.index];
              if (detailItem && detailItem.isSansSolde) {
                doc.setTextColor(211, 47, 47); doc.setFont(undefined, 'bold');
              }
            }
          } 
        }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }

    if (avances.length > 0) {
      if (currentY > 230) { doc.addPage(); currentY = 20; }
      const avanceRows = avances.map(a => [a.date, `${a.montant.toFixed(2)} TND`]);
      avanceRows.push(['TOTAL AVANCES', `${totalAvances.toFixed(2)} TND`]);
      autoTable(doc, {
        startY: currentY, head: [['Détail des Avances', 'Montant']], body: avanceRows, theme: 'grid',
        headStyles: { fillColor: [204, 51, 51], textColor: [255, 255, 255], halign: 'center' }, columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' } },
        margin: { left: 70, right: 14 }, 
        willDrawCell: function(data) { if (data.section === 'body' && data.row.index === avanceRows.length - 1) { doc.setFont(undefined, 'bold'); doc.setTextColor(204, 51, 51); } }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    }

    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setFontSize(14); doc.setTextColor(212, 175, 55); doc.setFont(undefined, 'bold'); doc.text("BILAN FINANCIER", 14, currentY); currentY += 8;

    const summaryRows = [];
    if (employe.categorie === 'CONTRAT') {
      if (bilan.salaireBaseNet !== (employe.salaire_mensuel || 0)) {
        summaryRows.push([`Salaire de base (Prorata ${bilan.daysEarned} jours)`, `${bilan.salaireBaseNet.toFixed(2)} TND`]);
      } else {
        summaryRows.push(['Salaire de base', `${bilan.salaireBaseNet.toFixed(2)} TND`]);
      }
    } else {
      summaryRows.push([`Salaire de base (${bilan.joursPointes} jours pointés)`, `${bilan.salaireBaseNet.toFixed(2)} TND`]);
    }
    
    if (bilan.totalDeductionsHeures > 0) summaryRows.push([`Retenue heures manquantes (Prorata)`, `- ${bilan.totalDeductionsHeures.toFixed(2)} TND`]);
    if (bilan.deductionConges > 0) summaryRows.push([`Retenue Congé Sans Solde (${bilan.congesSansSoldeCeMois} j)`, `- ${bilan.deductionConges.toFixed(2)} TND`]);
    if (bilan.deductionFerieNonPaye > 0) summaryRows.push([`Retenue Jour Férié Non Payé`, `- ${bilan.deductionFerieNonPaye.toFixed(2)} TND`]);

    if (bilan.bonusFerie > 0) summaryRows.push([`Bonus Jour Férié (Double)`, `+ ${bilan.bonusFerie.toFixed(2)} TND`]);

    if (bilan.montantSuppNormal > 0) summaryRows.push([`Heures Supplémentaires normales (${bilan.totalHS100} h)`, `+ ${bilan.montantSuppNormal.toFixed(2)} TND`]);
    if (bilan.montantSuppDouble > 0) summaryRows.push([`Heures Supplémentaires (Férié) payées double (${bilan.totalHS200} h)`, `+ ${bilan.montantSuppDouble.toFixed(2)} TND`]);
    
    summaryRows.push(['Total Brut', `${bilan.totalBrut.toFixed(2)} TND`]);
    summaryRows.push(['Total des Avances', `- ${totalAvances.toFixed(2)} TND`]);
    summaryRows.push(['', '']); summaryRows.push(['RESTE À PAYER', `${bilan.resteAPayer.toFixed(2)} TND`]);

    autoTable(doc, {
      startY: currentY, body: summaryRows, theme: 'plain', columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right' } },
      willDrawCell: function(data) {
        const valueStr = data.cell.raw;
        if (valueStr.includes('Total Brut') || valueStr.includes('Total des Avances')) doc.setFont(undefined, 'bold');
        if (valueStr.includes('Total des Avances') || valueStr.includes('Retenue')) doc.setTextColor(204, 51, 51); 
        if (valueStr.includes('Bonus') || valueStr.includes('(Férié)')) doc.setTextColor(184, 134, 11);
        if (valueStr.includes('RESTE À PAYER') || valueStr === `${bilan.resteAPayer.toFixed(2)} TND`) {
          doc.setFont(undefined, 'bold'); doc.setFontSize(13); doc.setTextColor(212, 175, 55);
          doc.setDrawColor(212, 175, 55); doc.setLineWidth(0.5);
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });

    let signatureY = doc.lastAutoTable.finalY + 25;
    if (signatureY > 260) { doc.addPage(); signatureY = 30; }
    doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'bold');
    doc.text("Signature & Cachet : SAGA WEDDING", 14, signatureY);
    doc.text("Signature de l'employé(e) :", 120, signatureY);
    doc.setFont(undefined, 'normal'); doc.text(employe.nom, 120, signatureY + 6);

    doc.save(`Pointage_${employe.nom}_${monthStr}.pdf`); showToast("Fichier PDF généré !");
  };

  return (
    <>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '250px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px' }}>GÉNÉRER UNE FICHE DE POINTAGE</label>
          <select className="form-control" value={exportEmployeId} onChange={(e) => setExportEmployeId(e.target.value)}>
            <option value="">Sélectionner un employé...</option>
            {(employes || []).map(emp => <option key={emp.id} value={emp.id}>{emp.nom} - {emp.categorie}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          <button onClick={() => handleExport('excel')} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#217346', color: '#fff' }}><FileSpreadsheet size={18} /> EXCEL</button>
          <button onClick={() => handleExport('pdf')} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e2574c', color: '#fff' }}><FileText size={18} /> PDF</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 25px 0' }}>Bilan des Heures & Paie</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employé</th><th>Catégorie</th>
                <th style={{ textAlign: 'center' }}>Heures / Congés</th>
                <th style={{ textAlign: 'center' }}>Total Brut</th>
                <th style={{ textAlign: 'center', color: 'var(--danger)' }}>Avances</th>
                <th style={{ textAlign: 'right', color: 'var(--primary)' }}>RESTE À PAYER</th>
              </tr>
            </thead>
            <tbody>
              {(dashboardData || []).map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{row.nom}</div>
                    {row.categorie === 'SAISONNIER' && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.jours_pointes || 0} jours pointés</div>}
                  </td>
                  <td><span className={`badge ${row.categorie === 'CONTRAT' ? 'badge-contrat' : 'badge-saisonnier'}`}>{row.categorie}</span></td>
                  <td style={{ textAlign: 'center', fontSize: '13px' }}>
                    <div>Normal : <strong>{row.total_normales} h</strong></div>
                    <div style={{ color: 'var(--warning)' }}>Supp : <strong>{row.total_supp} h</strong></div>
                    {row.categorie === 'CONTRAT' && (
                      <div style={{ color: 'var(--primary)', marginTop: '4px', fontSize: '11px' }}>
                        <Palmtree size={10} style={{marginRight:'2px'}}/> {row.conges_pris_ce_mois || 0} pris ce mois
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                    {row.total_brut.toFixed(2)} TND<br/>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                      Base {row.categorie === 'CONTRAT' && row.salaire_base_net !== row.salaire_mensuel ? `(Prorata ${row.days_earned}j)` : ''}: {row.salaire_base_net.toFixed(2)} 
                      {row.total_deductions > 0 && <span style={{color:'var(--danger)'}}><br/>- Retenue Heures: {row.total_deductions.toFixed(2)}</span>} 
                      {row.deduction_conges > 0 && <span style={{color:'var(--danger)'}}><br/>- Congé Sans Solde: {row.deduction_conges.toFixed(2)}</span>} 
                      {row.deduction_ferie_non_paye > 0 && <span style={{color:'var(--danger)'}}><br/>- J.F. Non Payé: {row.deduction_ferie_non_paye.toFixed(2)}</span>} 
                      {row.bonus_ferie > 0 && <span style={{color:'var(--primary)'}}><br/>+ Bonus J.F.: {row.bonus_ferie.toFixed(2)}</span>} 
                      
                      {row.montant_supp_normal > 0 && <span style={{color:'var(--warning)'}}><br/>+ Supp. Normal: {row.montant_supp_normal.toFixed(2)}</span>}
                      {row.montant_supp_double > 0 && <span style={{color:'var(--primary)'}}><br/>+ Supp. Férié (x2): {row.montant_supp_double.toFixed(2)}</span>}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: 'var(--danger)' }}>- {(row.total_avances || 0).toFixed(2)} TND</td>
                  <td style={{ textAlign: 'right', fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>{row.reste_a_payer.toFixed(2)} TND</td>
                </tr>
              ))}
              {dashboardData.length === 0 && (<tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Aucune donnée pour ce mois.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
