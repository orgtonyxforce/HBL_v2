//page js
var loc = false, locip;
var noNewSegs = false;
var isOn = false, isInfo = false, isNodes = false, isRgbw = false;
var whites = [0,0,0];
var selColors;
var powered = [true];
var selectedFx = 0;
var selectedPal = 0;
var csel = 0;
var currentPreset = -1;
var lastUpdate = 0;
var segCount = 0, ledCount = 0, lowestUnused = 0, maxSeg = 0, lSeg = 0;
var lastw = 0;
var tr = 7;
var d = document;
const ranges = RangeTouch.setup('input[type="range"]', {});
var palettesData;
var pJson = {}, eJson = {}, lJson = {};
var pN = "", pI = 0, pNum = 0;
var pmt = 1, pmtLS = 0, pmtLast = 0;
var lastinfo = {};
var ws;
var cfg = {
	theme:{base:"dark", bg:{url:""}, alpha:{bg:0.6,tab:0.8}, color:{bg:""}},
	comp :{colors:{picker: true, rgb: false, quick: true, hex: false}, labels:true, pcmbot:false, pid:true, seglen:false}
};
var hol = [
	[0,11,24,4,"https://aircoookie.github.io/xmas.png"], // christmas
	[0,2,17,1,"https://images.alphacoders.com/491/491123.jpg"], // st. Patrick's day
	[2022,3,17,2,"https://aircoookie.github.io/easter.png"],
	[2023,3,9,2,"https://aircoookie.github.io/easter.png"],
	[2024,2,31,2,"https://aircoookie.github.io/easter.png"]
];

var cpick = new iro.ColorPicker("#picker", {
	width: 260,
	wheelLightness: false,
	wheelAngle: 90,
	layout: [
    {
      component: iro.ui.Wheel,
      options: {}
    },
    {
      component: iro.ui.Slider,
      options: { sliderType: 'value' }
    },
    {
      component: iro.ui.Slider,
      options: {
        sliderType: 'kelvin',
        minTemperature: 2100,
        maxTemperature: 10000
      }
    }
  ]
});

function handleVisibilityChange() {if (!d.hidden && new Date () - lastUpdate > 3000) requestJson();}
function sCol(na, col) {d.documentElement.style.setProperty(na, col);}
function gId(c) {return d.getElementById(c);}
function gEBCN(c) {return d.getElementsByClassName(c);}
function isO(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }

function applyCfg()
{
	cTheme(cfg.theme.base === "light");
	var bg = cfg.theme.color.bg;
	if (bg) sCol('--c-1', bg);
	var ccfg = cfg.comp.colors;
	//gId('picker').style.display = "none"; // ccfg.picker ? "block":"none";
	//gId('rgbwrap').style.display = ccfg.rgb ? "block":"none";
	gId('qcs-w').style.display = ccfg.quick ? "block":"none";
	var l = cfg.comp.labels; //l = false;
	var e = d.querySelectorAll('.tab-label');
	for (var i=0; i<e.length; i++) e[i].style.display = l ? "block":"none";
	e = d.querySelectorAll('.label');
	for (var i=0; i<e.length; i++) e[i].style.display = l ? "block":"none";
	e = d.querySelector('.hd');
	e.style.display = l ? "block":"none";
	//sCol('--tbp',l ? "14px 14px 10px 14px":"10px 22px 4px 22px");
	sCol('--bbp',l ? "9px 0 7px 0":"10px 0 4px 0");
	sCol('--bhd',l ? "block":"none");
	sCol('--bmt',l ? "0px":"5px");
	sCol('--t-b', cfg.theme.alpha.tab);
	size();
	localStorage.setItem('wledUiCfg', JSON.stringify(cfg));
}

function tglTheme()
{
	cfg.theme.base = (cfg.theme.base === "light") ? "dark":"light";
	applyCfg();
}

function tglLabels()
{
	cfg.comp.labels = !cfg.comp.labels;
	applyCfg();
}

function cTheme(light) {
	if (light) {
	sCol('--c-1','#eee');
	sCol('--c-f','#000');
	sCol('--c-2','#ddd');
	sCol('--c-3','#bbb');
	sCol('--c-4','#aaa');
	sCol('--c-5','#999');
	sCol('--c-6','#999');
	sCol('--c-8','#888');
	sCol('--c-b','#444');
	sCol('--c-c','#333');
	sCol('--c-e','#111');
	sCol('--c-d','#222');
	sCol('--c-r','#c21');
	sCol('--c-g','#2c1');
	sCol('--c-l','#26c');
	sCol('--c-o','rgba(204, 204, 204, 0.9)');
	sCol('--c-sb','#0003'); sCol('--c-sbh','#0006');
	sCol('--c-tb','rgba(204, 204, 204, var(--t-b))');
	sCol('--c-tba','rgba(170, 170, 170, var(--t-b))');
	sCol('--c-tbh','rgba(204, 204, 204, var(--t-b))');
	gId('imgw').style.filter = "invert(0.8)";
	} else {
	sCol('--c-1','#111');
	sCol('--c-f','#fff');
	sCol('--c-2','#222');
	sCol('--c-3','#333');
	sCol('--c-4','#444');
	sCol('--c-5','#555');
	sCol('--c-6','#666');
	sCol('--c-8','#888');
	sCol('--c-b','#bbb');
	sCol('--c-c','#ccc');
	sCol('--c-e','#eee');
	sCol('--c-d','#ddd');
	sCol('--c-r','#e42');
	sCol('--c-g','#4e2');
	sCol('--c-l','#48a');
	sCol('--c-o','rgba(34, 34, 34, 0.9)');
	sCol('--c-sb','#fff3'); sCol('--c-sbh','#fff5');
	sCol('--c-tb','rgba(34, 34, 34, var(--t-b))');
	sCol('--c-tba','rgba(102, 102, 102, var(--t-b))');
	sCol('--c-tbh','rgba(51, 51, 51, var(--t-b))');
	gId('imgw').style.filter = "unset";
	}
}

