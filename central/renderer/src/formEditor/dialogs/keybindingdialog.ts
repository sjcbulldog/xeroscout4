import { XeroDialog } from '../widgets';
import type { Keybinding } from '../keybindings';

export class KeybindingDialog extends XeroDialog {
    private bindings_: Keybinding[];

    constructor(bindings: Keybinding[]) {
        super('Keybindings');
        this.bindings_ = bindings;
    }

    protected override async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const table = document.createElement('table');
        table.className = 'xero-form-keybinding-table';
        const header = document.createElement('tr');
        header.className = 'xero-form-keybinding-table-header-row';
        for (const title of ['Keybinding', 'Description']) {
            const th = document.createElement('th');
            th.className = 'xero-form-keybinding-table-header-cell';
            th.innerText = title;
            header.appendChild(th);
        }
        table.appendChild(header);
        for (const binding of this.bindings_) {
            const tr = document.createElement('tr');
            tr.className = 'xero-form-keybinding-table-data-row';
            const tdKey = document.createElement('td');
            tdKey.className = 'xero-form-keybinding-table-data-cell';
            tdKey.innerText = binding.bindingAsText;
            const tdDesc = document.createElement('td');
            tdDesc.className = 'xero-form-keybinding-table-data-cell';
            tdDesc.innerText = binding.desc;
            tr.append(tdKey, tdDesc);
            table.appendChild(tr);
        }
        pdiv.appendChild(table);
    }
}
