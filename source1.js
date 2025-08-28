// ==UserScript==
// @name         ShellShockers LEBMOD
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Mod menu with Crosshair, Ping, Clock, Music (ESP removed, KD + Themes removed)
// @author       You
// @match        *://shellshock.io/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    let crosshairEnabled = true;
    let pingEnabled = false;
    let musicEnabled = false;
    let clockRunning = false;
    let clockSeconds = 0;
    let clockInterval;

    let pingDiv, clockDiv, audio;
    let menuVisible = true;

    // --- Base Styles ---
    GM_addStyle(`
        #lebmodMenu {
            position: fixed;
            top: 100px;
            right: 50px;
            width: 260px;
            border-radius: 10px;
            padding: 8px;
            font-family: monospace;
            font-size: 14px;
            z-index: 10000;
            cursor: grab;
            background: #111;
            color: #0f0;
            border: 2px solid #0f0;
        }
        #lebmodMenu h1 {
            text-align: center;
            font-size: 18px;
            margin: 5px 0;
            padding-bottom: 4px;
            border-bottom: 2px solid #0f0;
            cursor: grab;
        }
        .category {
            margin-top: 8px;
            border-radius: 6px;
        }
        .category-header {
            padding: 4px;
            cursor: pointer;
            font-weight: bold;
            background: #111;
            border: 1px solid #0f0;
        }
        .category-content {
            display: none;
            padding: 6px;
            background: #111;
        }
        .lebmodToggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 6px 0;
        }
        .lebmodToggle label { flex: 1; }
        .lebmodToggle input,
        .lebmodToggle button {
            transform: scale(1.1);
            cursor: pointer;
            background: #111;
            color: #0f0;
            border: 1px solid #0f0;
        }

        /* Crosshair */
        #customCrosshair {
            position: fixed;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9999;
        }
        #customCrosshair::before,
        #customCrosshair::after {
            content: "";
            position: absolute;
            background: linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet);
        }
        #customCrosshair::before {
            top: 50%;
            left: 0;
            width: 100%;
            height: 2px;
            transform: translateY(-50%);
        }
        #customCrosshair::after {
            top: 0;
            left: 50%;
            width: 2px;
            height: 100%;
            transform: translateX(-50%);
            background: linear-gradient(180deg, red, orange, yellow, green, cyan, blue, violet);
        }

        /* Draggable displays */
        #pingCounter, #clockCounter {
            position: fixed;
            top: 10px;
            left: 10px;
            font-family: monospace;
            font-size: 14px;
            padding: 4px 6px;
            border-radius: 4px;
            z-index: 9999;
            cursor: grab;
            background: rgba(0,0,0,0.5);
            color: #0f0;
            border: 1px solid #0f0;
        }
        #clockCounter { top: 50px; }
    `);

    // --- Create menu ---
    const menu = document.createElement("div");
    menu.id = "lebmodMenu";
    menu.innerHTML = `
        <h1>LEBMOD</h1>

        <div class="category">
            <div class="category-header">[+] Displays</div>
            <div class="category-content">
                <div class="lebmodToggle">
                    <label>Show Ping</label>
                    <input type="checkbox" id="togglePing">
                </div>
                <div class="lebmodToggle">
                    <label>Clock</label>
                    <button id="clockToggle">Start</button>
                </div>
            </div>
        </div>

        <div class="category">
            <div class="category-header">[+] Crosshairs</div>
            <div class="category-content">
                <div class="lebmodToggle">
                    <label>Rainbow Crosshair</label>
                    <input type="checkbox" id="toggleCrosshair" checked>
                </div>
            </div>
        </div>

        <div class="category">
            <div class="category-header">[+] Other</div>
            <div class="category-content">
                <div class="lebmodToggle">
                    <label>Music Player</label>
                    <input type="checkbox" id="toggleMusic">
                </div>
                <input type="file" id="musicFile" accept="audio/*" style="width:100%; margin-top:6px; display:none;">
                <button id="musicPlayPause" style="width:100%; margin-top:4px; display:none;">Play</button>
            </div>
        </div>
    `;
    document.body.appendChild(menu);

    // Expand/collapse
    menu.querySelectorAll(".category-header").forEach(header => {
        header.addEventListener("click", () => {
            const content = header.nextElementSibling;
            const isOpen = content.style.display === "block";
            content.style.display = isOpen ? "none" : "block";
            header.textContent = header.textContent.replace(isOpen ? "[-]" : "[+]", isOpen ? "[+]" : "[-]");
        });
    });

    // Dragging
    function makeDraggable(el) {
        let isDragging = false, offsetX, offsetY;
        el.addEventListener("mousedown", e => {
            isDragging = true;
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
            el.style.cursor = "grabbing";
            e.preventDefault();
        });
        document.addEventListener("mousemove", e => {
            if (isDragging) {
                el.style.left = (e.clientX - offsetX) + "px";
                el.style.top = (e.clientY - offsetY) + "px";
                el.style.right = "auto";
            }
        });
        document.addEventListener("mouseup", () => { isDragging = false; el.style.cursor = "grab"; });
    }
    makeDraggable(menu);

    // Crosshair
    const crosshair = document.createElement("div");
    crosshair.id = "customCrosshair";
    document.body.appendChild(crosshair);
    crosshair.style.display = crosshairEnabled ? "block" : "none";
    document.getElementById("toggleCrosshair").addEventListener("change", e => {
        crosshairEnabled = e.target.checked;
        crosshair.style.display = crosshairEnabled ? "block" : "none";
    });

    // Ping
    function startPing() {
        if (pingDiv) return;
        pingDiv = document.createElement("div");
        pingDiv.id = "pingCounter";
        pingDiv.textContent = "Ping: ...";
        document.body.appendChild(pingDiv);
        makeDraggable(pingDiv);

        async function pingLoop() {
            while (pingEnabled) {
                const start = performance.now();
                await fetch(location.href, { method: "HEAD", cache: "no-cache" }).catch(()=>{});
                const latency = Math.round(performance.now() - start);
                pingDiv.textContent = "Ping: " + latency + " ms";
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        pingLoop();
    }
    function stopPing() { if (pingDiv) { pingDiv.remove(); pingDiv = null; } }

    // Clock
    function initClock() {
        if (clockDiv) return;
        clockDiv = document.createElement("div");
        clockDiv.id = "clockCounter";
        clockDiv.textContent = "Clock: 0:00";
        document.body.appendChild(clockDiv);
        clockDiv.style.display = "none";
        makeDraggable(clockDiv);
    }
    initClock();

    function updateClock() {
        let mins = Math.floor(clockSeconds / 60);
        let secs = clockSeconds % 60;
        clockDiv.textContent = `Clock: ${mins}:${secs.toString().padStart(2,'0')}`;
    }

    document.getElementById("clockToggle").addEventListener("click", function () {
        if (!clockRunning) {
            clockRunning = true;
            clockDiv.style.display = "block";
            this.textContent = "Stop";
            clockInterval = setInterval(() => { clockSeconds++; updateClock(); }, 1000);
        } else {
            clockRunning = false;
            this.textContent = "Start";
            clearInterval(clockInterval);
            clockSeconds = 0;
            updateClock();
            clockDiv.style.display = "none";
        }
    });

    // Music
    const musicFile = document.getElementById("musicFile");
    const musicPlayPause = document.getElementById("musicPlayPause");
    function startMusic() { musicFile.style.display = "block"; musicPlayPause.style.display = "block"; }
    function stopMusic() { musicFile.style.display = "none"; musicPlayPause.style.display = "none"; if (audio) { audio.pause(); audio=null; } }

    musicFile.addEventListener("change", e => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => { if (audio) audio.pause(); audio = new Audio(evt.target.result); audio.loop = true; };
        reader.readAsDataURL(file);
    });
    musicPlayPause.addEventListener("click", () => {
        if (!audio) return;
        if (audio.paused) { audio.play(); musicPlayPause.textContent="Pause"; }
        else { audio.pause(); musicPlayPause.textContent="Play"; }
    });

    // --- Toggles ---
    document.getElementById("togglePing").addEventListener("change", e => { pingEnabled = e.target.checked; if (pingEnabled) startPing(); else stopPing(); });
    document.getElementById("toggleMusic").addEventListener("change", e => { musicEnabled = e.target.checked; if (musicEnabled) startMusic(); else stopMusic(); });

    // Toggle menu with 0
    window.addEventListener("keydown", e => {
        if (e.key === "0") {
            menuVisible = !menuVisible;
            menu.style.display = menuVisible ? "block" : "none";
        }
    });

})();
