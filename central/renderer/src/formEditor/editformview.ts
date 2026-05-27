import type { IPCForm, IPCFormControlType, IPCFormItem, IPCSection, IPCTablet } from '@xeroscout4/shared';
import { XeroPoint, XeroRect, XeroSize } from './xerogeom';
import { FormObject } from './formobj';
import { XeroFormEditSectionPage } from './editpage';
import { KeybindingManager } from './keybindings';
import { KeybindingDialog } from './dialogs/keybindingdialog';
import { EditSectionNameDialog } from './dialogs/editsectionnamedialog';
import { PopupMenu, PopupMenuItem, TabWidget, XeroDialog } from './widgets';
import { UndoStackEntry, type UndoDeleteControlArgs, type UndoDeleteSectionArgs, type UndoEditArgs, type UndoLockContorlArgs, type UndoMoveResizeArgs, type UndoMoveSectionArgs, type UndoRenameSectionArgs } from './undo';
import { FormControl, type EditorContext } from './controls/formctrl';
import { LabelControl } from './controls/labelctrl';
import { BoxControl } from './controls/boxctrl';
import { TextControl } from './controls/textctrl';
import { TextAreaControl } from './controls/textareactrl';
import { UpDownControl } from './controls/updownctrl';
import { BooleanControl } from './controls/booleanctrl';
import { MultipleChoiceControl } from './controls/choicectrl';
import { SelectControl } from './controls/selectctrl';
import { TimerControl } from './controls/timerctrl';
import { ImageControl } from './controls/imagectrl';
import { StopwatchControl } from './controls/stopwatchctrl';
import { RobotPhotoControl } from './controls/robotphotoctrl';
import { RobotViewerControl } from './controls/robotviewerctrl';
import { AutoPlanControl } from './controls/autoplanctrl';
import { AutoSelectorControl } from './controls/autoselectorctrl';

type DragMode = 'none' | 'move' | 'resize-left' | 'resize-right' | 'resize-top' | 'resize-bottom' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'area';
type SupportedControlType = 'label' | 'box' | 'text' | 'textarea' | 'updown' | 'boolean' | 'choice' | 'select' | 'timer' | 'image' | 'stopwatch' | 'robotphoto' | 'robotviewer' | 'autoplan' | 'autoselector';

interface DragContext {
    pageIndex: number;
    mode: DragMode;
    start: XeroPoint;
    originals: Map<FormControl, XeroRect>;
    changed: boolean;
}

const TABLETS: IPCTablet[] = [
    { name: 'iPad 10.2"', size: { width: 1080, height: 810 } },
    { name: 'iPad Air 10.9"', size: { width: 1180, height: 820 } },
    { name: 'iPad Pro 11"', size: { width: 1194, height: 834 } },
    { name: 'iPad Pro 12.9"', size: { width: 1366, height: 1024 } },
    { name: 'Surface Go', size: { width: 1089, height: 727 } },
    { name: 'Dell Windows Tablet', size: { width: 1292, height: 777 } },
];
const CUSTOM_TABLET_NAME = 'Custom Size';

function cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

export class FormEditorView implements EditorContext {
    public readonly container: HTMLElement;
    private readonly purpose: 'team' | 'match';
    private readonly root: HTMLDivElement;
    private readonly tabHost: HTMLDivElement;
    private readonly tabletSelect: HTMLSelectElement;
    private readonly widthInput: HTMLInputElement;
    private readonly heightInput: HTMLInputElement;
    private readonly statusEl: HTMLDivElement;
    private readonly keybindings = new KeybindingManager();

    private form_: FormObject;
    private tabWidget?: TabWidget;
    private pages: XeroFormEditSectionPage[] = [];
    private selectedControls: FormControl[] = [];
    private clipboardItems: IPCFormItem[] = [];
    private undoStack: UndoStackEntry[] = [];
    private popupMenu?: PopupMenu;
    private activeDialog?: XeroDialog;
    private drag?: DragContext;
    private areaSelection?: { start: XeroPoint; div: HTMLDivElement; pageIndex: number; };
    private currentCursor = new XeroPoint(24, 24);
    private currentPageIndex = 0;
    private destroyed = false;

    private readonly onDocumentMouseMoveBound: (event: MouseEvent) => void;
    private readonly onDocumentMouseUpBound: (event: MouseEvent) => void;
    private readonly onDocumentKeyDownBound: (event: KeyboardEvent) => void;

