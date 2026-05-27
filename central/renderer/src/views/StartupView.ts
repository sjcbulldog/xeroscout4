export function StartupView(container: HTMLElement) {
    container.innerHTML = `
        <div class="startup-view">
            <div class="startup-logo">XeroScout 4</div>
            <div class="startup-subtitle">FRC Scouting System</div>
            <div class="startup-actions">
                <button class="btn btn-primary startup-btn" id="startup-create-btn">
                    <span class="startup-btn-icon">&#x2795;</span>
                    Create Event
                </button>
                <button class="btn btn-secondary startup-btn" id="startup-open-btn">
                    <span class="startup-btn-icon">&#x1F4C2;</span>
                    Open Event
                </button>
            </div>
            <div class="startup-hint">Create a new scouting event or open an existing one to get started.</div>
        </div>`;

    container.querySelector('#startup-create-btn')?.addEventListener('click',
        () => void window.xeroscout.executeCommand('create-event'));
    container.querySelector('#startup-open-btn')?.addEventListener('click',
        () => void window.xeroscout.executeCommand('open-event'));
}
