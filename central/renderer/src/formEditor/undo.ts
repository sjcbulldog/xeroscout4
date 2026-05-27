import type { IPCFormItem, IPCSection, IPCTablet } from '@xeroscout4/shared';
import { XeroRect } from './xerogeom';
import type { FormControl } from './controls/formctrl';

export type UndoRenameSectionArgs = { page: number; oldname: string; };
export type UndoMoveSectionArgs = { page: number; direction: 'left' | 'right'; };
export type UndoEditArgs = { formctrl: FormControl; olditem: IPCFormItem; };
export type UndoMoveResizeArgs = { formctrl: FormControl; oldbounds: XeroRect; };
export type UndoDeleteControlArgs = { page: number; items: IPCFormItem[]; };
export type UndoDeleteSectionArgs = { section: IPCSection; index: number; };
export type UndoLockContorlArgs = { formctrl: FormControl; oldlocked: boolean; };

export type UndoOperType = 'add' | 'delete' | 'edit' | 'rename' | 'move' | 'lock';
export type UndoObjType = 'section' | 'control' | 'image' | 'tablet';
export type UndoObjDataType =
    FormControl[] |
    UndoDeleteSectionArgs |
    UndoDeleteControlArgs |
    UndoRenameSectionArgs |
    UndoMoveSectionArgs |
    UndoEditArgs[] |
    UndoMoveResizeArgs[] |
    IPCTablet |
    string |
    UndoLockContorlArgs;

export class UndoStackEntry {
    public readonly oper: UndoOperType;
    public readonly obj: UndoObjType;
    public readonly item: UndoObjDataType;

    constructor(oper: UndoOperType, obj: UndoObjType, item: UndoObjDataType) {
        this.oper = oper;
        this.obj = obj;
        this.item = item;
    }
}
