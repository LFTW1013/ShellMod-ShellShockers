// ==UserScript==
// @name         ShellShockers ShellMod
// @namespace    http://tampermonkey.net/
// @version      1.10
// @description  ShellMod, a client-side UI mod for shellshockers.
// @author       LFTW1013
// @match        *://shellshock.io/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    let crosshairEnabled = true;
    let rainbowEnabled = false;
    let circleEnabled = false;
    let pingEnabled = false;
    let fpsEnabled = false;
    let musicEnabled = false;
    let youtubeEnabled = false;
    let clockRunning = false;
    let clockSeconds = 0;
    let clockInterval;
    let crosshairSize = 40;
    let crosshairThickness = 2;
    let pingDiv, clockDiv, fpsDiv, audio, ytPlayer, afkTimerDiv;
    let menuVisible = true;
    let afkEnabled = false;
    let afkSeconds = 0;
    let afkInterval;
    let lastActivityTime = Date.now();
    let pingAlertEnabled = false;
    let pingThreshold = 150;
    let currentPreset = "default";
    let currentDisplayTheme = "default";

    GM_addStyle(`
        #shellmodMenu { position: fixed; top: 100px; right: 50px; width: 320px; border-radius: 10px; padding: 24px 8px 8px 8px; font-family: monospace; font-size: 13px; z-index: 10000; background: #111; color: #0f0; border: 2px solid #0f0; }
        #shellmodMenu h1 { text-align: center; font-size: 18px; margin: 5px 0; padding-bottom: 4px; border-bottom: 2px solid #0f0; }
        .search-container { margin: 8px 0; position: relative; }
        .search-input { width: 100%; padding: 6px 30px 6px 8px; background: #111; color: #0f0; border: 1px solid #0f0; border-radius: 4px; font-family: monospace; font-size: 13px; }
        .search-input::placeholder { color: #0a0; opacity: 0.7; }
        .search-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #0f0; font-size: 16px; display: none; }
        .search-results { margin: 8px 0; padding: 6px; background: rgba(0,255,0,0.1); border: 1px solid #0f0; border-radius: 4px; display: none; max-height: 200px; overflow-y: auto; }
        .search-result-item { padding: 4px; margin: 2px 0; cursor: pointer; border-radius: 3px; }
        .search-result-item:hover { background: rgba(0,255,0,0.2); }
        .search-highlight { background: rgba(255,255,0,0.3); }
        .no-results { padding: 8px; text-align: center; opacity: 0.7; }
        .category { margin-top: 8px; border-radius: 6px; }
        .category-header { padding: 4px; cursor: pointer; font-weight: bold; background: #111; border: 1px solid #0f0; }
        .category-content { display: none; padding: 6px; background: #111; }
        .shellmodToggle { margin: 6px 0; }
        .shellmodToggle label { display:block; margin-bottom: 4px; }
        .colorRow { display:flex; gap:6px; flex-wrap:wrap; align-items: center; }
        .shellmodToggle input[type="checkbox"], select, button, input[type="range"] { cursor:pointer; }

        /* NEW COLOR PICKER STYLES */
        input[type="color"] { -webkit-appearance: none; border: 1px solid #0f0; width: 50px; height: 25px; background: #111; padding: 0; cursor: pointer; border-radius: 4px; vertical-align: middle; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 3px; }

        hr { border: 1px solid #0f0; margin:6px 0; }
        #customCrosshair { position: fixed; top:50%; left:50%; pointer-events: none; z-index:9999; }
        #customCrosshair .hLine, #customCrosshair .vLine, #customCrosshair .circle { position: absolute; background: #0f0; }
        #customCrosshair .circle { border-radius:50%; border:2px solid transparent; display:none; background:none; }
        #pingCounter, #clockCounter, #afkTimer { position: fixed; top: 10px; left: 10px; font-family: monospace; font-size: 14px; padding: 4px 6px; border-radius: 4px; z-index: 9999; cursor: grab; background: rgba(0,0,0,0.5); color: #0f0; border: 1px solid #0f0; }
        #clockCounter { top: 50px; }
        #fpsCounter { position: fixed; top: 90px; left: 10px; font-family: monospace; font-size: 14px; padding: 4px 6px; border-radius: 4px; z-index: 9999; cursor: grab; background: rgba(0,0,0,0.5); color: #0f0; border: 1px solid #0f0; }
        #afkTimer { top: 130px; }
        #dragHandle { position: absolute; top:2px; left:2px; width:16px; height:16px; background:#0f0; cursor:grab; border-radius:3px; }
        #shellmodGear { position: absolute; top:8px; right:8px; cursor: pointer; font-size: 18px; z-index: 10001; }
        #shellmodSettings { position: absolute; top:36px; right:8px; width: 200px; padding: 8px; background: rgba(0,0,0,0.8); color: #0f0; border-radius: 6px; display: none; font-size: 13px; z-index: 10001; }
        #shellmodSettings select, #shellmodSettings button { background: #111; color: #0f0; border: 1px solid #0f0; border-radius:4px; width:100%; margin-top:4px; }
        #ytPlayerContainer { position: fixed; bottom: 10px; right: 10px; width: 0; height: 0; overflow: hidden; z-index: 8999; }
        .yt-input { width: 100%; padding: 4px; background: #111; color: #0f0; border: 1px solid #0f0; border-radius: 4px; margin-top: 4px; font-family: monospace; font-size: 12px; }
        .ping-high { background: rgba(255,0,0,0.7) !important; color: #fff !important; animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .afk-warning { color: #ff0 !important; }
        .afk-critical { color: #f00 !important; animation: pulse 1s infinite; }
        input[type="number"] { width: 60px; padding: 2px 4px; background: #111; color: #0f0; border: 1px solid #0f0; border-radius: 3px; font-family: monospace; }
        .preset-item { padding: 6px; margin: 4px 0; background: rgba(0,255,0,0.1); border: 1px solid #0f0; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .preset-item:hover { background: rgba(0,255,0,0.2); }
        .preset-item.active { background: rgba(0,255,0,0.3); border: 2px solid #0f0; }
        .preset-delete { color: #f00; font-weight: bold; padding: 2px 6px; margin-left: 8px; }
        .preset-delete:hover { background: rgba(255,0,0,0.2); border-radius: 3px; }
        .preset-controls { display: flex; gap: 4px; margin-top: 6px; }
        .preset-controls button, .preset-controls input { flex: 1; }

        /* --- Slimmer sliders so they don't overflow the menu --- */
        #shellmodMenu input[type="range"] { width: 150px; max-width: calc(100% - 40px); display:inline-block; vertical-align: middle; }
        /* slightly smaller thumbs for range inputs */
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 16px; border-radius: 3px; }
        input[type="range"]::-moz-range-thumb { width: 12px; height: 16px; border-radius: 3px; }
    `);

    // --- Preset System ---
    const presets = {
        default: {
            name: "Default",
            crosshairEnabled: true,
            rainbowEnabled: false,
            circleEnabled: false,
            crosshairSize: 40,
            crosshairThickness: 2,
            crosshairColor: "#00ff00",
            circleColor: "#00ff00",
            pingEnabled: false,
            fpsEnabled: false,
            afkEnabled: false
        }
    };

    function saveCurrentAsPreset(presetName) {
        presets[presetName] = {
            name: presetName,
            crosshairEnabled: document.getElementById("toggleCrosshair").checked,
            rainbowEnabled: document.getElementById("toggleRainbow").checked,
            circleEnabled: document.getElementById("toggleCircle").checked,
            crosshairSize: parseInt(document.getElementById("crosshairResize").value),
            crosshairThickness: parseInt(document.getElementById("crosshairThickness").value),
            crosshairColor: document.getElementById("crosshairColorPicker").value,
            circleColor: document.getElementById("circleColorPicker").value,
            pingEnabled: pingEnabled,
            fpsEnabled: fpsEnabled,
            afkEnabled: afkEnabled
        };

        localStorage.setItem("shellmodPresets_v2", JSON.stringify(presets));
        updatePresetList();
    }

    function loadPreset(presetName) {
        const preset = presets[presetName];
        if (!preset) return;

        currentPreset = presetName;

        // stop all active features first
        if (pingEnabled) stopPing();
        if (fpsEnabled) stopFPS();
        if (afkEnabled) stopAFKTimer();

        // load crosshair settings
        document.getElementById("toggleCrosshair").checked = preset.crosshairEnabled;
        document.getElementById("toggleRainbow").checked = preset.rainbowEnabled;
        document.getElementById("toggleCircle").checked = preset.circleEnabled; // Load circle toggle
        document.getElementById("crosshairResize").value = preset.crosshairSize;
        document.getElementById("crosshairThickness").value = preset.crosshairThickness;

        // load colors
        document.getElementById("crosshairColorPicker").value = preset.crosshairColor || "#00ff00";
        document.getElementById("circleColorPicker").value = preset.circleColor || "#00ff00";

        crosshairSize = parseInt(preset.crosshairSize);
        crosshairThickness = parseInt(preset.crosshairThickness);

        // load display settings
        document.getElementById("togglePing").checked = preset.pingEnabled;
        document.getElementById("toggleFPS").checked = preset.fpsEnabled;
        document.getElementById("toggleAFK").checked = preset.afkEnabled;

        // apply settings
        pingEnabled = preset.pingEnabled;
        fpsEnabled = preset.fpsEnabled;
        afkEnabled = preset.afkEnabled;
        circleEnabled = preset.circleEnabled;

        if (pingEnabled) startPing();
        if (fpsEnabled) startFPS();
        if (afkEnabled) startAFKTimer();

        updateCrosshair();
        updatePresetList();
    }

    function deletePreset(presetName) {
        if (presetName === "default") {
            alert("Cannot delete default preset!");
            return;
        }
        delete presets[presetName];
        localStorage.setItem("shellmodPresets_v2", JSON.stringify(presets));
        if (currentPreset === presetName) {
            currentPreset = "default";
            loadPreset("default");
        }
        updatePresetList();
    }

    function updatePresetList() {
        const container = document.getElementById("presetList");
        if(!container) return;
        container.innerHTML = "";

        Object.keys(presets).forEach(key => {
            const preset = presets[key];
            const div = document.createElement("div");
            div.className = "preset-item" + (currentPreset === key ? " active" : "");
            div.innerHTML = `
                <span>${preset.name}</span>
                ${key !== "default" ? `<span class="preset-delete" data-preset="${key}">✕</span>` : ""}
            `;

            div.addEventListener("click", (e) => {
                if (!e.target.classList.contains("preset-delete")) {
                    loadPreset(key);
                }
            });

            const deleteBtn = div.querySelector(".preset-delete");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete preset "${preset.name}"?`)) {
                        deletePreset(key);
                    }
                });
            }

            container.appendChild(div);
        });
    }

    // load saved presets from localStorage
    const savedPresets = localStorage.getItem("shellmodPresets_v2");
    if (savedPresets) {
        try {
            const parsed = JSON.parse(savedPresets);
            Object.assign(presets, parsed);
        } catch (e) {
            console.error("Failed to load presets:", e);
        }
    }

    // --- Menu ---
    const menu = document.createElement("div");
    menu.id = "shellmodMenu";
    menu.innerHTML = `
        <div id="dragHandle"></div>
        <h1>ShellMod</h1>
        <div class="search-container">
            <input type="text" class="search-input" id="modSearch" placeholder="Search mods...">
            <span class="search-clear" id="searchClear">×</span>
        </div>
        <div class="search-results" id="searchResults"></div>
        <div class="category">
            <div class="category-header">[+] Displays</div>
            <div class="category-content">
                <div class="shellmodToggle"><label>Show Ping</label><input type="checkbox" id="togglePing"></div>
                <div class="shellmodToggle" id="pingAlertContainer" style="display:none;">
                    <label>Ping Alert (threshold ms): <input type="number" id="pingThresholdInput" value="150" min="50" max="999"></label>
                    <label style="margin-top:4px;"><input type="checkbox" id="togglePingAlert"> Enable Alert</label>
                </div>
                <div class="shellmodToggle"><label>Show FPS</label><input type="checkbox" id="toggleFPS"></div>
                <div class="shellmodToggle"><label>Clock</label><button id="clockToggle">Start</button></div>
                <div class="shellmodToggle"><label>AFK Timer</label><input type="checkbox" id="toggleAFK"></div>
            </div>
        </div>
        <div class="category">
            <div class="category-header">[+] Crosshairs</div>
            <div class="category-content">
                <div class="shellmodToggle"><label>Enable Crosshair</label><input type="checkbox" id="toggleCrosshair" checked></div>
                <div class="shellmodToggle"><label>Rainbow Mode</label><input type="checkbox" id="toggleRainbow"></div>
                <div class="shellmodToggle"><label>Resize</label><input type="range" id="crosshairResize" min="20" max="100" value="40"></div>
                <div class="shellmodToggle"><label>Thickness</label><input type="range" id="crosshairThickness" min="1" max="10" value="2"></div>
                <hr>
                <div class="shellmodToggle">
                    <label>Standard Color:</label>
                    <div class="colorRow">
                        <input type="color" id="crosshairColorPicker" value="#00ff00">
                    </div>
                </div>
                <hr>
                <div class="shellmodToggle">
                    <div class="colorRow">
                         <label style="margin:0; flex:1;">Enable Circle</label>
                         <input type="checkbox" id="toggleCircle">
                    </div>
                    <label style="margin-top:6px;">Circle Color:</label>
                    <div class="colorRow">
                        <input type="color" id="circleColorPicker" value="#00ff00">
                    </div>
                </div>
            </div>
        </div>
        <div class="category">
            <div class="category-header">[+] Presets</div>
            <div class="category-content">
                <div id="presetList"></div>
                <div class="preset-controls">
                    <input type="text" id="presetName" placeholder="Preset name..." style="background: #111; color: #0f0; border: 1px solid #0f0; border-radius: 4px; padding: 4px; font-family: monospace; font-size: 12px;">
                    <button id="savePreset">Save</button>
                </div>
            </div>
        </div>
        <div class="category">
            <div class="category-header">[+] Other</div>
            <div class="category-content">
                <div class="shellmodToggle"><label>Music Player</label><input type="checkbox" id="toggleMusic"></div>
                <input type="file" id="musicFile" accept="audio/*" style="width:100%; margin-top:6px; display:none;">
                <button id="musicPlayPause" style="width:100%; margin-top:4px; display:none;">Play</button>
                <div class="shellmodToggle" style="display:none;" id="musicVolumeContainer"><label>Volume</label><input type="range" id="musicVolume" min="0" max="100" value="100"></div>
                <hr>
                <div class="shellmodToggle"><label>YouTube Player</label><input type="checkbox" id="toggleYoutube"></div>
                <div id="youtubeControls" style="display:none;">
                    <input type="text" id="ytLink" class="yt-input" placeholder="Paste YouTube URL here...">
                    <div style="display:flex; gap:4px; margin-top:4px;">
                        <button id="ytLoad" style="flex:1;">Load</button>
                        <button id="ytPlayPause" style="flex:1;">Play</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(menu);

    // --- Search ---
    const searchInput = document.getElementById("modSearch");
    const searchClear = document.getElementById("searchClear");
    const searchResults = document.getElementById("searchResults");

    const searchableItems = [
        { category: "Displays", name: "Show Ping", element: "#togglePing" },
        { category: "Displays", name: "Ping Alert", element: "#togglePingAlert" },
        { category: "Displays", name: "Show FPS", element: "#toggleFPS" },
        { category: "Displays", name: "Clock", element: "#clockToggle" },
        { category: "Displays", name: "AFK Timer", element: "#toggleAFK" },
        { category: "Crosshairs", name: "Enable Crosshair", element: "#toggleCrosshair" },
        { category: "Crosshairs", name: "Rainbow Crosshair", element: "#toggleRainbow" },
        { category: "Crosshairs", name: "Crosshair Resize", element: "#crosshairResize" },
        { category: "Crosshairs", name: "Crosshair Thickness", element: "#crosshairThickness" },
        { category: "Crosshairs", name: "Crosshair Color", element: "#crosshairColorPicker" },
        { category: "Crosshairs", name: "Enable Circle", element: "#toggleCircle" },
        { category: "Crosshairs", name: "Circle Color", element: "#circleColorPicker" },
        { category: "Presets", name: "Save Preset", element: "#savePreset" },
        { category: "Presets", name: "Load Preset", element: "#presetList" },
        { category: "Other", name: "Music Player", element: "#toggleMusic" },
        { category: "Other", name: "YouTube Player", element: "#toggleYoutube" }
    ];

    searchInput.addEventListener("input", function() {
        const query = this.value.toLowerCase().trim();

        if (query.length === 0) {
            searchResults.style.display = "none";
            searchClear.style.display = "none";
            removeHighlights();
            return;
        }

        searchClear.style.display = "block";
        const matches = searchableItems.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No mods found</div>';
            searchResults.style.display = "block";
            return;
        }

        searchResults.innerHTML = matches.map(item =>
            `<div class="search-result-item" data-element="${item.element}">
                <strong>${item.category}</strong> → ${highlightMatch(item.name, query)}
            </div>`
        ).join("");
        searchResults.style.display = "block";

        setTimeout(() => {
            document.querySelectorAll(".search-result-item").forEach(item => {
                item.addEventListener("click", function() {
                    const elementSelector = this.getAttribute("data-element");
                    scrollToElement(elementSelector);
                    highlightElement(elementSelector);
                    searchResults.style.display = "none";
                    searchInput.value = "";
                    searchClear.style.display = "none";
                });
            });
        }, 0);
    });

    searchClear.addEventListener("click", function() {
        searchInput.value = "";
        searchResults.style.display = "none";
        searchClear.style.display = "none";
        removeHighlights();
    });

    function highlightMatch(text, query) {
        const index = text.toLowerCase().indexOf(query);
        if (index === -1) return text;
        return text.substring(0, index) +
               '<span class="search-highlight">' +
               text.substring(index, index + query.length) +
               '</span>' +
               text.substring(index + query.length);
    }

    function scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        const categoryContent = element.closest(".category-content");
        if (categoryContent && categoryContent.style.display === "none") {
            const header = categoryContent.previousElementSibling;
            header.textContent = header.textContent.replace("[+]", "[-]");
            categoryContent.style.display = "block";
        }

        setTimeout(() => {
            const container = element.closest(".shellmodToggle") || element.parentElement;
            if (container) {
                container.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 100);
    }

    function highlightElement(selector) {
        removeHighlights();
        const element = document.querySelector(selector);
        if (!element) return;

        const container = element.closest(".shellmodToggle") || element.parentElement;
        if (container) {
            container.style.background = "rgba(0,255,0,0.2)";
            container.style.border = "1px solid #0f0";
            container.style.borderRadius = "4px";
            container.style.transition = "all 0.3s";

            setTimeout(() => {
                container.style.background = "";
                container.style.border = "";
            }, 2000);
        }
    }

    function removeHighlights() {
        document.querySelectorAll(".shellmodToggle").forEach(el => {
            el.style.background = "";
            el.style.border = "";
        });
    }

    // --- Settings  ---
    const gear = document.createElement("div");
    gear.id = "shellmodGear";
    gear.innerHTML = "⚙️";
    menu.appendChild(gear);

    const settingsPanel = document.createElement("div");
    settingsPanel.id = "shellmodSettings";
    settingsPanel.innerHTML = `
        <div style="font-weight:bold; margin-bottom:6px;">Settings</div>
        <label for="themeSelect">Theme:</label>
        <select id="themeSelect">
            <option value="default">Green/Black</option>
            <option value="macbook">MacBook Transparent</option>
        </select>
    `;
    menu.appendChild(settingsPanel);

    gear.addEventListener("click", () => {
        settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
    });

    const themeSelect = document.getElementById("themeSelect");

    function setTheme(theme) {
        currentDisplayTheme = theme;
        if (theme === "default") {
            menu.style.background = "#111";
            menu.style.color = "#0f0";
            menu.style.border = "2px solid #0f0";
            menu.style.backdropFilter = "";
            document.querySelectorAll("#shellmodMenu button, #shellmodMenu select, #shellmodMenu input[type=range], .yt-input, .search-input, input[type=color], input[type=number]").forEach(el=>{
                el.style.background="#111";
                el.style.color="#0f0";
                el.style.border="1px solid #0f0";
            });
            document.querySelectorAll(".category-header, .category-content").forEach(el=>{
                el.style.background="#111";
                el.style.color="#0f0";
                el.style.border="1px solid #0f0";
            });
        } else if (theme === "macbook") {
            menu.style.background = "rgba(255,255,255,0.2)";
            menu.style.color = "#000";
            menu.style.border = "1px solid rgba(0,0,0,0.3)";
            menu.style.backdropFilter = "blur(10px)";
            document.querySelectorAll("#shellmodMenu button, #shellmodMenu select, #shellmodMenu input[type=range], .yt-input, .search-input, input[type=color], input[type=number]").forEach(el=>{
                el.style.background="rgba(255,255,255,0.2)";
                el.style.color="#000";
                el.style.border="1px solid rgba(0,0,0,0.3)";
            });
            document.querySelectorAll(".category-header, .category-content").forEach(el=>{
                el.style.background="rgba(255,255,255,0.2)";
                el.style.color="#000";
                el.style.border="1px solid rgba(0,0,0,0.3)";
            });
        }

        // update displays immediately
        updateAllDisplayStyles();
    }

    function themeFromMenuStyles() {

        try {
            const bg = (menu.style.background || "").toLowerCase();
            if (bg.includes("rgba(255,255,255") || bg.includes("transparent") || menu.style.color === "#000" || menu.style.backdropFilter) {
                return "macbook";
            }
        } catch(e){}
        return "default";
    }


    themeSelect.addEventListener("change", () => {
        setTheme(themeSelect.value);
    });

    // --- Collapsible ---
    document.querySelectorAll(".category-header").forEach(h => h.addEventListener("click", () => {
        const content = h.nextElementSibling;
        const isOpen = content.style.display === "block";
        content.style.display = isOpen ? "none" : "block";
        if (isOpen) {
            h.textContent = h.textContent.replace("[-]", "[+]");
        } else {
            h.textContent = h.textContent.replace("[+]", "[-]");
        }
    }));

    setTimeout(() => {
        updatePresetList();

        // Save preset button
        document.getElementById("savePreset").addEventListener("click", () => {
            const name = document.getElementById("presetName").value.trim();
            if (!name) {
                alert("Please enter a preset name!");
                return;
            }
            if (name === "default") {
                alert("Cannot overwrite default preset!");
                return;
            }
            saveCurrentAsPreset(name);
            document.getElementById("presetName").value = "";
            alert(`Preset "${name}" saved!`);
        });

        // apply initial theme from select
        setTheme(themeSelect.value);

    }, 100);

    // Watch for style changes on the menu
    const mo = new MutationObserver(() => {
        const guessed = themeFromMenuStyles();
        if (guessed !== currentDisplayTheme) {
            // sync select box too
            if (themeSelect.value !== guessed) themeSelect.value = guessed;
            setTheme(guessed);
        }
    });
    mo.observe(menu, { attributes: true, attributeFilter: ['style'] });

    // --- Draggable ---
    function makeDraggable(el, handle) {
        let isDragging=false, offsetX=0, offsetY=0;
        handle.addEventListener("mousedown", e=>{
            if(e.button!==0) return;
            isDragging=true;
            offsetX=e.clientX-el.offsetLeft;
            offsetY=e.clientY-el.offsetTop;
            handle.style.cursor="grabbing";
            e.preventDefault();
        });
        document.addEventListener("mousemove", e=>{
            if(isDragging){
                el.style.left=(e.clientX-offsetX)+"px";
                el.style.top=(e.clientY-offsetY)+"px";
                el.style.right="auto";
            }
        });
        document.addEventListener("mouseup", ()=>{ isDragging=false; handle.style.cursor="grab"; });
    }
    makeDraggable(menu, document.getElementById("dragHandle"));

    // --- Crosshair ---
    const crosshair=document.createElement("div"); crosshair.id="customCrosshair";
    const hLine=document.createElement("div"); hLine.className="hLine";
    const vLine=document.createElement("div"); vLine.className="vLine";
    const circleEl=document.createElement("div"); circleEl.className="circle";
    crosshair.appendChild(hLine); crosshair.appendChild(vLine); crosshair.appendChild(circleEl);
    document.body.appendChild(crosshair);

    function updateCrosshair() {
        const rainbow = document.getElementById("toggleRainbow").checked;
        const showCircle = document.getElementById("toggleCircle").checked;
        const mainColor = document.getElementById("crosshairColorPicker").value;
        const circularColor = document.getElementById("circleColorPicker").value;

        crosshairSize = parseInt(crosshairSize) || parseInt(document.getElementById("crosshairResize").value) || 40;
        crosshairThickness = parseInt(crosshairThickness) || parseInt(document.getElementById("crosshairThickness").value) || 2;

        crosshair.style.width = crosshair.style.height = crosshairSize + "px";
        crosshair.style.top = "50%";
        crosshair.style.left = "50%";
        crosshair.style.transform = "translate(-50%, -50%)";

        hLine.style.height = crosshairThickness + "px";
        hLine.style.width = crosshairSize + "px";
        hLine.style.top = "50%";
        hLine.style.left = "50%";
        hLine.style.transform = "translate(-50%, -50%)";

        vLine.style.width = crosshairThickness + "px";
        vLine.style.height = crosshairSize + "px";
        vLine.style.top = "50%";
        vLine.style.left = "50%";
        vLine.style.transform = "translate(-50%, -50%)";

        if (rainbow) {
            hLine.style.background = "linear-gradient(to right, red, orange, yellow, green, cyan, blue, violet)";
            vLine.style.background = "linear-gradient(to bottom, red, orange, yellow, green, cyan, blue, violet)";
        } else {
            hLine.style.background = vLine.style.background = mainColor;
        }

        if(showCircle){
            circleEl.style.display="block";
            circleEl.style.width = circleEl.style.height = crosshairSize + "px";
            circleEl.style.borderWidth = crosshairThickness + "px";
            circleEl.style.borderColor = rainbow ? "#fff" : circularColor;
            circleEl.style.top = "50%";
            circleEl.style.left = "50%";
            circleEl.style.transform = "translate(-50%, -50%)";
        } else {
            circleEl.style.display="none";
        }

        crosshair.style.display = document.getElementById("toggleCrosshair").checked ? "block" : "none";
    }

    document.getElementById("toggleCrosshair").addEventListener("change",updateCrosshair);
    document.getElementById("toggleRainbow").addEventListener("change",updateCrosshair);
    document.getElementById("toggleCircle").addEventListener("change",updateCrosshair);

    // New Color Pickers Listeners
    document.getElementById("crosshairColorPicker").addEventListener("input", updateCrosshair);
    document.getElementById("circleColorPicker").addEventListener("input", updateCrosshair);

    document.getElementById("crosshairResize").addEventListener("input", e=>{ crosshairSize=parseInt(e.target.value); updateCrosshair(); });
    document.getElementById("crosshairThickness").addEventListener("input", e=>{ crosshairThickness=parseInt(e.target.value); updateCrosshair(); });
    updateCrosshair();

    // ---------- Display theme helpers ----------
    function getDisplayStyleForTheme(theme) {
        if (theme === "macbook") {
            return {
                background: "rgba(255,255,255,0.85)",
                color: "#000",
                border: "1px solid rgba(0,0,0,0.2)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
            };
        } else {
            // default green/black
            return {
                background: "rgba(0,0,0,0.5)",
                color: "#0f0",
                border: "1px solid #0f0",
                boxShadow: "none"
            };
        }
    }

    function applyDisplayStylesTo(el) {
        if(!el) return;
        const s = getDisplayStyleForTheme(currentDisplayTheme);
        el.style.background = s.background;
        el.style.color = s.color;
        el.style.border = s.border;
        el.style.boxShadow = s.boxShadow;
        el.style.fontFamily = "monospace";
        el.style.fontSize = "14px";
        el.style.padding = "4px 6px";
        el.style.borderRadius = "4px";
    }

    function updateAllDisplayStyles() {
        [pingDiv, fpsDiv, clockDiv, afkTimerDiv].forEach(el => {
            if (el) applyDisplayStylesTo(el);
        });
    }

    // --- Ping with Alert ---
    let currentPing = 0;
    function startPing(){
        if(pingDiv)return;
        pingDiv=document.createElement("div");
        pingDiv.id="pingCounter";
        pingDiv.textContent="Ping: ...";
        applyDisplayStylesTo(pingDiv);
        document.body.appendChild(pingDiv);
        makeDraggable(pingDiv, pingDiv);
        document.getElementById("pingAlertContainer").style.display = "block";

        async function loop(){
            while(pingEnabled){
                const start=performance.now();
                await fetch(location.href,{method:"HEAD",cache:"no-cache"}).catch(()=>{});
                const latency=Math.round(performance.now()-start);
                currentPing = latency;

                if(pingDiv) {
                    pingDiv.textContent="Ping: "+latency+" ms";

                    if(pingAlertEnabled && latency > pingThreshold) {
                        pingDiv.classList.add("ping-high");
                    } else {
                        pingDiv.classList.remove("ping-high");
                    }
                }

                await new Promise(r=>setTimeout(r,2000));
            }
        }
        loop();
    }

    function stopPing(){
        if(pingDiv){
            pingDiv.remove();
            pingDiv=null;
        }
        document.getElementById("pingAlertContainer").style.display = "none";
    }

    document.getElementById("togglePing").addEventListener("change", e=>{
        pingEnabled=e.target.checked;
        if(pingEnabled) startPing();
        else stopPing();
    });

    document.getElementById("togglePingAlert").addEventListener("change", e=>{
        pingAlertEnabled = e.target.checked;
    });

    document.getElementById("pingThresholdInput").addEventListener("change", e=>{
        pingThreshold = parseInt(e.target.value) || 150;
    });

    // --- FPS ---
    function startFPS(){
        if(fpsDiv) return;
        fpsDiv=document.createElement("div"); fpsDiv.id="fpsCounter"; fpsDiv.textContent="FPS: ...";
        applyDisplayStylesTo(fpsDiv);
        document.body.appendChild(fpsDiv); makeDraggable(fpsDiv, fpsDiv);
        let lastTime=performance.now(); let frames=0; function loop(){frames++; const now=performance.now(); const delta=now-lastTime; if(delta>=1000){ if(fpsDiv) fpsDiv.textContent="FPS: "+frames; frames=0; lastTime=now; } if(fpsEnabled) requestAnimationFrame(loop);} if(fpsEnabled) loop();
    }
    function stopFPS(){if(fpsDiv){fpsDiv.remove(); fpsDiv=null;}}
    document.getElementById("toggleFPS").addEventListener("change", e=>{ fpsEnabled=e.target.checked; if(fpsEnabled)startFPS(); else stopFPS(); });

    // --- Clock ---
    document.getElementById("clockToggle").addEventListener("click", ()=>{
        if(clockRunning){
            clearInterval(clockInterval); clockRunning=false; document.getElementById("clockToggle").textContent="Start";
            if(clockDiv){ clockDiv.remove(); clockDiv=null; }
        } else {
            clockRunning=true; document.getElementById("clockToggle").textContent="Stop";
            clockDiv=document.createElement("div"); clockDiv.id="clockCounter";
            applyDisplayStylesTo(clockDiv);
            document.body.appendChild(clockDiv); makeDraggable(clockDiv, clockDiv);
            clockSeconds=0;
            clockDiv.textContent="00:00:00";
            const startT=Date.now();
            clockInterval=setInterval(()=>{
                const diff=Math.floor((Date.now()-startT)/1000);
                const h=Math.floor(diff/3600).toString().padStart(2,'0');
                const m=Math.floor((diff%3600)/60).toString().padStart(2,'0');
                const s=(diff%60).toString().padStart(2,'0');
                if(clockDiv)clockDiv.textContent=`${h}:${m}:${s}`;
            },1000);
        }
    });

    // --- AFK Timer ---
    function startAFKTimer() {
        if(afkTimerDiv) return;
        afkTimerDiv = document.createElement("div");
        afkTimerDiv.id = "afkTimer";
        afkTimerDiv.textContent = "AFK: 0s";
        applyDisplayStylesTo(afkTimerDiv);
        document.body.appendChild(afkTimerDiv);
        makeDraggable(afkTimerDiv, afkTimerDiv);

        afkInterval = setInterval(() => {
            if(!afkEnabled) return;
            const now = Date.now();
            const inactiveSeconds = Math.floor((now - lastActivityTime) / 1000);

            if(afkTimerDiv) {
                afkTimerDiv.textContent = `AFK: ${inactiveSeconds}s`;
                afkTimerDiv.classList.remove("afk-warning", "afk-critical");

                if (inactiveSeconds > 300) { // 5 mins
                     afkTimerDiv.classList.add("afk-critical");
                } else if (inactiveSeconds > 120) { // 2 mins
                     afkTimerDiv.classList.add("afk-warning");
                }
            }
        }, 1000);
    }

    function stopAFKTimer() {
        if(afkTimerDiv) {
            afkTimerDiv.remove();
            afkTimerDiv = null;
        }
        clearInterval(afkInterval);
    }

    function resetAFK() {
        lastActivityTime = Date.now();
        if(afkTimerDiv && afkEnabled) {
            afkTimerDiv.textContent = "AFK: 0s";
            afkTimerDiv.classList.remove("afk-warning", "afk-critical");
        }
    }

    document.getElementById("toggleAFK").addEventListener("change", e => {
        afkEnabled = e.target.checked;
        if(afkEnabled) startAFKTimer();
        else stopAFKTimer();
    });

    ['mousemove', 'keydown', 'mousedown', 'scroll'].forEach(evt => {
        document.addEventListener(evt, resetAFK);
    });

    // --- Music Player ---
    const musicContainer=document.getElementById("musicVolumeContainer");
    document.getElementById("toggleMusic").addEventListener("change", e=>{
        const musicFileIn=document.getElementById("musicFile");
        const playBtn=document.getElementById("musicPlayPause");
        if(e.target.checked){
            musicFileIn.style.display="block"; playBtn.style.display="block"; musicContainer.style.display="block";
        } else {
            musicFileIn.style.display="none"; playBtn.style.display="none"; musicContainer.style.display="none";
            if(audio){ audio.pause(); audio=null; playBtn.textContent="Play"; }
        }
    });
    document.getElementById("musicFile").addEventListener("change", e=>{
        if(e.target.files[0]){
            if(audio){ audio.pause(); }
            audio=new Audio(URL.createObjectURL(e.target.files[0]));
            audio.volume=document.getElementById("musicVolume").value/100;
            audio.addEventListener("ended", ()=>{ document.getElementById("musicPlayPause").textContent="Play"; });
            document.getElementById("musicPlayPause").textContent="Play";
        }
    });
    document.getElementById("musicPlayPause").addEventListener("click", e=>{
        if(!audio)return;
        if(audio.paused){ audio.play(); e.target.textContent="Pause"; }
        else { audio.pause(); e.target.textContent="Play"; }
    });
    document.getElementById("musicVolume").addEventListener("input", e=>{ if(audio)audio.volume=e.target.value/100; });

    // --- YouTube ---
    const ytContainer = document.createElement("div");
    ytContainer.id = "ytPlayerContainer";
    document.body.appendChild(ytContainer);

    let ytPlayerInstance = null;
    let ytIframe = null;

    document.getElementById("toggleYoutube").addEventListener("change", e => {
        const controls = document.getElementById("youtubeControls");
        controls.style.display = e.target.checked ? "block" : "none";
        if (!e.target.checked && ytIframe) {
            // Hide/Stop player if toggled off
            ytContainer.innerHTML = "";
            ytIframe = null;
        }
    });

    document.getElementById("ytLoad").addEventListener("click", () => {
        const url = document.getElementById("ytLink").value;
        let videoId = "";
        if (url.includes("v=")) {
            videoId = url.split("v=")[1];
            const ampersandPosition = videoId.indexOf("&");
            if (ampersandPosition !== -1) {
                videoId = videoId.substring(0, ampersandPosition);
            }
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1];
        }

        if (videoId) {
            ytContainer.innerHTML = `<iframe id="ytIframe" width="200" height="150" src="https://www.youtube.com/embed/${videoId}?enablejsapi=1" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
            ytIframe = document.getElementById("ytIframe");
        } else {
            alert("Invalid YouTube URL");
        }
    });

    document.getElementById("ytPlayPause").addEventListener("click", () => {
        if (ytIframe) {
            ytIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
    });

    // initial guess for theme
    setTimeout(() => {
        const guessed = themeFromMenuStyles();
        if (guessed && guessed !== currentDisplayTheme) {
            themeSelect.value = guessed;
            setTheme(guessed);
        }
    }, 150);
document.addEventListener("keydown", (e) => {


    // close or open with 0
    if (e.key === "0" || e.code === "Digit0" || e.code === "Numpad0") {
        menuVisible = !menuVisible;
        menu.style.display = menuVisible ? "block" : "none";
    }
});
// random comment from me lol
})();
