type Alliance = { teams: number[] };
type Outcome  = { winner: number; loser: number };
type Bracket  = { alliances: (Alliance | null)[]; outcomes: Record<string, Outcome> };

const MATCH_SCHEDULE: Array<{ id: string; label: string; a1: number; a2: number }> = [
    { id: 'qf1', label: 'QF 1', a1: 1, a2: 8 },
    { id: 'qf2', label: 'QF 2', a1: 2, a2: 7 },
    { id: 'qf3', label: 'QF 3', a1: 3, a2: 6 },
    { id: 'qf4', label: 'QF 4', a1: 4, a2: 5 },
    { id: 'sf1', label: 'SF 1', a1: 0, a2: 0 },  // winners fill in
    { id: 'sf2', label: 'SF 2', a1: 0, a2: 0 },
    { id: 'f',   label: 'Final', a1: 0, a2: 0 },
];

export async function PlayoffsView(container: HTMLElement) {
    const data = await window.xeroscout.getPlayoffStatus() as { bracket: Bracket } | null;
    const bracket: Bracket = data?.bracket ?? { alliances: Array(8).fill(null), outcomes: {} };

    const wrap = document.createElement('div');
    wrap.className = 'view-container';
    wrap.innerHTML = '<div class="view-title">Playoffs</div>';

    // Alliance setup
    const allianceSection = document.createElement('div');
    allianceSection.innerHTML = '<div class="view-subtitle">Alliance Selections (1–8)</div>';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-bottom:24px;';

    for (let i = 0; i < 8; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        const alliance = bracket.alliances[i] ?? { teams: [] };
        card.innerHTML = `
            <div class="card-title">Alliance ${i + 1}</div>
            <div style="display:flex; gap:4px; flex-wrap:wrap;">
                ${[0,1,2].map(j => `
                    <input class="form-input" style="width:70px" 
                        data-alliance="${i}" data-pos="${j}"
                        value="${alliance.teams[j] ?? ''}" placeholder="Team" />
                `).join('')}
            </div>
        `;
        grid.appendChild(card);
    }
    allianceSection.appendChild(grid);
    wrap.appendChild(allianceSection);

    // Save alliances button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Save Alliances';
    saveBtn.style.marginBottom = '24px';
    saveBtn.addEventListener('click', async () => {
        for (let i = 0; i < 8; i++) {
            const inputs = grid.querySelectorAll<HTMLInputElement>(`input[data-alliance="${i}"]`);
            const teams = Array.from(inputs).map(inp => parseInt(inp.value)).filter(n => !isNaN(n));
            await window.xeroscout.setAllianceTeams(i + 1, teams);
        }
    });
    wrap.appendChild(saveBtn);

    // Bracket
    const bracketTitle = document.createElement('div');
    bracketTitle.className = 'view-subtitle';
    bracketTitle.textContent = 'Match Bracket';
    wrap.appendChild(bracketTitle);

    for (const m of MATCH_SCHEDULE) {
        const outcome = bracket.outcomes[m.id];
        const row = document.createElement('div');
        row.className = 'bracket-row';
        row.innerHTML = `
            <div style="min-width:60px; font-weight:600; color:#90a4ae;">${m.label}</div>
            <div class="bracket-match${outcome ? ' winner' : ''}">
                ${outcome ? `Winner: Alliance ${outcome.winner}` : 'TBD'}
            </div>
            ${!outcome ? `
                <select class="form-input" style="max-width:180px;" id="winner-${m.id}">
                    <option value="">— Select winner —</option>
                    <option value="a1">Alliance ${m.a1 || '?'}</option>
                    <option value="a2">Alliance ${m.a2 || '?'}</option>
                </select>
                <button class="btn btn-primary" data-match="${m.id}" data-a1="${m.a1}" data-a2="${m.a2}">Record</button>
            ` : ''}
        `;
        wrap.appendChild(row);
    }

    wrap.addEventListener('click', async (e) => {
        const btn = (e.target as HTMLElement).closest('button[data-match]') as HTMLButtonElement | null;
        if (!btn) return;
        const matchId = btn.dataset.match!;
        const a1 = parseInt(btn.dataset.a1!);
        const a2 = parseInt(btn.dataset.a2!);
        const sel = wrap.querySelector<HTMLSelectElement>(`#winner-${matchId}`);
        if (!sel?.value) return;
        const winner = sel.value === 'a1' ? a1 : a2;
        const loser  = sel.value === 'a1' ? a2 : a1;
        await window.xeroscout.setPlayoffMatchOutcome(matchId, winner, loser);
        // Refresh
        PlayoffsView(container);
    });

    container.innerHTML = '';
    container.appendChild(wrap);
}
