import type { IPCTextItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditTextDialog extends EditFormControlDialog {
    private data_type_?: HTMLSelectElement;
    private placeholder_?: HTMLInputElement;

    constructor(formctrl: FormControl) { super('Edit Text', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const item = this.formctrl_.item as IPCTextItem;
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.populateTag(div);
        this.data_type_ = document.createElement('select');
        this.data_type_.className = 'xero-popup-form-edit-dialog-select';
        for (const [value, text] of [['string', 'String'], ['integer', 'Integer'], ['real', 'Float']] as const) {
            const option = document.createElement('option');
            option.value = value;
            option.innerText = text;
            this.data_type_.appendChild(option);
        }
        this.data_type_.value = this.formctrl_.item.datatype;
        let label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Data Type';
        label.appendChild(this.data_type_);
        div.appendChild(label);
        this.placeholder_ = document.createElement('input');
        this.placeholder_.type = 'text';
        this.placeholder_.className = 'xero-popup-form-edit-dialog-input';
        this.placeholder_.value = item.placeholder;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Placeholder';
        label.appendChild(this.placeholder_);
        div.appendChild(label);
        this.populateColors(div);
        await this.populateFontSelector(div);
        pdiv.appendChild(div);
    }

    public extractData(): void {
        if (!(this.tag_ && this.data_type_ && this.placeholder_ && this.font_name_ && this.font_size_ && this.text_color_ && this.background_color_ && this.transparent_)) return;
        const item = this.formctrl_.item as IPCTextItem;
        item.tag = this.tag_.value;
        item.datatype = this.data_type_.value as 'string' | 'integer' | 'real';
        item.placeholder = this.placeholder_.value;
        item.fontFamily = this.font_name_.value;
        item.fontSize = parseInt(this.font_size_.value, 10);
        item.fontStyle = this.font_style_?.value ?? item.fontStyle;
        item.fontWeight = this.font_weight_?.value ?? item.fontWeight;
        item.color = this.text_color_.value;
        item.background = this.background_color_.value;
        item.transparent = this.transparent_.checked;
    }

    protected override onInit(): void {
        this.tag_?.focus();
        this.tag_?.select();
    }
}
