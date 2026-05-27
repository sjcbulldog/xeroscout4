interface TabletRow { name: string; purpose: 'none' | 'team' | 'match'; }

// Module-level drag state: list of names being dragged
let dragNames: string[] = [];

export async function TabletAssignmentView(container: HTMLElement) {
    const info = await window.xeroscout.getInfoData() as {
        tablets: Array<{ name: string; purpose: string }>;
    } | null;

    const existing: TabletRow[] = (info?.tablets ?? []).map(t => ({
        name: t.name,
        purpose: (t.purpose as TabletRow['purpose']) || 'none',
    }));

    // Normalise: tablets with no/unknown purpose go to pool
    let tablets: TabletRow[] = existing.length > 0
        ? existing.map(t => ({ ...t, purpose: (['team','match'].includes(t.purpose) ? t.purpose : 'none') as TabletRow['purpose'] }))
        : [];

    // Track which tablet names are currently selected
    const selectedNames = new Set<string>();

    // Anchor for shift-click range selection (last non-shift click)
    let lastClickedName: string | null = null;

    // ── Auto-generate next default name ─────────────────────────────────────
    function nextName(): string {
        let n = 1;
        while (tablets.find(t => t.name === `tablet-${n}`)) n++;
        return `tablet-${n}`;
    }

    // ── Validation ───────────────────────────────────────────────────────────
    function validate(): string {
        const team  = tablets.filter(t => t.purpose === 'team').length;
        const match = tablets.filter(t => t.purpose === 'match').length;
        const msgs: string[] = [];
        if (team < 1)  msgs.push('At least 1 tablet must be assigned to Team Scouting.');
        if (match < 6) msgs.push(`At least 6 tablets must be assigned to Match Scouting (currently ${match}).`);
        return msgs.join('  ');
    }

    // ── Render a single tablet chip ─────────────────────────────────────────
    function makeChip(t: TabletRow): HTMLElement {
        const chip = document.createElement('div');
        chip.className = 'ta-chip';
        if (selectedNames.has(t.name)) chip.classList.add('ta-chip-selected');
        chip.draggable = true;
        chip.textContent = t.name;
        chip.dataset['name'] = t.name;

        // Click to select / deselect (Ctrl/Meta adds to selection, Shift selects range)
        chip.addEventListener('click', (e) => {
            const me = e as MouseEvent;
            const ctrl = me.ctrlKey || me.metaKey;
            if (me.shiftKey && lastClickedName) {
                // Range select within the same section
                const section = tablets.filter(x => x.purpose === t.purpose);
                const anchorIdx = section.findIndex(x => x.name === lastClickedName);
                const clickIdx  = section.findIndex(x => x.name === t.name);
                if (anchorIdx !== -1 && clickIdx !== -1) {
                    const lo = Math.min(anchorIdx, clickIdx);
                    const hi = Math.max(anchorIdx, clickIdx);
                    for (let i = lo; i <= hi; i++) selectedNames.add(section[i].name);
                } else {
                    selectedNames.add(t.name);
                }
                // Don't update lastClickedName on shift-click (anchor stays)
            } else if (ctrl) {
                if (selectedNames.has(t.name)) selectedNames.delete(t.name);
                else selectedNames.add(t.name);
                lastClickedName = t.name;
            } else {
                const alreadySoleSelected = selectedNames.size === 1 && selectedNames.has(t.name);
                selectedNames.clear();
                if (!alreadySoleSelected) selectedNames.add(t.name);
                lastClickedName = t.name;
            }
            renderLists();
        });

        chip.addEventListener('dragstart', (e) => {
            // If dragging an unselected chip, make it the only selection
            if (!selectedNames.has(t.name)) {
                selectedNames.clear();
                selectedNames.add(t.name);
            }
            dragNames = [...selectedNames];
            chip.classList.add('ta-chip-dragging');
            e.dataTransfer?.setData('text/plain', JSON.stringify(dragNames));
        });
        chip.addEventListener('dragend', () => {
            chip.classList.remove('ta-chip-dragging');
        });

        // Double-click to rename (only if single chip selected or none)
        chip.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.className = 'ta-chip-input';
            input.value = t.name;
            chip.replaceWith(input);
            input.focus();
            input.select();

            function commit() {
                const newName = input.value.trim();
                if (!newName) { input.replaceWith(chip); return; }
                if (newName !== t.name && tablets.find(x => x.name === newName)) {
                    input.classList.add('ta-chip-input-error');
                    input.title = 'Duplicate name';
                    return;
                }
                if (selectedNames.has(t.name)) {
                    selectedNames.delete(t.name);
                    selectedNames.add(newName);
                }
                t.name = newName;
                chip.textContent = newName;
                chip.dataset['name'] = newName;
                dragNames = [];
                input.replaceWith(chip);
                updateUI();
            }
            input.addEventListener('blur', commit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); commit(); }
                if (e.key === 'Escape') { input.replaceWith(chip); }
            });
        });

        return chip;
    }

    // ── Full re-render of chip lists ─────────────────────────────────────────
    function renderLists() {
        for (const purpose of ['none', 'team', 'match'] as const) {
            const holder = container.querySelector<HTMLElement>(`.ta-holder[data-purpose="${purpose}"]`)!;
            holder.innerHTML = '';
            const group = tablets.filter(t => t.purpose === purpose);
            if (group.length === 0) {
                const ph = document.createElement('div');
                ph.className = 'ta-placeholder';
                ph.textContent = purpose === 'none' ? 'Drag here to unassign'
                    : purpose === 'team' ? 'Drag team scouting tablets here'
                    : 'Drag match scouting tablets here';
                holder.appendChild(ph);
            } else {
                group.forEach(t => holder.appendChild(makeChip(t)));
            }
        }
    }

    // ── Update validation text + save button state ───────────────────────────
    function updateUI() {
        const msg = validate();
        const validEl  = container.querySelector<HTMLElement>('#ta-valid-msg')!;
        const saveBtn  = container.querySelector<HTMLButtonElement>('#ta-save-btn')!;
        validEl.textContent = msg;
        validEl.classList.toggle('hidden', msg === '');
        saveBtn.disabled = msg !== '';
        renderLists();
    }

    // ── Wire up a drop zone ───────────────────────────────────────────────────
    function wireDropZone(el: HTMLElement, purpose: TabletRow['purpose']) {
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.classList.add('ta-holder-over');
        });
        el.addEventListener('dragleave', (e) => {
            // Only remove highlight when leaving the holder itself (not a child)
            if (!el.contains(e.relatedTarget as Node)) {
                el.classList.remove('ta-holder-over');
            }
        });
        el.addEventListener('drop', (e) => {
            e.preventDefault();
            el.classList.remove('ta-holder-over');
            let names: string[] = dragNames;
            if (names.length === 0) {
                try { names = JSON.parse(e.dataTransfer?.getData('text/plain') ?? '[]'); }
                catch { names = []; }
            }
            for (const name of names) {
                const tab = tablets.find(t => t.name === name);
                if (tab) tab.purpose = purpose;
            }
            dragNames = [];
            updateUI();
        });
    }

    // ── Build the HTML scaffold ──────────────────────────────────────────────
    container.innerHTML = `
        <div class="view-container ta-outer">
            <div class="view-title">Assign Tablets</div>

            <div class="setup-toolbar">
                <button class="btn btn-secondary btn-sm" id="ta-add-btn">&#x2795; Add Tablet</button>
                <button class="btn btn-secondary btn-sm" id="ta-auto-btn">Auto Assign (7)</button>
                <button class="btn btn-secondary btn-sm" id="ta-unassign-btn">Unassign All</button>
                <button class="btn btn-danger btn-sm" id="ta-remove-all-btn">Remove All</button>
            </div>

            <div class="ta-layout">
                <div class="ta-column">
                    <div class="ta-col-header">Tablet Pool</div>
                    <div class="ta-col-hint">Click to select · Ctrl+click to multi-select · Shift+click for range · Drag to assign</div>
                    <div class="ta-holder" data-purpose="none"></div>
                </div>
                <div class="ta-column">
                    <div class="ta-col-header">Team Scouting</div>
                    <div class="ta-col-hint">Requires ≥ 1 tablet</div>
                    <div class="ta-holder" data-purpose="team"></div>
                </div>
                <div class="ta-column">
                    <div class="ta-col-header">Match Scouting</div>
                    <div class="ta-col-hint">Requires ≥ 6 tablets</div>
                    <div class="ta-holder" data-purpose="match"></div>
                </div>
            </div>

            <div id="ta-valid-msg" class="ta-validation-msg hidden"></div>

            <div class="form-row" style="margin-top:16px;gap:12px">
                <button class="btn btn-primary" id="ta-save-btn" disabled>Save</button>
                <button class="btn btn-secondary" id="ta-cancel-btn">Cancel</button>
            </div>
        </div>`;

    // Clicking the background of a holder clears selection
    for (const purpose of ['none', 'team', 'match'] as const) {
        const holder = container.querySelector<HTMLElement>(`.ta-holder[data-purpose="${purpose}"]`)!;
        holder.addEventListener('click', (e) => {
            if (e.target === holder) { selectedNames.clear(); lastClickedName = null; renderLists(); }
        });
        wireDropZone(holder, purpose);
    }

    // Add Tablet
    container.querySelector('#ta-add-btn')?.addEventListener('click', () => {
        tablets.push({ name: nextName(), purpose: 'none' });
        updateUI();
    });

    // Auto Assign: 6 match + 1 team
    container.querySelector('#ta-auto-btn')?.addEventListener('click', () => {
        tablets = [];
        selectedNames.clear();
        for (let i = 1; i <= 7; i++) {
            tablets.push({ name: `tablet-${i}`, purpose: i <= 6 ? 'match' : 'team' });
        }
        updateUI();
    });

    // Unassign all → move everyone to pool
    container.querySelector('#ta-unassign-btn')?.addEventListener('click', () => {
        tablets.forEach(t => { t.purpose = 'none'; });
        selectedNames.clear();
        lastClickedName = null;
        updateUI();
    });

    // Remove all
    container.querySelector('#ta-remove-all-btn')?.addEventListener('click', () => {
        tablets = [];
        selectedNames.clear();
        lastClickedName = null;
        updateUI();
    });

    // Save — only persist assigned (non-pool) tablets
    container.querySelector('#ta-save-btn')?.addEventListener('click', async () => {
        const assigned = tablets
            .filter(t => t.purpose === 'team' || t.purpose === 'match')
            .map(t => ({ name: t.name, purpose: t.purpose }));
        await window.xeroscout.executeCommand('save-tablets', assigned);
    });

    // Cancel
    container.querySelector('#ta-cancel-btn')?.addEventListener('click', () => {
        void window.xeroscout.executeCommand('show-view', 'event-setup');
    });

    updateUI();
}
