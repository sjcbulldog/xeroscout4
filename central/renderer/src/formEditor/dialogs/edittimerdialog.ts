import type { IPCTimerItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditTimerDialog extends EditFormControlDialog {
    constructor(formctrl: FormControl) { super('Edit Timer', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.populateTag(div);
        this.populateColors(div);
        await this.populateFontSelector(div);
        pdiv.appendChild(div);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCTimerItem;
        item.tag = this.tag_?.value ?? item.tag;
        item.color = this.text_color_?.value ?? item.color;
        item.background = this.background_color_?.value ?? item.background;
        item.fontFamily = this.font_name_?.value ?? item.fontFamily;
        item.fontSize = parseInt(this.font_size_?.value ?? `${item.fontSize}`, 10);
        item.fontWeight = this.font_weight_?.value ?? item.fontWeight;
        item.fontStyle = this.font_style_?.value ?? item.fontStyle;
        item.transparent = this.transparent_?.checked ?? item.transparent;
    }

    protected override onInit(): void {
        this.tag_?.focus();
        this.tag_?.select();
    }
}
