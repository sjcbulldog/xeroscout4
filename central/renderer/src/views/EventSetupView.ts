interface SetupInfoData {
    event: {
        name: string;
        uuid: string;
        baEventKey: string;
        locked: boolean;
        year: number;
    };
    teams: number;
    matches: number;
    tablets: Array<{ name: string; purpose: string }>;
    teamFormPresent: boolean;
    matchFormPresent: boolean;
}

interface SetupRow {
    id: string;
    label: string;
    getStatus: (d: SetupInfoData) => string;
    getCheck: (d: SetupInfoData) => boolean | null;  // null = optional (no requirement)
    getActions: (d: SetupInfoData) => Array<{ label: string; cmd: string; args?: unknown[] }>;
}

const ROWS: SetupRow[] = [
    {
        id: 'info',
        label: 'Event Info',
        getStatus: d => d.event.name,
        getCheck: () => true,
        getActions: () => [{ label: 'Edit Info', cmd: 'show-view', args: ['info'] }],
    },
    {
        id: 'teams',
        label: 'Teams',
        getStatus: d => `${d.teams} team${d.teams !== 1 ? 's' : ''} loaded`,
        getCheck: d => d.teams > 18,
        getActions: d => [
            { label: 'Edit Teams', cmd: 'show-view', args: ['edit-teams'] },
            ...(d.event.baEventKey && d.event.baEventKey !== '—'
                ? [{ label: 'Import from BA', cmd: 'import-ba' }]
                : []),
        ],
    },
    {
        id: 'schedule',
        label: 'Match Schedule',
        getStatus: d => `${d.matches} match${d.matches !== 1 ? 'es' : ''} loaded`,
        getCheck: () => null,
        getActions: d => [
            ...(d.event.baEventKey && d.event.baEventKey !== '—'
                ? [{ label: 'Import from BA', cmd: 'import-ba' }]
                : []),
        ],
    },
    {
        id: 'tablets',
        label: 'Tablets',
        getStatus: d => {
            const matchT = d.tablets.filter(t => t.purpose === 'match').length;
            const teamT  = d.tablets.filter(t => t.purpose === 'team').length;
            return `${d.tablets.length} tablet${d.tablets.length !== 1 ? 's' : ''} (${matchT} match, ${teamT} team)`;
        },
        getCheck: d => {
            const matchT = d.tablets.filter(t => t.purpose === 'match').length;
            const teamT  = d.tablets.filter(t => t.purpose === 'team').length;
            return matchT >= 6 && teamT >= 1;
        },
        getActions: () => [{ label: 'Assign Tablets', cmd: 'show-view', args: ['assign-tablets'] }],
    },
    {
        id: 'team-form',
        label: 'Team Scouting Form',
        getStatus: d => d.teamFormPresent ? 'Form present' : 'Not configured',
        getCheck: d => d.teamFormPresent,
        getActions: () => [{ label: 'Edit Team Form', cmd: 'show-view', args: ['form-json', 'team'] }],
    },
    {
        id: 'match-form',
        label: 'Match Scouting Form',
        getStatus: d => d.matchFormPresent ? 'Form present' : 'Not configured',
        getCheck: d => d.matchFormPresent,
        getActions: () => [{ label: 'Edit Match Form', cmd: 'show-view', args: ['form-json', 'match'] }],
    },
];

export async function EventSetupView(container: HTMLElement) {
    container.innerHTML = `<div class="view-container"><div class="view-title">Event Setup</div>
        <div id="setup-loading" class="view-subtitle">Loading…</div>
        <div id="setup-content" class="hidden"></div>
    </div>`;

    const info = await window.xeroscout.getInfoData() as SetupInfoData | null;
    const loadingEl = container.querySelector<HTMLElement>('#setup-loading')!;
    const contentEl = container.querySelector<HTMLElement>('#setup-content')!;

    if (!info || !info.event) {
        loadingEl.textContent = 'No event loaded.';
        return;
    }
    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

    const lockable = ROWS.every(r => {
        const c = r.getCheck(info);
        return c === null || c === true;
    });

    let rowsHtml = '';
    for (const row of ROWS) {
        const check = row.getCheck(info);
        const statusText = row.getStatus(info);
        const actions = row.getActions(info);

        let icon: string;
        if (check === null) {
            icon = `<span class="status-ok setup-check-icon">&#x2022;</span>`;
        } else if (check) {
            icon = `<span class="status-ok setup-check-icon">&#x2713;</span>`;
        } else {
            icon = `<span class="status-error setup-check-icon">&#x2717;</span>`;
        }

        const actionBtns = actions.map(a =>
            `<button class="btn btn-secondary btn-sm setup-action-btn"
                data-cmd="${a.cmd}"
                data-args="${encodeURIComponent(JSON.stringify(a.args ?? []))}"
            >${a.label}</button>`
        ).join(' ');

        rowsHtml += `
            <div class="setup-row" data-id="${row.id}">
                <div class="setup-row-icon">${icon}</div>
                <div class="setup-row-label">${row.label}</div>
                <div class="setup-row-status">${statusText}</div>
                <div class="setup-row-actions">${actionBtns}</div>
            </div>`;
    }

    const lockHtml = `
        <div class="setup-lock-section">
            <div class="setup-lock-requirements">
                ${lockable
                    ? '<span class="status-ok">All requirements met.</span>'
                    : '<span class="status-warn">Requirements not met. Fix items marked ✗ above.</span>'}
                <div class="setup-lock-note">Requirements: &gt;18 teams, ≥6 match tablets, ≥1 team tablet, both forms set. (Match schedule is optional.)</div>
            </div>
            <button class="btn ${lockable ? 'btn-primary' : 'btn-secondary'} setup-lock-btn"
                id="setup-lock-btn" ${lockable ? '' : 'disabled'}>
                &#x1F512; Lock Event
            </button>
        </div>`;

    contentEl.innerHTML = `
        <div class="setup-grid">${rowsHtml}</div>
        ${lockHtml}`;

    // Wire action buttons
    contentEl.querySelectorAll<HTMLButtonElement>('.setup-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cmd  = btn.dataset['cmd']!;
            const args = JSON.parse(decodeURIComponent(btn.dataset['args'] ?? '[]')) as unknown[];
            if (cmd === 'show-view') {
                void window.xeroscout.executeCommand(cmd, ...args);
            } else {
                void window.xeroscout.executeCommand(cmd, ...args);
            }
        });
    });

    container.querySelector('#setup-lock-btn')?.addEventListener('click', () => {
        void window.xeroscout.executeCommand('lock-event');
    });
}
