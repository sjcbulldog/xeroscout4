import { DataValue, type IPCBooleanItem, type IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import { EditBooleanDialog } from '../dialogs/editbooleandialog';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class BooleanControl extends FormControl {
    private static item_desc_: IPCBooleanItem = {
        type: 'boolean',
        tag: '',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        color: 'black',
        background: 'white',
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'normal',
        fontStyle: 'normal',
        datatype: 'boolean',
        transparent: true,
        accent: 'lightgreen',
    };

    private input_?: HTMLInputElement;

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, BooleanControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new BooleanControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(_editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl) return;
        const item = this.item as IPCBooleanItem;
        const ctrl = this.ctrl as HTMLDivElement;
        this.setPosition(scale, xoff, yoff);
        ctrl.style.fontFamily = item.fontFamily;
        ctrl.style.fontSize = `${item.fontSize}px`;
        ctrl.style.fontWeight = item.fontWeight;
        ctrl.style.fontStyle = item.fontStyle;
        ctrl.style.color = item.color;
        ctrl.style.backgroundColor = item.transparent ? 'transparent' : item.background;
        if (this.input_) this.input_.style.accentColor = item.accent;
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'edit');
        this.input_ = document.createElement('input');
        this.setClassList(this.input_, 'edit', 'checkbox');
        this.input_.type = 'checkbox';
        this.input_.disabled = true;
        this.ctrl.appendChild(this.input_);
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'scout');
        this.input_ = document.createElement('input');
        this.setClassList(this.input_, 'scout', 'checkbox');
        this.input_.type = 'checkbox';
        this.ctrl.appendChild(this.input_);
        this.updateFromItem(false, scale, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditBooleanDialog(this); }
    public getData(): IPCTypedDataValue { return DataValue.fromBoolean(this.input_?.checked ?? false); }
    public setData(data: IPCTypedDataValue | undefined): void { if (this.input_ && data && DataValue.isBoolean(data)) this.input_.checked = DataValue.toBoolean(data); }
}
