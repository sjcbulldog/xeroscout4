import { contextBridge, ipcRenderer } from 'electron';

// Expose a typed API to the renderer process — namespace must match window.xeroscout in the renderer
contextBridge.exposeInMainWorld('xeroscout', {
    // ── Main → Renderer push events ──────────────────────────────────────────
    onAppInit:      (cb: (data: unknown) => void) => ipcRenderer.on('xero-app-init', (_e, data) => cb(data)),
    onShowView:     (cb: (view: string, args: unknown[]) => void) => ipcRenderer.on('update-main-window-view', (_e, view, ...args) => cb(view, args)),
    onNavData:      (cb: (data: unknown) => void) => ipcRenderer.on('send-nav-data', (_e, data) => cb(data)),
    onStatusUpdate: (cb: (left: string, middle: string, right: string) => void) =>
        ipcRenderer.on('send-app-status', (_e, s: { left: string; middle: string; right: string }) => cb(s.left, s.middle, s.right)),
    onPromptString: (cb: (id: string, title: string, prompt: string) => void) =>
        ipcRenderer.on('prompt-string-request', (_e, req: { id: string; title: string; message: string }) => cb(req.id, req.title, req.message)),
    onSetOverlay:   (cb: (visible: boolean, text: string) => void) => ipcRenderer.on('set-status-overlay', (_e, visible, text) => cb(visible, text)),

    // ── Renderer → Main invoke calls ──────────────────────────────────────────
    getNavData:     () => ipcRenderer.invoke('get-nav-data'),
    executeCommand: (cmd: string, ...args: unknown[]) => ipcRenderer.invoke('execute-command', cmd, ...args),
    getInfoData:    () => ipcRenderer.invoke('get-info-data'),
    setEventName:   (name: string) => ipcRenderer.invoke('set-event-name', name),
    getForm:        (purpose: string) => ipcRenderer.invoke('get-form', purpose),
    saveForm:       (purpose: string, form: unknown) => ipcRenderer.invoke('save-form', purpose, form),
    getTeamDb:      (options?: unknown) => ipcRenderer.invoke('get-team-db', options),
    getMatchDb:     (options?: unknown) => ipcRenderer.invoke('get-match-db', options),
    updateTeamDb:   (change: unknown) => ipcRenderer.invoke('update-team-db', change),
    updateMatchDb:  (change: unknown) => ipcRenderer.invoke('update-match-db', change),
    getTeamStatus:  () => ipcRenderer.invoke('get-team-status'),
    getMatchStatus: () => ipcRenderer.invoke('get-match-status'),
    getFormulas:    () => ipcRenderer.invoke('get-formulas'),
    updateFormula:  (formula: unknown) => ipcRenderer.invoke('update-formula', formula),
    deleteFormula:  (name: string) => ipcRenderer.invoke('delete-formula', name),
    getDatasets:    () => ipcRenderer.invoke('get-datasets'),
    updateDatasets: (datasets: unknown) => ipcRenderer.invoke('update-datasets', datasets),
    getPicklistConfigs: () => ipcRenderer.invoke('get-picklist-configs'),
    savePicklistConfig: (config: unknown) => ipcRenderer.invoke('save-picklist-config', config),
    deletePicklistConfig: (name: string) => ipcRenderer.invoke('delete-picklist-config', name),
    getPicklistData: (name: string) => ipcRenderer.invoke('get-picklist-data', name),
    getSingleTeamConfigs: () => ipcRenderer.invoke('get-single-team-configs'),
    updateSingleTeamConfigs: (configs: unknown) => ipcRenderer.invoke('update-single-team-configs', configs),
    getChartData:   (config: unknown) => ipcRenderer.invoke('get-chart-data', config),
    getPlayoffStatus: () => ipcRenderer.invoke('get-playoff-status'),
    setAllianceTeams: (alliance: number, teams: number[]) => ipcRenderer.invoke('set-alliance-teams', alliance, teams),
    setPlayoffMatchOutcome: (match: string, winner: number, loser: number) => ipcRenderer.invoke('set-playoff-match-outcome', match, winner, loser),
    syncToCloud:    (options?: unknown) => ipcRenderer.invoke('sync-to-cloud', options),
    splitterChanged: (pos: number) => ipcRenderer.invoke('splitter-changed', pos),
    sendPromptResponse: (id: string, value: string | undefined) => ipcRenderer.invoke('prompt-string-response', id, value),
    logMessage:     (level: string, msg: string) => ipcRenderer.invoke('log-client-message', level, msg),
    getImages:      () => ipcRenderer.invoke('get-images'),
    getImageData:   (name: string) => ipcRenderer.invoke('get-image-data', name),
    importImage:    (name: string, data: string, mimeType: string) => ipcRenderer.invoke('import-image', name, data, mimeType),
    getBaEvents:    (year: number) => ipcRenderer.invoke('get-ba-events', year),
    getTbaKey:      () => ipcRenderer.invoke('get-tba-key'),
    setTbaKey:      (key: string) => ipcRenderer.invoke('set-tba-key', key),
});

