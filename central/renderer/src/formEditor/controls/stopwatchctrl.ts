import { DataValue, type IPCStopwatchItem, type IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import { EditStopwatchDialog } from '../dialogs/editstopwatchdialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class StopwatchControl extends FormControl {
    private static item_desc_: IPCStopwatchItem = {
        type: 'stopwatch',
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
        datatype: 'real',
        transparent: true,
        holdMode: true,
    };

    private start_stop_button_?: HTMLSpanElement;
    private current_time_?: HTMLSpanElement;
    private currentValue_ = 0;

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, StopwatchControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new StopwatchControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(_editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl || !this.start_stop_button_ || !this.current_time_) return;
        const item = this.item as IPCStopwatchItem;
        this.setPosition(scale, xoff, yoff);
        for (const el of [this.start_stop_button_, this.current_time_]) {
            el.style.backgroundColor = item.transparent ? 'transparent' : item.background;
            el.style.color = item.color;
            el.style.fontFamily = item.fontFamily;
            el.style.fontSize = `${item.fontSize}px`;
            el.style.fontWeight = item.fontWeight;
            el.style.fontStyle = item.fontStyle;
        }
        const isHold = (item.holdMode ?? true);
        this.start_stop_button_.innerText = isHold ? 'Hold' : 'Start';
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'edit');
        this.applyLayout();
        this.current_time_ = document.createElement('span');
        this.setClassList(this.current_time_, 'edit', 'timer');
        this.current_time_.innerText = '00:00.0';
        this.ctrl.appendChild(this.current_time_);
        this.start_stop_button_ = document.createElement('span');
        this.setClassList(this.start_stop_button_, 'edit', 'button');
        this.start_stop_button_.innerText = 'Hold';
        this.ctrl.appendChild(this.start_stop_button_);
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'scout');
        this.applyLayout();
        this.current_time_ = document.createElement('span');
        this.setClassList(this.current_time_, 'scout', 'timer');
        this.current_time_.innerText = '00:00.0';
        this.ctrl.appendChild(this.current_time_);
        this.start_stop_button_ = document.createElement('span');
        this.setClassList(this.start_stop_button_, 'scout', 'button');
        this.start_stop_button_.innerText = 'Hold';
        this.ctrl.appendChild(this.start_stop_button_);
        this.updateFromItem(false, scale, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    private applyLayout(): void {
        if (!this.ctrl) return;
        this.ctrl.style.display = 'flex';
        this.ctrl.style.flexDirection = 'column';
        this.ctrl.style.alignItems = 'center';
        this.ctrl.style.justifyContent = 'center';
        this.ctrl.style.gap = '4px';
        this.ctrl.style.boxSizing = 'border-box';
        this.ctrl.style.padding = '6px';
        this.ctrl.style.border = '1px solid #c8c8c8';
        this.ctrl.style.borderRadius = '8px';
        this.ctrl.style.backgroundColor = '#f2f2f2';
    }

    public createEditDialog(): EditFormControlDialog { return new EditStopwatchDialog(this); }
    public getData(): IPCTypedDataValue | undefined { return DataValue.fromReal(this.currentValue_); }
    public setData(data: IPCTypedDataValue | undefined): void { if (data && DataValue.isNumber(data)) { this.currentValue_ = DataValue.toReal(data); } }
}
