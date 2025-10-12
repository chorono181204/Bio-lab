// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, '../public')

import { join } from 'path'
import { app, BrowserWindow, ipcMain } from 'electron'
import { initDb, getStats, login, listForms, createForm, updateForm, deleteForm, listAnalytes, createAnalyte, updateAnalyte, deleteAnalyte, listLots, createLot, updateLot, deleteLot, listMachinesSimple, listMachinesByLot, listMachinesByLotId, listQcLevelsSimple, listLotsSimple, listMachines, createMachine, updateMachine, deleteMachine, listUsers, createUser, updateUser, deleteUser, listLimits, createLimit, updateLimit, deleteLimit, batchAddLimits, bulkApplyMachines, getCurrentUser, updateProfile, logout, listLimitsByContext, listLimitsByContextAnalyte, listLimitsByLotMachine } from './db'
import { listViolationsByContext, createViolation, updateViolationAction } from './db/violations'
import { listBiasMethods, createBiasMethod, updateBiasMethod, deleteBiasMethod } from './db/bias_methods'
import { listEntriesByContext, batchCreateEntries, updateEntry, deleteEntry } from './db/entries'
import { listWestgardRules, upsertWestgardRule, deleteWestgardRule, setWestgardRuleQcLevels } from './db/westgard_rules'
import { listQcLevels, createQcLevel, updateQcLevel, deleteQcLevel, listQcLevelsByLotId } from './db/qc_levels'

let win: BrowserWindow | null
// Here, you can also use other preload
const preload = join(__dirname, './preload.js')
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const url = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: join(process.env.PUBLIC, 'logo.svg'),
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      preload,
    },
  })

  // Set Content Security Policy
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' http://localhost:* ws://localhost:*;"
        ]
      }
    })
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (url) {
    win.loadURL(url)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  win = null
})

