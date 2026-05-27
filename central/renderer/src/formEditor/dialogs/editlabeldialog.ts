import type { IPCLabelItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditLabelDialog extends EditFormControlDialog {
    private text_string_?: HTMLInputElement;

    constructor(formctrl: FormControl) { super('Edit Label', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const item = this.formctrl_.item as IPCLabelItem;
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.text_string_ = document.createElement('input');
        this.text_string_.type = 'text';
        this.text_string_.className = 'xero-popup-form-edit-dialog-input';
        this.text_string_.value = item.text;
        const label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Text';
        label.appendChild(this.text_string_);
        div.appendChild(label);
        this.populateColors(div);
        await this.populateFontSelector(div);
        pdiv.appendChild(div);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCLabelItem;
        item.text = this.text_string_?.value ?? item.text;
        item.fontFamily = this.font_name_?.value ?? item.fontFamily;
        item.fontSize = parseInt(this.font_size_?.value ?? `${item.fontSize}`, 10);
        item.fontStyle = this.font_style_?.value ?? item.fontStyle;
        item.fontWeight = this.font_weight_?.value ?? item.fontWeight;
        item.color = this.text_color_?.value ?? item.color;
        item.background = this.background_color_?.value ?? item.background;
        item.transparent = this.transparent_?.checked ?? item.transparent;
    }

    protected override onInit(): void {
        this.text_string_?.focus();
        this.text_string_?.select();
    }
}
