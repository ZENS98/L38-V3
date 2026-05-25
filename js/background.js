(function () {
  const canvas = document.getElementById("bg");
  const context = canvas ? canvas.getContext("2d", { alpha: true }) : null;

  if (!canvas || !context) return;

  const DOT = {
    color: "rgba(255,255,255,0.78)",
    colorLine: "rgba(255,255,255,0.5)",
    desktopCount: 96,
    tabletCount: 64,
    mobileCount: 42,
    maxCount: 150,
    vX: 3,
    vY: 3,
    range: 150,
    maxDevicePixelRatio: 2
  };

  const dots = [];
  const pointer = { x: 0, y: 0, active: false };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrame = 0;
  let resizeTimer = 0;

  class Dot {
    constructor(x, y, vx, vy, r) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.r = r;
    }

    update() {
      if (this.x - this.r >= width) {
        this.x = -this.r;
        this.vy = (Math.random() - 0.5) * DOT.vY;
      }

      if (this.x + this.r < 0) {
        this.x = width + this.r;
        this.vy = (Math.random() - 0.5) * DOT.vY;
      }

      if (this.y - this.r >= height) {
        this.y = -this.r;
        this.vx = (Math.random() - 0.5) * DOT.vX;
      }

      if (this.y + this.r < 0) {
        this.y = height + this.r;
        this.vx = (Math.random() - 0.5) * DOT.vX;
      }

      this.x += this.vx;
      this.y += this.vy;
    }

    draw() {
      context.beginPath();
      context.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
      context.fillStyle = DOT.color;
      context.fill();
    }
  }

  const getDotCount = () => {
    if (window.innerWidth < 640) return DOT.mobileCount;
    if (window.innerWidth < 1024) return DOT.tabletCount;
    return DOT.desktopCount;
  };

  const createDot = (x, y) => {
    const r = Math.random() * 3 + 3;
    const vx = (Math.random() - 0.5) * DOT.vX;
    const vy = (Math.random() - 0.5) * DOT.vY;
    return new Dot(x, y, vx, vy, r);
  };

  const seedDots = () => {
    dots.length = 0;
    const count = getDotCount();

    for (let i = 0; i < count; i += 1) {
      dots.push(createDot(Math.random() * width, Math.random() * height));
    }
  };

  // Resize handling: draw at retina density while keeping CSS pixels for physics.
  const resizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, DOT.maxDevicePixelRatio);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    seedDots();
  };

  const scheduleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resizeCanvas, 120);
  };

  const drawBackground = () => {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#92fe9d');
    gradient.addColorStop(1, '#00c9ff');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  };

  // Line connection logic: distance controls both width and opacity, as in the source demo.
  const drawConnections = () => {
    const range = DOT.range;
    const rangeSquared = range * range;

    for (let i = 0; i < dots.length; i += 1) {
      const current = dots[i];

      for (let j = i + 1; j < dots.length; j += 1) {
        const near = dots[j];
        const dx = current.x - near.x;
        const dy = current.y - near.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared >= rangeSquared) continue;

        const distance = Math.sqrt(distanceSquared);
        const strength = (range - distance) / range;

        context.beginPath();
        context.moveTo(current.x, current.y);
        context.lineTo(near.x, near.y);
        context.lineWidth = strength * 2;
        context.strokeStyle = `rgba(255,255,255,${0.5 * strength})`;
        context.stroke();
      }

      if (pointer.active) {
        const dx = current.x - pointer.x;
        const dy = current.y - pointer.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < rangeSquared) {
          const distance = Math.sqrt(distanceSquared);
          const strength = (range - distance) / range;
          context.beginPath();
          context.moveTo(current.x, current.y);
          context.lineTo(pointer.x, pointer.y);
          context.lineWidth = strength * 1.4;
          context.strokeStyle = `rgba(255,255,255,${0.34 * strength})`;
          context.stroke();
        }
      }
    }
  };

  // Animation loop: background, moving dots, then connection lines.
  const animate = () => {
    drawBackground();

    context.save();
    context.shadowColor = "rgba(255,255,255,0.5)";
    context.shadowBlur = 10;

    for (let i = 0; i < dots.length; i += 1) {
      dots[i].update();
      dots[i].draw();
    }

    context.restore();
    drawConnections();

    if (dots.length > DOT.maxCount) {
      dots.splice(0, dots.length - DOT.maxCount);
    }

    animationFrame = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (animationFrame) return;
    animationFrame = window.requestAnimationFrame(animate);
  };

  const stop = () => {
    if (!animationFrame) return;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  const isInteractiveTarget = (target) => (
    target instanceof Element &&
    target.closest("a, button, input, textarea, select, label, iframe")
  );

  const spawnDots = (x, y) => {
    for (let i = 0; i < 3; i += 1) {
      dots.push(createDot(x, y));
    }
  };

  const handleClick = (event) => {
    if (isInteractiveTarget(event.target)) return;
    spawnDots(event.clientX, event.clientY);
  };

  const handlePointerMove = (event) => {
    pointer.active = true;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  };

  const handlePointerLeave = () => {
    pointer.active = false;
  };

  const handleTouch = (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    pointer.active = true;
    pointer.x = touch.clientX;
    pointer.y = touch.clientY;
  };

  const handleVisibility = () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  };

  const cleanup = () => {
    stop();
    window.clearTimeout(resizeTimer);
    window.removeEventListener("resize", scheduleResize);
    window.removeEventListener("click", handleClick);
    window.removeEventListener("mousemove", handlePointerMove);
    window.removeEventListener("mouseleave", handlePointerLeave);
    window.removeEventListener("touchstart", handleTouch);
    window.removeEventListener("touchmove", handleTouch);
    window.removeEventListener("beforeunload", cleanup);
    document.removeEventListener("visibilitychange", handleVisibility);
  };

  resizeCanvas();
  start();

  window.addEventListener("resize", scheduleResize, { passive: true });
  window.addEventListener("click", handleClick);
  window.addEventListener("mousemove", handlePointerMove, { passive: true });
  window.addEventListener("mouseleave", handlePointerLeave);
  window.addEventListener("touchstart", handleTouch, { passive: true });
  window.addEventListener("touchmove", handleTouch, { passive: true });
  window.addEventListener("beforeunload", cleanup);
  document.addEventListener("visibilitychange", handleVisibility);
}());
