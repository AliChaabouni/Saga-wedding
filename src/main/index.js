import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import { initDatabase } from './database'
import { setupUsersHandlers } from './ipc/users'
import { setupEmployesHandlers } from './ipc/employes'
import { setupPointagesHandlers } from './ipc/pointages'
import { setupAvancesHandlers } from './ipc/avances'
import { setupCalendarHandlers } from './ipc/calendar'
import { setupDashboardHandlers } from './ipc/dashboard'
import { setupClientsHandlers } from './ipc/clients'
import { setupDevisHandlers } from './ipc/devis'
import { setupFacturesHandlers } from './ipc/factures'
import { setupBonsSortieHandlers } from './ipc/bonsSortie'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200, height: 800, show: false, autoHideMenuBar: true,
    title: 'Saga Wedding', icon: join(__dirname, '../../build/saga-wedding.ico'),
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false }
  })
  mainWindow.on('ready-to-show', () => { mainWindow.show() })
  mainWindow.webContents.setWindowOpenHandler((details) => { shell.openExternal(details.url); return { action: 'deny' } })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) { mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']) } 
  else { mainWindow.loadFile(join(__dirname, '../renderer/index.html')) }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => { optimizer.watchWindowShortcuts(window) })

  initDatabase()
  setupUsersHandlers()
  setupEmployesHandlers()
  setupPointagesHandlers()
  setupAvancesHandlers()
  setupCalendarHandlers()
  setupDashboardHandlers()
  setupClientsHandlers()
  setupDevisHandlers()
  setupFacturesHandlers()
  setupBonsSortieHandlers()

  createWindow()
  app.on('activate', function () { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })