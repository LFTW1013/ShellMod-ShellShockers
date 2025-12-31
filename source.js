// ==UserScript==
// @name         ShellShockers ShellMod
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  ShellMod, a shellshockers modding service.
// @author       LFTW1013
// @match        *://shellshock.io/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    let crosshairEnabled = true;
    let rainbowEnabled = false;
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
        .colorRow { display:flex; gap:6px; flex-wrap:wrap; }
        .colorRow label { background: rgba(255,255,255,0.02); padding:4px 6px; border-radius:4px; cursor:pointer; border:1px solid rgba(15,255,15,0.15); }
        .shellmodToggle input[type="checkbox"], select, button, input[type="range"] { cursor:pointer; }
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
    `);

    // --- Preset System ---
    const presets = {
        default: {
            name: "Default",
            crosshairEnabled: true,
            rainbowEnabled: false,
            crosshairSize: 40,
            crosshairThickness: 2,
            standardColors: [],
            circularColors: [],
            pingEnabled: false,
            fpsEnabled: false,
            afkEnabled: false
        }
    };

    function saveCurrentAsPreset(presetName) {
        const standardColors = Array.from(document.querySelectorAll(".standardColor:checked")).map(e => e.value);
        const circularColors = Array.from(document.querySelectorAll(".circularColor:checked")).map(e => e.value);

        presets[presetName] = {
            name: presetName,
            crosshairEnabled: document.getElementById("toggleCrosshair").checked,
            rainbowEnabled: document.getElementById("toggleRainbow").checked,
            crosshairSize: parseInt(document.getElementById("crosshairResize").value),
            crosshairThickness: parseInt(document.getElementById("crosshairThickness").value),
            standardColors: standardColors,
            circularColors: circularColors,
            pingEnabled: pingEnabled,
            fpsEnabled: fpsEnabled,
            afkEnabled: afkEnabled
        };

        localStorage.setItem("shellmodPresets", JSON.stringify(presets));
        updatePresetList();
    }

    function loadPreset(presetName) {
        const preset = presets[presetName];
        if (!preset) return;

        currentPreset = presetName;

        // Stop all active features first
        if (pingEnabled) stopPing();
        if (fpsEnabled) stopFPS();
        if (afkEnabled) stopAFKTimer();

        // Load crosshair settings
        document.getElementById("toggleCrosshair").checked = preset.crosshairEnabled;
        document.getElementById("toggleRainbow").checked = preset.rainbowEnabled;
        document.getElementById("crosshairResize").value = preset.crosshairSize;
        document.getElementById("crosshairThickness").value = preset.crosshairThickness;
        crosshairSize = preset.crosshairSize;
        crosshairThickness = preset.crosshairThickness;

        // Clear and set standard colors
        document.querySelectorAll(".standardColor").forEach(cb => cb.checked = false);
        preset.standardColors.forEach(color => {
            const cb = document.querySelector(`.standardColor[value="${color}"]`);
            if (cb) cb.checked = true;
        });

        // Clear and set circular colors
        document.querySelectorAll(".circularColor").forEach(cb => cb.checked = false);
        preset.circularColors.forEach(color => {
            const cb = document.querySelector(`.circularColor[value="${color}"]`);
            if (cb) cb.checked = true;
        });

        // Load display settings
        document.getElementById("togglePing").checked = preset.pingEnabled;
        document.getElementById("toggleFPS").checked = preset.fpsEnabled;
        document.getElementById("toggleAFK").checked = preset.afkEnabled;

        // Apply settings
        pingEnabled = preset.pingEnabled;
        fpsEnabled = preset.fpsEnabled;
        afkEnabled = preset.afkEnabled;

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
        localStorage.setItem("shellmodPresets", JSON.stringify(presets));
        if (currentPreset === presetName) {
            currentPreset = "default";
            loadPreset("default");
        }
        updatePresetList();
    }

    function updatePresetList() {
        const container = document.getElementById("presetList");
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

    // Load saved presets from localStorage
    const savedPresets = localStorage.getItem("shellmodPresets");
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
                <div class="shellmodToggle"><label>Rainbow Crosshair</label><input type="checkbox" id="toggleRainbow"></div>
                <div class="shellmodToggle"><label>Resize</label><input type="range" id="crosshairResize" min="20" max="100" value="40"></div>
                <div class="shellmodToggle"><label>Thickness</label><input type="range" id="crosshairThickness" min="1" max="10" value="2"></div>
                <hr>
                <div class="shellmodToggle"><label>STANDARD:</label>
                    <div class="colorRow">
                        <label><input type="checkbox" class="standardColor" value="green"> Green</label>
                        <label><input type="checkbox" class="standardColor" value="red"> Red</label>
                        <label><input type="checkbox" class="standardColor" value="black"> Black</label>
                    </div>
                </div>
                <hr>
                <div class="shellmodToggle"><label>CIRCULAR:</label>
                    <div class="colorRow">
                        <label><input type="checkbox" class="circularColor" value="green"> Green</label>
                        <label><input type="checkbox" class="circularColor" value="red"> Red</label>
                        <label><input type="checkbox" class="circularColor" value="black"> Black</label>
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

    // --- Search Functionality ---
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
        { category: "Crosshairs", name: "Standard Colors", element: ".standardColor" },
        { category: "Crosshairs", name: "Circular Colors", element: ".circularColor" },
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

        // Add click handlers to results - use setTimeout to ensure elements are in DOM
        setTimeout(() => {
            document.querySelectorAll(".search-result-item").forEach(item => {
                item.addEventListener("click", function() {
                    const elementSelector = this.getAttribute("data-element");
                    scrollToElement(elementSelector);
                    highlightElement(elementSelector);
                    // Hide search results after clicking
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

        // Expand the category if it's collapsed
        const categoryContent = element.closest(".category-content");
        if (categoryContent && categoryContent.style.display === "none") {
            const header = categoryContent.previousElementSibling;
            // Update header text to show it's open
            header.textContent = header.textContent.replace("[+]", "[-]");
            categoryContent.style.display = "block";
        }

        // Scroll within the menu to the element
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

    // --- Gear & Settings Panel ---
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
    themeSelect.addEventListener("change", () => {
        const val = themeSelect.value;
        if(val === "default"){
            menu.style.background = "#111";
            menu.style.color = "#0f0";
            menu.style.border = "2px solid #0f0";
            menu.style.backdropFilter = "";
            document.querySelectorAll("#shellmodMenu button, #shellmodMenu select, #shellmodMenu input[type=range], .yt-input, .search-input").forEach(el=>{
                el.style.background="#111";
                el.style.color="#0f0";
                el.style.border="1px solid #0f0";
            });
            document.querySelectorAll(".category-header, .category-content").forEach(el=>{
                el.style.background="#111";
                el.style.color="#0f0";
                el.style.border="1px solid #0f0";
            });
        } else if(val === "macbook"){
            menu.style.background = "rgba(255,255,255,0.2)";
            menu.style.color = "#000";
            menu.style.border = "1px solid rgba(0,0,0,0.3)";
            menu.style.backdropFilter = "blur(10px)";
            document.querySelectorAll("#shellmodMenu button, #shellmodMenu select, #shellmodMenu input[type=range], .yt-input, .search-input").forEach(el=>{
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
    }, 100);

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
        const standardColors = Array.from(document.querySelectorAll(".standardColor:checked")).map(e=>e.value);
        const circularColors = Array.from(document.querySelectorAll(".circularColor:checked")).map(e=>e.value);

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

        const color = standardColors[0] || "#0f0";

        if (rainbow) {
            hLine.style.background = "linear-gradient(to right, red, orange, yellow, green, cyan, blue, violet)";
            vLine.style.background = "linear-gradient(to bottom, red, orange, yellow, green, cyan, blue, violet)";
        } else {
            hLine.style.background = vLine.style.background = color;
        }

        if(circularColors[0]){
            circleEl.style.display="block";
            circleEl.style.width = circleEl.style.height = crosshairSize + "px";
            circleEl.style.borderWidth = crosshairThickness + "px";
            circleEl.style.borderColor = rainbow ? "#fff" : circularColors[0];
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
    document.querySelectorAll(".standardColor,.circularColor").forEach(cb=>cb.addEventListener("change",updateCrosshair));
    document.getElementById("crosshairResize").addEventListener("input", e=>{ crosshairSize=e.target.value; updateCrosshair(); });
    document.getElementById("crosshairThickness").addEventListener("input", e=>{ crosshairThickness=e.target.value; updateCrosshair(); });
    updateCrosshair();

    // --- Ping with Alert ---
    let currentPing = 0;
    function startPing(){
        if(pingDiv)return;
        pingDiv=document.createElement("div");
        pingDiv.id="pingCounter";
        pingDiv.textContent="Ping: ...";
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
    function startFPS(){if(fpsDiv)return; fpsDiv=document.createElement("div"); fpsDiv.id="fpsCounter"; fpsDiv.textContent="FPS: ..."; document.body.appendChild(fpsDiv); makeDraggable(fpsDiv, fpsDiv); let lastTime=performance.now(); let frames=0; function loop(){frames++; const now=performance.now(); const delta=now-lastTime; if(delta>=1000){const fps=Math.round(frames*1000/delta); if(fpsDiv) fpsDiv.textContent="FPS: "+fps; frames=0; lastTime=now;} if(fpsEnabled) requestAnimationFrame(loop);} loop();}
    function stopFPS(){if(fpsDiv){fpsDiv.remove(); fpsDiv=null;}}
    document.getElementById("toggleFPS").addEventListener("change", e=>{fpsEnabled=e.target.checked;if(fpsEnabled) startFPS(); else stopFPS();});

    // --- Clock ---
    function initClock(){if(clockDiv)return; clockDiv=document.createElement("div"); clockDiv.id="clockCounter"; clockDiv.textContent="Clock: 0:00"; document.body.appendChild(clockDiv); clockDiv.style.display="none"; makeDraggable(clockDiv, clockDiv);}
    initClock();
    function updateClock(){var m=Math.floor(clockSeconds/60); var s=clockSeconds%60; clockDiv.textContent="Clock: "+m+":"+(s<10?"0"+s:s);}
    document.getElementById("clockToggle").addEventListener("click",function(){if(!clockRunning){clockRunning=true;clockDiv.style.display="block"; this.textContent="Stop"; clockInterval=setInterval(()=>{clockSeconds++; updateClock();},1000);}else{clockRunning=false; this.textContent="Start"; clearInterval(clockInterval); clockSeconds=0; updateClock(); clockDiv.style.display="none";}});

    // --- AFK Timer ---
    function initAFKTimer(){
        if(afkTimerDiv) return;
        afkTimerDiv = document.createElement("div");
        afkTimerDiv.id = "afkTimer";
        afkTimerDiv.textContent = "AFK: 0:00 / 5:00";
        document.body.appendChild(afkTimerDiv);
        afkTimerDiv.style.display = "none";
        makeDraggable(afkTimerDiv, afkTimerDiv);
    }
    initAFKTimer();

    function updateAFKTimer(){
        const m = Math.floor(afkSeconds / 60);
        const s = afkSeconds % 60;
        const timeStr = m + ":" + (s < 10 ? "0" + s : s);

        afkTimerDiv.textContent = "AFK: " + timeStr + " / 5:00";

        afkTimerDiv.classList.remove("afk-warning", "afk-critical");
        if(afkSeconds >= 240) {
            afkTimerDiv.classList.add("afk-critical");
        } else if(afkSeconds >= 180) {
            afkTimerDiv.classList.add("afk-warning");
        }
    }

    function startAFKTimer(){
        if(!afkTimerDiv) initAFKTimer();
        afkTimerDiv.style.display = "block";
        lastActivityTime = Date.now();
        afkSeconds = 0;
        updateAFKTimer();

        afkInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - lastActivityTime) / 1000);
            afkSeconds = elapsed;
            updateAFKTimer();
        }, 1000);
    }

    function stopAFKTimer(){
        if(afkInterval) clearInterval(afkInterval);
        if(afkTimerDiv) afkTimerDiv.style.display = "none";
        afkSeconds = 0;
    }

    function resetAFKTimer(){
        lastActivityTime = Date.now();
        afkSeconds = 0;
        if(afkEnabled) updateAFKTimer();
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'wheel', 'touchstart'];
    activityEvents.forEach(event => {
        document.addEventListener(event, resetAFKTimer);
    });

    document.getElementById("toggleAFK").addEventListener("change", e => {
        afkEnabled = e.target.checked;
        if(afkEnabled) startAFKTimer();
        else stopAFKTimer();
    });

    // --- Music ---
    const musicFile=document.getElementById("musicFile");
    const musicPlayPause=document.getElementById("musicPlayPause");
    const musicVolumeContainer=document.getElementById("musicVolumeContainer");
    const musicVolume=document.getElementById("musicVolume");
    function startMusic(){musicFile.style.display="block"; musicPlayPause.style.display="block"; musicVolumeContainer.style.display="block";}
    function stopMusic(){musicFile.style.display="none"; musicPlayPause.style.display="none"; musicVolumeContainer.style.display="none"; if(audio){audio.pause(); audio=null;}}
    musicFile.addEventListener("change", e=>{const file=e.target.files[0]; if(!file)return; const reader=new FileReader(); reader.onload=evt=>{if(audio)audio.pause(); audio=new Audio(evt.target.result); audio.loop=true; audio.volume=musicVolume.value/100;}; reader.readAsDataURL(file);});
    musicPlayPause.addEventListener("click", ()=>{if(!audio)return; if(audio.paused){audio.play(); musicPlayPause.textContent="Pause";} else{audio.pause(); musicPlayPause.textContent="Play";}});
    musicVolume.addEventListener("input", e=>{if(audio) audio.volume=e.target.value/100;});
    document.getElementById("toggleMusic").addEventListener("change", e=>{musicEnabled=e.target.checked;if(musicEnabled) startMusic(); else stopMusic();});

    function extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        for (let pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    // --- YouTube Player ---
    const ytContainer = document.createElement("div");
    ytContainer.id = "ytPlayerContainer";
    document.body.appendChild(ytContainer);

    const youtubeControls = document.getElementById("youtubeControls");
    const ytLink = document.getElementById("ytLink");
    const ytLoad = document.getElementById("ytLoad");
    const ytPlayPause = document.getElementById("ytPlayPause");
    let ytIframe = null;

    function startYoutube() {
        youtubeControls.style.display = "block";
    }

    function stopYoutube() {
        youtubeControls.style.display = "none";
        if (ytIframe) {
            ytIframe.remove();
            ytIframe = null;
            ytPlayer = null;
        }
    }

    function loadYouTubeVideo(url) {
        if (!url) {
            alert("Please enter a YouTube URL");
            return;
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            alert("Invalid YouTube URL. Try: youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID");
            return;
        }

        if (ytIframe) {
            ytIframe.remove();
        }

        ytIframe = document.createElement('iframe');
        ytIframe.width = '0';
        ytIframe.height = '0';
        ytIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&enablejsapi=1`;
        ytIframe.allow = 'autoplay';
        ytIframe.style.border = 'none';
        ytContainer.appendChild(ytIframe);

        ytPlayer = ytIframe;
        ytPlayPause.textContent = "Pause";
    }

    ytLoad.addEventListener("click", () => {
        loadYouTubeVideo(ytLink.value.trim());
    });

    ytLink.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            loadYouTubeVideo(ytLink.value.trim());
        }
    });

    ytPlayPause.addEventListener("click", () => {
        if (!ytIframe) {
            alert("Please load a YouTube video first!");
            return;
        }

        const currentSrc = ytIframe.src;
        if (currentSrc.includes('autoplay=1')) {
            // Pause by setting autoplay to 0
            ytIframe.src = currentSrc.replace('autoplay=1', 'autoplay=0');
            ytPlayPause.textContent = "Play";
        } else {
            // Play by setting autoplay to 1
            ytIframe.src = currentSrc.replace('autoplay=0', 'autoplay=1');
            ytPlayPause.textContent = "Pause";
        }
    });

    document.getElementById("toggleYoutube").addEventListener("change", e => {
        youtubeEnabled = e.target.checked;
        if (youtubeEnabled) startYoutube();
        else stopYoutube();
    });

    // --- Menu toggle ---
    window.addEventListener("keydown",e=>{
        if(e.key==="0"){menuVisible=!menuVisible; menu.style.display=menuVisible?"block":"none";}
    });
})();
