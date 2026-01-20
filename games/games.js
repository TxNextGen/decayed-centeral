const zonesurls = [
    "./zones.json",
    "https://cdn.jsdelivr.net/gh/gn-math/assets@latest/zones.json",
    "https://cdn.jsdelivr.net/gh/gn-math/assets/zones.json"
];

const grid = document.getElementById('games-grid');
const search = document.getElementById('game-search');
const player = document.getElementById('game-player');
const frame = document.getElementById('frame');
let allGames = [];

async function load() {
    console.log('Starting to load games...');
    
    for (const url of zonesurls) {
        try {
            console.log('Trying URL:', url);
            const res = await fetch(url);
            console.log('Response status:', res.status);
            
            if (res.ok) {
                const data = await res.json();
                console.log('Loaded games:', data.length);
                allGames = data;
                render(allGames);
                return;
            }
        } catch (e) {
            console.error('Error loading from', url, e);
        }
    }
    
    console.error('Failed to load games from all sources');
    grid.innerHTML = '<div style="color: #fff; padding: 40px; text-align: center;">Failed to load games. Please check console for errors.</div>';
}

function render(games) {
    if (!games || games.length === 0) {
        grid.innerHTML = '<div style="color: #fff; padding: 40px; text-align: center;">No games found.</div>';
        return;
    }
    
    console.log('Rendering', games.length, 'games');
    grid.innerHTML = '';
    
    games.forEach(game => {
        let coverUrl = game.cover || game.image || '';
        if (coverUrl.includes('{COVER_URL}')) {
            coverUrl = coverUrl.replace('{COVER_URL}', 'https://gitlab.com/technonyte00/vapor-game-assets/-/raw/main/covers');
        }
        
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="image-wrapper">
                <img src="${coverUrl}" alt="${game.name || 'Game'}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22125%22%3E%3Crect width=%22200%22 height=%22125%22 fill=%22%23222%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-family=%22sans-serif%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                <div class="play-overlay">
                    <i class="fa-solid fa-play"></i>
                </div>
            </div>
            <div class="title">${game.name || 'Untitled Game'}</div>
        `;
        
        card.onclick = () => {
            console.log('Game clicked:', game.name);
            if (window.navigateProxy) {
                let gameUrl = game.url;
                if (gameUrl.includes('{HTML_URL}')) {
                    gameUrl = gameUrl.replace('{HTML_URL}', 'https://gitlab.com/technonyte00/vapor-game-assets/-/raw/main/games');
                }
                window.navigateProxy(gameUrl);
                grid.style.display = 'none';
                player.style.display = 'block';
            } else {
                console.error('navigateProxy function not found');
                alert('Game loader not initialized. Please refresh the page.');
            }
        };
        
        grid.appendChild(card);
    });
}

search.oninput = () => {
    const term = search.value.toLowerCase();
    const filtered = allGames.filter(g => g.name.toLowerCase().includes(term));
    console.log('Search term:', term, 'Found:', filtered.length);
    render(filtered);
};

document.getElementById('random-game').onclick = () => {
    if (allGames.length === 0) {
        alert('No games loaded yet!');
        return;
    }
    const rand = allGames[Math.floor(Math.random() * allGames.length)];
    console.log('Random game selected:', rand.name);
    if (rand && window.navigateProxy) {
        let gameUrl = rand.url;
        if (gameUrl.includes('{HTML_URL}')) {
            gameUrl = gameUrl.replace('{HTML_URL}', 'https://gitlab.com/technonyte00/vapor-game-assets/-/raw/main/games');
        }
        window.navigateProxy(gameUrl);
        grid.style.display = 'none';
        player.style.display = 'block';
    }
};

document.getElementById('close-game').onclick = () => {
    console.log('Closing game');
    player.style.display = 'none';
    grid.style.display = 'grid';
    frame.src = 'about:blank';
};

grid.innerHTML = '<div style="color: #fff; padding: 40px; text-align: center;">Loading games...</div>';

window.navigateProxy = function(url) {
    console.log('Navigating to:', url);
    const frame = document.getElementById('frame');
    if (frame) {
        frame.src = url;
    } else {
        console.error('Frame not found');
    }
};

load();