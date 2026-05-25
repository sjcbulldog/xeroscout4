export function TextView(container: HTMLElement, message: string) {
    const div = document.createElement('div');
    div.className = 'view-container';
    const p = document.createElement('p');
    p.style.color = '#90a4ae';
    p.style.fontSize = '15px';
    p.textContent = message;
    div.appendChild(p);
    container.appendChild(div);
}
