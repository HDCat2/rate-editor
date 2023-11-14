let match_osu_url = new RegExp("^https:\/\/osu\.ppy\.sh\/beatmapsets\/([0-9]+)#(osu|fruits|taiko|mania)\/([0-9]+)$");
let set_id;
let beatmap_mode;
let diff_id;

function display_unsupported() {
    document.getElementById("root_div").className = "unsupported";
    document.getElementById("root_div").innerHTML = "This extension does not support this webpage :c";
}

function display_supported() {
    var root_div = document.getElementById("root_div")

    var form = document.createElement('form');

    var input_bpm = document.createElement('input');
    var input_ar = document.createElement('input');
    var input_cs = document.createElement('input');
    var input_od = document.createElement('input');
    var input_hp = document.createElement('input');
    input_bpm.setAttribute('id', 'input_bpm');
    input_ar.setAttribute('id', 'input_ar');
    input_cs.setAttribute('id', 'input_cs');
    input_od.setAttribute('id', 'input_od');
    input_hp.setAttribute('id', 'input_hp');

    form.appendChild(input_bpm);
    form.appendChild(input_ar);
    form.appendChild(input_cs);
    form.appendChild(input_od);
    form.appendChild(input_hp);

    var download_button = document.createElement('button');
    download_button.innerHTML = 'Download!';
    download_button.setAttribute('id', 'download_button');
    download_button.addEventListener('click', handleDownload);

    root_div.setAttribute('title', 'placeholder');
    root_div.className = "supported";
    root_div.appendChild(form);
    root_div.appendChild(download_button);
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    console.log("got tab", tab.url);
    return tab;
}

async function handleDownload() {
    console.log("reading...");
    let osz = await fetch("https://api.chimu.moe/v1/download/" + set_id + "/");
    console.log(osz.status);
    console.log(osz.headers.get("Content-Type"));
    osz = await osz.blob();
    console.log("read!");
    console.log(osz.size);
    const reader = new zip.ZipReader(new zip.BlobReader(osz));
    var arr = await reader.getEntries({filenameEncoding : "utf-8"});
    console.log(arr);
    for (var i = 0; i < arr.length; i++) {
        console.log(arr[i].filename);
    }
}

async function main() {
    const tab = await getCurrentTab();
    const url = tab.url;

    if (match_osu_url.test(url)) {
        display_supported();
        let extract_ids = url.match(match_osu_url);
        set_id = extract_ids[1];
        beatmap_mode = extract_ids[2];
        diff_id = extract_ids[3];
    } else {
        display_unsupported();
    }
}

main();