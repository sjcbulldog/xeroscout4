type Row = Record<string, unknown>;

function buildDbTable(container: HTMLElement, rows: Row[], title: string, onEdit?: (row: Row, col: string, val: string) => void) {
    const wrap = document.createElement('div');
    wrap.className = 'view-container';

    const h = document.createElement('div');
    h.className = 'view-title';
    h.textContent = title;
    wrap.appendChild(h);

    if (!rows.length) {
        const p = document.createElement('p');
        p.style.color = '#90a4ae';
        p.textContent = 'No data yet.';
        wrap.appendChild(p);
        container.appendChild(wrap);
        return;
    }

    const cols = Object.keys(rows[0]);
    const tableWrap = document.createElement('div');
    tableWrap.style.overflowX = 'auto';

    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const row of rows) {
        const tr = document.createElement('tr');
        for (const col of cols) {
            const td = document.createElement('td');
            const val = String(row[col] ?? '');
            td.textContent = val;
            if (onEdit) {
                td.contentEditable = 'true';
                td.style.cursor = 'text';
                td.addEventListener('blur', () => {
                    const newVal = td.textContent ?? '';
                    if (newVal !== val) onEdit(row, col, newVal);
                });
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);
    container.appendChild(wrap);
}

export async function TeamDbView(container: HTMLElement) {
    const data = await window.xeroscout.getTeamDb() as { results: Row[] } | null;
    buildDbTable(container, data?.results ?? [], 'Team Scouting Data', async (row, col, val) => {
        await window.xeroscout.updateTeamDb({ matchNumber: row.matchNumber, teamNumber: row.teamNumber, field: col, value: val });
    });
}

export async function MatchDbView(container: HTMLElement) {
    const data = await window.xeroscout.getMatchDb() as { results: Row[] } | null;
    buildDbTable(container, data?.results ?? [], 'Match Scouting Data', async (row, col, val) => {
        await window.xeroscout.updateMatchDb({ matchNumber: row.matchNumber, teamNumber: row.teamNumber, field: col, value: val });
    });
}