function loadBg(iUrl)
{
	let bg = document.getElementById('bg');
	let img = document.createElement("img");
	img.src = iUrl;
	img.addEventListener('load', (event) => {
		var a = parseFloat(cfg.theme.alpha.bg);
		if (isNaN(a)) a = 0.6;
		bg.style.opacity = a;
		bg.style.backgroundImage = `url(${img.src})`;
		img = null;
	});
}

function loadSkinCSS(cId)
{
	if (!gId(cId))	// check if element exists
	{
		var h  = document.getElementsByTagName('head')[0];
		var l  = document.createElement('link');
		l.id   = cId;
		l.rel  = 'stylesheet';
		l.type = 'text/css';
		l.href = (loc?`http://${locip}`:'.') + '/skin.css';
		l.media = 'all';
		h.appendChild(l);
	}
}

async function onLoad()
{
	if (window.location.protocol == "file:") {
		loc = true;
		locip = localStorage.getItem('locIp');
		if (!locip)
		{
			locip = prompt("File Mode. Please enter WLED IP!");
			localStorage.setItem('locIp', locip);
		}
	}
	var sett = localStorage.getItem('wledUiCfg');
	if (sett) cfg = mergeDeep(cfg, JSON.parse(sett));

	applyCfg();
	if (cfg.theme.bg.url=="" || cfg.theme.bg.url === "https://picsum.photos/1920/1080") {
		var iUrl = cfg.theme.bg.url;
		fetch((loc?`http://${locip}`:'.') + "/holidays.json", {
			method: 'get'
		})
		.then(res => {
			return res.json();
		})
		.then(json => {
			if (Array.isArray(json)) hol = json;
			//TODO: do some parsing first
		})
		.catch(function(error){
			console.log("holidays.json does not contain array of holidays. Defaults loaded.");
		})
		.finally(()=>{
			var today = new Date();
			for (var i=0; i<hol.length; i++) {
				var yr = hol[i][0]==0 ? today.getFullYear() : hol[i][0];
				var hs = new Date(yr,hol[i][1],hol[i][2]);
				var he = new Date(hs);
				he.setDate(he.getDate() + hol[i][3]);
				if (today>=hs && today<he) iUrl = hol[i][4];
			}
			if (iUrl !== "") loadBg(iUrl);
		});
	} else
		loadBg(cfg.theme.bg.url);
	loadSkinCSS('skinCss');

	var cd = gId('csl').children;
	for (var i = 0; i < cd.length; i++) cd[i].style.backgroundColor = "rgb(0, 0, 0)";
	selectSlot(0);
	cpick.on("input:end", function() {
		setColor(1);
	});
	pmtLS = localStorage.getItem('wledPmt');

	// Load initial data
	loadPalettes(()=>{
		loadPalettesData(redrawPalPrev);
		loadFX(()=>{
			loadPresets(()=>{
				loadInfo(requestJson);
			});
		});
	});
	updateUI(true);

	d.addEventListener("visibilitychange", handleVisibilityChange, false);
	size();
	gId("cv").style.opacity=0;
	var sls = d.querySelectorAll('input[type="range"]');
	for (var sl of sls) {
		sl.addEventListener('touchstart', toggleBubble);
		sl.addEventListener('touchend', toggleBubble);
	}
}

var timeout;
function showToast(text, error = false)
{
	if (error) gId('connind').style.backgroundColor = "var(--c-r)";
	var x = gId("toast");
	x.innerHTML = text;
	x.className = error ? "error":"show";
	clearTimeout(timeout);
	x.style.animation = 'none';
	timeout = setTimeout(function(){ x.className = x.className.replace("show", ""); }, 2900);
}

function showErrorToast()
{
	if (ws && ws.readyState === WebSocket.OPEN) {
		// if we received a timeout force WS reconnect
		ws.close();
		ws = null;
		if (lastinfo.ws > -1) setTimeout(makeWS,500);
	}
	showToast('Connection to light failed!', true);
}

function clearErrorToast() {gId("toast").className = gId("toast").className.replace("error", "");}

function getRuntimeStr(rt)
{
	var t = parseInt(rt);
	var days = Math.floor(t/86400);
	var hrs = Math.floor((t - days*86400)/3600);
	var mins = Math.floor((t - days*86400 - hrs*3600)/60);
	var str = days ? (days + " " + (days == 1 ? "day" : "days") + ", ") : "";
	str += (hrs || days) ? (hrs + " " + (hrs == 1 ? "hour" : "hours")) : "";
	if (!days && hrs) str += ", ";
	if (t > 59 && !days) str += mins + " min";
	if (t < 3600 && t > 59) str += ", ";
	if (t < 3600) str += (t - mins*60) + " sec";
	return str;
}

function inforow(key, val, unit = "")
{
	return `<tr><td class="keytd">${key}</td><td class="valtd">${val}${unit}</td></tr>`;
}

function pName(i)
{
	var n = "Preset " + i;
	if (pJson && pJson[i] && pJson[i].n) n = pJson[i].n;
	return n;
}

function isPlaylist(i)
{
	return pJson[i].playlist && pJson[i].playlist.ps;
}

function papiVal(i)
{
	if (!pJson || !pJson[i]) return "";
	var o = Object.assign({},pJson[i]);
	if (o.win) return o.win;
	delete o.n; delete o.p; delete o.ql;
	return JSON.stringify(o);
}

function qlName(i)
{
	if (!pJson || !pJson[i] || !pJson[i].ql) return "";
	return pJson[i].ql;
}

function cpBck()
{
	var copyText = gId("bck");

	copyText.select();
	copyText.setSelectionRange(0, 999999);
	d.execCommand("copy");
	showToast("Copied to clipboard!");
}

function loadPresets(callback = null)
{
	//1st boot (because there is a callback)
	if (callback && pmt == pmtLS && pmt > 0) {
		//we have a copy of the presets in local storage and don't need to fetch another one
        pJson = JSON.parse(localStorage.getItem("wledP"));
		populatePresets();
		pmtLast = pmt;
		callback();
		return;
	}

	//afterwards
	if (!callback && pmt == pmtLast) return;

	pmtLast = pmt;

	var url = (loc?`http://${locip}`:'') + '/presets.json';

	fetch(url, {
		method: 'get'
	})
	.then(res => {
		if (!res.ok) showErrorToast();
		return res.json();
	})
	.then(json => {
		clearErrorToast();
		pJson = json;
		populatePresets();
	})
	.catch(function (error) {
		showToast(error, true);
		console.log(error);
	})
	.finally(()=>{
		if (callback) setTimeout(callback,99);
	});
}

function loadPalettes(callback = null)
{
	var url = (loc?`http://${locip}`:'') + '/json/palettes';

	fetch(url, {
		method: 'get'
	})
	.then(res => {
		if (!res.ok) showErrorToast();
		return res.json();
	})
	.then(json => {
		clearErrorToast();
		lJson = Object.entries(json);
		populatePalettes();
	})
	.catch(function (error) {
		showToast(error, true);
	})
	.finally(()=>{
		if (callback) callback();
	});
}

function loadFX(callback = null)
{
	var url = (loc?`http://${locip}`:'') + '/json/effects';

	fetch(url, {
		method: 'get'
	})
	.then(res => {
		if (!res.ok) showErrorToast();
		return res.json();
	})
	.then(json => {
		clearErrorToast();
		eJson = Object.entries(json);
		populateEffects();
	})
	.catch(function (error) {
		showToast(error, true);
	})
	.finally(()=>{
		if (callback) callback();
	});
}

var pQL = [];
function populateQL()
{
	var cn = "";
	if (pQL.length > 0) {
		pQL.sort((a,b) => (a[0]>b[0]));
		for (var key of (pQL||[])) {
			cn += `<button class="btn btn-xs psts" id="p${key[0]}qlb" title="${key[2]?key[2]:''}" onclick="setPreset(${key[0]});">${key[1]}</button>`;
		}
	}
	gId('pql').innerHTML = cn;
}

function populatePresets()
{
	if (!pJson) {pJson={};return};
	delete pJson["0"];
	var cn = ""; //`<p class="label">All presets</p>`;
	var arr = Object.entries(pJson);
	arr.sort(cmpP);
	pQL = [];
	var is = [];
	pNum = 0;
	for (var key of (arr||[]))
	{
		if (!isO(key[1])) continue;
		let i = parseInt(key[0]);
		var qll = key[1].ql;
		if (qll) pQL.push([i, qll, pName(i)]);
		is.push(i);

		cn += `<div class="lstI c pres" id="p${i}o" onclick="setPreset(${i})">`;
		//if (cfg.comp.pid) cn += `<div class="pid">${i}</div>`;
		cn += `${isPlaylist(i)?"<i class='icons btn-icon'>&#xe139;</i>":""}<span class="lstIname">${pName(i)}</span></div>`;
    	pNum++;
	}
	gId('pcont').innerHTML = cn;
	updatePA(true);
	populateQL();
}

function loadInfo(callback=null)
{
	var url = (loc?`http://${locip}`:'') + '/json/info';
	fetch(url, {
		method: 'get'
	})
	.then(res => {
		if (!res.ok) showToast('Could not load Info!', true);
		return res.json();
	})
	.then(json => {
		clearErrorToast();
		lastinfo = json;
		var name = json.name;
		gId('namelabel').innerHTML = name;
//		if (name === "Dinnerbone") d.documentElement.style.transform = "rotate(180deg)";
		if (json.live) name = "(Live) " + name;
		if (loc) name = "(L) " + name;
		d.title = name;
		isRgbw = json.leds.wv;
		ledCount = json.leds.count;
		syncTglRecv = json.str;
		maxSeg = json.leds.maxseg;
		pmt = json.fs.pmt;
		if (isInfo) populateInfo(json);
		reqsLegal = true;
		if (!ws && lastinfo.ws > -1) setTimeout(makeWS,500);
	})
	.catch(function (error) {
		showToast(error, true);
		console.log(error);
	})
	.finally(()=>{
		if (callback) callback();
	});
}

