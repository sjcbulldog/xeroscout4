type StatusData = {
    results?: Array<{ teamNumber: number; matchNumber: number; position: string }>;
    teams?: Array<{ number: number; name: string }>;
    matches?: Array<{ id: number; matchNumber: number; redTeams: number[]; blueTeams: number[] }>;
};

function buildStatusGrid(container: HTMLElement, title: string, rows: string[][], headers: string[]) {
    const wrap = document.createElement('div');
    wrap.className = 'view-container';
    wrap.innerHTML = `<div class="view-title">${title}</div>`;

    const tableWrap = document.createElement('div');
    tableWrap.style.overflowX = 'auto';
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    `;
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);
    container.appendChild(wrap);
}

export async function TeamStatusView(container: HTMLElement) {
    const data = await window.xeroscout.getTeamStatus() as StatusData | null;
    const teams = data?.teams ?? [];
    const results = data?.results ?? [];
    const scoutedSet = new Set(results.map(r => r.teamNumber));
    const rows = teams.map(t => [
        String(t.number),
        t.name,
        scoutedSet.has(t.number)
            ? `<span class="status-ok">✓ ${results.filter(r => r.teamNumber === t.number).length}</span>`
            : '<span class="status-pending">—</span>',
    ]);
    buildStatusGrid(container, 'Team Status', rows, ['#', 'Team Name', 'Scouting Results']);
}

export async function MatchStatusView(container: HTMLElement) {
    const data = await window.xeroscout.getMatchStatus() as StatusData | null;
    const matches = data?.matches ?? [];
    const results = data?.results ?? [];

    const rows = matches.map(m => {
        const matchResults = results.filter(r => r.matchNumber === m.matchNumber);
        const allPositions = ['red1','red2','red3','blue1','blue2','blue3'];
        const scoutedPositions = matchResults.map(r => r.position);
        const missing = allPositions.filter(p => !scoutedPositions.includes(p));
        const statusStr = missing.length === 0
            ? '<span class="status-ok">✓ Complete</span>'
            : `<span class="status-warn">Missing: ${missing.join(', ')}</span>`;
        return [
            String(m.matchNumber),
            m.redTeams.join(', '),
            m.blueTeams.join(', '),
            statusStr,
        ];
    });
    buildStatusGrid(container, 'Match Status', rows, ['Match', 'Red', 'Blue', 'Scouting']);
}
