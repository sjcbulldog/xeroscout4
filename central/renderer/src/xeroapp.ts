import './xeroapp.css';
import { InfoView }         from './views/InfoView';
import { TeamDbView }       from './views/TeamDbView';
import { MatchDbView }      from './views/MatchDbView';
import { TeamStatusView }   from './views/TeamStatusView';
import { MatchStatusView }  from './views/MatchStatusView';
import { FormulasView }     from './views/FormulasView';
import { PicklistView }     from './views/PicklistView';
import { PlayoffsView }     from './views/PlayoffsView';
import { SingleTeamView }   from './views/SingleTeamView';
import { TextView }         from './views/TextView';

// ── Types matching the preload contextBridge ──────────────────────────────────
declare global {
    interface Window {
        xeroscout: {
            getNavData(): Promise<NavItem[]>;
            splitterChanged(pos: number): Promise<void>;
            getInfoData(): Promise<unknown>;
            executeCommand(cmd: string, ...args: unknown[]): Promise<unknown>;
            getForm(purpose: 'team' | 'match'): Promise<unknown>;
            saveForm(purpose: 'team' | 'match', form: unknown): Promise<void>;
            getTeamDb(): Promise<unknown>;
            getMatchDb(): Promise<unknown>;
            updateTeamDb(change: unknown): Promise<void>;
            updateMatchDb(change: unknown): Promise<void>;
            getTeamStatus(): Promise<unknown>;
            getMatchStatus(): Promise<unknown>;
            getFormulas(): Promise<unknown>;
            updateFormula(formula: unknown): Promise<void>;
            deleteFormula(name: string): Promise<void>;
            getDatasets(): Promise<unknown>;
            updateDatasets(datasets: unknown): Promise<void>;
            getPicklistConfigs(): Promise<unknown>;
            savePicklistConfig(config: unknown): Promise<void>;
            deletePicklistConfig(name: string): Promise<void>;
            getPicklistData(name: string): Promise<unknown>;
            getPlayoffStatus(): Promise<unknown>;
            setAllianceTeams(alliance: number, teams: number[]): Promise<void>;
            setPlayoffMatchOutcome(match: string, winner: number, loser: number): Promise<void>;
            getImages(): Promise<unknown>;
            getImageData(name: string): Promise<unknown>;
            importImage(name: string, data: string, mimeType: string): Promise<unknown>;
            logMessage(level: string, msg: string): void;
            onNavData(cb: (items: NavItem[]) => void): void;
            onStatusUpdate(cb: (left: string, middle: string, right: string) => void): void;
            onShowView(cb: (view: string, args: unknown[]) => void): void;
            onSetOverlay(cb: (visible: boolean, msg: string) => void): void;
            onPromptString(cb: (id: string, title: string, prompt: string) => void): void;
            sendPromptResponse(id: string, value: string | undefined): void;
        };
    }
}

export interface NavItem {
    id: string;
    label: string;
    view: string;
    args?: unknown[];
    children?: NavItem[];
}

// ── View registry ─────────────────────────────────────────────────────────────
type ViewConstructor = (container: HTMLElement, args: unknown[]) => void;

const viewRegistry: Record<string, ViewConstructor> = {
    'info':         (el, _)    => InfoView(el),
    'team-db':      (el, _)    => TeamDbView(el),
    'match-db':     (el, _)    => MatchDbView(el),
    'team-status':  (el, _)    => TeamStatusView(el),
    'match-status': (el, _)    => MatchStatusView(el),
    'formulas':     (el, _)    => FormulasView(el),
    'picklist':     (el, _)    => PicklistView(el),
    'playoffs':     (el, _)    => PlayoffsView(el),
    'singleteam':   (el, args) => SingleTeamView(el, args[0] as number | undefined),
    'text':         (el, args) => TextView(el, args[0] as string ?? ''),
};