function populateInfo(i)
{
	var cn="";
	var heap = i.freeheap/1000;
	heap = heap.toFixed(1);
	var pwr = i.leds.pwr;
	var pwru = "Not calculated";
	if (pwr > 1000) {pwr /= 1000; pwr = pwr.toFixed((pwr > 10) ? 0 : 1); pwru = pwr + " A";}
	else if (pwr > 0) {pwr = 50 * Math.round(pwr/50); pwru = pwr + " mA";}
  	var urows="";
	if (i.u) {
		for (const [k, val] of Object.entries(i.u)) {
			if (val[1])
				urows += inforow(k,val[0],val[1]);
			else
				urows += inforow(k,val);
		}
	}
	var vcn = "Kuuhaku";
	if (i.ver.startsWith("0.13.")) vcn = "Toki";
	if (i.ver.includes("-bl")) vcn = "Ryujin";
	if (i.cn) vcn = i.cn;

	cn += `v${i.ver} "${vcn}"<br><br><table class="infot">
${urows}
${inforow("Build",i.vid)}
${inforow("Signal strength",i.wifi.signal +"% ("+ i.wifi.rssi, " dBm)")}
${inforow("Uptime",getRuntimeStr(i.uptime))}
${inforow("Free heap",heap," kB")}
${i.psram?inforow("Free PSRAM",(i.psram/1024).toFixed(1)," kB"):""}
${inforow("Estimated current",pwru)}
${inforow("Average FPS",i.leds.fps)}
${inforow("MAC address",i.mac)}
${inforow("Filesystem",i.fs.u + "/" + i.fs.t + " kB (" +Math.round(i.fs.u*100/i.fs.t) + "%)")}
${inforow("Environment",i.arch + " " + i.core + " (" + i.lwip + ")")}
</table>`;
	gId('kv').innerHTML = cn;
}

function populateSegments(s)
{
	var cn = "";
	segCount = (s.seg||[]).length;
	lowestUnused = 0; lSeg = 0;

	if (segCount > 1) {
		for (var y = 0; y < segCount && y<4; y++)
		{
			var inst=s.seg[y];
			let i = parseInt(inst.id);
			powered[i] = inst.on;
			if (i == lowestUnused) lowestUnused = i+1;
			if (i > lSeg) lSeg = i;

			cn +=
`<div class="label h">${(inst.n&&inst.n!=='')?inst.n:('Segment '+y)}</div>
<div>
	<label class="check schkl">
		&nbsp;
		<input type="checkbox" id="seg${i}sel" onchange="selSeg(${i})" ${inst.sel ? "checked":""}>
		<span class="checkmark schk"></span>
	</label>
	<i class="icons slider-icon pwr ${powered[i] ? "act":""}" id="seg${i}pwr" onclick="setSegPwr(${i})" title="${inst.n}">&#xe08f;</i>
	<div id="sliderSeg${i}Bri" class="sliderwrap il">
		<input id="seg${i}bri" class="noslide" onchange="setSegBri(${i})" oninput="updateTrail(this)" max="255" min="1" type="range" value="${inst.bri}" />
		<div class="sliderdisplay"></div>
	</div>
	<output class="sliderbubble"></output>
</div>`;
		}
		if (gId('buttonBri').className !== 'active') tglBri(true);
	} else {
		tglBri(false);
	}
	gId('buttonBri').style.display = (segCount > 1) ? "block" : "none";
	gId('segcont').innerHTML = cn;
	for (var i = 0; i < segCount && i<4; i++) updateTrail(gId(`seg${i}bri`));
}

function btype(b)
{
	switch (b) {
		case 2:
		case 32: return "ESP32";
		case 1:
		case 82: return "ESP8266";
	}
	return "?";
}

function bname(o)
{
	if (o.name=="WLED") return o.ip;
	return o.name;
}

function populateNodes(i,n)
{
	var cn="";
	var urows="";
	var nnodes = 0;
	if (n.nodes) {
		n.nodes.sort((a,b) => (a.name).localeCompare(b.name));
		for (var x=0;x<n.nodes.length;x++) {
			var o = n.nodes[x];
			if (o.name) {
				var url = `<button class="btn tab" title="${o.ip}" onclick="location.assign('http://${o.ip}');">${bname(o)}</button>`;
				urows += inforow(url,`${btype(o.type)}<br><i>${o.vid==0?"N/A":o.vid}</i>`);
				nnodes++;
			}
		}
	}
	if (i.ndc < 0) cn += `Instance List is disabled.`;
	else if (nnodes == 0) cn += `No other instances found.`;
	cn += `<table class="infot">
	${urows}
	${inforow("Current instance:",i.name)}
	</table>`;
	gId('kn').innerHTML = cn;
}

function loadNodes()
{
	var url = (loc?`http://${locip}`:'') + '/json/nodes';
	fetch(url, {
		method: 'get'
	})
	.then(res => {
		if (!res.ok) showToast('Could not load Node list!', true);
		return res.json();
	})
	.then(json => {
		clearErrorToast();
		populateNodes(lastinfo, json);
	})
	.catch(function (error) {
		showToast(error, true);
		console.log(error);
	});
}

function populateEffects()
{
	var effects = eJson;
	var html = "";

	effects.shift(); //remove solid
	for (let i = 0; i < effects.length; i++) effects[i] = {id: effects[i][0], name:effects[i][1]};
	effects.sort((a,b) => (a.name).localeCompare(b.name));
	effects.unshift({
		"id": 0,
		"name": "Solid",
	});
	for (let i = 0; i < effects.length; i++) {
		html += generateListItemHtml(
			effects[i].id,
			effects[i].name,
			'setEffect'
		);
	}
	gId('fxlist').innerHTML=html;
}

