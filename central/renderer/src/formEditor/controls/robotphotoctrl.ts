import type { IPCRobotPhotoItem, IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import { EditRobotPhotoDialog } from '../dialogs/editrobotphotodialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class RobotPhotoControl extends FormControl {
    private static item_desc_: IPCRobotPhotoItem = {
        type: 'robotphoto',
        tag: '',
        x: 0,
        y: 0,
        width: 280,
        height: 220,
        color: 'black',
        background: '#f3f4f6',
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'normal',
        fontStyle: 'normal',
        datatype: 'string',
        transparent: false,
        mode: 'capture',
    };

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, RobotPhotoControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new RobotPhotoControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(_editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl) return;
        const item = this.item as IPCRobotPhotoItem;
        this.setPosition(scale, xoff, yoff);
        this.ctrl.textContent = item.mode === 'display' ? 'Robot Photo (display)' : 'Robot Photo (capture)';
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'edit');
        this.ctrl.style.display = 'flex';
        this.ctrl.style.alignItems = 'center';
        this.ctrl.style.justifyContent = 'center';
        this.ctrl.style.border = '2px dashed #94a3b8';
        this.ctrl.style.borderRadius = '12px';
        this.ctrl.style.background = '#f8fafc';
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'scout');
        this.ctrl.style.display = 'flex';
        this.ctrl.style.alignItems = 'center';
        this.ctrl.style.justifyContent = 'center';
        this.ctrl.style.border = '2px dashed #94a3b8';
        this.ctrl.style.borderRadius = '12px';
        this.ctrl.style.background = '#f8fafc';
        this.updateFromItem(false, scale, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditRobotPhotoDialog(this); }
    public getData(): IPCTypedDataValue | undefined { return undefined; }
    public setData(_data: IPCTypedDataValue | undefined): void {}
}
