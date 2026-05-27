interface InfoData {
    event: {
        name: string;
        uuid: string;
        baEventKey: string;
        locked: boolean;
        year: number;
        startDate: string;
        endDate: string;
    };
    teams: number;
    matches: number;
    scoutedMatches: number;
    tablets: unknown[];
}

export async function InfoView(container: HTMLElement) {
    const info = await window.xeroscout.getInfoData() as InfoData | null;

    container.innerHTML = '';

    if (!info || !info.event) {
        // No event loaded — show inline fallback (startup view handles the real one)
        container.innerHTML = `
            <div class="view-container">
                <div class="view-title">No Event Loaded</div>
                <p class="view-subtitle">Create a new event or open an existing one to get started.</p>
                <div style="display:flex;gap:12px;margin-top:8px">
                    <button class="btn btn-primary" id="info-create-btn">Create Event</button>
                    <button class="btn btn-secondary" id="info-open-btn">Open Event</button>
                </div>
            </div>`;
        container.querySelector('#info-create-btn')?.addEventListener('click',
            () => void window.xeroscout.executeCommand('create-event'));
        container.querySelector('#info-open-btn')?.addEventListener('click',
            () => void window.xeroscout.executeCommand('open-event'));
        return;
    }

    const { event, teams, matches, scoutedMatches, tablets } = info;
    const locked = event.locked;
    const tabletCount = Array.isArray(tablets) ? tablets.length : 0;

    const wrap = document.createElement('div');
    wrap.className = 'view-container';

    const check = '<span class="status-ok">&#x2713;</span>';
    const cross = '<span class="status-error">&#x2717;</span>';

    function makeRow(label: string, valueHtml: string, actionHtml = '', statusHtml = ''): string {
        return `<tr>
            <td class="info-label">${label}</td>
            <td class="info-value">${valueHtml}</td>
            <td class="info-action">${actionHtml}</td>
            <td class="info-status">${statusHtml}</td>
        </tr>`;
    }

    const nameHtml = locked
        ? event.name
        : `<span class="info-editable" contenteditable="true" id="info-event-name">${event.name}</span>`;

    const baKeyAction = !locked
        ? `<button class="btn btn-secondary btn-sm" id="import-ba-btn">Import from BA</button>`
        : '';

    let lockAction = '';
    let lockStatus = cross;
    if (locked) {
        lockStatus = '<span class="status-ok">&#x1F512;</span>';
    } else if (teams > 0) {
        lockAction = `<button class="btn btn-secondary btn-sm" id="lock-event-btn">Lock Event</button>`;
        lockStatus = '<span class="status-ok">&#x1F513;</span>';
    }

    const generatorRow = !locked
        ? `<tr><td colspan="4" class="info-generator-comment">Locking the event will generate the scouting schedule</td></tr>`
        : '';

    wrap.innerHTML = `
        <div class="view-title">${event.name}</div>
        <table class="info-table">
            <tbody>
                ${makeRow('Name', nameHtml)}
                ${makeRow('UUID', event.uuid)}
                ${makeRow('Year', String(event.year))}
                ${makeRow('Blue Alliance Key', event.baEventKey ?? '—', baKeyAction)}
                ${makeRow('Teams', String(teams), '', teams > 0 ? check : cross)}
                ${makeRow('Matches', String(matches), '', matches > 0 ? check : cross)}
                ${makeRow('Scouted Matches', String(scoutedMatches))}
                ${makeRow('Tablets', String(tabletCount), '', tabletCount > 0 ? check : cross)}
                ${makeRow('Locked', locked ? 'Locked' : 'Unlocked', lockAction, lockStatus)}
                ${generatorRow}
            </tbody>
        </table>`;

    container.appendChild(wrap);

    // Wire up editable event name
    const nameEl = wrap.querySelector('#info-event-name') as HTMLElement | null;
    if (nameEl) {
        let debounce: ReturnType<typeof setTimeout>;
        nameEl.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                void window.xeroscout.setEventName(nameEl.innerText.trim());
            }, 500);
        });
    }

    wrap.querySelector('#import-ba-btn')?.addEventListener('click',
        () => void window.xeroscout.executeCommand('import-ba'));

    wrap.querySelector('#lock-event-btn')?.addEventListener('click',
        () => void window.xeroscout.executeCommand('lock-event'));
}

