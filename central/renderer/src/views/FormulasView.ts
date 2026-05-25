type Formula = { name: string; expression: string; description?: string };

export async function FormulasView(container: HTMLElement) {
    const data = await window.xeroscout.getFormulas() as { formulas: Formula[] } | null;
    let formulas: Formula[] = data?.formulas ?? [];

    const wrap = document.createElement('div');
    wrap.className = 'view-container';

    function render() {
        wrap.innerHTML = `<div class="view-title">Formulas</div>`;

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex; gap:8px; margin-bottom:16px;';
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary';
        addBtn.textContent = '+ New Formula';
        addBtn.addEventListener('click', () => openEditor(null));
        toolbar.appendChild(addBtn);
        wrap.appendChild(toolbar);

        // Table
        const tableWrap = document.createElement('div');
        tableWrap.style.overflowX = 'auto';
        const table = document.createElement('table');
        table.className = 'data-table';
        table.innerHTML = `<thead><tr><th>Name</th><th>Expression</th><th>Description</th><th></th></tr></thead>`;
        const tbody = document.createElement('tbody');
        for (const f of formulas) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${f.name}</td>
                <td><code style="color:#80cbc4">${f.expression}</code></td>
                <td style="color:#90a4ae">${f.description ?? ''}</td>
                <td>
                    <button class="btn btn-secondary" style="margin-right:4px" data-action="edit" data-name="${f.name}">Edit</button>
                    <button class="btn btn-danger" data-action="delete" data-name="${f.name}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        tableWrap.appendChild(table);
        wrap.appendChild(tableWrap);

        table.addEventListener('click', async (e) => {
            const btn = (e.target as HTMLElement).closest('button[data-action]') as HTMLButtonElement | null;
            if (!btn) return;
            const action = btn.dataset.action;
            const name   = btn.dataset.name!;
            if (action === 'edit') openEditor(formulas.find(f => f.name === name) ?? null);
            if (action === 'delete') {
                if (!confirm(`Delete formula "${name}"?`)) return;
                await window.xeroscout.deleteFormula(name);
                formulas = formulas.filter(f => f.name !== name);
                render();
            }
        });
    }

    function openEditor(existing: Formula | null) {
        const dlg = document.createElement('div');
        dlg.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; z-index:500;';
        dlg.innerHTML = `
            <div class="card" style="min-width:480px;">
                <div class="view-title" style="font-size:16px;">${existing ? 'Edit' : 'New'} Formula</div>
                <div class="form-row"><label class="form-label">Name</label><input class="form-input" id="f-name" value="${existing?.name ?? ''}" /></div>
                <div class="form-row"><label class="form-label">Expression</label><input class="form-input" id="f-expr" value="${existing?.expression ?? ''}" /></div>
                <div class="form-row"><label class="form-label">Description</label><input class="form-input" id="f-desc" value="${existing?.description ?? ''}" /></div>
                <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px;">
                    <button class="btn btn-secondary" id="f-cancel">Cancel</button>
                    <button class="btn btn-primary" id="f-save">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(dlg);
        dlg.querySelector('#f-cancel')!.addEventListener('click', () => dlg.remove());
        dlg.querySelector('#f-save')!.addEventListener('click', async () => {
            const name = (dlg.querySelector('#f-name') as HTMLInputElement).value.trim();
            const expr = (dlg.querySelector('#f-expr') as HTMLInputElement).value.trim();
            const desc = (dlg.querySelector('#f-desc') as HTMLInputElement).value.trim();
            if (!name || !expr) return;
            const updated: Formula = { name, expression: expr, description: desc || undefined };
            await window.xeroscout.updateFormula(updated);
            formulas = formulas.filter(f => f.name !== name);
            formulas.push(updated);
            dlg.remove();
            render();
        });
    }

    render();
    container.appendChild(wrap);
}
