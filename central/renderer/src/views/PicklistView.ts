type PicklistEntry = { teamNumber: number; rank: number; notes?: string };
type PicklistConfig = { name: string; entries: PicklistEntry[] };

export async function PicklistView(container: HTMLElement) {
    const data = await window.xeroscout.getPicklistConfigs() as { picklists: PicklistConfig[] } | null;
    let picklists: PicklistConfig[] = data?.picklists ?? [];
    let activeIdx = 0;

    const wrap = document.createElement('div');
    wrap.className = 'view-container';

    function render() {
        wrap.innerHTML = '<div class="view-title">Pick Lists</div>';

        // Picklist selector + add button
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:16px;';
        const select = document.createElement('select');
        select.className = 'form-input';
        select.style.maxWidth = '220px';
        picklists.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = p.name;
            opt.selected = i === activeIdx;
            select.appendChild(opt);
        });
        select.addEventListener('change', () => { activeIdx = parseInt(select.value); render(); });

        const newBtn = document.createElement('button');
        newBtn.className = 'btn btn-primary';
        newBtn.textContent = '+ New List';
        newBtn.addEventListener('click', () => promptName());

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-danger';
        delBtn.textContent = 'Delete List';
        delBtn.disabled = picklists.length === 0;
        delBtn.addEventListener('click', async () => {
            if (!picklists[activeIdx]) return;
            if (!confirm(`Delete picklist "${picklists[activeIdx].name}"?`)) return;
            await window.xeroscout.deletePicklistConfig(picklists[activeIdx].name);
            picklists.splice(activeIdx, 1);
            activeIdx = Math.max(0, activeIdx - 1);
            render();
        });

        toolbar.appendChild(select);
        toolbar.appendChild(newBtn);
        toolbar.appendChild(delBtn);
        wrap.appendChild(toolbar);

        const pl = picklists[activeIdx];
        if (!pl) { container.innerHTML = ''; container.appendChild(wrap); return; }

        // Entries
        const table = document.createElement('table');
        table.className = 'data-table';
        table.innerHTML = '<thead><tr><th>Rank</th><th>Team #</th><th>Notes</th><th></th></tr></thead>';
        const tbody = document.createElement('tbody');
        pl.entries.sort((a, b) => a.rank - b.rank).forEach((entry, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${entry.rank}</td>
                <td>${entry.teamNumber}</td>
                <td contenteditable="true" style="cursor:text">${entry.notes ?? ''}</td>
                <td>
                    <button class="btn btn-secondary" data-i="${i}" data-dir="up">↑</button>
                    <button class="btn btn-secondary" data-i="${i}" data-dir="down">↓</button>
                </td>
            `;
            const notesTd = tr.querySelectorAll('td')[2];
            notesTd.addEventListener('blur', async () => {
                pl.entries[i].notes = notesTd.textContent ?? '';
                await window.xeroscout.savePicklistConfig(pl);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);

        tbody.addEventListener('click', async (e) => {
            const btn = (e.target as HTMLElement).closest('button[data-dir]') as HTMLButtonElement | null;
            if (!btn) return;
            const i   = parseInt(btn.dataset.i!);
            const dir = btn.dataset.dir!;
            const sorted = [...pl.entries].sort((a, b) => a.rank - b.rank);
            const swapIdx = dir === 'up' ? i - 1 : i + 1;
            if (swapIdx < 0 || swapIdx >= sorted.length) return;
            const tmp = sorted[i].rank;
            sorted[i].rank = sorted[swapIdx].rank;
            sorted[swapIdx].rank = tmp;
            pl.entries = sorted;
            await window.xeroscout.savePicklistConfig(pl);
            render();
        });

        container.innerHTML = '';
        container.appendChild(wrap);
    }

    function promptName() {
        const name = prompt('Picklist name:');
        if (!name) return;
        const pl: PicklistConfig = { name, entries: [] };
        picklists.push(pl);
        activeIdx = picklists.length - 1;
        void window.xeroscout.savePicklistConfig(pl).then(render);
    }

    render();
}
