import { ipcRenderer } from 'electron'

export default {
  getEmployes: () => ipcRenderer.invoke('get-employes'),
  addEmploye: (data) => ipcRenderer.invoke('add-employe', data),
  updateEmploye: (data) => ipcRenderer.invoke('update-employe', data),
  deleteEmploye: (id) => ipcRenderer.invoke('delete-employe', id),
}
