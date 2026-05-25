export async function SingleTeamView(container: HTMLElement, teamNumber?: number) {
    const wrap = document.createElement('div');
    wrap.className = 'view-container';

    // Team picker
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:24px;';
    const input = document.createElement('input');
    input.className = 'form-input';
    input.style.maxWidth = '140px';
    input.type = 'number';
    input.placeholder = 'Team #';
    input.value = teamNumber ? String(teamNumber) : '';
    const goBtn = document.createElement('button');
    goBtn.className = 'btn btn-primary';
    goBtn.textContent = 'View';
    toolbar.appendChild(input);
    toolbar.appendChild(goBtn);
    wrap.appendChild(toolbar);

    const content = document.createElement('div');
    wrap.appendChild(content);
    container.innerHTML = '';
    container.appendChild(wrap);

    async function load(tn: number) {
        content.innerHTML = '<p style="color:#90a4ae">Loading…</p>';
        try {
            const data = await window.xeroscout.getTeamDb() as {
                results?: Array<Record<string, unknown>>
            } | null;
            const rows = (data?.results ?? []).filter(r => Number(r.teamNumber) === tn);
            if (!rows.length) {
                content.innerHTML = `<p style="color:#90a4ae">No scouting data for team ${tn}.</p>`;
                return;
            }
            const cols = Object.keys(rows[0]);
            const tableWrap = document.createElement('div');
            tableWrap.style.overflowX = 'auto';
            const table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
            `;
            tableWrap.appendChild(table);
            content.innerHTML = '';
            content.innerHTML = `<div class="view-title">Team ${tn}</div>`;
            content.appendChild(tableWrap);
        } catch (err) {
            content.innerHTML = `<p style="color:#ef5350">Error: ${err}</p>`;
        }
    }

    goBtn.addEventListener('click', () => {
        const tn = parseInt(input.value);
        if (!isNaN(tn) && tn > 0) void load(tn);
    });

    if (teamNumber) void load(teamNumber);
}
