'use strict';

// Bomber Tribe v1.4.2, bots volgen tegelcentra voordat ze een bocht maken.
moveBotToTarget = function moveBotGridAligned(bot, dt) {
  if (!bot.target) return;

  const step = Math.max(0, bot.speed * dt);
  const currentTileX = Math.floor(bot.x);
  const currentTileY = Math.floor(bot.y);
  const currentCenterX = currentTileX + 0.5;
  const currentCenterY = currentTileY + 0.5;
  const targetCenterX = bot.target.x + 0.5;
  const targetCenterY = bot.target.y + 0.5;

  const horizontalTarget = bot.target.y === currentTileY && bot.target.x !== currentTileX;
  const verticalTarget = bot.target.x === currentTileX && bot.target.y !== currentTileY;

  let moveX = 0;
  let moveY = 0;

  if (horizontalTarget) {
    const laneCorrection = currentCenterY - bot.y;

    if (Math.abs(laneCorrection) > 0.012) {
      moveY = clamp(laneCorrection, -step, step);
    } else {
      bot.y = currentCenterY;
      moveX = clamp(targetCenterX - bot.x, -step, step);
    }
  } else if (verticalTarget) {
    const laneCorrection = currentCenterX - bot.x;

    if (Math.abs(laneCorrection) > 0.012) {
      moveX = clamp(laneCorrection, -step, step);
    } else {
      bot.x = currentCenterX;
      moveY = clamp(targetCenterY - bot.y, -step, step);
    }
  } else {
    // Het doel ligt al in dezelfde tegel. Eerst exact naar het midden lopen,
    // daarna kan de volgende route-tegel zonder afsnijden worden gekozen.
    const remainingX = targetCenterX - bot.x;
    const remainingY = targetCenterY - bot.y;

    if (Math.abs(remainingX) > 0.012) {
      moveX = clamp(remainingX, -step, step);
    } else if (Math.abs(remainingY) > 0.012) {
      moveY = clamp(remainingY, -step, step);
    } else {
      bot.x = targetCenterX;
      bot.y = targetCenterY;
      return;
    }
  }

  if (moveX !== 0) bot.facing = Math.sign(moveX);
  moveEntity(bot, moveX, moveY);

  if (Math.abs(bot.x - targetCenterX) < 0.012) bot.x = targetCenterX;
  if (Math.abs(bot.y - targetCenterY) < 0.012) bot.y = targetCenterY;
};
