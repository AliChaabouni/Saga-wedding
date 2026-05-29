import { ipcRenderer } from 'electron'

export default {
  getDashboardData: (month) => ipcRenderer.invoke('get-dashboard-data', month),
  getExportData: (data) => ipcRenderer.invoke('get-export-data', data),
}
