// ==UserScript==
// @name         ShellShockers ShellMod
// @namespace    http://tampermonkey.net/
// @version      3.9
// @description  ShellShockers modding service
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
    let pingDiv, clockDiv, fpsDiv, audio, ytPlayer;
    let menuVisible = true;

    GM_addStyle(`
        #shellmodMenu { position: fixed; top: 100px; right: 50px; width: 320px; border-radius: 10px; padding: 24px 8px 8px 8px; font-family: monospace; font-size: 13px; z-index: 10000; background: #111; color: #0f0; border: 2px solid #0f0; }
        #shellmodMenu h1 { text-align: center; font-size: 18px; margin: 5px 0; padding-bottom: 4px; border-bottom: 2px solid #0f0; }
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
        #pingCounter, #clockCounter { position: fixed; top: 10px; left: 10px; font-family: monospace; font-size: 14px; padding: 4px 6px; border-radius: 4px; z-index: 9999; cursor: grab; background: rgba(0,0,0,0.5); color: #0f0; border: 1px solid #0f0; }
        #clockCounter { top: 50px; }
        #fpsCounter { position: fixed; top: 90px; left: 10px; font-family: monospace; font-size: 14px; padding: 4px 6px; border-radius: 4px; z-index: 9999; cursor: grab; background: rgba(0,0,0,0.5); color: #0f0; border: 1px solid #0f0; }
        #dragHandle { position: absolute; top:2px; left:2px; width:16px; height:16px; background:#0f0; cursor:grab; border-radius:3px; }
        #shellmodGear { position: absolute; top:8px; right:8px; cursor: pointer; font-size: 18px; z-index: 10001; }
        #shellmodSettings { position: absolute; top:36px; right:8px; width: 200px; padding: 8px; background: rgba(0,0,0,0.8); color: #0f0; border-radius: 6px; display: none; font-size: 13px; z-index: 10001; }
        #shellmodSettings select, #shellmodSettings button { background: #111; color: #0f0; border: 1px solid #0f0; border-radius:4px; width:100%; margin-top:4px; }
        #ytPlayerContainer { position: fixed; bottom: 10px; right: 10px; width: 0; height: 0; overflow: hidden; z-index: 8999; }
        .yt-input { width: 100%; padding: 4px; background: #111; color: #0f0; border: 1px solid #0f0; border-radius: 4px; margin-top: 4px; font-family: monospace; font-size: 12px; }
    `);

    // --- Menu ---
    const menu = document.createElement("div");
    menu.id = "shellmodMenu";
    menu.innerHTML = `
        <div id="dragHandle"></div>
        <h1>ShellMod</h1>
        <div class="category">
            <div class="category-header">[+] Displays</div>
            <div class="category-content">
                <div class="shellmodToggle"><label>Show Ping</label><input type="checkbox" id="togglePing"></div>
                <div class="shellmodToggle"><label>Show FPS</label><input type="checkbox" id="toggleFPS"></div>
                <div class="shellmodToggle"><label>Clock</label><button id="clockToggle">Start</button></div>
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
            document.querySelectorAll("#shellmodMenu button, #shellmodMenu select, #shellmodMenu input[type=range], .yt-input").forEach(el=>{
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
            document.querySelectorAll("#shellmodMenu button, #shellmodMenu select, #shellmodMenu input[type=range], .yt-input").forEach(el=>{
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

    // --- Ping ---
    function startPing(){if(pingDiv)return; pingDiv=document.createElement("div"); pingDiv.id="pingCounter"; pingDiv.textContent="Ping: ..."; document.body.appendChild(pingDiv); makeDraggable(pingDiv, pingDiv); async function loop(){while(pingEnabled){const start=performance.now();await fetch(location.href,{method:"HEAD",cache:"no-cache"}).catch(()=>{}); const latency=Math.round(performance.now()-start); if(pingDiv) pingDiv.textContent="Ping: "+latency+" ms"; await new Promise(r=>setTimeout(r,2000));}} loop();}
    function stopPing(){if(pingDiv){pingDiv.remove(); pingDiv=null;}}
    document.getElementById("togglePing").addEventListener("change", e=>{pingEnabled=e.target.checked;if(pingEnabled) startPing(); else stopPing();});

    // --- FPS ---
    function startFPS(){if(fpsDiv)return; fpsDiv=document.createElement("div"); fpsDiv.id="fpsCounter"; fpsDiv.textContent="FPS: ..."; document.body.appendChild(fpsDiv); makeDraggable(fpsDiv, fpsDiv); let lastTime=performance.now(); let frames=0; function loop(){frames++; const now=performance.now(); const delta=now-lastTime; if(delta>=1000){const fps=Math.round(frames*1000/delta); if(fpsDiv) fpsDiv.textContent="FPS: "+fps; frames=0; lastTime=now;} if(fpsEnabled) requestAnimationFrame(loop);} loop();}
    function stopFPS(){if(fpsDiv){fpsDiv.remove(); fpsDiv=null;}}
    document.getElementById("toggleFPS").addEventListener("change", e=>{fpsEnabled=e.target.checked;if(fpsEnabled) startFPS(); else stopFPS();});

    // --- Clock ---
    function initClock(){if(clockDiv)return; clockDiv=document.createElement("div"); clockDiv.id="clockCounter"; clockDiv.textContent="Clock: 0:00"; document.body.appendChild(clockDiv); clockDiv.style.display="none"; makeDraggable(clockDiv, clockDiv);}
    initClock();
    function updateClock(){var m=Math.floor(clockSeconds/60); var s=clockSeconds%60; clockDiv.textContent="Clock: "+m+":"+(s<10?"0"+s:s);}
    document.getElementById("clockToggle").addEventListener("click",function(){if(!clockRunning){clockRunning=true;clockDiv.style.display="block"; this.textContent="Stop"; clockInterval=setInterval(()=>{clockSeconds++; updateClock();},1000);}else{clockRunning=false; this.textContent="Start"; clearInterval(clockInterval); clockSeconds=0; updateClock(); clockDiv.style.display="none";}});

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
            console.log("No URL provided");
            alert("Please enter a YouTube URL");
            return;
        }

        console.log("Attempting to load URL:", url);

        const videoId = extractVideoId(url);
        if (!videoId) {
            alert("Invalid YouTube URL. Try: youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID");
            return;
        }

        console.log("Video ID extracted:", videoId);

        // Remove old iframe if exists
        if (ytIframe) {
            ytIframe.remove();
        }

        // Create new iframe
        ytIframe = document.createElement('iframe');
        ytIframe.width = '0';
        ytIframe.height = '0';
        ytIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&enablejsapi=1`;
        ytIframe.allow = 'autoplay';
        ytIframe.style.border = 'none';
        ytContainer.appendChild(ytIframe);

        ytPlayer = ytIframe;
        ytPlayPause.textContent = "Pause";
        console.log("YouTube iframe created and added");
    }

    // Load button click
    ytLoad.addEventListener("click", () => {
        loadYouTubeVideo(ytLink.value.trim());
    });

    // Also allow Enter key
    ytLink.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            loadYouTubeVideo(ytLink.value.trim());
        }
    });

    ytPlayPause.addEventListener("click", () => {
        console.log("Play/Pause clicked. ytIframe:", ytIframe);

        if (!ytIframe) {
            alert("Please paste a YouTube URL first!");
            return;
        }

        // Toggle by reloading iframe with/without autoplay
        const currentSrc = ytIframe.src;
        console.log("Current src:", currentSrc);

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
    window.addEventListener("keydown",e=>{if(e.key==="0"){menuVisible=!menuVisible; menu.style.display=menuVisible?"block":"none";}});
})();