// ── Nav pane ──────────────────────────────────────────────────────────────────
function buildNav(items: NavItem[], container: HTMLElement) {
    container.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'nav-list';

    function renderItems(list: NavItem[], parent: HTMLElement, depth: number) {
        for (const item of list) {
            const li = document.createElement('li');
            li.className = `nav-item depth-${depth}`;
            if (item.children?.length) {
                const header = document.createElement('div');
                header.className = 'nav-group-header';
                header.textContent = item.label;
                const sub = document.createElement('ul');
                sub.className = 'nav-sub-list';
                renderItems(item.children, sub, depth + 1);
                li.appendChild(header);
                li.appendChild(sub);
            } else {
                const btn = document.createElement('button');
                btn.className = 'nav-btn';
                btn.textContent = item.label;
                btn.addEventListener('click', () => showView(item.view, item.args ?? []));
                li.appendChild(btn);
            }
            parent.appendChild(li);
        }
    }

    renderItems(items, ul, 0);
    container.appendChild(ul);
}

// ── View pane ─────────────────────────────────────────────────────────────────
function showView(view: string, args: unknown[]) {
    const pane = document.getElementById('view-pane');
    if (!pane) return;
    pane.innerHTML = '';
    const fn = viewRegistry[view];
    if (fn) {
        fn(pane, args);
    } else if (view) {
        const p = document.createElement('p');
        p.style.color = '#90a4ae';
        p.style.padding = '24px';
        p.textContent = `View "${view}" not yet implemented.`;
        pane.appendChild(p);
    }
}

// ── Splitter drag ─────────────────────────────────────────────────────────────
function initSplitter() {
    const splitter = document.getElementById('splitter');
    const navPane  = document.getElementById('nav-pane');
    if (!splitter || !navPane) return;

    let dragging = false;
    splitter.addEventListener('mousedown', () => { dragging = true; });
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const w = Math.max(120, Math.min(500, e.clientX));
        navPane.style.width = `${w}px`;
    });
    document.addEventListener('mouseup', () => {
        if (dragging) {
            const w = navPane.getBoundingClientRect().width;
            void window.xeroscout.splitterChanged(w);
        }
        dragging = false;
    });
}

// ── Prompt dialog ─────────────────────────────────────────────────────────────
function initPromptDialog() {
    window.xeroscout.onPromptString((id, title, prompt) => {
        const dlg   = document.getElementById('prompt-dialog')!;
        const titleEl = document.getElementById('prompt-title')!;
        const msgEl   = document.getElementById('prompt-message')!;
        const input   = document.getElementById('prompt-input') as HTMLInputElement;
        const okBtn   = document.getElementById('prompt-ok')!;
        const cancelBtn = document.getElementById('prompt-cancel')!;

        titleEl.textContent = title;
        msgEl.textContent   = prompt;
        input.value         = '';
        dlg.classList.remove('hidden');
        input.focus();

        function close(value: string | undefined) {
            dlg.classList.add('hidden');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            window.xeroscout.sendPromptResponse(id, value);
        }
        function onOk()     { close(input.value); }
        function onCancel() { close(undefined); }
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// ── Status bar ────────────────────────────────────────────────────────────────
function initStatusBar() {
    window.xeroscout.onStatusUpdate((left, middle, right) => {
        const l = document.getElementById('status-left');
        const m = document.getElementById('status-middle');
        const r = document.getElementById('status-right');
        if (l) l.textContent = left;
        if (m) m.textContent = middle;
        if (r) r.textContent = right;
    });
}

// ── Overlay ───────────────────────────────────────────────────────────────────
function initOverlay() {
    window.xeroscout.onSetOverlay((visible, msg) => {
        const ov = document.getElementById('status-overlay')!;
        const txt = document.getElementById('status-overlay-text')!;
        txt.textContent = msg;
        ov.classList.toggle('hidden', !visible);
    });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
    initSplitter();
    initPromptDialog();
    initStatusBar();
    initOverlay();

    window.xeroscout.onNavData(items => {
        const nav = document.getElementById('nav-pane');
        if (nav) buildNav(items, nav);
    });

    window.xeroscout.onShowView((view, args) => showView(view, args));

    // Initial nav
    const nav = document.getElementById('nav-pane');
    if (nav) {
        const items = await window.xeroscout.getNavData();
        buildNav(items, nav);
    }
}

void boot();