function populatePalettes()
{
	var palettes = lJson;
	palettes.shift(); //remove default
	for (let i = 0; i < palettes.length; i++) {
		palettes[i] = {
			"id": palettes[i][0],
			"name": palettes[i][1]
		};
	}
	palettes.sort((a,b) => (a.name).localeCompare(b.name));
	palettes.unshift({
		"id": 0,
		"name": "Default",
	});
	var html = "";
	for (let i = 0; i < palettes.length; i++) {
		html += generateListItemHtml(
			palettes[i].id,
			palettes[i].name,
			'setPalette',
			`<div class="lstIprev"></div>`
		);
	}
	gId('pallist').innerHTML=html;
}

function redrawPalPrev()
{
	let palettes = d.querySelectorAll('#pallist .lstI');
	for (let i = 0; i < palettes.length; i++) {
		let id = palettes[i].dataset.id;
		let lstPrev = palettes[i].querySelector('.lstIprev');
		if (lstPrev) {
			lstPrev.style = genPalPrevCss(id);
		}
	}
}

function genPalPrevCss(id)
{
	if (!palettesData) return;

	var paletteData = palettesData[id];
	var previewCss = "";

	if (!paletteData) return 'display: none';

	// We need at least two colors for a gradient
	if (paletteData.length == 1) {
		paletteData[1] = paletteData[0];
		if (Array.isArray(paletteData[1])) {
			paletteData[1][0] = 255;
		}
	}

	var gradient = [];
	for (let j = 0; j < paletteData.length; j++) {
		const element = paletteData[j];
		let r;
		let g;
		let b;
		let index = false;
		if (Array.isArray(element)) {
			index = element[0]/255*100;
			r = element[1];
			g = element[2];
			b = element[3];
		} else if (element == 'r') {
			r = Math.random() * 255;
			g = Math.random() * 255;
			b = Math.random() * 255;
		} else {
			if (selColors) {
				let e = element[1] - 1;
				if (Array.isArray(selColors[e])) {
					r = selColors[e][0];
					g = selColors[e][1];
					b = selColors[e][2];
				} else {
					r = (selColors[e]>>16) & 0xFF;
					g = (selColors[e]>> 8) & 0xFF;
					b = (selColors[e]    ) & 0xFF;
				}
			}
		}
		if (index === false) {
			index = j / paletteData.length * 100;
		}

		gradient.push(`rgb(${r},${g},${b}) ${index}%`);
	}

	return `background: linear-gradient(to right,${gradient.join()});`;
}

function generateOptionItemHtml(id, name)
{
    return `<option value="${id}">${name}</option>`;
}

function generateListItemHtml(id, name, clickAction, extraHtml = '')
{
    return `<div class="lstI c" data-id="${id}" onClick="${clickAction}(${id})"><span class="lstIname">${name}</span>${extraHtml}</div>`;
}

function updateTrail(e, slidercol)
{
	if (e==null) return;
	var max = e.hasAttribute('max') ? e.attributes.max.value : 255;
	var perc = e.value * 100 / max;
	perc = parseInt(perc);
	if (perc < 50) perc += 2;
	var scol;
	switch (slidercol) {
		case 1: scol = "#f00"; break;
		case 2: scol = "#0f0"; break;
		case 3: scol = "#00f"; break;
		default: scol = "var(--c-f)";
	}
	var val = `linear-gradient(90deg, ${scol} ${perc}%, var(--c-4) ${perc}%)`;
	e.parentNode.getElementsByClassName('sliderdisplay')[0].style.background = val;
	var bubble = e.parentNode.parentNode.getElementsByTagName('output')[0];
	if (bubble) bubble.innerHTML = e.value;
}

function toggleBubble(e)
{
	var bubble = e.target.parentNode.parentNode.getElementsByTagName('output')[0];
	bubble.classList.toggle('sliderbubbleshow');
}

function updatePA(scrollto=false)
{
	var ps = gEBCN("pres");
	for (let i = 0; i < ps.length; i++) {
		ps[i].classList.remove('selected');;
	}
	ps = gEBCN("psts");
	for (let i = 0; i < ps.length; i++) {
		ps[i].classList.remove('selected');;
	}
	if (currentPreset > 0) {
        var acv = gId(`p${currentPreset}o`);
		if (acv) acv.classList.add('selected');
		acv = gId(`p${currentPreset}qlb`);
		if (acv) acv.classList.add('selected');
    }
}

function updateUI(scrollto=false)
{
	gId('buttonPower').className = (isOn) ? "active":"";

	var sel = 0;
	if (lJson && lJson.length) {
		for (var i=0; i<lJson.length; i++) if (lJson[i].id == selectedPal) {sel = i; break;}
		gId('palBtn').innerHTML = '<i class="icons">&#xe2b3;</i> ' + lJson[sel].name;
	}
	sel = 0;
	if (eJson && eJson.length) {
		for (var i=0; i<eJson.length; i++) if (eJson[i].id == selectedFx) {sel = i; break;}
		gId('fxBtn').innerHTML = '<i class="icons">&#xe0e8;</i> ' + eJson[sel].name;
	}

	updateTrail(gId('sliderBri'));
	updateTrail(gId('sliderSpeed'));
	updateTrail(gId('sliderIntensity'));
	updateTrail(gId('sliderW'));
	if (isRgbw) gId('wwrap').style.display = "block";

	updatePA(scrollto);
	redrawPalPrev();

	var l = cfg.comp.labels; //l = false;
	var e = d.querySelectorAll('.label');
	for (var i=0; i<e.length; i++) e[i].style.display = l ? "block":"none";
}

