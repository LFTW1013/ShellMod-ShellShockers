// ==UserScript==
// @name         ShellShockers LEBMOD
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Custom draggable mod menu with Rainbow Crosshair, Ping, Music Player (no FPS spam)
// @author       You
// @match        *://shellshock.io/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    let crosshairEnabled = true;
    let pingEnabled = false;
    let musicEnabled = false;

    let pingDiv, audio;

    // --- Styles ---
    GM_addStyle(`
        #lebmodMenu {
            position: fixed;
            top: 100px;
            right: 50px;
            width: 260px;
            background: #111;
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 10px;
            font-family: monospace;
            font-size: 14px;
            color: #0f0;
            z-index: 10000;
            cursor: grab;
        }
        #lebmodMenu h1 {
            text-align: center;
            font-size: 18px;
            margin: 5px 0 10px 0;
            border-bottom: 2px solid #0f0;
            padding-bottom: 5px;
            cursor: grab;
        }
        .lebmodToggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 6px 0;
        }
        .lebmodToggle label {
            flex: 1;
        }
        .lebmodToggle input {
            transform: scale(1.2);
            cursor: pointer;
        }
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
        #pingCounter {
            position: fixed;
            top: 10px;
            left: 10px;
            font-family: monospace;
            font-size: 14px;
            color: #0f0;
            background: rgba(0,0,0,0.5);
            padding: 4px 6px;
            border-radius: 4px;
            z-index: 9999;
        }
    `);

    // --- Create menu ---
    const menu = document.createElement("div");
    menu.id = "lebmodMenu";
    menu.innerHTML = `
        <h1>LEBMOD</h1>
        <div class="lebmodToggle">
            <label>Rainbow Crosshair</label>
            <input type="checkbox" id="toggleCrosshair" checked>
        </div>
        <div class="lebmodToggle">
            <label>Show Ping</label>
            <input type="checkbox" id="togglePing">
        </div>
        <div class="lebmodToggle">
            <label>Music Player</label>
            <input type="checkbox" id="toggleMusic">
        </div>
        <input type="file" id="musicFile" accept="audio/*" style="width:100%; margin-top:6px; display:none;">
        <button id="musicPlayPause" style="width:100%; margin-top:4px; display:none;">Play</button>
    `;
    document.body.appendChild(menu);

    // --- Crosshair ---
    const crosshair = document.createElement("div");
    crosshair.id = "customCrosshair";
    document.body.appendChild(crosshair);

    document.getElementById("toggleCrosshair").addEventListener("change", function (e) {
        crosshairEnabled = e.target.checked;
        crosshair.style.display = crosshairEnabled ? "block" : "none";
    });

    // --- Ping Counter ---
    function startPing() {
        if (pingDiv) return;
        pingDiv = document.createElement("div");
        pingDiv.id = "pingCounter";
        document.body.appendChild(pingDiv);

        async function pingLoop() {
            while (pingEnabled) {
                const start = performance.now();
                await fetch(location.href, { method: "HEAD", cache: "no-cache" }).catch(()=>{});
                const end = performance.now();
                const latency = Math.round(end - start);
                pingDiv.textContent = "Ping: " + latency + " ms";
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        pingLoop();
    }
    function stopPing() {
        if (pingDiv) {
            pingDiv.remove();
            pingDiv = null;
        }
    }

    // --- Music Player ---
    const musicFile = document.getElementById("musicFile");
    const musicPlayPause = document.getElementById("musicPlayPause");

    function startMusic() {
        musicFile.style.display = "block";
        musicPlayPause.style.display = "block";
    }
    function stopMusic() {
        musicFile.style.display = "none";
        musicPlayPause.style.display = "none";
        if (audio) {
            audio.pause();
            audio = null;
        }
    }

    musicFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            if (audio) audio.pause();
            audio = new Audio(evt.target.result);
            audio.loop = true;
        };
        reader.readAsDataURL(file);
    });

    musicPlayPause.addEventListener("click", () => {
        if (!audio) return;
        if (audio.paused) {
            audio.play();
            musicPlayPause.textContent = "Pause";
        } else {
            audio.pause();
            musicPlayPause.textContent = "Play";
        }
    });

    // --- Toggle bindings ---
    document.getElementById("togglePing").addEventListener("change", (e) => {
        pingEnabled = e.target.checked;
        if (pingEnabled) startPing();
        else stopPing();
    });

    document.getElementById("toggleMusic").addEventListener("change", (e) => {
        musicEnabled = e.target.checked;
        if (musicEnabled) startMusic();
        else stopMusic();
    });

    // --- Toggle menu with key "0" ---
    let menuVisible = true;
    window.addEventListener("keydown", (e) => {
        if (e.key === "0") {
            menuVisible = !menuVisible;
            menu.style.display = menuVisible ? "block" : "none";
        }
    });

    // --- Dragging logic ---
    let isDragging = false;
    let offsetX, offsetY;
    menu.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - menu.offsetLeft;
        offsetY = e.clientY - menu.offsetTop;
        menu.style.cursor = "grabbing";
    });
    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            menu.style.left = (e.clientX - offsetX) + "px";
            menu.style.top = (e.clientY - offsetY) + "px";
            menu.style.right = "auto";
        }
    });
    document.addEventListener("mouseup", () => {
        isDragging = false;
        menu.style.cursor = "grab";
    });

})();