app.whenReady().then(() => {
  initDb()
  ipcMain.handle('iqc:get-stats', () => getStats())
  ipcMain.handle('iqc:login', (_e, username: string, password: string) => login(username, password))
  // Forms CRUD
  ipcMain.handle('forms:list', () => listForms())
  ipcMain.handle('forms:create', (_e, payload) => createForm(payload))
  ipcMain.handle('forms:update', (_e, payload) => updateForm(payload))
  ipcMain.handle('forms:delete', (_e, id: string) => { deleteForm(id); return true })
  // Analytes CRUD
  ipcMain.handle('analytes:list', () => listAnalytes())
  ipcMain.handle('analytes:create', (_e, payload) => createAnalyte(payload))
  ipcMain.handle('analytes:update', (_e, payload) => updateAnalyte(payload))
  ipcMain.handle('analytes:delete', (_e, id: string) => { 
    try {
      deleteAnalyte(id); 
      return true 
    } catch (error) {
      console.error('Delete analyte error:', error)
      throw error
    }
  })
  // Lots CRUD
  ipcMain.handle('lots:list', () => listLots())
  ipcMain.handle('lots:create', (_e, payload) => createLot(payload))
  ipcMain.handle('lots:update', (_e, payload) => updateLot(payload))
  ipcMain.handle('lots:delete', (_e, id: string) => { deleteLot(id); return true })
  // Lookups
  ipcMain.handle('machines:list-simple', () => listMachinesSimple())
  ipcMain.handle('machines:list-by-lot', (_e, lotCode: string) => listMachinesByLot(lotCode))
  ipcMain.handle('machines:list-by-lot-id', (_e, lotId: string) => listMachinesByLotId(lotId))
  ipcMain.handle('qclevels:list-simple', () => listQcLevelsSimple())
  ipcMain.handle('qclevels:list-by-lot-id', (_e, lotId: string) => listQcLevelsByLotId(lotId))
  ipcMain.handle('lots:list-simple', () => listLotsSimple())
  // Machines CRUD
  ipcMain.handle('machines:list', () => listMachines())
  ipcMain.handle('machines:create', (_e, payload) => createMachine(payload))
  ipcMain.handle('machines:update', (_e, payload) => updateMachine(payload))
  ipcMain.handle('machines:delete', (_e, id: string) => { 
    try {
      deleteMachine(id); 
      return true 
    } catch (error) {
      console.error('Delete machine error:', error)
      throw error
    }
  })
  // Users CRUD
  ipcMain.handle('users:list', () => listUsers())
  ipcMain.handle('users:create', (_e, payload) => createUser(payload))
  ipcMain.handle('users:update', (_e, payload) => updateUser(payload))
  ipcMain.handle('users:delete', (_e, id: string) => { 
    try {
      deleteUser(id); 
      return true 
    } catch (error) {
      console.error('Delete user error:', error)
      throw error
    }
  })
  // Limits CRUD
  ipcMain.handle('limits:list', () => listLimits())
  ipcMain.handle('limits:listByContext', (_e, lotId: string, qcLevelId: string, machineId: string) => listLimitsByContext(lotId, qcLevelId, machineId))
  ipcMain.handle('limits:listByContextAnalyte', (_e, lotId: string, qcLevelId: string, machineId: string, analyteIdOrCode: string) => listLimitsByContextAnalyte(lotId, qcLevelId, machineId, analyteIdOrCode))
  ipcMain.handle('limits:listByLotMachine', (_e, lotId: string, machineId: string) => listLimitsByLotMachine(lotId, machineId))
  ipcMain.handle('limits:create', (_e, payload) => createLimit(payload))
  ipcMain.handle('limits:update', (_e, payload) => updateLimit(payload))
  ipcMain.handle('limits:delete', (_e, id: string) => { 
    try {
      deleteLimit(id); 
      return true 
    } catch (error) {
      console.error('Delete limit error:', error)
      throw error
    }
  })
  ipcMain.handle('limits:batchAdd', (_e, lot_id: string, qc_level_id: string, analyte_ids: string[], machine_id: string, created_by?: string) => batchAddLimits(lot_id, qc_level_id, analyte_ids, machine_id, created_by || 'admin'))
  ipcMain.handle('limits:bulkApplyMachines', (_e, lot_id: string, qc_level_id: string, machine_ids: string[], analyte_ids?: string[]) => bulkApplyMachines(lot_id, qc_level_id, machine_ids || [], analyte_ids))
  
  // Bias Methods CRUD
  ipcMain.handle('biasMethods:list', () => listBiasMethods())
  ipcMain.handle('biasMethods:create', (_e, payload) => createBiasMethod(payload))
  ipcMain.handle('biasMethods:update', (_e, payload) => updateBiasMethod(payload))
  ipcMain.handle('biasMethods:delete', (_e, id: string) => { 
    try {
      deleteBiasMethod(id); 
      return true 
    } catch (error) {
      console.error('Delete bias method error:', error)
      throw error
    }
  })
  
  // QC Levels CRUD
  ipcMain.handle('qcLevels:list', () => listQcLevels())
  ipcMain.handle('qcLevels:create', (_e, payload) => createQcLevel(payload))
  ipcMain.handle('qcLevels:update', (_e, payload) => updateQcLevel(payload))
  ipcMain.handle('qcLevels:delete', (_e, id: string) => { 
    try {
      deleteQcLevel(id); 
      return true 
    } catch (error) {
      console.error('Delete QC level error:', error)
      throw error
    }
  })
  
  // Profile API
  ipcMain.handle('profile:getCurrentUser', (_e, username: string) => getCurrentUser(username))
  ipcMain.handle('profile:update', (_e, username: string, data: any) => updateProfile(username, data))
  ipcMain.handle('auth:logout', () => logout())

  // Westgard rules API
  ipcMain.handle('westgard:list', () => listWestgardRules())
  ipcMain.handle('westgard:upsert', (_e, payload) => upsertWestgardRule(payload))
  ipcMain.handle('westgard:setQcLevels', (_e, ruleId: string, qcLevels: string[]) => setWestgardRuleQcLevels(ruleId, qcLevels))
  ipcMain.handle('westgard:delete', (_e, id: string) => deleteWestgardRule(id))

  // QC Entries API
  ipcMain.handle('entries:listByContext', (_e, params: { lotId: string, qcLevelId: string, machineId: string, startDate?: string, endDate?: string }) => {
    console.log('IPC - entries:listByContext received:', params)
    return listEntriesByContext(params.lotId, params.qcLevelId, params.machineId, params.startDate, params.endDate)
  })
  ipcMain.handle('entries:batchCreate', (_e, payload: any[]) => batchCreateEntries(payload))
  ipcMain.handle('entries:update', (_e, id: string, value: number, note?: string) => updateEntry(id, value, note))
  ipcMain.handle('entries:delete', (_e, id: string) => deleteEntry(id))

  // Violations API
  ipcMain.handle('violations:listByContext', (_e, lotId: string, machineId: string, from?: string | null, to?: string | null) => listViolationsByContext(lotId, machineId, from, to))
  ipcMain.handle('violations:create', (_e, payload) => createViolation(payload))
  ipcMain.handle('violations:updateAction', (_e, id: string, action?: string, staff?: string, status?: string) => updateViolationAction(id, action, staff, status))
  
  createWindow()
})
