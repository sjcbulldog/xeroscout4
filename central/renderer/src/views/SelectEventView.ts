interface EventSummary {
    uuid: string;
    name: string;
    year: number;
    locked: boolean;
    baEventKey?: string | null;
    startDate?: string;
    endDate?: string;
}

export function SelectEventView(container: HTMLElement, events: unknown[]) {
    const eventList = (events ?? []) as EventSummary[];

    container.innerHTML = `
        <div class="view-container">
            <div class="view-title">Select Event</div>
            <div class="select-event-toolbar">
                <input type="text" class="form-input" id="select-event-search" placeholder="Search events…" style="max-width:300px">
                <button class="btn btn-primary" id="select-event-create-btn">&#x2795; Create New Event</button>
            </div>
            <table class="data-table select-event-table" id="select-event-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Year</th>
                        <th>BA Code</th>
                        <th>Start Date</th>
                        <th>Status</th>
                        <th>UUID</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="select-event-body"></tbody>
            </table>
            <div id="select-event-empty" class="select-event-empty hidden">No events found.</div>
        </div>`;

    container.querySelector('#select-event-create-btn')?.addEventListener('click',
        () => void window.xeroscout.executeCommand('create-event'));

    const searchInput = container.querySelector('#select-event-search') as HTMLInputElement;
    searchInput?.addEventListener('input', () => renderRows(searchInput.value));

    function renderRows(filter: string) {
        const tbody = container.querySelector('#select-event-body')!;
        const empty = container.querySelector('#select-event-empty')!;
        const lc = filter.toLowerCase();
        const filtered = filter
            ? eventList.filter(e =>
                e.name.toLowerCase().includes(lc) ||
                String(e.year).includes(lc) ||
                (e.baEventKey ?? '').toLowerCase().includes(lc) ||
                e.uuid.toLowerCase().includes(lc))
            : eventList;

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        for (const ev of filtered) {
            const tr = document.createElement('tr');
            tr.className = 'select-event-row';
            tr.innerHTML = `
                <td>${ev.name}</td>
                <td>${ev.year}</td>
                <td>${ev.baEventKey ?? '—'}</td>
                <td>${ev.startDate ?? '—'}</td>
                <td>${ev.locked
                    ? '<span class="status-ok">&#x1F512; Locked</span>'
                    : '<span class="status-pending">&#x1F513; Unlocked</span>'
                }</td>
                <td class="select-event-uuid" title="${ev.uuid}">${ev.uuid}</td>
                <td class="select-event-actions"><button class="btn-icon-danger select-event-delete" title="Delete event">🗑️</button></td>`;
            tr.addEventListener('dblclick', () => {
                void window.xeroscout.executeCommand('select-event', ev.uuid);
            });
            tr.title = 'Double-click to open';
            tr.querySelector('.select-event-delete')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const updated = await window.xeroscout.executeCommand('delete-event', ev.uuid);
                if (Array.isArray(updated)) {
                    SelectEventView(container, updated as unknown[]);
                }
            });
            tbody.appendChild(tr);
        }
    }

    renderRows('');
}