function cmpP(a, b)
{
	if (!a[1].n) return (a[0] > b[0]);
	// playlists follow presets
	var name = (a[1].playlist ? '~' : ' ') + a[1].n;
	return name.localeCompare((b[1].playlist ? '~' : ' ') + b[1].n, undefined, {numeric: true});
}

function makeWS() {
	if (ws || lastinfo.ws<0) return;
	ws = new WebSocket('ws://'+(loc?locip:window.location.hostname)+'/ws');
	ws.onmessage = function(event) {
		var json = JSON.parse(event.data);
		if (json.leds) return; //liveview packet
		clearTimeout(jsonTimeout);
		jsonTimeout = null;
		lastUpdate = new Date();
		clearErrorToast();
	  	gId('connind').style.backgroundColor = "var(--c-l)";
		// json object should contain json.info AND json.state (but may not)
		var info = json.info;
		if (info) {
			var name = info.name;
			lastinfo = info;
			gId('namelabel').innerHTML = name;
			//if (name === "Dinnerbone") d.documentElement.style.transform = "rotate(180deg)";
			if (info.live) name = "(Live) " + name;
			if (loc) name = "(L) " + name;
			d.title     = name;
			isRgbw      = info.leds.wv;
			ledCount    = info.leds.count;
			syncTglRecv = info.str;
			maxSeg      = info.leds.maxseg;
			pmt         = info.fs.pmt;
			if (isInfo) populateInfo(info);
		} else
			info = lastinfo;
		var s = json.state ? json.state : json;
		readState(s);
	};
	ws.onclose = function(event) {
		gId('connind').style.backgroundColor = "var(--c-r)";
		ws = null;
	}
	ws.onopen = function(event) {
		ws.send("{'v':true}");
		reqsLegal = true;
		clearErrorToast();
	}
}

function readState(s,command=false)
{
	if (!s) return false;

	isOn = s.on;
	gId('sliderBri').value= s.bri;
	nlA = s.nl.on;
	nlDur = s.nl.dur;
	nlTar = s.nl.tbri;
	nlFade = s.nl.fade;
	syncSend = s.udpn.send;
	if (s.pl<0)	currentPreset = s.ps;
	else currentPreset = s.pl;
	tr = s.transition/10;

	var selc=0; var ind=0;
	populateSegments(s);
	for (let i = 0; i < (s.seg||[]).length; i++)
	{
		if(s.seg[i].sel) {selc = ind; break;} ind++;
	}
	var i=s.seg[selc];
	if (!i) {
		showToast('No Segments!', true);
		updateUI();
		return;
	}
  
	selColors = i.col;
	var cd = gId('csl').children;
	for (let e = cd.length-1; e >= 0; e--)
	{
		var r,g,b,w;
		if (Array.isArray(i.col[e])) {
			r = i.col[e][0];
			g = i.col[e][1];
			b = i.col[e][2];
			if (isRgbw) w = i.col[e][3];
		} else {
			// unsigned long RGBW (@blazoncek v2 experimental API implementation)
			r = (i.col[e]>>16) & 0xFF;
			g = (i.col[e]>> 8) & 0xFF;
			b = (i.col[e]    ) & 0xFF;
			if (isRgbw) w = (i.col[e] >> 24) & 0xFF;
		}
		cd[e].style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
		if (isRgbw) whites[e] = parseInt(w);
		selectSlot(csel);
	}
	gId('sliderW').value = whites[csel];

	gId('sliderSpeed').value = i.sx;
	gId('sliderIntensity').value = i.ix;

	if (s.error && s.error != 0) {
	  var errstr = "";
	  switch (s.error) {
		case 10:
		  errstr = "Could not mount filesystem!";
		  break;
		case 11:
		  errstr = "Not enough space to save preset!";
		  break;
		case 12:
		  errstr = "Preset not found.";
		  break;
		case 13:
		  errstr = "Missing IR.json.";
		  break;
		case 19:
		  errstr = "A filesystem error has occured.";
		  break;
		}
	  showToast('Error ' + s.error + ": " + errstr, true);
	}

	selectedPal = i.pal;
	selectedFx = i.fx;
	updateUI(true);
}

var jsonTimeout;
var reqsLegal = false;

function requestJson(command=null)
{
	gId('connind').style.backgroundColor = "var(--c-r)";
	if (command && !reqsLegal) return; //stop post requests from chrome onchange event on page restore
	if (!jsonTimeout) jsonTimeout = setTimeout(showErrorToast, 3000);
	if (!command) command = {'v':true};
	var req = null;
	var url = (loc?`http://${locip}`:'') + '/json/state';
	var useWs = (ws && ws.readyState === WebSocket.OPEN);
	var type = command ? 'post':'get';

	command.v = true; // force complete /json/si API response
	command.time = Math.floor(Date.now() / 1000);
    command.transition = tr;
	req = JSON.stringify(command);
	if (req.length > 1000) useWs = false; //do not send very long requests over websocket

	if (useWs) {
		ws.send(req?req:'{"v":true}');
		return;
	}

	fetch(url, {
		method: type,
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		},
		body: req
	})
	.then(res => {
		if (!res.ok) showErrorToast();
		return res.json();
	})
	.then(json => {
		clearTimeout(jsonTimeout);
		jsonTimeout = null;
		lastUpdate = new Date();
		clearErrorToast();
		gId('connind').style.backgroundColor = "var(--c-g)";
		if (!json) { showToast('Empty response', true); return; }
		if (json.success) return;
		var s = json.state ? json.state : json;
		readState(s);
		reqsLegal = true;
	})
	.catch(function (error) {
		showToast(error, true);
		console.log(error);
	});
}

