const portraitFiles = {
  casper: 'casper.webp',
  'adult-man': 'bas.webp',
  'woman-black-dress': 'tamara.webp',
  'young-girl': 'lisette.webp',
  laurens: 'laurens.webp'
};

const pagePath = window.location.pathname.endsWith('/')
  ? window.location.pathname
  : window.location.pathname.replace(/\/[^/]*$/, '/');

const portraitUrl = (file) => `${window.location.origin}${pagePath}public/characters/${file}`;

const style = document.createElement('style');
style.textContent = `
  .character-card { min-height: 122px; }
  .character-avatar {
    width: 58px !important;
    height: 58px !important;
    overflow: hidden;
    padding: 0 !important;
    border-radius: 16px !important;
    background: rgba(255,255,255,.04) !important;
  }
  .character-avatar img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center 34%;
    transform: scale(1.04);
  }
  .character-card.selected .character-avatar {
    box-shadow: 0 0 24px color-mix(in srgb,var(--card-accent,var(--green)) 35%,transparent);
  }
  @media (max-width: 760px) {
    .character-card { min-height: 108px; }
    .character-avatar { width: 50px !important; height: 50px !important; }
  }
`;
document.head.append(style);

function applyPortraits() {
  const cards = document.querySelectorAll('.character-card[data-character-id]');
  if (!cards.length) return false;

  for (const card of cards) {
    const file = portraitFiles[card.dataset.characterId];
    const avatar = card.querySelector('.character-avatar');
    if (!file || !avatar || avatar.querySelector('img')) continue;

    const img = document.createElement('img');
    img.src = portraitUrl(file);
    img.alt = `${card.querySelector('strong')?.textContent || 'Character'} portret`;
    img.loading = 'eager';
    img.decoding = 'async';
    avatar.replaceChildren(img);
  }

  return true;
}

if (!applyPortraits()) {
  const grid = document.querySelector('#character-grid');
  const observer = new MutationObserver(() => {
    if (applyPortraits()) observer.disconnect();
  });
  observer.observe(grid || document.body, { childList: true, subtree: true });
}