    constructor(container: HTMLElement, purpose: 'team' | 'match', initialForm: IPCForm | null) {
        this.container = container;
        this.purpose = purpose;
        this.form_ = new FormObject(initialForm ? cloneValue(initialForm) : FormEditorView.createDefaultForm(purpose));
        if (this.form_.sections.length === 0) this.form_.createNewSection();

        this.root = document.createElement('div');
        this.root.className = 'form-editor-root';
        this.root.tabIndex = 0;

        const header = document.createElement('div');
        header.className = 'form-editor-header';
        const title = document.createElement('div');
        title.className = 'form-editor-header-title';
        title.textContent = `Edit ${purpose === 'team' ? 'Team' : 'Match'} Scouting Form`;
        const actions = document.createElement('div');
        actions.className = 'form-editor-header-actions';

        // Hidden file input for JSON import
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', () => void this.importFormFromFile(fileInput));
        this.root.appendChild(fileInput);

        actions.append(
            this.createButton('Import JSON…', 'btn btn-secondary', () => fileInput.click()),
            this.createButton('Save', 'btn btn-primary', () => void this.save()),
            this.createButton('Back', 'btn btn-secondary', () => void this.cancel()),
        );
        header.append(title, actions);

        const toolbar = document.createElement('div');
        toolbar.className = 'form-editor-toolbar';
        toolbar.append(
            this.createButton('Add Section', 'btn btn-secondary', () => this.addSection()),
            this.createButton('Delete Section', 'btn btn-secondary', () => this.deleteCurrentSection()),
            this.createButton('Move Left', 'btn btn-secondary', () => this.moveSection(true)),
            this.createButton('Move Right', 'btn btn-secondary', () => this.moveSection(false)),
            this.createButton('Undo', 'btn btn-secondary', () => this.undo()),
            this.createButton('Help', 'btn btn-secondary', () => this.showKeybindings()),
        );

        const tabletRow = document.createElement('div');
        tabletRow.className = 'form-editor-tablet-row';
        const tabletLabel = document.createElement('span');
        tabletLabel.className = 'form-editor-tablet-label';
        tabletLabel.textContent = 'Tablet';
        this.tabletSelect = document.createElement('select');
        this.tabletSelect.className = 'form-input form-editor-tablet-select';
        for (const tablet of TABLETS) {
            const option = document.createElement('option');
            option.value = tablet.name;
            option.textContent = tablet.name;
            this.tabletSelect.appendChild(option);
        }
        {
            const option = document.createElement('option');
            option.value = CUSTOM_TABLET_NAME;
            option.textContent = CUSTOM_TABLET_NAME;
            this.tabletSelect.appendChild(option);
        }
        this.tabletSelect.addEventListener('change', () => this.targetTabletChanged(true));
        this.widthInput = document.createElement('input');
        this.widthInput.type = 'number';
        this.widthInput.className = 'form-input form-editor-tablet-size';
        this.heightInput = document.createElement('input');
        this.heightInput.type = 'number';
        this.heightInput.className = 'form-input form-editor-tablet-size';
        tabletRow.append(
            tabletLabel,
            this.tabletSelect,
            this.wrapField('Width', this.widthInput),
            this.wrapField('Height', this.heightInput),
            this.createButton('Apply Size', 'btn btn-secondary', () => this.applyCustomTabletSize()),
        );

        this.tabHost = document.createElement('div');
        this.tabHost.className = 'form-editor-tab-host';
        this.statusEl = document.createElement('div');
        this.statusEl.className = 'form-editor-status';

        this.root.append(header, toolbar, tabletRow, this.tabHost, this.statusEl);
        this.container.replaceChildren(this.root);

        this.onDocumentMouseMoveBound = this.onDocumentMouseMove.bind(this);
        this.onDocumentMouseUpBound = this.onDocumentMouseUp.bind(this);
        this.onDocumentKeyDownBound = this.onDocumentKeyDown.bind(this);
        document.addEventListener('mousemove', this.onDocumentMouseMoveBound);
        document.addEventListener('mouseup', this.onDocumentMouseUpBound);
        document.addEventListener('keydown', this.onDocumentKeyDownBound);

        this.initKeybindings();
        this.refreshTabletControls();
        this.rebuildPages(0);
        this.updateStatus();
    }

