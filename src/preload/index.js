import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import authApi from './api/auth'
import employesApi from './api/employes'
import pointagesApi from './api/pointages'
import avancesApi from './api/avances'
import calendarApi from './api/calendar'
import dashboardApi from './api/dashboard'
import clientsApi from './api/clients'
import devisApi from './api/devis'
import facturesApi from './api/factures'
import bonsSortieApi from './api/bonsSortie'

const api = {
  ...authApi,
  ...employesApi,
  ...pointagesApi,
  ...avancesApi,
  ...calendarApi,
  ...dashboardApi,
  ...clientsApi,
  ...devisApi,
  ...facturesApi,
  ...bonsSortieApi
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}