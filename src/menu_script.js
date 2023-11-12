function handleDownload() {
    console.log("lmao");
}

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

let match_osu_url = new RegExp("^https:\/\/osu\.ppy\.sh\/beatmapsets\/([0-9]+)#(osu|fruits|taiko|mania)\/([0-9]+)$");
let beatmap_id;
let beatmap_mode;
let diff_id;

async function main() {
    const tab = await getCurrentTab();
    const url = tab.url;

    if (match_osu_url.test(url)) {
        display_supported();
        let extract_ids = url.match(match_osu_url);
        beatmap_id = extract_ids[1];
        beatmap_mode = extract_ids[2];
        diff_id = extract_ids[3];
        console.log(beatmap_id);
        console.log(beatmap_mode);
        console.log(diff_id);
    } else {
        display_unsupported();
    }
}

main();