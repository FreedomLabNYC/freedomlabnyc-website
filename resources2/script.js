(() => {
    const slides = [
        'Freedom Lab NYC',
        'Open Source AI Agent Skill Sharing',
        "Tonight's agenda",
        'Freedom Lab and the freedom tech mission',
        'What is Freedom Lab?',
        'Introductions',
        'What are AI agents?',
        'The basics',
        'How agents work',
        'What is OpenClaw?',
        'OpenClaw',
        'OpenClaw through the freedom tech lens',
        'Why open-source agents are good for freedom',
        'How skills work',
        'How are we using it?',
        'Private access details removed',
        'How are you using it?',
        'How do you want to use it?',
        'How to set it up securely',
        'Principles',
        'What you need',
        'Real threats',
        'Join Freedom Lab',
        'Vellum Assistant',
        'Group photo',
        'Your AI. Your machine. Your rules.',
        'Appendix',
        'Why AI changes everything',
        'The infrastructure play',
        'ChatGPT vs OpenClaw',
        'How it works',
        'What it can actually do',
        'The mindset shift',
        'The security paradox',
        'If something goes wrong',
        'Give it a mission',
        'How we are using it',
        'What others are building',
        'The OpenClaw hands-on class',
        'Start simple, build up',
        'The process',
        'Keep learning',
        'How we protect ourselves',
        'Why Ubuntu?',
        'OpenClaw privacy'
    ];

    const resources = [
        { title: 'Set Up OpenClaw', kicker: 'Guide', description: 'Install a personal AI assistant, connect a messaging channel, and understand the gateway.', tags: ['agents', 'self-hosting'], href: '/resources/openclaw-setup/' },
        { title: 'Better Agent Memory with QMD', kicker: 'Guide', description: 'Add searchable local memory without turning your notes into an opaque cloud service.', tags: ['agents', 'privacy'], href: '/resources/qmd-memory-setup/' },
        { title: 'Quality Toolkit for OpenClaw', kicker: 'Skill pair', description: 'Challenge assumptions before building, then systematically stress-test the result.', tags: ['agents'], href: '/resources/quality-toolkit/' },
        { title: 'Self-Host an AI Chatbot', kicker: 'Guide', description: 'Run a local model and chat interface on infrastructure you control.', tags: ['agents', 'privacy', 'self-hosting'], href: '/resources/self-host-ai/' },
        { title: 'Scoped Google Drive Access', kicker: 'Guide', description: 'Give an agent access to specific Drive content instead of an entire account.', tags: ['agents', 'privacy'], href: '/resources/google-drive-scoped-access/' },
        { title: 'Buy Bitcoin P2P Without ID', kicker: 'Class', description: 'Compare practical peer-to-peer methods and understand the tradeoffs before transacting.', tags: ['bitcoin', 'privacy'], href: '/resources/buy-bitcoin-p2p-without-id/' },
        { title: 'Tor vs VPN', kicker: 'Guide', description: 'Understand what each network privacy tool protects—and what it does not.', tags: ['privacy'], href: '/resources/tor-vs-vpn/' },
        { title: 'Run a Bitcoin Node on StartOS', kicker: 'Class', description: 'Verify Bitcoin independently with a self-hosted node on StartOS.', tags: ['bitcoin', 'self-hosting'], href: '/resources/bitcoin-node-startos/' },
        { title: 'Self-Host Email with Mailcow', kicker: 'Guide', description: 'Operate a private mail server while accounting for deliverability and maintenance.', tags: ['privacy', 'self-hosting'], href: '/resources/mailcow/' }
    ];

    const deckSlide = document.getElementById('deckSlide');
    const slideTitle = document.getElementById('slideTitle');
    const currentSlideEl = document.getElementById('currentSlide');
    const deckProgress = document.getElementById('deckProgress');
    const thumbnailStrip = document.getElementById('thumbnailStrip');
    const deckLinks = [...document.querySelectorAll('.deck-link')];
    let current = Number(new URLSearchParams(window.location.search).get('slide')) || 2;
    if (current < 1 || current > slides.length) current = 2;

    const slidePath = number => `assets/slides/slide-${String(number).padStart(2, '0')}.webp`;

    function buildThumbnails() {
        const fragment = document.createDocumentFragment();
        slides.forEach((title, index) => {
            const number = index + 1;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'thumbnail-button';
            button.dataset.slide = number;
            button.setAttribute('aria-label', `View slide ${number}: ${title}`);
            const image = document.createElement('img');
            image.src = slidePath(number);
            image.alt = '';
            image.width = 208;
            image.height = 117;
            image.loading = number === current ? 'eager' : 'lazy';
            button.appendChild(image);
            button.addEventListener('click', () => showSlide(number, true));
            fragment.appendChild(button);
        });
        thumbnailStrip.appendChild(fragment);
    }

    function highlightDeckLinks(number) {
        deckLinks.forEach(link => {
            const matches = link.dataset.slides.split(',').map(Number).includes(number);
            link.classList.toggle('current', matches);
        });
    }

    function preload(number) {
        if (number < 1 || number > slides.length) return;
        const image = new Image();
        image.src = slidePath(number);
    }

    function showSlide(number, updateUrl = false) {
        if (number < 1) number = slides.length;
        if (number > slides.length) number = 1;
        current = number;
        deckSlide.src = slidePath(number);
        deckSlide.alt = `Slide ${number}: ${slides[number - 1]}`;
        slideTitle.textContent = slides[number - 1];
        currentSlideEl.textContent = number;
        deckProgress.style.width = `${(number / slides.length) * 100}%`;
        document.querySelectorAll('.thumbnail-button').forEach(button => {
            const active = Number(button.dataset.slide) === number;
            button.classList.toggle('active', active);
            button.setAttribute('aria-current', active ? 'true' : 'false');
            if (active) {
                const targetLeft = button.offsetLeft - (thumbnailStrip.clientWidth - button.offsetWidth) / 2;
                thumbnailStrip.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
            }
        });
        highlightDeckLinks(number);
        preload(number - 1);
        preload(number + 1);
        if (updateUrl) {
            const url = new URL(window.location.href);
            url.searchParams.set('slide', number);
            url.hash = 'featured-event';
            history.replaceState({}, '', url);
        }
    }

    document.getElementById('previousSlide').addEventListener('click', () => showSlide(current - 1, true));
    document.getElementById('nextSlide').addEventListener('click', () => showSlide(current + 1, true));
    document.addEventListener('keydown', event => {
        if (event.target.matches('input, textarea, select')) return;
        if (event.key === 'ArrowLeft') showSlide(current - 1, true);
        if (event.key === 'ArrowRight') showSlide(current + 1, true);
    });

    const toast = document.getElementById('toast');
    let toastTimer;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    document.getElementById('shareSlide').addEventListener('click', async () => {
        const url = new URL(window.location.href);
        url.searchParams.set('slide', current);
        url.hash = 'featured-event';
        try {
            await navigator.clipboard.writeText(url.toString());
            showToast(`Slide ${current} link copied`);
        } catch (_) {
            window.prompt('Copy this slide link:', url.toString());
        }
    });

    document.getElementById('fullScreen').addEventListener('click', async () => {
        const stage = document.getElementById('slideStage');
        try {
            if (!document.fullscreenElement) await stage.requestFullscreen();
            else await document.exitFullscreen();
        } catch (_) {
            showToast('Full screen is not available in this browser');
        }
    });

    buildThumbnails();
    showSlide(current);

    const resourceGrid = document.getElementById('resourceGrid');
    const resourceEmpty = document.getElementById('resourceEmpty');
    const resourceSearch = document.getElementById('resourceSearch');
    const filterButtons = [...document.querySelectorAll('.filter-chip')];
    let activeFilter = 'all';

    function renderResources() {
        const query = resourceSearch.value.trim().toLowerCase();
        const visible = resources.filter(resource => {
            const matchesFilter = activeFilter === 'all' || resource.tags.includes(activeFilter);
            const text = `${resource.title} ${resource.kicker} ${resource.description} ${resource.tags.join(' ')}`.toLowerCase();
            return matchesFilter && (!query || text.includes(query));
        });
        resourceGrid.replaceChildren(...visible.map(resource => {
            const card = document.createElement('a');
            card.className = 'resource-card';
            card.href = resource.href;
            card.innerHTML = `<span class="resource-kicker">${resource.kicker}</span><h3>${resource.title}</h3><p>${resource.description}</p><div class="resource-tags">${resource.tags.map(tag => `<span>${tag.replace('-', ' ')}</span>`).join('')}</div>`;
            return card;
        }));
        resourceEmpty.hidden = visible.length !== 0;
    }

    filterButtons.forEach(button => button.addEventListener('click', () => {
        activeFilter = button.dataset.filter;
        filterButtons.forEach(candidate => candidate.classList.toggle('active', candidate === button));
        renderResources();
    }));
    resourceSearch.addEventListener('input', renderResources);
    renderResources();

})();
