'use strict';

// Bomber Tribe v1.4.5, analoge mobiele joystick met acht richtingen.
const mobileJoystick = document.getElementById('mobileJoystick');
const mobileJoystickKnob = document.getElementById('mobileJoystickKnob');

if (mobileJoystick && mobileJoystickKnob) {
  let joystickPointerId = null;

  function resetJoystick() {
    joystickPointerId = null;
    touchDirections.clear();
    mobileJoystick.classList.remove('active');
    mobileJoystickKnob.style.transform = 'translate(-50%, -50%)';
  }

  function updateJoystick(clientX, clientY) {
    const rect = mobileJoystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const maxOffset = Math.min(rect.width, rect.height) * 0.32;
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > maxOffset ? maxOffset / distance : 1;
    const knobX = rawX * scale;
    const knobY = rawY * scale;

    mobileJoystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    touchDirections.clear();
    if (distance < maxOffset * 0.18) return;

    const normalizedX = rawX / Math.max(distance, 1);
    const normalizedY = rawY / Math.max(distance, 1);
    const diagonalThreshold = 0.34;

    if (normalizedX <= -diagonalThreshold) touchDirections.add('left');
    if (normalizedX >= diagonalThreshold) touchDirections.add('right');
    if (normalizedY <= -diagonalThreshold) touchDirections.add('up');
    if (normalizedY >= diagonalThreshold) touchDirections.add('down');
  }

  mobileJoystick.addEventListener('pointerdown', event => {
    if (joystickPointerId !== null) return;
    event.preventDefault();
    joystickPointerId = event.pointerId;
    mobileJoystick.classList.add('active');
    mobileJoystick.setPointerCapture?.(event.pointerId);
    updateJoystick(event.clientX, event.clientY);
  }, { passive: false });

  mobileJoystick.addEventListener('pointermove', event => {
    if (event.pointerId !== joystickPointerId) return;
    event.preventDefault();
    updateJoystick(event.clientX, event.clientY);
  }, { passive: false });

  const stopJoystick = event => {
    if (joystickPointerId !== null && event.pointerId !== undefined && event.pointerId !== joystickPointerId) return;
    event.preventDefault?.();
    resetJoystick();
  };

  mobileJoystick.addEventListener('pointerup', stopJoystick, { passive: false });
  mobileJoystick.addEventListener('pointercancel', stopJoystick, { passive: false });
  mobileJoystick.addEventListener('lostpointercapture', resetJoystick);
  window.addEventListener('blur', resetJoystick);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetJoystick();
  });
}
