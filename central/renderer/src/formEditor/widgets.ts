import { XeroPoint } from './xerogeom';

type Listener = (...args: unknown[]) => void;

type ModalCloseReason = 'ok' | 'cancel' | 'close';

class EventSource {
    private listeners = new Map<string, Listener[]>();

    public on(event: string, cb: Listener): void {
        const list = this.listeners.get(event) ?? [];
        list.push(cb);
        this.listeners.set(event, list);
    }

    protected emit(event: string, ...args: unknown[]): void {
        for (const cb of this.listeners.get(event) ?? []) cb(...args);
    }
}

export class XeroWidget {
    public readonly elem: HTMLElement;

    constructor(tag = 'div', className?: string) {
        this.elem = document.createElement(tag);
        if (className) this.elem.className = className;
    }

    public setParent(parent: HTMLElement): void {
        parent.appendChild(this.elem);
    }
}

export class TabWidget extends EventSource {
    public readonly elem: HTMLDivElement;
    private readonly tabBar: HTMLDivElement;
    private readonly contentHost: HTMLDivElement;
    private readonly pages: { button: HTMLButtonElement; element: HTMLElement; title: string; }[] = [];
    public selectedPageIndex = -1;
    public onTabChange?: (oldIndex: number, newIndex: number) => void;

    constructor() {
        super();
        this.elem = document.createElement('div');
        this.elem.className = 'form-editor-tab-widget';
        this.tabBar = document.createElement('div');
        this.tabBar.className = 'form-editor-tab-bar';
        this.contentHost = document.createElement('div');
        this.contentHost.className = 'form-editor-tab-content';
        this.elem.append(this.tabBar, this.contentHost);
    }

    public get selectedPageNumber(): number {
        return this.selectedPageIndex;
    }

    public addPage(title: string, element: HTMLElement): void {
        this.insertPage(this.pages.length, title, element);
    }

    public insertPage(index: number, title: string, element: HTMLElement): void {
        const pageIndex = Math.max(0, Math.min(index, this.pages.length));
        const button = document.createElement('button');
        button.className = 'form-editor-tab-button';
        button.textContent = title;
        button.addEventListener('click', () => this.selectPage(this.pages.indexOf(entry)));
        button.addEventListener('dblclick', () => this.emit('tabButtonDoubleClicked', this.pages.indexOf(entry)));
        element.classList.add('form-editor-tab-page');
        element.hidden = true;
        const entry = { button, element, title };
        this.pages.splice(pageIndex, 0, entry);
        this.renderTabs();
        if (this.selectedPageIndex === -1) this.selectPage(0);
    }

    public removePage(index: number): void {
        if (index < 0 || index >= this.pages.length) return;
        const [page] = this.pages.splice(index, 1);
        page.button.remove();
        page.element.remove();
        if (this.pages.length === 0) {
            this.selectedPageIndex = -1;
            return;
        }
        const next = Math.min(index, this.pages.length - 1);
        this.renderTabs();
        this.selectPage(next);
    }

    public renamePage(index: number, title: string): void {
        const page = this.pages[index];
        if (!page) return;
        page.title = title;
        page.button.textContent = title;
    }

    public inlineRename(index: number, onCommit: (newTitle: string) => void): void {
        const page = this.pages[index];
        if (!page) return;
        const btn = page.button;
        const oldTitle = page.title;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-editor-tab-rename-input';
        input.value = oldTitle;
        btn.textContent = '';
        btn.appendChild(input);
        input.focus();
        input.select();

        const commit = () => {
            const newTitle = input.value.trim() || oldTitle;
            btn.removeChild(input);
            btn.textContent = newTitle;
            page.title = newTitle;
            if (newTitle !== oldTitle) onCommit(newTitle);
        };

        const revert = () => {
            btn.removeChild(input);
            btn.textContent = oldTitle;
        };

        input.addEventListener('blur', commit, { once: true });
        input.addEventListener('keydown', (ev: KeyboardEvent) => {
            if (ev.key === 'Enter') { ev.preventDefault(); input.removeEventListener('blur', commit); commit(); }
            else if (ev.key === 'Escape') { ev.preventDefault(); input.removeEventListener('blur', commit); revert(); }
        });
    }

    public movePageLeft(index: number): void {
        if (index <= 0 || index >= this.pages.length) return;
        const [page] = this.pages.splice(index, 1);
        this.pages.splice(index - 1, 0, page);
        this.renderTabs();
        this.selectPage(index - 1);
    }

    public movePageRight(index: number): void {
        if (index < 0 || index >= this.pages.length - 1) return;
        const [page] = this.pages.splice(index, 1);
        this.pages.splice(index + 1, 0, page);
        this.renderTabs();
        this.selectPage(index + 1);
    }

    public selectPage(index: number): void {
        const newIndex = index >= 0 && index < this.pages.length ? index : -1;
        const oldIndex = this.selectedPageIndex;
        if (oldIndex === newIndex) return;
        this.emit('beforeSelectPage', oldIndex, newIndex);
        this.selectedPageIndex = newIndex;
        this.pages.forEach((page, pageIndex) => {
            const selected = pageIndex === newIndex;
            page.button.classList.toggle('active', selected);
            page.element.hidden = !selected;
        });
        this.onTabChange?.(oldIndex, newIndex);
        this.emit('afterSelectPage', oldIndex, newIndex);
    }

