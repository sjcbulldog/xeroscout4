import { DataValue, type IPCTimerItem, type IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import { EditTimerDialog } from '../dialogs/edittimerdialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class TimerControl extends FormControl {
    private static item_desc_: IPCTimerItem = {
        type: 'timer',
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
        datatype: 'integer',
        transparent: true,
    };

    private start_stop_button_?: HTMLButtonElement;
    private current_time_?: HTMLSpanElement;
    private currentValue_ = 0;

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, TimerControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new TimerControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(_editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl || !this.start_stop_button_ || !this.current_time_) return;
        const item = this.item as IPCTimerItem;
        this.setPosition(scale, xoff, yoff);
        for (const el of [this.start_stop_button_, this.current_time_]) {
            el.style.backgroundColor = item.transparent ? 'transparent' : item.background;
            el.style.color = item.color;
            el.style.fontFamily = item.fontFamily;
            el.style.fontSize = `${item.fontSize}px`;
            el.style.fontWeight = item.fontWeight;
            el.style.fontStyle = item.fontStyle;
        }
    }

    private displayTimer(): void {
        if (!this.current_time_) return;
        const minutes = Math.floor(this.currentValue_ / 60);
        const seconds = Math.floor(this.currentValue_ % 60);
        const tenths = Math.floor((this.currentValue_ - Math.floor(this.currentValue_)) * 10);
        this.current_time_.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'edit');
        this.current_time_ = document.createElement('span');
        this.setClassList(this.current_time_, 'edit', 'timer');
        this.current_time_.innerText = '00:00.0';
        this.ctrl.appendChild(this.current_time_);
        this.start_stop_button_ = document.createElement('button');
        this.setClassList(this.start_stop_button_, 'edit', 'button');
        this.start_stop_button_.innerText = 'Start';
        this.start_stop_button_.disabled = true;
        this.ctrl.appendChild(this.start_stop_button_);
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'scout');
        this.current_time_ = document.createElement('span');
        this.setClassList(this.current_time_, 'scout', 'timer');
        this.current_time_.innerText = '00:00.0';
        this.ctrl.appendChild(this.current_time_);
        this.start_stop_button_ = document.createElement('button');
        this.setClassList(this.start_stop_button_, 'scout', 'button');
        this.start_stop_button_.innerText = 'Start';
        this.start_stop_button_.disabled = true;
        this.ctrl.appendChild(this.start_stop_button_);
        this.updateFromItem(false, scale, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditTimerDialog(this); }
    public getData(): IPCTypedDataValue | undefined { return DataValue.fromReal(this.currentValue_); }
    public setData(data: IPCTypedDataValue | undefined): void { if (data && DataValue.isNumber(data)) { this.currentValue_ = DataValue.toReal(data); this.displayTimer(); } }
}
