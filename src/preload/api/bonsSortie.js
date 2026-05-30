import { ipcRenderer } from 'electron'

export default {
  getBonsSortie: () => ipcRenderer.invoke('get-bons-sortie'),
  getNextBonSortieNumber: (date) => ipcRenderer.invoke('get-next-bon-sortie-number', date),
  addBonSortie: (data) => ipcRenderer.invoke('add-bon-sortie', data),
  updateBonSortie: (data) => ipcRenderer.invoke('update-bon-sortie', data),
  deleteBonSortie: (id) => ipcRenderer.invoke('delete-bon-sortie', id)
}