function togglePower()
{
	isOn = !isOn;
	var obj = {"on": isOn};
	requestJson(obj);
}

function toggleInfo()
{
	if (isNodes) toggleNodes();
	isInfo = !isInfo;
	if (isInfo) loadInfo();
	gId('info').style.transform = (isInfo) ? "translateY(0px)":"translateY(100%)";
}

function toggleNodes()
{
	if (isInfo) toggleInfo();
	isNodes = !isNodes;
	if (isNodes) loadNodes();
	gId('nodes').style.transform = (isNodes) ? "translateY(0px)":"translateY(100%)";
}

function tglBri(b=null)
{
	if (b===null) b = gId(`briwrap`).style.display === "block";
	gId('briwrap').style.display = !b ? "block":"none";
	gId('buttonBri').className = !b ? "active":"";
	size();
}

function tglCP()
{
//	var p = gId(`picker`).style.display === "block";
	var p = gId('buttonCP').className === "active";
	gId('buttonCP').className = !p ? "active":"";
	gId('picker').style.display = !p ? "block":"none";
	var csl = gId(`csl`).style.display === "block";
	gId('csl').style.display = !csl ? "block":"none";
	var ps = gId(`Presets`).style.display === "block";
	gId('Presets').style.display = !ps ? "block":"none";
}

function tglCs(i)
{
	var pss = gId(`p${i}cstgl`).checked;
	gId(`p${i}o1`).style.display = pss? "block" : "none";
	gId(`p${i}o2`).style.display = !pss? "block" : "none";
}

function selSeg(s)
{
	var sel = gId(`seg${s}sel`).checked;
	var obj = {"seg": {"id": s, "sel": sel}};
	requestJson(obj);
}

function tglPalDropdown()
{
	var p = gId('palDropdown').style;
	p.display = (p.display==='block'?'none':'block');
	gId('fxDropdown').style.display = 'none';
	if (p.display==='block')
		gId('palDropdown').scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
}

function tglFxDropdown()
{
	var p = gId('fxDropdown').style;
	p.display = (p.display==='block'?'none':'block');
	gId('palDropdown').style.display = 'none';
	if (p.display==='block')
		gId('fxDropdown').scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
}

function setSegPwr(s)
{
	var obj = {"seg": {"id": s, "on": !powered[s]}};
	requestJson(obj);
}

function setSegBri(s)
{
	var obj = {"seg": {"id": s, "bri": parseInt(gId(`seg${s}bri`).value)}};
	requestJson(obj);
}

function setEffect(ind = null)
{
	tglFxDropdown();
	var obj = {"seg": {"fx": parseInt(ind)}};
	requestJson(obj);
}

function setPalette(paletteId = null)
{
	tglPalDropdown();
	var obj = {"seg": {"pal": paletteId}};
	requestJson(obj);
}

function setBri()
{
	var obj = {"bri": parseInt(gId('sliderBri').value)};
	requestJson(obj);
}

function setSpeed()
{
	var obj = {"seg": {"sx": parseInt(gId('sliderSpeed').value)}};
	requestJson(obj);
}

function setIntensity()
{
	var obj = {"seg": {"ix": parseInt(gId('sliderIntensity').value)}};
	requestJson(obj);
}

function setLor(i)
{
	var obj = {"lor": i};
	requestJson(obj);
}

function setPreset(i)
{
	var obj = {"ps": i};
	if (isPlaylist(i)) obj.on = true;
	showToast("Loading preset " + pName(i) +" (" + i + ")");
	requestJson(obj);
}

function selectSlot(b)
{
	csel = b;
	var cd = gId('csl').children;
	for (let i = 0; i < cd.length; i++) {
		cd[i].classList.remove('xxs-w');
	}
	cd[csel].classList.add('xxs-w');
	cpick.color.set(cd[csel].style.backgroundColor);
	gId('sliderW').value = whites[csel];
	updateTrail(gId('sliderW'));
	redrawPalPrev();
}

var lasth = 0;
function pC(col)
{
	if (col == "rnd") {
		col = {h: 0, s: 0, v: 100};
		col.s = Math.floor((Math.random() * 50) + 50);
		do {
			col.h = Math.floor(Math.random() * 360);
		} while (Math.abs(col.h - lasth) < 50);
		lasth = col.h;
	}
	cpick.color.set(col);
	setColor(0);
}

function setColor(sr)
{
	var cd = gId('csl').children;
	if (sr == 1 && cd[csel].style.backgroundColor == 'rgb(0, 0, 0)') cpick.color.setChannel('hsv', 'v', 100);
	cd[csel].style.backgroundColor = cpick.color.rgbString;
	if (sr != 2) whites[csel] = gId('sliderW').value;
	var col = cpick.color.rgb;
	var obj = {"seg": {"col": [[col.r, col.g, col.b, whites[csel]],[],[]]}};
	if (sr==1 || gId(`picker`).style.display !== "block") obj.seg.fx = 0;
	if (csel == 1) {
		obj = {"seg": {"col": [[],[col.r, col.g, col.b, whites[csel]],[]]}};
	} else if (csel == 2) {
		obj = {"seg": {"col": [[],[],[col.r, col.g, col.b, whites[csel]]]}};
	}
	requestJson(obj);
}

