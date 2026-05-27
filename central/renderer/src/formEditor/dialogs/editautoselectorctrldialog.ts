import type { IPCAutoSelectorItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditAutoSelectorDialog extends EditFormControlDialog {
    private image_name_?: HTMLInputElement;
    private show_source_tag_?: HTMLInputElement;

    constructor(formctrl: FormControl) { super('Edit Auto Selector', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const item = this.formctrl_.item as IPCAutoSelectorItem;
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';

        this.populateTag(div);
        this.populateColors(div);

        this.image_name_ = document.createElement('input');
        this.image_name_.type = 'text';
        this.image_name_.className = 'xero-popup-form-edit-dialog-input';
        this.image_name_.value = item.fieldImage ?? '';
        let label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Field Image';
        label.appendChild(this.image_name_);
        div.appendChild(label);

        this.show_source_tag_ = document.createElement('input');
        this.show_source_tag_.type = 'checkbox';
        this.show_source_tag_.className = 'xero-popup-form-edit-dialog-checkbox';
        this.show_source_tag_.checked = item.showSourceTagInTab !== false;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Show Source Tag In Tabs';
        label.appendChild(this.show_source_tag_);
        div.appendChild(label);

        pdiv.appendChild(div);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCAutoSelectorItem;
        item.tag = this.tag_?.value ?? item.tag;
        item.color = this.text_color_?.value ?? item.color;
        item.background = this.background_color_?.value ?? item.background;
        item.transparent = this.transparent_?.checked ?? item.transparent;
        item.fieldImage = (this.image_name_?.value ?? '').replace(/\.png$/i, '');
        item.showSourceTagInTab = this.show_source_tag_?.checked !== false;
    }

    protected override onInit(): void {
        this.tag_?.focus();
        this.tag_?.select();
    }
}
