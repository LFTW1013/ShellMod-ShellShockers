// ==UserScript==
// @name         Shell Shockers Enhanced HUD (Crosshairs + NameTags)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Custom crosshairs, FPS, ping, and enemy name tags (visible through walls) in Shell Shockers.
// @author       You
// @match        *://shellshock.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // === MENU CREATION ===
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '10px';
    menu.style.right = '10px';
    menu.style.background = 'rgba(0,0,0,0.7)';
    menu.style.padding = '10px';
    menu.style.borderRadius = '10px';
    menu.style.fontFamily = 'Arial, sans-serif';
    menu.style.zIndex = '999999';
    menu.style.color = '#fff';
    document.body.appendChild(menu);

    const title = document.createElement('h3');
    title.innerText = 'Game Menu';
    title.style.margin = '0 0 5px 0';
    menu.appendChild(title);

    // === MENU CHECKBOXES ===
    const crosshair1Toggle = createCheckbox('Enable Crosshair 1 (Red X)');
    const crosshair2Toggle = createCheckbox('Enable Crosshair 2 (Circle + Dot)');
    const nameTagsToggle = createCheckbox('Show Name Tags (All Players)');
    const fpsToggle = createCheckbox('Show FPS');
    const pingToggle = createCheckbox('Show Ping');

    menu.appendChild(crosshair1Toggle.container);
    menu.appendChild(crosshair2Toggle.container);
    menu.appendChild(nameTagsToggle.container);
    menu.appendChild(fpsToggle.container);
    menu.appendChild(pingToggle.container);

    // === CROSSHAIRS ===
    const crosshair1 = document.createElement('div');
    crosshair1.style.position = 'fixed';
    crosshair1.style.top = '50%';
    crosshair1.style.left = '50%';
    crosshair1.style.width = '20px';
    crosshair1.style.height = '20px';
    crosshair1.style.marginLeft = '-10px';
    crosshair1.style.marginTop = '-10px';
    crosshair1.style.pointerEvents = 'none';
    crosshair1.style.zIndex = '99999';
    crosshair1.style.display = 'none';
    crosshair1.innerHTML = `<svg width="20" height="20"><line x1="0" y1="0" x2="20" y2="20" stroke="red" stroke-width="2"/><line x1="20" y1="0" x2="0" y2="20" stroke="red" stroke-width="2"/></svg>`;
    document.body.appendChild(crosshair1);

    const crosshair2 = document.createElement('div');
    crosshair2.style.position = 'fixed';
    crosshair2.style.top = '50%';
    crosshair2.style.left = '50%';
    crosshair2.style.width = '30px';
    crosshair2.style.height = '30px';
    crosshair2.style.marginLeft = '-15px';
    crosshair2.style.marginTop = '-15px';
    crosshair2.style.pointerEvents = 'none';
    crosshair2.style.zIndex = '99999';
    crosshair2.style.display = 'none';
    crosshair2.innerHTML = `<svg width="30" height="30">
        <circle cx="15" cy="15" r="14" stroke="red" stroke-width="2" fill="none"/>
        <circle cx="15" cy="15" r="2" fill="red"/>
    </svg>`;
    document.body.appendChild(crosshair2);

    // === FPS COUNTER ===
    const fpsCounter = document.createElement('div');
    fpsCounter.style.position = 'fixed';
    fpsCounter.style.bottom = '10px';
    fpsCounter.style.left = '10px';
    fpsCounter.style.color = '#0f0';
    fpsCounter.style.fontWeight = 'bold';
    fpsCounter.style.fontSize = '16px';
    fpsCounter.style.zIndex = '99999';
    fpsCounter.style.display = 'none';
    document.body.appendChild(fpsCounter);

    let lastFrame = performance.now();
    let frames = 0;
    let fps = 0;
    function updateFPS() {
        frames++;
        const now = performance.now();
        if (now - lastFrame >= 1000) {
            fps = frames;
            frames = 0;
            lastFrame = now;
            fpsCounter.innerText = `FPS: ${fps}`;
        }
        requestAnimationFrame(updateFPS);
    }
    updateFPS();

    // === PING DISPLAY ===
    const pingDisplay = document.createElement('div');
    pingDisplay.style.position = 'fixed';
    pingDisplay.style.bottom = '30px';
    pingDisplay.style.left = '10px';
    pingDisplay.style.color = '#0f0';
    pingDisplay.style.fontWeight = 'bold';
    pingDisplay.style.fontSize = '16px';
    pingDisplay.style.zIndex = '99999';
    pingDisplay.style.display = 'none';
    document.body.appendChild(pingDisplay);

    async function getPing() {
        const start = performance.now();
        try {
            await fetch(window.location.origin, { method: 'HEAD', cache: 'no-cache' });
            const latency = Math.round(performance.now() - start);
            pingDisplay.innerText = `Ping: ${latency} ms`;
        } catch {
            pingDisplay.innerText = `Ping: Error`;
        }
    }
    setInterval(getPing, 2000);

    // === NAME TAGS (VISIBLE THROUGH WALLS) ===
    function updateNameTags() {
        const allPlayers = document.querySelectorAll('*');
        allPlayers.forEach(el => {
            if (el.innerText && el.innerText.length > 0 && el.className && el.className.toLowerCase().includes('name')) {
                el.style.display = nameTagsToggle.input.checked ? 'block' : 'none';
                el.style.color = 'red';
                el.style.fontWeight = 'bold';
                el.style.fontSize = '14px';
                el.style.textShadow = '1px 1px 3px black';
                el.style.position = 'relative';
                el.style.zIndex = '999999'; // Forces on top of everything
            }
        });
    }
    setInterval(updateNameTags, 300);

    // === TOGGLE EVENTS ===
    crosshair1Toggle.input.addEventListener('change', () => {
        crosshair1.style.display = crosshair1Toggle.input.checked ? 'block' : 'none';
    });
    crosshair2Toggle.input.addEventListener('change', () => {
        crosshair2.style.display = crosshair2Toggle.input.checked ? 'block' : 'none';
    });
    fpsToggle.input.addEventListener('change', () => {
        fpsCounter.style.display = fpsToggle.input.checked ? 'block' : 'none';
    });
    pingToggle.input.addEventListener('change', () => {
        pingDisplay.style.display = pingToggle.input.checked ? 'block' : 'none';
    });

    // === HELPER: CHECKBOX CREATION ===
    function createCheckbox(label) {
        const container = document.createElement('div');
        const input = document.createElement('input');
        input.type = 'checkbox';
        const span = document.createElement('span');
        span.innerText = label;
        container.appendChild(input);
        container.appendChild(span);
        container.style.marginBottom = '5px';
        return { container, input };
    }

})();
