interface TeamRow { teamNumber: number; nickname: string; }

export async function EditTeamsView(container: HTMLElement) {
    const raw = await window.xeroscout.getInfoData() as {
        event: { baEventKey: string };
    } | null;

    // Load existing teams via a dedicated channel or reuse info
    // Teams count is in getInfoData, but we need the actual list — fetch separately
    let teams: TeamRow[] = [];
    try {
        const result = await (window.xeroscout as unknown as {
            getTeamStatus(): Promise<{ teams: TeamRow[] }>;
        }).getTeamStatus?.() ?? { teams: [] };
        teams = (result.teams ?? []).map((t: TeamRow) => ({ teamNumber: t.teamNumber, nickname: t.nickname }));
    } catch {
        teams = [];
    }

    const hasBAKey = !!(raw?.event?.baEventKey && raw.event.baEventKey !== '—');

    function renderTable(wrapEl: HTMLElement) {
        const tbody = wrapEl.querySelector<HTMLElement>('#teams-tbody')!;
        tbody.innerHTML = '';

        if (teams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="select-event-empty">No teams. Click "Add Team" or import from Blue Alliance.</td></tr>';
            return;
        }

        teams.forEach((t, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input class="form-input team-number" data-idx="${i}" type="number" value="${t.teamNumber}" style="width:110px" /></td>
                <td><input class="form-input team-nickname" data-idx="${i}" type="text" value="${escHtml(t.nickname)}" style="width:100%" /></td>
                <td><button class="btn btn-danger btn-sm team-remove-btn" data-idx="${i}">Remove</button></td>`;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll<HTMLInputElement>('.team-number').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset['idx']!, 10);
                teams[idx].teamNumber = parseInt(input.value, 10) || 0;
            });
        });
        tbody.querySelectorAll<HTMLInputElement>('.team-nickname').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset['idx']!, 10);
                teams[idx].nickname = input.value;
            });
        });
        tbody.querySelectorAll<HTMLButtonElement>('.team-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset['idx']!, 10);
                teams.splice(idx, 1);
                renderTable(wrapEl);
            });
        });
    }

    container.innerHTML = `
        <div class="view-container">
            <div class="view-title">Edit Teams</div>
            <div class="view-subtitle">
                Add or remove teams. Lock requires more than 18 teams.
            </div>
            <div class="setup-toolbar">
                <button class="btn btn-secondary" id="teams-add-btn">&#x2795; Add Team</button>
                ${hasBAKey ? '<button class="btn btn-secondary" id="teams-import-ba-btn">Import from Blue Alliance</button>' : ''}
            </div>
            <div id="teams-count" class="setup-team-count">${teams.length} team${teams.length !== 1 ? 's' : ''} (need &gt;18 to lock)</div>
            <table class="data-table" style="max-width:700px;margin-top:12px">
                <thead><tr><th style="width:130px">Team #</th><th>Nickname</th><th style="width:80px"></th></tr></thead>
                <tbody id="teams-tbody"></tbody>
            </table>
            <div id="teams-error" class="create-event-error hidden" style="margin-top:12px"></div>
            <div class="form-row" style="margin-top:20px;gap:12px">
                <button class="btn btn-primary" id="teams-save-btn">Save</button>
                <button class="btn btn-secondary" id="teams-cancel-btn">Cancel</button>
            </div>
        </div>`;

    renderTable(container);

    function updateCount() {
        const el = container.querySelector<HTMLElement>('#teams-count');
        if (el) el.innerHTML = `${teams.length} team${teams.length !== 1 ? 's' : ''} (need &gt;18 to lock)`;
    }

    container.querySelector('#teams-add-btn')?.addEventListener('click', () => {
        teams.push({ teamNumber: 0, nickname: '' });
        renderTable(container);
        updateCount();
    });

    container.querySelector('#teams-import-ba-btn')?.addEventListener('click', async () => {
        const errorEl = container.querySelector<HTMLElement>('#teams-error')!;
        errorEl.classList.add('hidden');
        try {
            await window.xeroscout.executeCommand('import-ba');
            // After BA import, reload the view to show updated teams
            window.xeroscout.executeCommand('show-view', 'edit-teams');
        } catch (err) {
            errorEl.textContent = `Import failed: ${String(err)}`;
            errorEl.classList.remove('hidden');
        }
    });

    container.querySelector('#teams-save-btn')?.addEventListener('click', async () => {
        const errorEl = container.querySelector<HTMLElement>('#teams-error')!;
        const valid = teams.filter(t => t.teamNumber > 0);
        if (valid.length !== teams.length) {
            errorEl.textContent = 'All teams must have a valid team number (> 0).';
            errorEl.classList.remove('hidden');
            return;
        }
        errorEl.classList.add('hidden');
        await window.xeroscout.executeCommand('save-teams', valid);
    });

    container.querySelector('#teams-cancel-btn')?.addEventListener('click', () => {
        void window.xeroscout.executeCommand('show-view', 'event-setup');
    });
}

function escHtml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
