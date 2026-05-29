import { ipcRenderer } from 'electron'

export default {
  getClients: () => ipcRenderer.invoke('get-clients'),
  addClient: (data) => ipcRenderer.invoke('add-client', data),
  updateClient: (data) => ipcRenderer.invoke('update-client', data),
  deleteClient: (id) => ipcRenderer.invoke('delete-client', id)
}
