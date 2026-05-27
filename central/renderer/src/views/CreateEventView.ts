interface BAEvent {
    key: string;
    name: string;
    city: string | null;
    state_prov: string | null;
    start_date: string;
    end_date: string;
}

export function CreateEventView(container: HTMLElement) {
    const currentYear = new Date().getFullYear();

    container.innerHTML = `
        <div class="view-container ce-outer">
            <div class="view-title">Create New Event</div>

            <div class="ce-layout">
                <!-- Left: BA event browser -->
                <div class="ce-browser">
                    <div class="ce-browser-toolbar">
                        <div class="form-row" style="gap:8px;align-items:center;margin-bottom:0">
                            <label class="form-label" style="white-space:nowrap;margin-bottom:0" for="ce-year">Year</label>
                            <input class="form-input" type="number" id="ce-year" value="${currentYear}"
                                   min="2000" max="2100" style="max-width:100px" />
                            <button class="btn btn-secondary btn-sm" id="ce-reload-btn">Reload</button>
                        </div>
                        <input class="ba-filter-input" type="text" id="ba-filter"
                               placeholder="Filter by name, city, or state…" />
                    </div>
                    <div id="ba-status" class="ba-inline-status hidden"></div>
                    <div id="ba-list" class="ba-inline-list"></div>
                </div>

                <!-- Right: event details form -->
                <div class="ce-details">
                    <div class="ce-details-title">Event Details</div>
                    <div class="ce-details-hint" id="ce-hint">Select an event from the list, or fill in manually.</div>

                    <div class="create-event-form">
                        <div class="form-row">
                            <label class="form-label" for="ce-name">Event Name <span class="required">*</span></label>
                            <input class="form-input" type="text" id="ce-name" placeholder="e.g. FIRST Chesapeake District Event" />
                        </div>
                        <div class="form-row">
                            <label class="form-label" for="ce-bakey">BA Event Code</label>
                            <input class="form-input" type="text" id="ce-bakey" placeholder="e.g. 2025wasno" />
                        </div>
                        <div class="form-row">
                            <label class="form-label" for="ce-start">Start Date</label>
                            <input class="form-input" type="date" id="ce-start" style="max-width:180px" />
                        </div>
                        <div class="form-row">
                            <label class="form-label" for="ce-end">End Date</label>
                            <input class="form-input" type="date" id="ce-end" style="max-width:180px" />
                        </div>

                        <div id="ce-error" class="create-event-error hidden"></div>

                        <div class="form-row" style="margin-top:20px;gap:12px">
                            <button class="btn btn-primary" id="ce-create-btn">Create Event</button>
                            <button class="btn btn-secondary" id="ce-cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    const nameInput  = container.querySelector<HTMLInputElement>('#ce-name')!;
    const yearInput  = container.querySelector<HTMLInputElement>('#ce-year')!;
    const bakeyInput = container.querySelector<HTMLInputElement>('#ce-bakey')!;
    const startInput = container.querySelector<HTMLInputElement>('#ce-start')!;
    const endInput   = container.querySelector<HTMLInputElement>('#ce-end')!;
    const errorEl    = container.querySelector<HTMLElement>('#ce-error')!;
    const filterInput = container.querySelector<HTMLInputElement>('#ba-filter')!;
    const baList      = container.querySelector<HTMLElement>('#ba-list')!;
    const baStatus    = container.querySelector<HTMLElement>('#ba-status')!;
    const hintEl      = container.querySelector<HTMLElement>('#ce-hint')!;

    let allBAEvents: BAEvent[] = [];
    let selectedKey = '';

    // ── Render filtered list ──────────────────────────────────────────────────
    function renderList() {
        const q = filterInput.value.toLowerCase();
        const filtered = q
            ? allBAEvents.filter(e =>
                e.name.toLowerCase().includes(q) ||
                (e.city?.toLowerCase().includes(q) ?? false) ||
                (e.state_prov?.toLowerCase().includes(q) ?? false) ||
                e.key.toLowerCase().includes(q))
            : allBAEvents;

        if (filtered.length === 0) {
            baList.innerHTML = '<div class="ba-inline-empty">No events match.</div>';
            return;
        }

        baList.innerHTML = filtered.map(e => {
            const location = [e.city, e.state_prov].filter(Boolean).join(', ');
            const sel = e.key === selectedKey ? ' ba-event-selected' : '';
            return `<div class="ba-event-row${sel}" data-key="${e.key}"
                         data-name="${e.name.replace(/"/g, '&quot;')}"
                         data-start="${e.start_date}" data-end="${e.end_date}">
                        <div class="ba-event-name">${e.name}</div>
                        <div class="ba-event-meta">${location ? location + ' · ' : ''}${e.start_date} → ${e.end_date}</div>
                    </div>`;
        }).join('');

        baList.querySelectorAll<HTMLElement>('.ba-event-row').forEach(row => {
            row.addEventListener('click', () => {
                selectedKey = row.dataset.key ?? '';
                nameInput.value  = row.dataset.name ?? '';
                bakeyInput.value = selectedKey;
                startInput.value = row.dataset.start ?? '';
                endInput.value   = row.dataset.end ?? '';
                const keyYear = parseInt(selectedKey.slice(0, 4), 10);
                if (keyYear >= 2000 && keyYear <= 2100) yearInput.value = String(keyYear);
                hintEl.textContent = 'Event selected — confirm details and click Create Event.';
                hintEl.classList.add('ce-hint-selected');
                errorEl.classList.add('hidden');
                renderList(); // re-render to update selected highlight
            });
        });
    }

    // ── Load events from TBA ──────────────────────────────────────────────────
    async function loadEvents() {
        const year = parseInt(yearInput.value, 10);
        if (!year || year < 2000 || year > 2100) return;

        allBAEvents = [];
        selectedKey = '';
        baList.innerHTML = '';
        filterInput.value = '';
        baStatus.textContent = `Loading ${year} events from The Blue Alliance…`;
        baStatus.classList.remove('hidden');

        try {
            const result = await (window.xeroscout as unknown as { getBaEvents(year: number): Promise<unknown> }).getBaEvents(year);
            baStatus.classList.add('hidden');

            if (!result || (result as { error?: string }).error) {
                baStatus.textContent = (result as { error?: string })?.error ?? 'Failed to load events.';
                baStatus.classList.remove('hidden');
                return;
            }

            allBAEvents = (result as BAEvent[]).sort((a, b) => a.start_date.localeCompare(b.start_date));
            renderList();
        } catch (err) {
            baStatus.textContent = `Error: ${String(err)}`;
            baStatus.classList.remove('hidden');
        }
    }

    filterInput.addEventListener('input', renderList);
    container.querySelector('#ce-reload-btn')?.addEventListener('click', () => void loadEvents());

    // Reload when year changes (on blur or Enter)
    yearInput.addEventListener('change', () => void loadEvents());
    yearInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') void loadEvents(); });

    // ── Cancel ────────────────────────────────────────────────────────────────
    container.querySelector('#ce-cancel-btn')?.addEventListener('click', () => {
        void window.xeroscout.executeCommand('open-event');
    });

    // ── Create ────────────────────────────────────────────────────────────────
    container.querySelector('#ce-create-btn')?.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const year = parseInt(yearInput.value, 10);

        if (!name) {
            errorEl.textContent = 'Event name is required.';
            errorEl.classList.remove('hidden');
            nameInput.focus();
            return;
        }
        if (!year || year < 2000 || year > 2100) {
            errorEl.textContent = 'Please enter a valid year.';
            errorEl.classList.remove('hidden');
            yearInput.focus();
            return;
        }
        errorEl.classList.add('hidden');

        const details: Record<string, unknown> = { name, year };
        const bakey = bakeyInput.value.trim();
        if (bakey) details['baEventKey'] = bakey;
        if (startInput.value) details['startDate'] = startInput.value;
        if (endInput.value) details['endDate'] = endInput.value;

        try {
            await window.xeroscout.executeCommand('create-event-details', details);
        } catch (err) {
            errorEl.textContent = `Failed to create event: ${String(err)}`;
            errorEl.classList.remove('hidden');
        }
    });

    // Load immediately on open
    void loadEvents();
}
