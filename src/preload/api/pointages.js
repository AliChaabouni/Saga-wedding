import { ipcRenderer } from 'electron'

export default {
  getAllPointages: () => ipcRenderer.invoke('get-all-pointages'),
  savePointage: (data) => ipcRenderer.invoke('save-pointage', data),
  deletePointage: (id) => ipcRenderer.invoke('delete-pointage', id),
}
