import { DataValue, type IPCTypedDataValue, type IPCUpDownItem } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import { EditUpDownControlDialog } from '../dialogs/editupdowndialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class UpDownControl extends FormControl {
    private static item_desc_: IPCUpDownItem = {
        type: 'updown',
        orientation: 'vertical',
        tag: '',
        x: 0,
        y: 0,
        width: 40,
        height: 200,
        color: 'black',
        background: 'white',
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'normal',
        fontStyle: 'normal',
        datatype: 'integer',
        transparent: true,
        minvalue: 0,
        maxvalue: 20,
    };

    private upbutton_?: HTMLButtonElement;
    private downbutton_?: HTMLButtonElement;
    private count_?: HTMLSpanElement;
    private count_value_ = 0;

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, UpDownControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new UpDownControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(_editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl || !this.upbutton_ || !this.downbutton_ || !this.count_) return;
        const item = this.item as IPCUpDownItem;
        this.setPosition(scale, xoff, yoff);
        this.ctrl.style.display = 'flex';
        this.ctrl.style.flexDirection = item.orientation === 'horizontal' ? 'row' : 'column';
        for (const el of [this.upbutton_, this.downbutton_, this.count_]) {
            el.style.fontFamily = item.fontFamily;
            el.style.fontSize = `${item.fontSize}px`;
            el.style.fontStyle = item.fontStyle;
            el.style.fontWeight = item.fontWeight;
            el.style.color = item.color;
            el.style.backgroundColor = item.transparent ? 'transparent' : item.background;
        }
        this.upbutton_.style.flexGrow = '1';
        this.downbutton_.style.flexGrow = '1';
        this.count_.style.flexGrow = '0';
    }

    private countUp(): void {
        const item = this.item as IPCUpDownItem;
        if (this.count_value_ < item.maxvalue) { this.count_value_++; this.displayCount(); }
    }

    private countDown(): void {
        const item = this.item as IPCUpDownItem;
        if (this.count_value_ > item.minvalue) { this.count_value_--; this.displayCount(); }
    }

    private displayCount(): void { if (this.count_) this.count_.innerText = this.count_value_.toString(); }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        const item = this.item as IPCUpDownItem;
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'edit');
        this.upbutton_ = document.createElement('button');
        this.setClassList(this.upbutton_, 'edit', 'button');
        this.upbutton_.innerHTML = '&#x25B2;';
        this.upbutton_.disabled = true;
        this.count_ = document.createElement('span');
        this.setClassList(this.count_, 'edit', 'count');
        this.count_.innerText = '0';
        this.downbutton_ = document.createElement('button');
        this.setClassList(this.downbutton_, 'edit', 'button');
        this.downbutton_.innerHTML = '&#x25BC;';
        this.downbutton_.disabled = true;
        if (item.orientation === 'horizontal') this.ctrl.append(this.downbutton_, this.count_, this.upbutton_); else this.ctrl.append(this.upbutton_, this.count_, this.downbutton_);
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        const item = this.item as IPCUpDownItem;
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'scout');
        this.upbutton_ = document.createElement('button');
        this.setClassList(this.upbutton_, 'scout', 'button');
        this.upbutton_.innerHTML = '&#x25B2;';
        this.upbutton_.addEventListener('click', this.countUp.bind(this));
        this.count_ = document.createElement('span');
        this.setClassList(this.count_, 'scout', 'count');
        this.count_.innerText = '0';
        this.downbutton_ = document.createElement('button');
        this.setClassList(this.downbutton_, 'scout', 'button');
        this.downbutton_.innerHTML = '&#x25BC;';
        this.downbutton_.addEventListener('click', this.countDown.bind(this));
        if (item.orientation === 'horizontal') this.ctrl.append(this.downbutton_, this.count_, this.upbutton_); else this.ctrl.append(this.upbutton_, this.count_, this.downbutton_);
        this.updateFromItem(false, scale, xoff, yoff);
        this.setData(DataValue.fromInteger(item.minvalue));
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditUpDownControlDialog(this); }
    public getData(): IPCTypedDataValue | undefined { return DataValue.fromInteger(this.count_value_); }
    public setData(data: IPCTypedDataValue | undefined): void { if (data && DataValue.isInteger(data)) { this.count_value_ = DataValue.toInteger(data); this.displayCount(); } }
}
