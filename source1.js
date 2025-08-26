// ==UserScript==
// @name         ShellShockers LEBMOD 
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Custom draggable mod menu with toggles (Rainbow Crosshair example)
// @author       You
// @match        *://shellshock.io/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    let crosshairEnabled = true;

    // --- Styles ---
    GM_addStyle(`
        /* Menu container */
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
    `;
    document.body.appendChild(menu);

    // --- Crosshair ---
    const crosshair = document.createElement("div");
    crosshair.id = "customCrosshair";
    document.body.appendChild(crosshair);

    // --- Toggle logic ---
    document.getElementById("toggleCrosshair").addEventListener("change", function (e) {
        crosshairEnabled = e.target.checked;
        crosshair.style.display = crosshairEnabled ? "block" : "none";
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
            menu.style.right = "auto"; // unlock from right
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        menu.style.cursor = "grab";
    });
})();
