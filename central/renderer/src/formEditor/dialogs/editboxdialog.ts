import type { IPCBoxItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditBoxDialog extends EditFormControlDialog {
    private border_style_?: HTMLSelectElement;
    private border_width_?: HTMLInputElement;
    private border_radius_?: HTMLInputElement;
    private shadow_?: HTMLInputElement;

    constructor(formctrl: FormControl) { super('Edit Box', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const item = this.formctrl_.item as IPCBoxItem;
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.border_width_ = document.createElement('input');
        this.border_width_.type = 'number';
        this.border_width_.className = 'xero-popup-form-edit-dialog-input';
        this.border_width_.value = `${item.borderWidth}`;
        let label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Border Width';
        label.appendChild(this.border_width_);
        div.appendChild(label);
        this.border_style_ = document.createElement('select');
        this.border_style_.className = 'xero-popup-form-edit-dialog-select';
        for (const value of ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset']) {
            const option = document.createElement('option');
            option.value = value;
            option.innerText = value.charAt(0).toUpperCase() + value.slice(1);
            this.border_style_.appendChild(option);
        }
        this.border_style_.value = item.borderStyle;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Border Style';
        label.appendChild(this.border_style_);
        div.appendChild(label);
        this.border_radius_ = document.createElement('input');
        this.border_radius_.type = 'number';
        this.border_radius_.className = 'xero-popup-form-edit-dialog-input';
        this.border_radius_.value = `${item.borderRadius}`;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Border Radius';
        label.appendChild(this.border_radius_);
        div.appendChild(label);
        this.shadow_ = document.createElement('input');
        this.shadow_.type = 'checkbox';
        this.shadow_.checked = item.borderShadow;
        this.shadow_.className = 'xero-popup-form-edit-dialog-checkbox';
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Shadow';
        label.appendChild(this.shadow_);
        div.appendChild(label);
        this.populateForegroundColor(div);
        pdiv.appendChild(div);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCBoxItem;
        item.color = this.text_color_?.value ?? item.color;
        item.borderRadius = parseInt(this.border_radius_?.value ?? `${item.borderRadius}`, 10);
        item.borderWidth = parseInt(this.border_width_?.value ?? `${item.borderWidth}`, 10);
        item.borderStyle = this.border_style_?.value ?? item.borderStyle;
        item.borderShadow = this.shadow_?.checked ?? item.borderShadow;
    }
}
