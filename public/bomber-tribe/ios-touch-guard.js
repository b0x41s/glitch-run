'use strict';

// Voorkom dat iOS tijdens het spelen selectie-, kopieer- of plakmenu's opent.
const blockedInteractionEvents = [
  'copy',
  'cut',
  'paste',
  'contextmenu',
  'selectstart',
  'dragstart'
];

for (const eventName of blockedInteractionEvents) {
  document.addEventListener(eventName, event => {
    event.preventDefault();
  }, { capture: true });
}

// Wis een eventuele selectie die Safari toch kort probeert te maken.
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection?.();
  if (selection && selection.rangeCount) selection.removeAllRanges();
});
