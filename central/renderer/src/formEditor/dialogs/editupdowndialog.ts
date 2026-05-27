import type { IPCUpDownItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditUpDownControlDialog extends EditFormControlDialog {
    private min_value_?: HTMLInputElement;
    private max_value_?: HTMLInputElement;

    constructor(formctrl: FormControl) { super('Edit UpDown', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const item = this.formctrl_.item as IPCUpDownItem;
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.populateTag(div);
        this.populateOrientation(div, item.orientation);
        this.min_value_ = document.createElement('input');
        this.min_value_.type = 'number';
        this.min_value_.className = 'xero-popup-form-edit-dialog-input';
        this.min_value_.value = item.minvalue.toString();
        let label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Minimum Value';
        label.appendChild(this.min_value_);
        div.appendChild(label);
        this.max_value_ = document.createElement('input');
        this.max_value_.type = 'number';
        this.max_value_.className = 'xero-popup-form-edit-dialog-input';
        this.max_value_.value = item.maxvalue.toString();
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Maximum Value';
        label.appendChild(this.max_value_);
        div.appendChild(label);
        this.populateColors(div);
        await this.populateFontSelector(div);
        pdiv.appendChild(div);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCUpDownItem;
        item.tag = this.tag_?.value ?? item.tag;
        item.color = this.text_color_?.value ?? item.color;
        item.background = this.background_color_?.value ?? item.background;
        item.fontFamily = this.font_name_?.value ?? item.fontFamily;
        item.fontSize = parseInt(this.font_size_?.value ?? `${item.fontSize}`, 10);
        item.fontWeight = this.font_weight_?.value ?? item.fontWeight;
        item.fontStyle = this.font_style_?.value ?? item.fontStyle;
        item.transparent = this.transparent_?.checked ?? item.transparent;
        item.orientation = (this.orientation_?.value as 'horizontal' | 'vertical') ?? item.orientation;
        item.minvalue = parseFloat(this.min_value_?.value ?? `${item.minvalue}`);
        item.maxvalue = parseFloat(this.max_value_?.value ?? `${item.maxvalue}`);
    }

    protected override onInit(): void {
        this.tag_?.focus();
        this.tag_?.select();
    }
}
