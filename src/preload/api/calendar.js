import { ipcRenderer } from 'electron'

export default {
  getJoursFeries: (month) => ipcRenderer.invoke('get-jours-feries', month),
  addJourFerie: (data) => ipcRenderer.invoke('add-jour-ferie', data),
  deleteJourFerie: (date) => ipcRenderer.invoke('delete-jour-ferie', date),
  getPeriodesRamadan: () => ipcRenderer.invoke('get-periodes-ramadan'),
  addPeriodeRamadan: (data) => ipcRenderer.invoke('add-periode-ramadan', data),
  deletePeriodeRamadan: (id) => ipcRenderer.invoke('delete-periode-ramadan', id),
}
