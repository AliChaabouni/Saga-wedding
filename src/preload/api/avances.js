import { ipcRenderer } from 'electron'

export default {
  getAvances: (month) => ipcRenderer.invoke('get-avances', month),
  addAvance: (data) => ipcRenderer.invoke('add-avance', data),
  deleteAvance: (id) => ipcRenderer.invoke('delete-avance', id),
}