    public setParent(parent: HTMLElement): void {
        parent.appendChild(this.elem);
    }

    public on(event: string, cb: Listener): void {
        super.on(event, cb);
    }

    private renderTabs(): void {
        this.tabBar.innerHTML = '';
        this.contentHost.innerHTML = '';
        for (const page of this.pages) {
            this.tabBar.appendChild(page.button);
            this.contentHost.appendChild(page.element);
        }
    }
}

export class XeroTabbedWidget extends TabWidget {}

export class PopupMenuItem {
    constructor(
        public readonly label: string,
        public readonly action?: () => void,
        public readonly submenu?: PopupMenu,
        public readonly disabled = false,
    ) {}
}

export class PopupMenu extends EventSource {
    private readonly element: HTMLDivElement;
    private readonly items: PopupMenuItem[];
    private readonly docHandler: (ev: MouseEvent) => void;
    private visible = false;

    constructor(_name: string, items: PopupMenuItem[] = []) {
        super();
        this.items = items;
        this.element = document.createElement('div');
        this.element.className = 'form-editor-popup-menu hidden';
        document.body.appendChild(this.element);
        this.docHandler = (ev: MouseEvent) => {
            if (this.visible && !this.element.contains(ev.target as Node)) this.hide();
        };
        document.addEventListener('mousedown', this.docHandler);
        this.render();
    }

    public show(x: number, y: number): void {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.classList.remove('hidden');
        this.visible = true;
    }

    public showRelative(_parent: HTMLElement, point: XeroPoint): void {
        this.show(point.x, point.y);
    }

    public hide(): void {
        this.element.classList.add('hidden');
        this.visible = false;
        this.emit('closed');
    }

    public destroy(): void {
        document.removeEventListener('mousedown', this.docHandler);
        this.element.remove();
    }

    private render(): void {
        this.element.innerHTML = '';
        for (const item of this.items) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'form-editor-popup-menu-item';
            button.textContent = item.label + (item.submenu ? ' ▸' : '');
            button.disabled = item.disabled;
            button.addEventListener('click', ev => {
                ev.stopPropagation();
                if (item.disabled) return;
                if (item.submenu) {
                    const rect = button.getBoundingClientRect();
                    item.submenu.show(rect.right + 4, rect.top);
                    return;
                }
                this.hide();
                item.action?.();
            });
            this.element.appendChild(button);
        }
    }
}

export class XeroPopupMenu extends PopupMenu {}
export class XeroPopupMenuItem extends PopupMenuItem {}

export class ModalDialog extends EventSource {
    protected readonly overlay: HTMLDivElement;
    protected readonly dialog: HTMLDivElement;
    protected readonly content: HTMLDivElement;
    protected readonly okBtn: HTMLButtonElement;
    protected readonly cancelBtn: HTMLButtonElement;
    public wasAccepted = false;

    constructor(title: string) {
        super();
        this.overlay = document.createElement('div');
        this.overlay.className = 'form-editor-modal-overlay hidden';
        this.dialog = document.createElement('div');
        this.dialog.className = 'form-editor-modal';
        const titleEl = document.createElement('div');
        titleEl.className = 'form-editor-modal-title';
        titleEl.textContent = title;
        this.content = document.createElement('div');
        this.content.className = 'form-editor-modal-content';
        const buttons = document.createElement('div');
        buttons.className = 'form-editor-modal-buttons';
        this.okBtn = document.createElement('button');
        this.okBtn.type = 'button';
        this.okBtn.className = 'btn btn-primary';
        this.okBtn.textContent = 'OK';
        this.cancelBtn = document.createElement('button');
        this.cancelBtn.type = 'button';
        this.cancelBtn.className = 'btn btn-secondary';
        this.cancelBtn.textContent = 'Cancel';
        buttons.append(this.cancelBtn, this.okBtn);
        this.dialog.append(titleEl, this.content, buttons);
        this.overlay.appendChild(this.dialog);
        document.body.appendChild(this.overlay);
        this.okBtn.addEventListener('click', this.okButton.bind(this));
        this.cancelBtn.addEventListener('click', this.cancelButton.bind(this));
        this.overlay.addEventListener('click', ev => {
            if (ev.target === this.overlay) this.close('cancel');
        });
    }

    public async show(): Promise<void> {
        this.wasAccepted = false;
        this.content.innerHTML = '';
        await this.populateDialog(this.content as HTMLDivElement);
        this.overlay.classList.remove('hidden');
        this.onInit();
    }

    public async showCentered(_parent?: HTMLElement): Promise<void> {
        await this.show();
    }

    public async showRelative(_parent: HTMLElement, _x: number, _y: number): Promise<void> {
        await this.show();
    }

    public close(reason: ModalCloseReason = 'close'): void {
        this.overlay.classList.add('hidden');
        this.emit('closed', this.wasAccepted, reason);
    }

    public destroy(): void {
        this.overlay.remove();
    }

    public okButton(_event: Event): void {
        this.wasAccepted = true;
        this.close('ok');
    }

    public cancelButton(_event: Event): void {
        this.wasAccepted = false;
        this.close('cancel');
    }

    protected async populateDialog(_pdiv: HTMLDivElement): Promise<void> {}
    protected onInit(): void {}
}

export class XeroDialog extends ModalDialog {}