var hc = 0;
setInterval(function(){if (!isInfo) return; hc+=18; if (hc>300) hc=0; if (hc>200)hc=306; if (hc==144) hc+=36; if (hc==108) hc+=18;
gId('heart').style.color = `hsl(${hc}, 100%, 50%)`;}, 910);

function openGH() { window.open("https://github.com/Aircoookie/WLED/wiki"); }

var cnfr = false;
function cnfReset()
{
	if (!cnfr) {
		var bt = gId('resetbtn');
		bt.style.color = "#f00";
		bt.innerHTML = "Confirm Reboot";
		cnfr = true; return;
	}
	window.location.href = "/reset";
}

function loadPalettesData(callback = null)
{
	if (palettesData) return;
	const lsKey = "wledPalx";
	var palettesDataJson = localStorage.getItem(lsKey);
	if (palettesDataJson) {
		try {
			palettesDataJson = JSON.parse(palettesDataJson);
			if (palettesDataJson && palettesDataJson.vid == lastinfo.vid) {
				palettesData = palettesDataJson.p;
				if (callback) callback(); //redrawPalPrev()
				return;
			}
		} catch (e) {}
	}

	palettesData = {};
	getPalettesData(0, function() {
		localStorage.setItem(lsKey, JSON.stringify({
			p: palettesData,
			vid: lastinfo.vid
		}));
		if (callback) setTimeout(callback, 99); //redrawPalPrev()
	});
}

function getPalettesData(page, callback)
{
	var url = (loc?`http://${locip}`:'') + `/json/palx?page=${page}`;

	fetch(url, {
		method: 'get',
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	})
	.then(res => {
		if (!res.ok) showErrorToast();
		return res.json();
	})
	.then(json => {
		palettesData = Object.assign({}, palettesData, json.p);
		if (page < json.m) setTimeout(function() { getPalettesData(page + 1, callback); }, 50);
		else callback();
	})
	.catch(function(error) {
		showToast(error, true);
		console.log(error);
	});
}

function search(f,l=null)
{
	f.nextElementSibling.style.display=(f.value!=='')?'block':'none';
	if (!l) return;
	var el = gId(l).querySelectorAll('.lstI');
	for (i = 0; i < el.length; i++) {
		var it = el[i];
		var itT = it.querySelector('.lstIname').innerText.toUpperCase();
		it.style.display = itT.indexOf(f.value.toUpperCase())>-1?'':'none';
	}
}

function clean(c)
{
	c.style.display='none';
	var i=c.previousElementSibling;
	i.value='';
	i.focus();
	i.dispatchEvent(new Event('input'));
}

function unfocusSliders()
{
	gId("sliderBri").blur();
	gId("sliderSpeed").blur();
	gId("sliderIntensity").blur();
}

//sliding UI
const _C = d.querySelector('.container'), N = 1;

let iSlide = 0, x0 = null, scrollS = 0, locked = false, w;

function unify(e) {	return e.changedTouches ? e.changedTouches[0] : e; }

function hasIroClass(classList)
{
	for (var i = 0; i < classList.length; i++) {
		var element = classList[i];
		if (element.startsWith('Iro')) return true;
	}
	return false;
}

function lock(e)
{
	var l = e.target.classList;
	var pl = e.target.parentElement.classList;

	if (l.contains('noslide') || hasIroClass(l) || hasIroClass(pl)) return;

	x0 = unify(e).clientX;
	scrollS = gEBCN("tabcontent")[iSlide].scrollTop;

	_C.classList.toggle('smooth', !(locked = true));
}

function move(e)
{
	if(!locked) return;
	var clientX = unify(e).clientX;
	var dx = clientX - x0;
	var s = Math.sign(dx);
	var f = +(s*dx/w).toFixed(2);

	if((clientX != 0) &&
		(iSlide > 0 || s < 0) && (iSlide < N - 1 || s > 0) &&
		f > 0.12 &&
		gEBCN("tabcontent")[iSlide].scrollTop == scrollS)
	{
		_C.style.setProperty('--i', iSlide -= s);
		f = 1 - f;
		updateTablinks(iSlide);
	}
	_C.style.setProperty('--f', f);
	_C.classList.toggle('smooth', !(locked = false));
	x0 = null;
}

function size()
{
	w = window.innerWidth;
	var h = gId('top').clientHeight;
	sCol('--th', h + "px");
    sCol("--tp", h - (gId(`briwrap`).style.display === "block" ? 0 : gId(`briwrap`).clientTop) + "px");
    sCol("--bh", "0px");
}

function mergeDeep(target, ...sources)
{
	if (!sources.length) return target;
	const source = sources.shift();

	if (isO(target) && isO(source)) {
		for (const key in source) {
			if (isO(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				mergeDeep(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		}
	}
	return mergeDeep(target, ...sources);
}

size();
window.addEventListener('resize', size, false);

_C.addEventListener('mousedown', lock, false);
_C.addEventListener('touchstart', lock, false);

_C.addEventListener('mouseout', move, false);
_C.addEventListener('mouseup', move, false);
_C.addEventListener('touchend', move, false);