var match_osu_url = new RegExp("^https:\/\/osu\.ppy\.sh\/beatmapsets\/([0-9]+)#(osu|fruits|taiko|mania)\/([0-9]+)$");
var set_id;
var beatmap_mode;
var diff_id;
var set_info;
var set_index;
var url;

function display_error(error_msg) {
    document.getElementById("root_div").className = "unsupported";
    document.getElementById("root_div").innerHTML = "The extension ran into an error. Please try again by clicking out and back into the extension :c";
    var error_display = document.createElement('p');
    error_display.style.fontSize = 'x-small';
    error_display.innerHTML = error_msg;
    document.appendChild(error_display);
}

function display_unsupported() {
    document.getElementById("root_div").className = "unsupported";
    document.getElementById("root_div").innerHTML = "This extension does not support this webpage :c";
}

function display_supported() {
    var root_div = document.getElementById("root_div")

    var form = document.createElement('form');

    var input_diff_name = document.createElement('input');
    var input_bpm = document.createElement('input');
    var input_ar = document.createElement('input');
    var input_cs = document.createElement('input');
    var input_od = document.createElement('input');
    var input_hp = document.createElement('input');
    input_name.setAttribute('id', 'input_diff_name');
    input_bpm.setAttribute('id', 'input_bpm');
    input_ar.setAttribute('id', 'input_ar');
    input_cs.setAttribute('id', 'input_cs');
    input_od.setAttribute('id', 'input_od');
    input_hp.setAttribute('id', 'input_hp');

    form.appendChild(input_diff_name);
    form.appendChild(input_bpm);
    form.appendChild(input_ar);
    form.appendChild(input_cs);
    form.appendChild(input_od);
    form.appendChild(input_hp);

    var reset_button = document.createElement('button');
    reset_button.innerHTML = 'Reset Selection';
    reset_button.setAttribute('id', 'reset_button');
    reset_button.addEventListener('click', handleReset);

    var download_button = document.createElement('button');
    download_button.innerHTML = 'Download!';
    download_button.setAttribute('id', 'download_button');
    download_button.addEventListener('click', handleDownload);

    root_div.setAttribute('title', 'placeholder');
    root_div.className = "supported";
    root_div.appendChild(form);
    root_div.appendChild(reset_button);
    root_div.appendChild(download_button);
}

function fillDefault() {
    document.getElementById('input_bpm') = set_info.ChildrenBeatmaps[set_index].BPM;
}

async function get_vals() {
    // Use regex matching to get IDs of set and diff
    let extract_ids = url.match(match_osu_url);
    set_id = extract_ids[1];
    beatmap_mode = extract_ids[2];
    diff_id = extract_ids[3];

    // Retrieve set attributes using API call
    let response = await fetch("https://api.chimu.moe/v1/set/" + set_id + "/");
    if (response.status != 200) {
        console.log("f");
        display_error("Failed to retreive beatmapset info");
        return;
    }

    set_info = await response.json();

    // Find beatmap info amongst set info
    let flag = 0;
    for(let i = 0; i < set_info.ChildrenBeatmaps.length; i++) {
        if (set_info.ChildrenBeatmaps[i].BeatmapId == diff_id) {
            flag = 1;
            set_index = i;

            break;
        }
    }
    if (!flag) {
        display_error("Failed to retrieve diff from received beatmap data");
        return;
    }

    console.log(set_info);
    console.log(set_index);

}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function handleReset() {
    console.log('lmao');
}

async function handleDownload() {
    // Fetch zipped beatmap data with API call
    let osz = await fetch("https://api.chimu.moe/v1/download/" + set_id + "/");
    osz = await osz.blob();

    // Unzip and read beatmap data
    const reader = new zip.ZipReader(new zip.BlobReader(osz));
    var arr = await reader.getEntries({filenameEncoding : "utf-8"});
    console.log(arr);
    for (var i = 0; i < arr.length; i++) {
        console.log(arr[i].filename);
    }
}

async function main() {
    const tab = await getCurrentTab();
    url = tab.url;

    if (match_osu_url.test(url)) {
        display_supported();
        await get_vals();
    } else {
        display_unsupported();
    }
}

main();