import type { IPCImageItem, IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import { EditImageDialog } from '../dialogs/editimagectrldialog';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class ImageControl extends FormControl {
    private static item_desc_: IPCImageItem = {
        type: 'image',
        tag: '',
        x: 0,
        y: 0,
        width: 160,
        height: 120,
        color: 'black',
        background: '#dddddd',
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'normal',
        fontStyle: 'normal',
        datatype: 'null',
        transparent: false,
        image: '',
        field: false,
        mirrorx: false,
        mirrory: false,
    };

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, ImageControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new ImageControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(_editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl) return;
        const item = this.item as IPCImageItem;
        this.setPosition(scale, xoff, yoff);
        this.ctrl.textContent = item.image ? `Image: ${item.image}` : 'Image control (stub)';
        this.ctrl.style.display = 'flex';
        this.ctrl.style.alignItems = 'center';
        this.ctrl.style.justifyContent = 'center';
        this.ctrl.style.border = '1px dashed #666';
        this.ctrl.style.backgroundColor = item.transparent ? 'transparent' : item.background;
        this.ctrl.style.color = item.color;
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'edit');
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'scout');
        this.updateFromItem(false, scale, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditImageDialog(this, []); }
    public getData(): IPCTypedDataValue | undefined { return undefined; }
    public setData(_data: IPCTypedDataValue | undefined): void {}
}
