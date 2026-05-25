export async function InfoView(container: HTMLElement) {
    const info = await window.xeroscout.getInfoData() as {
        event?: { name: string; startDate: string; endDate: string; locked: boolean };
        teams?: number;
        matches?: number;
        scoutedMatches?: number;
        tablets?: Array<{ name: string; purpose: string; assignedAlliance?: string }>;
    } | null;

    const wrap = document.createElement('div');
    wrap.className = 'view-container';

    if (!info?.event) {
        const p = document.createElement('p');
        p.style.color = '#90a4ae';
        p.textContent = 'No event loaded. Use File → Open Event to begin.';
        wrap.appendChild(p);
        container.appendChild(wrap);
        return;
    }

    const { event } = info;

    // Header card
    wrap.innerHTML = `
        <div class="view-title">${event.name}</div>
        <div class="view-subtitle">${event.startDate} – ${event.endDate}${event.locked ? ' <span class="status-warn">[LOCKED]</span>' : ''}</div>

        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
            <div class="card">
                <div class="card-title">Teams</div>
                <div style="font-size: 36px; font-weight: bold; color: #4fc3f7;">${info.teams ?? 0}</div>
            </div>
            <div class="card">
                <div class="card-title">Matches</div>
                <div style="font-size: 36px; font-weight: bold; color: #4fc3f7;">${info.matches ?? 0}</div>
            </div>
            <div class="card">
                <div class="card-title">Scouted</div>
                <div style="font-size: 36px; font-weight: bold; color: #66bb6a;">${info.scoutedMatches ?? 0}</div>
            </div>
        </div>

        <div class="view-title" style="font-size: 16px;">Tablets</div>
        <table class="data-table">
            <thead><tr><th>Name</th><th>Purpose</th><th>Alliance</th></tr></thead>
            <tbody>
                ${(info.tablets ?? []).map(t => `
                    <tr>
                        <td>${t.name}</td>
                        <td>${t.purpose}</td>
                        <td>${t.assignedAlliance ?? '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.appendChild(wrap);
}
