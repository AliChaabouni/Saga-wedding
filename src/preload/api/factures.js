import { ipcRenderer } from 'electron'

export default {
  getFactures: () => ipcRenderer.invoke('get-factures'),
  getNextFactureNumber: (date) => ipcRenderer.invoke('get-next-facture-number', date),
  addFacture: (data) => ipcRenderer.invoke('add-facture', data),
  updateFacture: (data) => ipcRenderer.invoke('update-facture', data),
  deleteFacture: (id) => ipcRenderer.invoke('delete-facture', id)
}
