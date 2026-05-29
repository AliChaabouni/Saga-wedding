import { ipcRenderer } from 'electron'

export default {
  login: (data) => ipcRenderer.invoke('login', data),
  getUsers: () => ipcRenderer.invoke('get-users'),
  addUser: (data) => ipcRenderer.invoke('add-user', data),
  deleteUser: (id) => ipcRenderer.invoke('delete-user', id),
  updateUserPassword: (data) => ipcRenderer.invoke('update-user-password', data), 
}
