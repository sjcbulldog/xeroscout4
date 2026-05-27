import type { IPCMultipleChoiceItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditWithItemsDialog } from './editwithitemsdialog';

export class EditChoiceDialog extends EditWithItemsDialog {
    private data_type_?: HTMLSpanElement;
    private radio_size_?: HTMLInputElement;

    constructor(formctrl: FormControl) { super('Edit Multiple Choice', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const item = this.formctrl_.item as IPCMultipleChoiceItem;
        this.createTabs(pdiv);
        this.populateTag(this.tab_page_1!);
        this.radio_size_ = document.createElement('input');
        this.radio_size_.type = 'number';
        this.radio_size_.max = '400';
        this.radio_size_.min = '4';
        this.radio_size_.className = 'xero-popup-form-edit-dialog-input';
        this.radio_size_.value = item.radiosize.toString();
        const label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Radio Button Size';
        label.appendChild(this.radio_size_);
        this.tab_page_1!.appendChild(label);
        this.data_type_ = document.createElement('span');
        this.data_type_.className = 'xero-popup-form-edit-dialog-label';
        this.data_type_.innerText = 'Data Type: ' + item.datatype;
        this.tab_page_2!.appendChild(this.data_type_);
        this.populateOrientation(this.tab_page_1!, item.orientation);
        this.populateColors(this.tab_page_1!);
        await this.populateFontSelector(this.tab_page_1!);
        this.populateChoices(this.tab_page_2!, this.data_type_, item.choices);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCMultipleChoiceItem;
        item.tag = this.tag_?.value ?? item.tag;
        item.radiosize = parseInt(this.radio_size_?.value ?? `${item.radiosize}`, 10);
        item.color = this.text_color_?.value ?? item.color;
        item.background = this.background_color_?.value ?? item.background;
        item.transparent = this.transparent_?.checked ?? item.transparent;
        item.fontFamily = this.font_name_?.value ?? item.fontFamily;
        item.fontSize = parseInt(this.font_size_?.value ?? `${item.fontSize}`, 10);
        item.fontWeight = this.font_weight_?.value ?? item.fontWeight;
        item.fontStyle = this.font_style_?.value ?? item.fontStyle;
        item.orientation = (this.orientation_?.value as 'horizontal' | 'vertical') ?? item.orientation;
        item.datatype = this.extractDataType();
        item.choices = this.extractChoices();
    }

    protected override onInit(): void {
        this.tag_?.focus();
        this.tag_?.select();
    }
}
