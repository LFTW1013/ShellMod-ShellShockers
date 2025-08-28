// ==UserScript==
// @name         ShellShockers ShellMod
// @namespace    http://tampermonkey.net/
// @version      3.5
// @description  ShellMod: Crosshair enable + standard/circular/rainbow + resize/thickness sliders, fixed right-angle issue + rainbow gradient lines
// @author       CJ_THE_PRO
// @match        *://shellshock.io/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    let crosshairEnabled = true;
    let rainbowEnabled = false;
    let pingEnabled = false;
    let musicEnabled = false;
    let clockRunning = false;
    let clockSeconds = 0;
    let clockInterval;
    let crosshairSize = 40;
    let crosshairThickness = 2;
    let pingDiv, clockDiv, audio;
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
        .shellmodToggle input[type="checkbox"] { cursor:pointer; }
        hr { border: 1px solid #0f0; margin:6px 0; }
        #customCrosshair { position: fixed; top:50%; left:50%; pointer-events: none; z-index:9999; }
        #customCrosshair .hLine, #customCrosshair .vLine, #customCrosshair .circle { position: absolute; background: #0f0; }
        #customCrosshair .circle { border-radius:50%; border:2px solid transparent; display:none; background:none; }
        #pingCounter, #clockCounter { position: fixed; top: 10px; left: 10px; font-family: monospace; font-size: 14px; padding: 4px 6px; border-radius: 4px; z-index: 9999; cursor: grab; background: rgba(0,0,0,0.5); color: #0f0; border: 1px solid #0f0; }
        #clockCounter { top: 50px; }
        #dragHandle { position: absolute; top:2px; left:2px; width:16px; height:16px; background:#0f0; cursor:grab; border-radius:3px; }
    `);

    const menu = document.createElement("div");
    menu.id = "shellmodMenu";
    menu.innerHTML = `
        <div id="dragHandle"></div>
        <h1>ShellMod</h1>
        <div class="category">
            <div class="category-header">[+] Displays</div>
            <div class="category-content">
                <div class="shellmodToggle"><label>Show Ping</label><input type="checkbox" id="togglePing"></div>
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
            </div>
        </div>
    `;
    document.body.appendChild(menu);

    document.querySelectorAll(".category-header").forEach(h => h.addEventListener("click", ()=>{
        const content=h.nextElementSibling;
        const isOpen=content.style.display==="block";
        content.style.display=isOpen?"none":"block";
        h.textContent=h.textContent.replace(isOpen?"[-]":"[+]","[-]".includes(h.textContent)?"[+]":"[-]");
    }));

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

    // Ping
    function startPing(){if(pingDiv)return; pingDiv=document.createElement("div"); pingDiv.id="pingCounter"; pingDiv.textContent="Ping: ..."; document.body.appendChild(pingDiv); makeDraggable(pingDiv, pingDiv); async function loop(){while(pingEnabled){const start=performance.now();await fetch(location.href,{method:"HEAD",cache:"no-cache"}).catch(()=>{}); const latency=Math.round(performance.now()-start); if(pingDiv) pingDiv.textContent="Ping: "+latency+" ms"; await new Promise(r=>setTimeout(r,2000));}} loop();}
    function stopPing(){if(pingDiv){pingDiv.remove(); pingDiv=null;}}
    document.getElementById("togglePing").addEventListener("change", e=>{pingEnabled=e.target.checked;if(pingEnabled) startPing(); else stopPing();});

    // Clock
    function initClock(){if(clockDiv)return; clockDiv=document.createElement("div"); clockDiv.id="clockCounter"; clockDiv.textContent="Clock: 0:00"; document.body.appendChild(clockDiv); clockDiv.style.display="none"; makeDraggable(clockDiv, clockDiv);}
    initClock();
    function updateClock(){var m=Math.floor(clockSeconds/60); var s=clockSeconds%60; clockDiv.textContent="Clock: "+m+":"+(s<10?"0"+s:s);}
    document.getElementById("clockToggle").addEventListener("click",function(){if(!clockRunning){clockRunning=true;clockDiv.style.display="block";this.textContent="Stop"; clockInterval=setInterval(()=>{clockSeconds++; updateClock();},1000);}else{clockRunning=false;this.textContent="Start"; clearInterval(clockInterval); clockSeconds=0; updateClock(); clockDiv.style.display="none";}});

    // Music
    const musicFile=document.getElementById("musicFile");
    const musicPlayPause=document.getElementById("musicPlayPause");
    function startMusic(){musicFile.style.display="block"; musicPlayPause.style.display="block";}
    function stopMusic(){musicFile.style.display="none"; musicPlayPause.style.display="none"; if(audio){audio.pause(); audio=null;}}
    musicFile.addEventListener("change", e=>{const file=e.target.files[0]; if(!file)return; const reader=new FileReader(); reader.onload=evt=>{if(audio)audio.pause(); audio=new Audio(evt.target.result); audio.loop=true;}; reader.readAsDataURL(file);});
    musicPlayPause.addEventListener("click", ()=>{if(!audio)return; if(audio.paused){audio.play(); musicPlayPause.textContent="Pause";} else{audio.pause(); musicPlayPause.textContent="Play";}});
    document.getElementById("toggleMusic").addEventListener("change", e=>{musicEnabled=e.target.checked;if(musicEnabled) startMusic(); else stopMusic();});

    // Menu toggle
    window.addEventListener("keydown",e=>{if(e.key==="0"){menuVisible=!menuVisible; menu.style.display=menuVisible?"block":"none";}});
})();
