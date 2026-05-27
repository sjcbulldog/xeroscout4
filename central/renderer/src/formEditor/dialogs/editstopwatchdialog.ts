import type { IPCStopwatchItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditStopwatchDialog extends EditFormControlDialog {
    private hold_mode_?: HTMLInputElement;

    constructor(formctrl: FormControl) { super('Edit Stopwatch', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const item = this.formctrl_.item as IPCStopwatchItem;
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.populateTag(div);
        this.hold_mode_ = document.createElement('input');
        this.hold_mode_.type = 'checkbox';
        this.hold_mode_.checked = item.holdMode ?? true;
        this.hold_mode_.className = 'xero-popup-form-edit-dialog-checkbox';
        const modeLabel = document.createElement('label');
        modeLabel.className = 'xero-popup-form-edit-dialog-label';
        modeLabel.innerText = 'Hold (unchecked = Toggle)';
        modeLabel.appendChild(this.hold_mode_);
        div.appendChild(modeLabel);
        this.populateColors(div);
        await this.populateFontSelector(div);
        pdiv.appendChild(div);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCStopwatchItem;
        item.tag = this.tag_?.value ?? item.tag;
        item.color = this.text_color_?.value ?? item.color;
        item.background = this.background_color_?.value ?? item.background;
        item.fontFamily = this.font_name_?.value ?? item.fontFamily;
        item.fontSize = parseInt(this.font_size_?.value ?? `${item.fontSize}`, 10);
        item.fontWeight = this.font_weight_?.value ?? item.fontWeight;
        item.fontStyle = this.font_style_?.value ?? item.fontStyle;
        item.transparent = this.transparent_?.checked ?? item.transparent;
        item.holdMode = this.hold_mode_?.checked ?? true;
    }

    protected override onInit(): void {
        this.tag_?.focus();
        this.tag_?.select();
    }
}
