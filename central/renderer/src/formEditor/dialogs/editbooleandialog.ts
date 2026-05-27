import type { IPCBooleanItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditBooleanDialog extends EditFormControlDialog {
    private accent_color_?: HTMLInputElement;

    constructor(formctrl: FormControl) { super('Edit Boolean', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.populateTag(div);
        this.populateColors(div);
        this.accent_color_ = document.createElement('input');
        this.accent_color_.className = 'xero-popup-form-edit-dialog-color';
        this.accent_color_.type = 'color';
        this.accent_color_.value = EditFormControlDialog.colorNameToHex((this.formctrl_.item as IPCBooleanItem).accent);
        const label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Accent Color';
        label.appendChild(this.accent_color_);
        div.appendChild(label);
        pdiv.appendChild(div);
    }

    extractData(): void {
        const item = this.formctrl_.item as IPCBooleanItem;
        item.tag = this.tag_?.value || '';
        item.color = this.text_color_?.value || 'black';
        item.background = this.background_color_?.value || 'white';
        item.transparent = this.transparent_?.checked ?? item.transparent;
        item.accent = this.accent_color_?.value || 'lightgreen';
    }

    protected override onInit(): void {
        this.tag_?.focus();
        this.tag_?.select();
    }
}
