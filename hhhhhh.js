(() => {
    "use strict";

    const canvas = document.getElementById("scene");
    const ctx = canvas.getContext("2d");

    let W, H, DPR;
    let time = 0;
    let scale = 1;
    let pulse = 1;
    let exploding = false;
    let explosionTime = 0;

    const colors = [
        "#1d4ed8",
        "#2563eb",
        "#3b82f6",
        "#60a5fa",
        "#93c5fd",
        "#bfdbfe",
        "#ffffff"
    ];

    const particles = [];
    const floating = [];
    const bursts = [];

    const TAU = Math.PI * 2;

    const random = (a, b) =>
        Math.random() * (b - a) + a;

    const pick = arr =>
        arr[Math.floor(Math.random() * arr.length)];

    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;

        canvas.width = W * DPR;
        canvas.height = H * DPR;

        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        scale = Math.min(W * 0.027, H * 0.020);
    }

    window.addEventListener("resize", resize);
    resize();

    // Fórmula matemática del corazón
    function heart(t) {
        return {
            x: 16 * Math.pow(Math.sin(t), 3),
            y: -(
                13 * Math.cos(t)
                - 5 * Math.cos(2 * t)
                - 2 * Math.cos(3 * t)
                - Math.cos(4 * t)
            )
        };
    }

    // Partículas del corazón
    class HeartParticle {
        constructor() {
            this.angle = random(0, TAU);
            this.radius = Math.random() < 0.7
                ? random(0.96, 1.03)
                : random(0.1, 0.95);

            this.size = random(1.2, 3.5);
            this.color = pick(colors);
            this.alpha = random(0.45, 1);
            this.phase = random(0, TAU);
            this.speed = random(0.001, 0.003);
        }

        draw() {
            const p = heart(this.angle);

            const cx = W / 2;
            const cy = H / 2;

            const appear = exploding
                ? Math.min(1, explosionTime / 900)
                : 1;

            const x = cx + p.x * scale * pulse * this.radius;
            const y = cy + p.y * scale * pulse * this.radius;

            const jitter = Math.sin(time * this.speed + this.phase) * 1.5;

            const px = x + jitter;
            const py = y + Math.cos(time * this.speed + this.phase) * 1.5;

            const a = this.alpha * appear;

            ctx.globalAlpha = a;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;

            ctx.beginPath();
            ctx.arc(px, py, this.size, 0, TAU);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    // Partículas ambientales
    class FloatParticle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = random(0, W);
            this.y = initial ? random(0, H) : H + 10;
            this.size = random(1, 3);
            this.speed = random(0.2, 0.8);
            this.alpha = random(0.2, 0.7);
            this.color = pick(colors);
        }

        update() {
            this.y -= this.speed;
            this.x += Math.sin(time * 0.001 + this.y) * 0.3;

            if (this.y < -10) this.reset();
        }

        draw() {
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, TAU);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    // Explosión de partículas
    class Burst {
        constructor(x, y) {
            const angle = random(0, TAU);
            const speed = random(2, 8);

            this.x = x;
            this.y = y;

            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;

            this.size = random(2, 5);
            this.life = 1;
            this.color = pick(colors);
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            this.vx *= 0.97;
            this.vy *= 0.97;

            this.vy += 0.025;
            this.life -= 0.012;

            return this.life > 0;
        }

        draw() {
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, TAU);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    // Crear partículas
    for (let i = 0; i < 900; i++) {
        particles.push(new HeartParticle());
    }

    for (let i = 0; i < 130; i++) {
        floating.push(new FloatParticle());
    }

    // Explosión
    function explode(x, y) {
        for (let i = 0; i < 180; i++) {
            bursts.push(new Burst(x, y));
        }

        exploding = true;
        explosionTime = 0;
    }

    canvas.addEventListener("pointerdown", e => {
        explode(e.clientX, e.clientY);
    });

    // Animación
    let lastTime = 0;

    function animate(now) {
        const dt = Math.min(now - lastTime || 16, 40);
        lastTime = now;
        time += dt;

        ctx.clearRect(0, 0, W, H);

        // Fondo luminoso
        const gradient = ctx.createRadialGradient(
            W / 2, H / 2, 5,
            W / 2, H / 2, Math.max(W, H) * 0.55
        );

        gradient.addColorStop(0, "#102c5a");
        gradient.addColorStop(1, "#01040c");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // Latido doble
        const seconds = time / 1000;
        const p = seconds % 1.15;

        const beat1 = Math.exp(-Math.pow((p - 0.10) / 0.055, 2));
        const beat2 = Math.exp(-Math.pow((p - 0.30) / 0.070, 2));

        pulse = 1 + (beat1 + beat2) * 0.085;

        // Partículas flotantes
        floating.forEach(p => {
            p.update();
            p.draw();
        });

        // Corazón
        particles.forEach(p => p.draw());

        // Partículas de explosión
        for (let i = bursts.length - 1; i >= 0; i--) {
            const b = bursts[i];

            if (b.update()) {
                b.draw();
            } else {
                bursts.splice(i, 1);
            }
        }

        // Reconstrucción tras la explosión
        if (exploding) {
            explosionTime += dt;

            if (explosionTime > 900) {
                exploding = false;
            }
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

})();