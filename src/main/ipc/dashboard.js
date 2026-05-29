import { ipcMain } from 'electron'
import db from '../database'

export function setupDashboardHandlers() {
  ipcMain.handle('get-dashboard-data', async (event, month) => {
    try {
      const param = `${month}-%`;
      const [yearStr, monthStr] = month.split('-');
      const reqYear = parseInt(yearStr, 10);
      const reqMonth = parseInt(monthStr, 10);
      const daysInMonth = new Date(reqYear, reqMonth, 0).getDate();

      const now = new Date();
      const currYear = now.getFullYear();
      const currMonth = now.getMonth() + 1;
      const currDay = now.getDate();

      let limitDay = daysInMonth;
      const isOngoingMonth = (reqYear === currYear && reqMonth === currMonth && currDay < daysInMonth);
      if (isOngoingMonth) {
        limitDay = currDay;
      } else if (reqYear > currYear || (reqYear === currYear && reqMonth > currMonth)) {
        limitDay = 0;
      }

      const getDb = (q, p) => new Promise((res, rej) => db.all(q, p, (err, rows) => err ? rej(err) : res(rows || [])));
      
      const employes = await getDb("SELECT * FROM employes", []);
      const pointages = await getDb("SELECT * FROM pointages WHERE date LIKE ?", [param]);
      const avances = await getDb("SELECT * FROM avances WHERE date LIKE ?", [param]);
      const joursFeries = await getDb("SELECT * FROM jours_feries WHERE date LIKE ?", [param]);
      const congesTotalDb = await getDb("SELECT employe_id, COUNT(id) as total FROM pointages WHERE est_conge = 1 GROUP BY employe_id", []);
      const periodesRamadan = await getDb("SELECT * FROM periodes_ramadan", []);
      
      const isRamadan = (dateStr) => periodesRamadan.some(p => dateStr >= p.date_debut && dateStr <= p.date_fin);

      const result = employes.map(emp => {
        const empPts = pointages.filter(p => p.employe_id === emp.id);
        const empAvs = avances.filter(a => a.employe_id === emp.id);
        const congeTotalRow = congesTotalDb.find(c => c.employe_id === emp.id);
        const congesTotalPris = congeTotalRow ? congeTotalRow.total : 0;

        let joursPointes = 0; let totalDeductionsHeures = 0; let totalHN = 0; let totalHS = 0; let totalHS100 = 0; let totalHS200 = 0;
        let congesPrisCeMois = 0; let bonusFerie = 0; let montantSuppNormal = 0; let montantSuppDouble = 0; let deductionFerieNonPaye = 0;

        const rate = emp.categorie === 'CONTRAT' ? ((emp.salaire_mensuel || 0) / 26 / 8) : ((emp.prix_journalier || 0) / 8);
        const tauxSupp = emp.taux_horaire_supp || 0;
        let unearnedDays = 0;

        if (emp.categorie === 'CONTRAT') {
          for (let i = 1; i <= daysInMonth; i++) {
            const dStr = `${yearStr}-${monthStr}-${String(i).padStart(2, '0')}`;
            const dateObj = new Date(dStr);
            const isSun = dateObj.getUTCDay() === 0;
            const isSat = dateObj.getUTCDay() === 6;
            const ferie = joursFeries.find(jf => jf.date === dStr);
            const pt = empPts.find(p => p.date === dStr);

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

        empPts.forEach(pt => {
          const dateObj = new Date(pt.date);
          const isSun = dateObj.getUTCDay() === 0;
          const isSat = dateObj.getUTCDay() === 6;
          
          if (dateObj.getDate() > limitDay) return;

          const ferie = joursFeries.find(jf => jf.date === pt.date);
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
              if (emp.categorie === 'CONTRAT') {
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
              if (emp.categorie === 'CONTRAT') {
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

        const congesPrisAvantCeMois = congesTotalPris - congesPrisCeMois;
        const soldeAvantCeMois = (emp.jours_conge || 0) - congesPrisAvantCeMois;
        let congesSansSoldeCeMois = Math.max(0, congesPrisCeMois - Math.max(0, soldeAvantCeMois));
        if (soldeAvantCeMois <= 0) congesSansSoldeCeMois = congesPrisCeMois;
        const tauxJournalier = emp.categorie === 'CONTRAT' ? ((emp.salaire_mensuel || 0) / 26) : (emp.prix_journalier || 0);
        const deductionConges = congesSansSoldeCeMois * tauxJournalier;
        
        let salaireBaseNet = 0;
        let daysEarned = 26;

        if (emp.categorie === 'CONTRAT') {
          if (isOngoingMonth) {
            daysEarned = Math.min(26, limitDay - unearnedDays);
            salaireBaseNet = daysEarned * ((emp.salaire_mensuel || 0) / 26);
          } else {
            salaireBaseNet = emp.salaire_mensuel || 0;
          }
        } else {
          salaireBaseNet = (joursPointes * (emp.prix_journalier || 0));
        }

        const totalAvances = empAvs.reduce((sum, a) => sum + a.montant, 0);

        const montantSupp = montantSuppNormal + montantSuppDouble;
        const totalBrut = salaireBaseNet - totalDeductionsHeures - deductionConges - deductionFerieNonPaye + bonusFerie + montantSupp;
        const resteAPayer = totalBrut - totalAvances;

        return {
          id: emp.id, nom: emp.nom, categorie: emp.categorie,
          salaire_mensuel: emp.salaire_mensuel, prix_journalier: emp.prix_journalier, taux_horaire_supp: emp.taux_horaire_supp, jours_conge: emp.jours_conge,
          jours_pointes: joursPointes,
          total_deductions: totalDeductionsHeures,
          deduction_conges: deductionConges,
          deduction_ferie_non_paye: deductionFerieNonPaye,
          bonus_ferie: bonusFerie,
          total_normales: totalHN,
          total_supp: totalHS,
          total_supp_100: totalHS100,
          total_supp_200: totalHS200,
          conges_pris_ce_mois: congesPrisCeMois,
          conges_total_pris: congesTotalPris,
          total_avances: totalAvances,
          montant_supp_normal: montantSuppNormal,
          montant_supp_double: montantSuppDouble,
          montant_supp: montantSupp,
          total_brut: totalBrut,
          reste_a_payer: resteAPayer,
          salaire_base_net: salaireBaseNet,
          limit_day: limitDay,
          days_in_month: daysInMonth,
          days_earned: emp.categorie === 'CONTRAT' ? daysEarned : joursPointes
        };
      });

      return result.filter(r => r.jours_pointes > 0 || r.total_avances > 0 || r.categorie === 'CONTRAT').sort((a, b) => a.nom.localeCompare(b.nom));

    } catch (e) {
      throw e;
    }
  });

  ipcMain.handle('get-export-data', (event, { employe_id, month }) => {
    return new Promise((resolve, reject) => {
      const param = `${month}-%`;
      db.get("SELECT * FROM employes WHERE id = ?", [employe_id], (err, employe) => {
        if (err) return reject(err);
        if (!employe) return reject(new Error("Employé introuvable"));
        db.all("SELECT * FROM pointages WHERE employe_id = ? AND date LIKE ? ORDER BY date ASC", [employe_id, param], (err, pointages) => {
          if (err) return reject(err);
          db.all("SELECT * FROM avances WHERE employe_id = ? AND date LIKE ?", [employe_id, param], (err, avances) => {
            if (err) return reject(err);
            db.all("SELECT * FROM jours_feries WHERE date LIKE ?", [param], (err, joursFeries) => {
              if (err) return reject(err);
              db.all("SELECT * FROM periodes_ramadan", [], (err, periodesRamadan) => {
                if (err) return reject(err);
                db.get("SELECT COUNT(id) as total_pris FROM pointages WHERE employe_id = ? AND est_conge = 1", [employe_id], (err, rowConge) => {
                  if (err) return reject(err);
                  resolve({ employe, pointages: pointages || [], avances: avances || [], joursFeries: joursFeries || [], periodesRamadan: periodesRamadan || [], conges_total_pris: rowConge ? rowConge.total_pris : 0 });
                });
              });
            });
          });
        });
      });
    });
  });
}