    public destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;
        document.removeEventListener('mousemove', this.onDocumentMouseMoveBound);
        document.removeEventListener('mouseup', this.onDocumentMouseUpBound);
        document.removeEventListener('keydown', this.onDocumentKeyDownBound);
        this.hidePopupMenu();
        this.activeDialog?.close?.();
        this.activeDialog?.destroy?.();
        this.root.remove();
    }

    private static createDefaultForm(purpose: 'team' | 'match'): IPCForm {
        return {
            purpose,
            tablet: cloneValue(TABLETS[0]),
            sections: [{ name: 'Section 1', items: [] }],
        };
    }

    private createButton(text: string, className: string, action: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        button.addEventListener('click', action);
        return button;
    }

    private wrapField(labelText: string, input: HTMLElement): HTMLLabelElement {
        const label = document.createElement('label');
        label.className = 'form-editor-tablet-field';
        label.textContent = labelText;
        label.appendChild(input);
        return label;
    }

    private initKeybindings(): void {
        this.keybindings.addKeybinding('F1', false, false, false, 'Show keybindings', () => this.showKeybindings());
        this.keybindings.addKeybinding('Delete', false, false, false, 'Delete selected controls', () => this.deleteSelectedControls());
        this.keybindings.addKeybinding('z', true, false, false, 'Undo', () => this.undo());
        this.keybindings.addKeybinding('a', true, false, false, 'Select all controls in the section', () => this.selectAll());
        this.keybindings.addKeybinding('c', true, false, false, 'Copy selected controls', () => this.copySelectedControls());
        this.keybindings.addKeybinding('v', true, false, false, 'Paste copied controls', () => this.pasteClipboard());
        this.keybindings.addKeybinding('d', true, false, false, 'Duplicate selected controls', () => this.duplicateSelection());
        this.keybindings.addKeybinding('p', true, false, false, 'Edit selected control properties', () => this.editControlProperties());
        this.keybindings.addKeybinding('ArrowLeft', false, false, false, 'Move selection left', () => this.moveSelectedBy(-1, 0));
        this.keybindings.addKeybinding('ArrowRight', false, false, false, 'Move selection right', () => this.moveSelectedBy(1, 0));
        this.keybindings.addKeybinding('ArrowUp', false, false, false, 'Move selection up', () => this.moveSelectedBy(0, -1));
        this.keybindings.addKeybinding('ArrowDown', false, false, false, 'Move selection down', () => this.moveSelectedBy(0, 1));
        this.keybindings.addKeybinding('ArrowLeft', false, true, false, 'Resize selection narrower', () => this.resizeSelectedBy(-1, 0));
        this.keybindings.addKeybinding('ArrowRight', false, true, false, 'Resize selection wider', () => this.resizeSelectedBy(1, 0));
        this.keybindings.addKeybinding('ArrowUp', false, true, false, 'Resize selection shorter', () => this.resizeSelectedBy(0, -1));
        this.keybindings.addKeybinding('ArrowDown', false, true, false, 'Resize selection taller', () => this.resizeSelectedBy(0, 1));
    }

    private rebuildPages(selectIndex: number): void {
        this.clearSelection();
        this.tabHost.innerHTML = '';
        this.pages = [];
        this.tabWidget = new TabWidget();
        this.tabWidget.setParent(this.tabHost);
        this.tabWidget.onTabChange = (_oldIndex: number, newIndex: number) => {
            this.currentPageIndex = Math.max(0, newIndex);
            this.clearSelection();
            this.updateStatus();
        };
        this.tabWidget.on('tabButtonDoubleClicked', (idx: unknown) => {
            const pageIndex = idx as number;
            this.tabWidget?.inlineRename(pageIndex, (newName: string) => {
                this.renameSectionInternal(newName, pageIndex);
            });
        });
        this.form_.sections.forEach((section, index) => {
            const page = new XeroFormEditSectionPage(section.name, this.form_.json.tablet.size);
            this.pages.push(page);
            this.bindPageEvents(page, index);
            for (const item of section.items) this.createControlFromItem(item, page);
            this.tabWidget?.addPage(section.name, page.elem);
        });
        const pageIndex = Math.max(0, Math.min(selectIndex, this.form_.sections.length - 1));
        this.currentPageIndex = pageIndex;
        this.tabWidget.selectPage(pageIndex);
    }

    private bindPageEvents(page: XeroFormEditSectionPage, index: number): void {
        page.form.addEventListener('mousedown', event => this.onPageMouseDown(index, event));
        page.form.addEventListener('mousemove', event => this.onPageHover(index, event));
        page.form.addEventListener('contextmenu', event => this.onPageContextMenu(index, event));
        page.form.addEventListener('dblclick', event => this.onPageDoubleClick(index, event));
    }

    private onPageDoubleClick(pageIndex: number, event: MouseEvent): void {
        this.currentPageIndex = pageIndex;
        const point = this.getPagePoint(pageIndex, event.clientX, event.clientY);
        const control = this.pages[pageIndex].findControlsByPosition(point)[0];
        if (control) {
            if (!this.isSelected(control)) this.selectOnly(control);
            this.editControlProperties();
        }
    }

    private onPageContextMenu(pageIndex: number, event: MouseEvent): void {
        event.preventDefault();
        this.root.focus();
        this.currentPageIndex = pageIndex;
        const point = this.getPagePoint(pageIndex, event.clientX, event.clientY);
        this.currentCursor = point;
        const control = this.pages[pageIndex].findControlsByPosition(point)[0];
        if (control && !this.isSelected(control)) this.selectOnly(control);
        this.showContextMenu(pageIndex, point, control, event.clientX, event.clientY);
        this.updateStatus();
    }

    private onPageHover(pageIndex: number, event: MouseEvent): void {
        this.currentPageIndex = pageIndex;
        this.currentCursor = this.getPagePoint(pageIndex, event.clientX, event.clientY);
        this.updateStatus();
        if (!this.drag) this.updateHoverCursor(pageIndex, this.currentCursor);
    }

    private onPageMouseDown(pageIndex: number, event: MouseEvent): void {
        if (event.button !== 0) return;
        this.hidePopupMenu();
        this.root.focus();
        this.currentPageIndex = pageIndex;
        const point = this.getPagePoint(pageIndex, event.clientX, event.clientY);
        this.currentCursor = point;
        const page = this.pages[pageIndex];
        const hits = page.findControlsByPosition(point);
        if (hits.length === 0) {
            if (!(event.shiftKey || event.ctrlKey || event.metaKey)) this.clearSelection();
            this.beginAreaSelection(pageIndex, point);
            this.updateStatus();
            event.preventDefault();
            return;
        }
        const control = hits.find(ctrl => this.isSelected(ctrl)) ?? hits[0];
        if (event.ctrlKey || event.metaKey) {
            this.toggleSelection(control);
            if (!this.isSelected(control)) return;
        } else if (event.shiftKey) {
            if (!this.isSelected(control)) this.addSelection(control);
        } else {
            if (!this.isSelected(control) || this.selectedControls.length > 1) this.selectOnly(control);
        }
        const mode = this.selectedControls.length === 1 ? this.determineDragMode(control, point) : 'move';
        this.beginDrag(pageIndex, point, mode);
        this.updateStatus();
        event.preventDefault();
    }

    private onDocumentMouseMove(event: MouseEvent): void {
        if (this.destroyed) return;
        if (this.areaSelection) {
            const point = this.getPagePoint(this.areaSelection.pageIndex, event.clientX, event.clientY);
            this.currentCursor = point;
            this.updateAreaSelection(point);
            this.updateStatus();
            return;
        }
        if (!this.drag) return;
        const point = this.getPagePoint(this.drag.pageIndex, event.clientX, event.clientY);
        this.currentCursor = point;
        if (this.drag.mode === 'move') this.applyMoveDrag(point);
        else this.applyResizeDrag(point);
        this.updateStatus();
    }

    private onDocumentMouseUp(event: MouseEvent): void {
        if (this.areaSelection) {
            const point = this.getPagePoint(this.areaSelection.pageIndex, event.clientX, event.clientY);
            this.finishAreaSelection(point, event.shiftKey || event.ctrlKey || event.metaKey);
            return;
        }
        if (!this.drag) return;
        if (this.drag.changed) {
            const args: UndoMoveResizeArgs[] = [];
            for (const [control, bounds] of this.drag.originals.entries()) {
                args.push({ formctrl: control, oldbounds: bounds });
            }
            this.modified(new UndoStackEntry('move', 'control', args));
        }
        this.drag = undefined;
        this.root.style.cursor = 'default';
        this.updateStatus();
    }

    private onDocumentKeyDown(event: KeyboardEvent): void {
        if (this.destroyed || this.activeDialog || this.popupMenu) return;
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)) return;
        const ctrl = event.ctrlKey || event.metaKey;
        const binding = this.keybindings.getKeybindings(event.key, ctrl, event.altKey, event.shiftKey);
        if (binding) {
            binding.action(event);
            event.preventDefault();
            event.stopPropagation();
        }
    }

    private get currentPage(): XeroFormEditSectionPage | undefined {
        return this.pages[this.currentPageIndex];
    }

    private getPagePoint(pageIndex: number, clientX: number, clientY: number): XeroPoint {
        const page = this.pages[pageIndex];
        const rect = page.form.getBoundingClientRect();
        return new XeroPoint(Math.round(clientX - rect.left), Math.round(clientY - rect.top));
    }

    private updateHoverCursor(pageIndex: number, point: XeroPoint): void {
        const control = this.pages[pageIndex].findControlsByPosition(point)[0];
        if (!control || !this.isSelected(control) || this.selectedControls.length !== 1) {
            this.root.style.cursor = 'default';
            return;
        }
        const mode = this.determineDragMode(control, point);
        this.root.style.cursor = this.cursorForMode(mode);
    }

    private determineDragMode(control: FormControl, point: XeroPoint): DragMode {
        const top = control.isTopEdge(point);
        const bottom = control.isBottomEdge(point);
        const left = control.isLeftEdge(point);
        const right = control.isRightEdge(point);
        if (top && left) return 'resize-tl';
        if (top && right) return 'resize-tr';
        if (bottom && left) return 'resize-bl';
        if (bottom && right) return 'resize-br';
        if (left) return 'resize-left';
        if (right) return 'resize-right';
        if (top) return 'resize-top';
        if (bottom) return 'resize-bottom';
        return 'move';
    }

    private cursorForMode(mode: DragMode): string {
        switch (mode) {
            case 'resize-left':
            case 'resize-right': return 'ew-resize';
            case 'resize-top':
            case 'resize-bottom': return 'ns-resize';
            case 'resize-tl':
            case 'resize-br': return 'nwse-resize';
            case 'resize-tr':
            case 'resize-bl': return 'nesw-resize';
            case 'move': return 'move';
            default: return 'default';
        }
    }

    private beginDrag(pageIndex: number, point: XeroPoint, mode: DragMode): void {
        const originals = new Map<FormControl, XeroRect>();
        for (const control of this.selectedControls) {
            control.setOriginalBounds();
            originals.set(control, control.bounds.clone());
        }
        this.drag = { pageIndex, mode, start: point, originals, changed: false };
        this.root.style.cursor = this.cursorForMode(mode);
    }

    private beginAreaSelection(pageIndex: number, point: XeroPoint): void {
        const div = document.createElement('div');
        div.className = 'form-editor-area-selection';
        this.pages[pageIndex].form.appendChild(div);
        this.areaSelection = { start: point, div, pageIndex };
        this.updateAreaSelection(point);
    }

    private updateAreaSelection(point: XeroPoint): void {
        if (!this.areaSelection) return;
        const rect = XeroRect.fromPoints([this.areaSelection.start, point]);
        this.areaSelection.div.style.left = `${rect.x}px`;
        this.areaSelection.div.style.top = `${rect.y}px`;
        this.areaSelection.div.style.width = `${rect.width}px`;
        this.areaSelection.div.style.height = `${rect.height}px`;
    }

    private finishAreaSelection(point: XeroPoint, additive: boolean): void {
        if (!this.areaSelection) return;
        const { pageIndex, start, div } = this.areaSelection;
        const area = XeroRect.fromPoints([start, point]);
        div.remove();
        this.areaSelection = undefined;
        if (!additive) this.clearSelection();
        for (const control of this.pages[pageIndex].controls) {
            if (control.bounds.intersects(area) && !control.locked) this.addSelection(control);
        }
        this.updateSelectionStyles();
        this.updateStatus();
    }

    private applyMoveDrag(point: XeroPoint): void {
        if (!this.drag) return;
        const dx = point.x - this.drag.start.x;
        const dy = point.y - this.drag.start.y;
        const pageSize = this.form_.json.tablet.size;
        for (const [control, original] of this.drag.originals.entries()) {
            const rect = new XeroRect(
                Math.min(Math.max(original.x + dx, 0), pageSize.width - original.width),
                Math.min(Math.max(original.y + dy, 0), pageSize.height - original.height),
                original.width,
                original.height,
            );
            if (rect.x !== control.item.x || rect.y !== control.item.y) this.drag.changed = true;
            control.item.x = rect.x;
            control.item.y = rect.y;
            control.positionUpdated();
            this.currentPage?.clipControl(control);
        }
    }

    private applyResizeDrag(point: XeroPoint): void {
        if (!this.drag || this.selectedControls.length !== 1) return;
        const control = this.selectedControls[0];
        const original = this.drag.originals.get(control);
        if (!original) return;
        const deltaX = point.x - this.drag.start.x;
        const deltaY = point.y - this.drag.start.y;
        let x = original.x;
        let y = original.y;
        let width = original.width;
        let height = original.height;
        switch (this.drag.mode) {
            case 'resize-left': x = original.x + deltaX; width = original.width - deltaX; break;
            case 'resize-right': width = original.width + deltaX; break;
            case 'resize-top': y = original.y + deltaY; height = original.height - deltaY; break;
            case 'resize-bottom': height = original.height + deltaY; break;
            case 'resize-tl': x = original.x + deltaX; width = original.width - deltaX; y = original.y + deltaY; height = original.height - deltaY; break;
            case 'resize-tr': width = original.width + deltaX; y = original.y + deltaY; height = original.height - deltaY; break;
            case 'resize-bl': x = original.x + deltaX; width = original.width - deltaX; height = original.height + deltaY; break;
            case 'resize-br': width = original.width + deltaX; height = original.height + deltaY; break;
            default: return;
        }
        width = Math.max(FormControl.kMinimumWidth, width);
        height = Math.max(FormControl.kMinimumHeight, height);
        x = Math.max(0, x);
        y = Math.max(0, y);
        const pageSize = this.form_.json.tablet.size;
        if (x + width > pageSize.width) width = pageSize.width - x;
        if (y + height > pageSize.height) height = pageSize.height - y;
        if (x !== control.item.x || y !== control.item.y || width !== control.item.width || height !== control.item.height) this.drag.changed = true;
        control.item.x = x;
        control.item.y = y;
        control.item.width = width;
        control.item.height = height;
        control.positionUpdated();
        this.currentPage?.clipControl(control);
    }

    private isSelected(control: FormControl): boolean {
        return this.selectedControls.includes(control);
    }

    private addSelection(control: FormControl): void {
        if (control.locked || this.isSelected(control)) return;
        this.selectedControls.push(control);
        this.updateSelectionStyles();
    }

    private toggleSelection(control: FormControl): void {
        if (this.isSelected(control)) {
            this.selectedControls = this.selectedControls.filter(item => item !== control);
        } else {
            this.selectedControls.push(control);
        }
        this.updateSelectionStyles();
    }

    private selectOnly(control: FormControl): void {
        this.selectedControls = control.locked ? [] : [control];
        this.updateSelectionStyles();
    }

    private clearSelection(): void {
        this.selectedControls = [];
        this.updateSelectionStyles();
    }

    private updateSelectionStyles(): void {
        for (const page of this.pages) {
            for (const control of page.controls) control.displayStyle = 'none';
        }
        if (this.selectedControls.length === 1) this.selectedControls[0].displayStyle = 'selected';
        else if (this.selectedControls.length > 1) {
            for (const control of this.selectedControls) control.displayStyle = 'multiplesel';
        }
    }

    private findItemBounds(items: IPCFormItem[]): XeroRect {
        let left = Number.MAX_VALUE;
        let top = Number.MAX_VALUE;
        let right = 0;
        let bottom = 0;
        for (const item of items) {
            left = Math.min(left, item.x);
            top = Math.min(top, item.y);
            right = Math.max(right, item.x + item.width);
            bottom = Math.max(bottom, item.y + item.height);
        }
        return new XeroRect(left, top, right - left, bottom - top);
    }

    private createControl(type: SupportedControlType, tag: string, bounds: XeroRect): FormControl {
        switch (type) {
            case 'label': return new LabelControl(this, tag, bounds);
            case 'box': return new BoxControl(this, tag, bounds);
            case 'text': return new TextControl(this, tag, bounds);
            case 'textarea': return new TextAreaControl(this, tag, bounds);
            case 'updown': return new UpDownControl(this, tag, bounds);
            case 'boolean': return new BooleanControl(this, tag, bounds);
            case 'choice': return new MultipleChoiceControl(this, tag, bounds);
            case 'select': return new SelectControl(this, tag, bounds);
            case 'timer': return new TimerControl(this, tag, bounds);
            case 'image': return new ImageControl(this, tag, bounds);
            case 'stopwatch': return new StopwatchControl(this, tag, bounds);
            case 'robotphoto': return new RobotPhotoControl(this, tag, bounds);
            case 'robotviewer': return new RobotViewerControl(this, tag, bounds);
            case 'autoplan': return new AutoPlanControl(this, tag, bounds);
            case 'autoselector': return new AutoSelectorControl(this, tag, bounds);
        }
    }

    private createControlFromItem(item: IPCFormItem, page: XeroFormEditSectionPage): FormControl {
        let type: SupportedControlType;
        switch (item.type) {
            case 'label': case 'box': case 'text': case 'textarea': case 'updown': case 'boolean': case 'choice': case 'select': case 'timer': case 'image':
            case 'stopwatch': case 'robotphoto': case 'robotviewer': case 'autoplan': case 'autoselector':
                type = item.type;
                break;
            default:
                type = 'image';
                break;
        }
        const control = this.createControl(type, item.tag || this.getUniqueTagName(), new XeroRect(item.x, item.y, item.width, item.height));
        control.update(item);
        page.addControl(control);
        return control;
    }

    private getUniqueTagName(): string {
        let index = 1;
        let name = `tag_${index}`;
        while (this.form_.findItemByTag(name)) {
            index++;
            name = `tag_${index}`;
        }
        return name;
    }

    private addControlToCurrentSection(type: SupportedControlType, point?: XeroPoint): void {
        const page = this.currentPage;
        if (!page) return;
        const location = point ?? this.currentCursor;
        const largeControls: SupportedControlType[] = ['robotphoto', 'robotviewer', 'autoplan', 'autoselector'];
        const size = type === 'choice' ? new XeroSize(250, 150)
            : largeControls.includes(type) ? new XeroSize(400, 300)
            : new XeroSize(250, 50);
        const control = this.createControl(type, this.getUniqueTagName(), XeroRect.fromPointSize(location, size));
        this.form_.sections[this.currentPageIndex].items.push(control.item);
        page.addControl(control);
        this.selectOnly(control);
        this.modified(new UndoStackEntry('add', 'control', [control]));
    }

    private deleteControls(ctrls: FormControl[], save = true): void {
        if (!ctrls.length) return;
        const page = this.currentPage;
        if (!page) return;
        const deleted: IPCFormItem[] = [];
        const section = this.form_.sections[this.currentPageIndex];
        for (const control of ctrls) {
            deleted.push(cloneValue(control.item));
            const itemIndex = section.items.findIndex(item => item.tag === control.item.tag);
            if (itemIndex >= 0) section.items.splice(itemIndex, 1);
            page.removeControl(control);
        }
        this.clearSelection();
        if (save) {
            const undoitem: UndoDeleteControlArgs = { page: this.currentPageIndex, items: deleted };
            this.modified(new UndoStackEntry('delete', 'control', undoitem));
        }
    }

    private deleteSelectedControls(): void {
        this.deleteControls([...this.selectedControls]);
    }

    private copySelectedControls(): void {
        this.clipboardItems = this.selectedControls.map(control => cloneValue(control.item));
    }

    private pasteClipboard(): void {
        if (!this.clipboardItems.length || !this.currentPage) return;
        const baseBounds = this.findItemBounds(this.clipboardItems);
        const dx = this.currentCursor.x - baseBounds.x + 24;
        const dy = this.currentCursor.y - baseBounds.y + 24;
        const added: FormControl[] = [];
        this.clearSelection();
        for (const original of this.clipboardItems) {
            const item = cloneValue(original);
            item.x += dx;
            item.y += dy;
            item.tag = this.getUniqueTagName();
            this.form_.sections[this.currentPageIndex].items.push(item);
            const control = this.createControlFromItem(item, this.currentPage);
            added.push(control);
            this.addSelection(control);
        }
        this.modified(new UndoStackEntry('add', 'control', added));
    }

    private duplicateSelection(): void {
        this.copySelectedControls();
        this.pasteClipboard();
    }

    private moveSelectedBy(dx: number, dy: number): void {
        if (!this.selectedControls.length) return;
        const pageSize = this.form_.json.tablet.size;
        const args: UndoMoveResizeArgs[] = [];
        for (const control of this.selectedControls) {
            args.push({ formctrl: control, oldbounds: control.bounds.clone() });
            control.item.x = Math.max(0, Math.min(control.item.x + dx, pageSize.width - control.item.width));
            control.item.y = Math.max(0, Math.min(control.item.y + dy, pageSize.height - control.item.height));
            control.positionUpdated();
            this.currentPage?.clipControl(control);
        }
        this.modified(new UndoStackEntry('move', 'control', args));
        this.updateStatus();
    }

    private resizeSelectedBy(dw: number, dh: number): void {
        if (this.selectedControls.length !== 1) return;
        const control = this.selectedControls[0];
        const pageSize = this.form_.json.tablet.size;
        const args: UndoMoveResizeArgs[] = [{ formctrl: control, oldbounds: control.bounds.clone() }];
        control.item.width = Math.max(FormControl.kMinimumWidth, Math.min(control.item.width + dw, pageSize.width - control.item.x));
        control.item.height = Math.max(FormControl.kMinimumHeight, Math.min(control.item.height + dh, pageSize.height - control.item.y));
        control.positionUpdated();
        this.currentPage?.clipControl(control);
        this.modified(new UndoStackEntry('move', 'control', args));
        this.updateStatus();
    }

    private selectAll(): void {
        this.clearSelection();
        for (const control of this.currentPage?.controls ?? []) {
            if (!control.locked) this.addSelection(control);
        }
        this.updateSelectionStyles();
        this.updateStatus();
    }

    private showContextMenu(pageIndex: number, point: XeroPoint, control: FormControl | undefined, clientX: number, clientY: number): void {
        const items: PopupMenuItem[] = [];
        if (control) {
            items.push(new PopupMenuItem('Properties', () => this.editControlProperties()));
            items.push(new PopupMenuItem('Duplicate', () => this.duplicateSelection()));
            items.push(new PopupMenuItem('Delete', () => this.deleteSelectedControls()));
            items.push(new PopupMenuItem(control.locked ? 'Unlock' : 'Lock', () => this.toggleLocked(control)));
        }
        items.push(new PopupMenuItem('Add Section', () => this.addSection()));
        items.push(new PopupMenuItem('Delete Section', () => this.deleteCurrentSection(), undefined, this.form_.sections.length <= 1));
        items.push(new PopupMenuItem('Add Label', () => this.addControlToCurrentSection('label', point)));
        items.push(new PopupMenuItem('Add Box', () => this.addControlToCurrentSection('box', point)));
        items.push(new PopupMenuItem('Add Text', () => this.addControlToCurrentSection('text', point)));
        items.push(new PopupMenuItem('Add Text Area', () => this.addControlToCurrentSection('textarea', point)));
        items.push(new PopupMenuItem('Add Up/Down', () => this.addControlToCurrentSection('updown', point)));
        items.push(new PopupMenuItem('Add Boolean', () => this.addControlToCurrentSection('boolean', point)));
        items.push(new PopupMenuItem('Add Choice', () => this.addControlToCurrentSection('choice', point)));
        items.push(new PopupMenuItem('Add Select', () => this.addControlToCurrentSection('select', point)));
        items.push(new PopupMenuItem('Add Timer', () => this.addControlToCurrentSection('timer', point)));
        items.push(new PopupMenuItem('Add Stopwatch', () => this.addControlToCurrentSection('stopwatch', point)));
        items.push(new PopupMenuItem('Add Image (stub)', () => this.addControlToCurrentSection('image', point)));
        items.push(new PopupMenuItem('Add Robot Photo', () => this.addControlToCurrentSection('robotphoto', point)));
        items.push(new PopupMenuItem('Add Robot Viewer', () => this.addControlToCurrentSection('robotviewer', point)));
        items.push(new PopupMenuItem('Add Auto Plan', () => this.addControlToCurrentSection('autoplan', point)));
        items.push(new PopupMenuItem('Add Auto Selector', () => this.addControlToCurrentSection('autoselector', point)));
        this.hidePopupMenu();
        this.currentPageIndex = pageIndex;
        this.popupMenu = new PopupMenu('editor', items);
        this.popupMenu.on('closed', () => {
            this.popupMenu?.destroy();
            this.popupMenu = undefined;
        });
        this.popupMenu.show(clientX, clientY);
    }

    private hidePopupMenu(): void {
        if (this.popupMenu) {
            this.popupMenu.destroy();
            this.popupMenu = undefined;
        }
    }

    private toggleLocked(control: FormControl): void {
        const args: UndoLockContorlArgs = { formctrl: control, oldlocked: control.locked };
        control.locked = !control.locked;
        if (control.locked) this.clearSelection();
        this.modified(new UndoStackEntry('lock', 'control', args));
        this.updateStatus();
    }

    private openDialog(dialog: XeroDialog, onAccepted: () => void): void {
        this.activeDialog = dialog;
        dialog.on('closed', (accepted: unknown) => {
            const ok = accepted === true;
            dialog.destroy();
            this.activeDialog = undefined;
            if (ok) onAccepted();
            this.root.focus();
        });
        void dialog.showCentered(this.root);
    }

    private showKeybindings(): void {
        const dialog = new KeybindingDialog(this.keybindings.getAllKeybindings());
        this.openDialog(dialog, () => undefined);
    }

    private editControlProperties(): void {
        if (this.selectedControls.length !== 1) return;
        const control = this.selectedControls[0];
        const oldItem = cloneValue(control.item);
        const dialog = control.createEditDialog();
        this.openDialog(dialog, () => {
            const arg: UndoEditArgs = { formctrl: control, olditem: oldItem };
            const pageIndex = this.pageIndexOfControl(control);
            if (pageIndex >= 0) this.pages[pageIndex].doLayout();
            this.modified(new UndoStackEntry('edit', 'control', [arg]));
        });
    }

    private pageIndexOfControl(control: FormControl): number {
        return this.pages.findIndex(page => page.controls.includes(control));
    }

    private addSection(): void {
        const section = this.form_.createNewSection();
        this.modified(new UndoStackEntry('add', 'section', section.name));
        this.rebuildPages(this.form_.sections.length - 1);
    }

    private renameSectionInternal(name: string, page: number, saveUndo = true): void {
        const trimmed = name.trim();
        if (!trimmed || this.form_.sections[page].name === trimmed) return;
        const oldname = this.form_.sections[page].name;
        this.form_.sections[page].name = trimmed;
        if (saveUndo) {
            const args: UndoRenameSectionArgs = { oldname, page };
            this.modified(new UndoStackEntry('rename', 'section', args));
        }
        this.rebuildPages(page);
    }

    private async renameSection(): Promise<void> {
        const current = this.form_.sections[this.currentPageIndex];
        if (!current) return;
        const dialog = new EditSectionNameDialog(current.name);
        this.openDialog(dialog, () => this.renameSectionInternal(dialog.enteredName, this.currentPageIndex));
    }

    private deleteCurrentSection(): void {
        if (this.form_.sections.length <= 1) return;
        const section = cloneValue(this.form_.sections[this.currentPageIndex]);
        const index = this.currentPageIndex;
        this.form_.removeSectionByIndex(index);
        const args: UndoDeleteSectionArgs = { section, index };
        this.modified(new UndoStackEntry('delete', 'section', args));
        this.rebuildPages(Math.max(0, index - 1));
    }

    private moveSection(left: boolean): void {
        const index = this.currentPageIndex;
        const newIndex = left ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= this.form_.sections.length) return;
        const [section] = this.form_.sections.splice(index, 1);
        this.form_.sections.splice(newIndex, 0, section);
        const args: UndoMoveSectionArgs = { page: index, direction: left ? 'left' : 'right' };
        this.modified(new UndoStackEntry('move', 'section', args));
        this.rebuildPages(newIndex);
    }

    private refreshTabletControls(): void {
        const match = TABLETS.find(tablet => tablet.name === this.form_.json.tablet.name || (tablet.size.width === this.form_.json.tablet.size.width && tablet.size.height === this.form_.json.tablet.size.height));
        this.tabletSelect.value = match ? match.name : CUSTOM_TABLET_NAME;
        this.widthInput.value = `${this.form_.json.tablet.size.width}`;
        this.heightInput.value = `${this.form_.json.tablet.size.height}`;
        const custom = this.tabletSelect.value === CUSTOM_TABLET_NAME;
        this.widthInput.disabled = !custom;
        this.heightInput.disabled = !custom;
    }

    private targetTabletChanged(saveUndo: boolean): void {
        const name = this.tabletSelect.value;
        if (name === CUSTOM_TABLET_NAME) {
            this.widthInput.disabled = false;
            this.heightInput.disabled = false;
            return;
        }
        const tablet = TABLETS.find(entry => entry.name === name);
        if (!tablet) return;
        const old = cloneValue(this.form_.json.tablet);
        this.form_.json.tablet = cloneValue(tablet);
        this.refreshTabletControls();
        this.updatePageSizes();
        if (saveUndo) this.modified(new UndoStackEntry('edit', 'tablet', old));
    }

    private applyCustomTabletSize(): void {
        const width = parseInt(this.widthInput.value, 10);
        const height = parseInt(this.heightInput.value, 10);
        if (!Number.isFinite(width) || !Number.isFinite(height) || width < 100 || height < 100) return;
        const old = cloneValue(this.form_.json.tablet);
        this.form_.json.tablet = { name: CUSTOM_TABLET_NAME, size: { width, height } };
        this.tabletSelect.value = CUSTOM_TABLET_NAME;
        this.updatePageSizes();
        this.modified(new UndoStackEntry('edit', 'tablet', old));
    }

    private updatePageSizes(): void {
        for (const page of this.pages) page.setPageSize(this.form_.json.tablet.size);
        this.rebuildPages(this.currentPageIndex);
    }

    private modified(undo: UndoStackEntry): void {
        this.undoStack.push(undo);
        this.updateStatus();
    }

    private undo(): void {
        const undo = this.undoStack.pop();
        if (!undo) return;
        if (undo.oper === 'add' && undo.obj === 'control') {
            this.deleteControls(undo.item as FormControl[], false);
        } else if (undo.oper === 'delete' && undo.obj === 'control') {
            const args = undo.item as UndoDeleteControlArgs;
            const page = this.pages[args.page];
            const section = this.form_.sections[args.page];
            for (const item of args.items) {
                const cloned = cloneValue(item);
                section.items.push(cloned);
                this.createControlFromItem(cloned, page);
            }
            this.rebuildPages(args.page);
        } else if (undo.oper === 'edit' && undo.obj === 'control') {
            for (const arg of undo.item as UndoEditArgs[]) {
                arg.formctrl.update(cloneValue(arg.olditem));
                const pageIndex = this.pageIndexOfControl(arg.formctrl);
                if (pageIndex >= 0) this.pages[pageIndex].doLayout();
            }
        } else if (undo.oper === 'move' && undo.obj === 'control') {
            for (const arg of undo.item as UndoMoveResizeArgs[]) {
                arg.formctrl.item.x = arg.oldbounds.x;
                arg.formctrl.item.y = arg.oldbounds.y;
                arg.formctrl.item.width = arg.oldbounds.width;
                arg.formctrl.item.height = arg.oldbounds.height;
                arg.formctrl.positionUpdated();
            }
        } else if (undo.oper === 'add' && undo.obj === 'section') {
            const name = undo.item as string;
            const index = this.form_.findSectionIndexByName(name);
            if (index >= 0) this.form_.removeSectionByIndex(index);
            if (this.form_.sections.length === 0) this.form_.createNewSection();
            this.rebuildPages(Math.max(0, this.currentPageIndex - 1));
        } else if (undo.oper === 'delete' && undo.obj === 'section') {
            const args = undo.item as UndoDeleteSectionArgs;
            this.form_.sections.splice(args.index, 0, cloneValue(args.section));
            this.rebuildPages(args.index);
        } else if (undo.oper === 'rename' && undo.obj === 'section') {
            const args = undo.item as UndoRenameSectionArgs;
            this.form_.sections[args.page].name = args.oldname;
            this.rebuildPages(args.page);
        } else if (undo.oper === 'move' && undo.obj === 'section') {
            const args = undo.item as UndoMoveSectionArgs;
            const source = args.direction === 'left' ? args.page - 1 : args.page + 1;
            const dest = args.page;
            if (source >= 0 && source < this.form_.sections.length) {
                const [section] = this.form_.sections.splice(source, 1);
                this.form_.sections.splice(dest, 0, section);
                this.rebuildPages(dest);
            }
        } else if (undo.oper === 'edit' && undo.obj === 'tablet') {
            this.form_.json.tablet = cloneValue(undo.item as IPCTablet);
            this.refreshTabletControls();
            this.updatePageSizes();
        } else if (undo.oper === 'lock' && undo.obj === 'control') {
            const args = undo.item as UndoLockContorlArgs;
            args.formctrl.locked = args.oldlocked;
            if (args.formctrl.locked) this.clearSelection();
        }
        this.updateStatus();
    }

    private updateStatus(): void {
        const section = this.form_.sections[this.currentPageIndex];
        const selectionText = this.selectedControls.length === 1
            ? `${this.selectedControls[0].item.tag} @ ${this.selectedControls[0].item.x},${this.selectedControls[0].item.y} ${this.selectedControls[0].item.width}x${this.selectedControls[0].item.height}`
            : `${this.selectedControls.length} selected`;
        this.statusEl.textContent = `Section: ${section?.name ?? 'None'} | Cursor: ${this.currentCursor.x}, ${this.currentCursor.y} | ${selectionText} | Undo: ${this.undoStack.length}`;
    }

    private async save(): Promise<void> {
        await window.xeroscout.executeCommand('save-form-json', this.purpose, JSON.stringify(this.form_.json, null, 2));
    }

    private importFormFromFile(fileInput: HTMLInputElement): void {
        const file = fileInput.files?.[0];
        fileInput.value = '';
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string) as Record<string, unknown>;
                if (!Array.isArray(parsed['sections'])) {
                    alert('Invalid form JSON: missing "sections" array.');
                    return;
                }
                const imported = {
                    ...parsed,
                    purpose: this.purpose,
                } as IPCForm;
                this.form_ = new FormObject(imported);
                this.undoStack.length = 0;
                this.rebuildPages(0);
                this.refreshTabletControls();
                this.updateStatus();
            } catch {
                alert('Failed to parse JSON file. Please select a valid form JSON.');
            }
        };
        reader.onerror = () => { alert('Failed to read file.'); };
        reader.readAsText(file);
    }

    private async cancel(): Promise<void> {
        await window.xeroscout.executeCommand('show-view', 'event-setup');
    }
}
