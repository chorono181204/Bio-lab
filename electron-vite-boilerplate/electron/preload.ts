import { contextBridge, ipcRenderer } from 'electron'
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `iqc-loader`
  const styleContent = `
@keyframes iqc-rotate { to { transform: rotate(360deg); } }
@keyframes iqc-dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}
.app-loading-wrap {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  z-index: 9999;
}
.loading-card {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.loading-logo { height: 56px; }
.loading-title { color: #1976d2; font-weight: 800; letter-spacing: .4px; font-size: 14px; line-height: 1.2; text-align:center }
.loading-tag { color: #ffc107; font-size: 12px; font-style: italic; }
.${className} {
  width: 64px; height: 64px; animation: iqc-rotate 1.4s linear infinite;
}
.${className} circle {
  stroke: #1976d2; stroke-linecap: round; animation: iqc-dash 1.4s ease-in-out infinite;
}
  `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `
    <div class="loading-card">
      <img class="loading-logo" src="/logo.svg" alt="logo" />
      <div class="loading-title">
        <div>BỆNH VIỆN ĐA KHOA SỐ 1</div>
        <div>TỈNH LÀO CAI</div>
        <div class="loading-tag">More than a hospital</div>
      </div>
      <svg class="${className}" viewBox="25 25 50 50">
        <circle cx="50" cy="50" r="20" fill="none" stroke-width="4" stroke-miterlimit="10" />
      </svg>
      
    </div>
  `

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = ev => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)

// Expose minimal API
try {
  contextBridge.exposeInMainWorld('iqc', {
    getStats: () => ipcRenderer.invoke('iqc:get-stats'),
    login: (username: string, password: string) => ipcRenderer.invoke('iqc:login', username, password)
  })
} catch {}

