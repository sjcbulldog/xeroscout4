import type { IPCImageItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditImageDialog extends EditFormControlDialog {
    private image_name_?: HTMLInputElement;
    private mirror_x_?: HTMLInputElement;
    private mirror_y_?: HTMLInputElement;
    private field_?: HTMLInputElement;

    constructor(formctrl: FormControl, _images: string[]) {
        super('Edit Image', formctrl);
    }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const item = this.formctrl_.item as IPCImageItem;
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.image_name_ = document.createElement('input');
        this.image_name_.type = 'text';
        this.image_name_.className = 'xero-popup-form-edit-dialog-input';
        this.image_name_.value = item.image;
        let label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Image Name';
        label.appendChild(this.image_name_);
        div.appendChild(label);
        this.mirror_x_ = document.createElement('input');
        this.mirror_x_.type = 'checkbox';
        this.mirror_x_.checked = item.mirrorx;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Mirror X';
        label.appendChild(this.mirror_x_);
        div.appendChild(label);
        this.mirror_y_ = document.createElement('input');
        this.mirror_y_.type = 'checkbox';
        this.mirror_y_.checked = item.mirrory;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Mirror Y';
        label.appendChild(this.mirror_y_);
        div.appendChild(label);
        this.field_ = document.createElement('input');
        this.field_.type = 'checkbox';
        this.field_.checked = item.field;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Field';
        label.appendChild(this.field_);
        div.appendChild(label);
        pdiv.appendChild(div);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCImageItem;
        item.image = this.image_name_?.value ?? item.image;
        item.mirrorx = this.mirror_x_?.checked ?? item.mirrorx;
        item.mirrory = this.mirror_y_?.checked ?? item.mirrory;
        item.field = this.field_?.checked ?? item.field;
    }
}
