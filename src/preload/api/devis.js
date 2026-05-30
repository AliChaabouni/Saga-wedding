import { ipcRenderer } from 'electron'

export default {
  getDevis: () => ipcRenderer.invoke('get-devis'),
  getNextDevisNumber: (date) => ipcRenderer.invoke('get-next-devis-number', date),
  addDevis: (data) => ipcRenderer.invoke('add-devis', data),
  updateDevis: (data) => ipcRenderer.invoke('update-devis', data),
  deleteDevis: (id) => ipcRenderer.invoke('delete-devis', id)
}