// Fallback for contextIsolation=false
(window as any).iqc = (window as any).iqc || {
  getStats: () => ipcRenderer.invoke('iqc:get-stats'),
  login: (username: string, password: string) => ipcRenderer.invoke('iqc:login', username, password),
  // Forms CRUD
  forms: {
    list: () => ipcRenderer.invoke('forms:list'),
    create: (payload: any) => ipcRenderer.invoke('forms:create', payload),
    update: (payload: any) => ipcRenderer.invoke('forms:update', payload),
    delete: (id: string) => ipcRenderer.invoke('forms:delete', id),
  },
  analytes: {
    list: () => ipcRenderer.invoke('analytes:list'),
    create: (payload: any) => ipcRenderer.invoke('analytes:create', payload),
    update: (payload: any) => ipcRenderer.invoke('analytes:update', payload),
    delete: (id: string) => ipcRenderer.invoke('analytes:delete', id),
  },
  lots: {
    list: () => ipcRenderer.invoke('lots:list'),
    create: (payload: any) => ipcRenderer.invoke('lots:create', payload),
    update: (payload: any) => ipcRenderer.invoke('lots:update', payload),
    delete: (id: string) => ipcRenderer.invoke('lots:delete', id),
  },
  limits: {
    list: () => ipcRenderer.invoke('limits:list'),
    listByContext: (lotId: string, qcLevelId: string, machineId: string) => ipcRenderer.invoke('limits:listByContext', lotId, qcLevelId, machineId),
    listByContextAnalyte: (lotId: string, qcLevelId: string, machineId: string, analyteIdOrCode: string) => ipcRenderer.invoke('limits:listByContextAnalyte', lotId, qcLevelId, machineId, analyteIdOrCode),
    listByLotMachine: (lotId: string, machineId: string) => ipcRenderer.invoke('limits:listByLotMachine', lotId, machineId),
    create: (payload: any) => ipcRenderer.invoke('limits:create', payload),
    update: (payload: any) => ipcRenderer.invoke('limits:update', payload),
    delete: (id: string) => ipcRenderer.invoke('limits:delete', id),
    batchAdd: (lot_id: string, qc_level_id: string, analyte_ids: string[], machine_id: string, created_by?: string) => ipcRenderer.invoke('limits:batchAdd', lot_id, qc_level_id, analyte_ids, machine_id, created_by),
    bulkApplyMachines: (lot_id: string, qc_level_id: string, machine_ids: string[], analyte_ids?: string[]) => ipcRenderer.invoke('limits:bulkApplyMachines', lot_id, qc_level_id, machine_ids, analyte_ids),
  },
  machines: {
    list: () => ipcRenderer.invoke('machines:list'),
    create: (payload: any) => ipcRenderer.invoke('machines:create', payload),
    update: (payload: any) => ipcRenderer.invoke('machines:update', payload),
    delete: (id: string) => ipcRenderer.invoke('machines:delete', id),
  },
  users: {
    list: () => ipcRenderer.invoke('users:list'),
    create: (payload: any) => ipcRenderer.invoke('users:create', payload),
    update: (payload: any) => ipcRenderer.invoke('users:update', payload),
    delete: (id: string) => ipcRenderer.invoke('users:delete', id),
  },
  biasMethods: {
    list: () => ipcRenderer.invoke('biasMethods:list'),
    create: (payload: any) => ipcRenderer.invoke('biasMethods:create', payload),
    update: (payload: any) => ipcRenderer.invoke('biasMethods:update', payload),
    delete: (id: string) => ipcRenderer.invoke('biasMethods:delete', id),
  },
  qcLevels: {
    list: () => ipcRenderer.invoke('qcLevels:list'),
    create: (payload: any) => ipcRenderer.invoke('qcLevels:create', payload),
    update: (payload: any) => ipcRenderer.invoke('qcLevels:update', payload),
    delete: (id: string) => ipcRenderer.invoke('qcLevels:delete', id),
  },
  westgard: {
    list: () => ipcRenderer.invoke('westgard:list'),
    upsert: (payload: any) => ipcRenderer.invoke('westgard:upsert', payload),
    setQcLevels: (ruleId: string, qcLevels: string[]) => ipcRenderer.invoke('westgard:setQcLevels', ruleId, qcLevels),
    delete: (id: string) => ipcRenderer.invoke('westgard:delete', id),
  },
  entries: {
    listByContext: (lotId: string, qcLevelId: string, machineId: string) => ipcRenderer.invoke('entries:listByContext', lotId, qcLevelId, machineId),
    batchCreate: (payload: any[]) => ipcRenderer.invoke('entries:batchCreate', payload),
    update: (id: string, value: number, note?: string) => ipcRenderer.invoke('entries:update', id, value, note),
    delete: (id: string) => ipcRenderer.invoke('entries:delete', id),
  },
  violations: {
    listByContext: (lotId: string, machineId: string, from?: string | null, to?: string | null) => ipcRenderer.invoke('violations:listByContext', lotId, machineId, from || null, to || null),
    create: (payload: any) => ipcRenderer.invoke('violations:create', payload),
    updateAction: (id: string, action?: string, staff?: string, status?: string) => ipcRenderer.invoke('violations:updateAction', id, action, staff, status),
  },
  profile: {
    getCurrentUser: (username: string) => ipcRenderer.invoke('profile:getCurrentUser', username),
    update: (username: string, data: any) => ipcRenderer.invoke('profile:update', username, data),
  },
  auth: {
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  lookups: {
    machines: () => ipcRenderer.invoke('machines:list-simple'),
    machinesByLot: (lotCode: string) => ipcRenderer.invoke('machines:list-by-lot', lotCode),
    machinesByLotId: (lotId: string) => ipcRenderer.invoke('machines:list-by-lot-id', lotId),
    qcLevels: () => ipcRenderer.invoke('qclevels:list-simple'),
    qcLevelsByLotId: (lotId: string) => ipcRenderer.invoke('qclevels:list-by-lot-id', lotId),
    lots: () => ipcRenderer.invoke('lots:list-simple'),
  }
}
