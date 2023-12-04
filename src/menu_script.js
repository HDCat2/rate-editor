var match_osu_url = new RegExp("^https:\/\/osu\.ppy\.sh\/beatmapsets\/([0-9]+)#(osu|fruits|taiko|mania)\/([0-9]+)$");
var set_id;
var beatmap_mode;
var diff_id;
var set_info;
var set_index;
var url;
var result_fname;
var audio_fname;

const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({
    corePath: chrome.runtime.getURL("lib/ffmpeg-core.js"),
    log: true,
    mainName: 'main'
});

/*
Display HTML in the case an error comes up
*/
function display_error(error_msg) {
    document.getElementById("root_div").className = "unsupported";
    document.getElementById("root_div").innerHTML = error_msg;
}

/*
Display HTML for a beatmap page
*/
function display_supported() {
    var root_div = document.getElementById("root_div")
    root_div.className = "supported";

    var form = document.createElement('form');
    form.setAttribute('id', 'popup_form');
    form.setAttribute('onsubmit', "return handleDownload()");

    var input_diff_div = document.createElement('div');
    var input_diff_label = document.createElement('span');
    input_diff_label.innerHTML = 'Name';

    var input_bpm_div = document.createElement('div');
    var input_bpm_label = document.createElement('span');
    input_bpm_label.innerHTML = 'BPM';

    var input_ar_div = document.createElement('div');
    var input_ar_label = document.createElement('span');
    input_ar_label.innerHTML = 'AR';

    var input_cs_div = document.createElement('div');
    var input_cs_label = document.createElement('span');
    input_cs_label.innerHTML = 'CS';

    var input_od_div = document.createElement('div');
    var input_od_label = document.createElement('span');
    input_od_label.innerHTML = 'OD';

    var input_hp_div = document.createElement('div');
    var input_hp_label = document.createElement('span');
    input_hp_label.innerHTML = 'HP';

    var input_diff_name = document.createElement('input');
    var input_bpm = document.createElement('input');
    var input_ar = document.createElement('input');
    var input_cs = document.createElement('input');
    var input_od = document.createElement('input');
    var input_hp = document.createElement('input');

    input_diff_div.setAttribute('class', 'form-group');
    input_bpm_div.setAttribute('class', 'form-group');
    input_ar_div.setAttribute('class', 'form-group');
    input_cs_div.setAttribute('class', 'form-group');
    input_od_div.setAttribute('class', 'form-group');
    input_hp_div.setAttribute('class', 'form-group');

    input_diff_name.setAttribute('id', 'input_diff_name');
    input_bpm.setAttribute('id', 'input_bpm');
    input_ar.setAttribute('id', 'input_ar');
    input_cs.setAttribute('id', 'input_cs');
    input_od.setAttribute('id', 'input_od');
    input_hp.setAttribute('id', 'input_hp');

    input_bpm.setAttribute('type', 'range');
    input_ar.setAttribute('type', 'number');
    input_cs.setAttribute('type', 'number');
    input_od.setAttribute('type', 'number');
    input_hp.setAttribute('type', 'number');

    input_bpm.setAttribute('min', '0.5');
    input_ar.setAttribute('min', '0');
    input_cs.setAttribute('min', '0');
    input_od.setAttribute('min', '0');
    input_hp.setAttribute('min', '0');

    input_bpm.setAttribute('max', '2.0');
    input_ar.setAttribute('max', '10');
    input_cs.setAttribute('max', '10');
    input_od.setAttribute('max', '10');
    input_hp.setAttribute('max', '10');

    input_bpm.setAttribute('step', '0.1');
    input_ar.setAttribute('step', '0.1');
    input_cs.setAttribute('step', '0.1');
    input_od.setAttribute('step', '0.1');
    input_hp.setAttribute('step', '0.1');

    input_bpm.setAttribute('title', "Input a number between 0.5 and 2.0 inclusive");
    input_ar.setAttribute('title', "Input a number between 0 and 10 inclusive, up to 1 decimal place");
    input_cs.setAttribute('title', "Input a number between 0 and 10 inclusive, up to 1 decimal place");
    input_od.setAttribute('title', "Input a number between 0 and 10 inclusive, up to 1 decimal place");
    input_hp.setAttribute('title', "Input a number between 0 and 10 inclusive, up to 1 decimal place");

    var input_bpm_display = document.createElement('output');
    input_bpm_display.setAttribute('id', 'input_bpm_display');
    input_bpm_display.value = 'x1.0';
    input_bpm.oninput = function() {
        if (/^[0-9]$/.test(input_bpm.value)) {
            document.getElementById('input_bpm_display').value = 'x' + input_bpm.value + '.0';
        }
        else {
            document.getElementById('input_bpm_display').value = 'x' + input_bpm.value;
        }
    }

    input_diff_div.appendChild(input_diff_label);
    input_diff_div.appendChild(input_diff_name);

    input_bpm_div.appendChild(input_bpm_label);
    input_bpm_div.appendChild(input_bpm_display);
    input_bpm_div.appendChild(input_bpm);

    input_ar_div.appendChild(input_ar_label);
    input_ar_div.appendChild(input_ar);

    input_cs_div.appendChild(input_cs_label);
    input_cs_div.appendChild(input_cs);

    input_od_div.appendChild(input_od_label);
    input_od_div.appendChild(input_od);

    input_hp_div.appendChild(input_hp_label);
    input_hp_div.appendChild(input_hp);

    form.appendChild(input_diff_div);
    form.appendChild(input_ar_div);
    form.appendChild(input_cs_div);
    form.appendChild(input_od_div);
    form.appendChild(input_hp_div);
    form.appendChild(input_bpm_div);

    var reset_button = document.createElement('button');
    reset_button.innerHTML = 'Reset Values';
    reset_button.setAttribute('id', 'reset_button');
    reset_button.setAttribute('class', 'bn5');
    reset_button.addEventListener('click', fillDefault);

    var download_button = document.createElement('button');
    download_button.innerHTML = 'Download';
    download_button.setAttribute('id', 'download_button');
    download_button.setAttribute('class', 'bn5');
    download_button.addEventListener('click', handleDownload);

    var title_header = document.createElement('p');
    title_header.setAttribute('class', 'title_header');
    title_header.innerHTML = 'Create New Beatmap Difficulty'

    var ext_info = document.createElement('p');
    ext_info.innerHTML = "Edit the beatmap characteristics below. Click 'download' to receive the edited beatmap. The edited beatmap can be put into osu! by double-clicking like all other downloaded beatmaps."
    ext_info.setAttribute('class', 'info');

    root_div.appendChild(title_header);
    root_div.appendChild(document.createElement('hr'));
    root_div.appendChild(ext_info);
    root_div.appendChild(document.createElement('hr'));
    root_div.appendChild(form);
    root_div.appendChild(document.createElement('hr'));
    root_div.appendChild(reset_button);
    root_div.appendChild(download_button);

    var bottom_text = document.createElement('p');
    bottom_text.setAttribute('id', 'bottom_text');
    root_div.appendChild(bottom_text);

    // Because editing width in CSS sheet doesn't work
    document.getElementById('input_diff_name').setAttribute("style", "width: 244px");
    document.getElementById('input_ar').setAttribute("style", "width: 94px");
    document.getElementById('input_cs').setAttribute("style", "width: 94px");
    document.getElementById('input_od').setAttribute("style", "width: 94px");
    document.getElementById('input_hp').setAttribute("style", "width: 94px");
    document.getElementById('input_bpm').setAttribute("style", "width: 188px");
}

/*
Refill form values back to the default (whatever the indicated map had originally)
*/
function fillDefault() {
    document.getElementById('input_diff_name').value = set_info.ChildrenBeatmaps[set_index].DiffName + " (edited)";
    document.getElementById('input_bpm').value = "1.0";
    document.getElementById('input_ar').value = set_info.ChildrenBeatmaps[set_index].AR;
    document.getElementById('input_cs').value = set_info.ChildrenBeatmaps[set_index].CS;
    document.getElementById('input_od').value = set_info.ChildrenBeatmaps[set_index].OD;
    document.getElementById('input_hp').value = set_info.ChildrenBeatmaps[set_index].HP;
}

/*
Retrieve set and diff info from API
*/
async function get_vals() {
    // Use regex matching to get IDs of set and diff
    let extract_ids = url.match(match_osu_url);
    set_id = extract_ids[1];
    beatmap_mode = extract_ids[2];
    diff_id = extract_ids[3];

    // Retrieve set attributes using API call
    let response = await fetch("https://api.chimu.moe/v1/set/" + set_id + "/");
    if (response.status != 200) {
        display_error("Failed to retrieve beatmapset info. Please try again by clicking in and out of the popup.");
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

    fillDefault();

}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

/*
Check if valid values were entered for input fields
*/
function verifyFields() {
    if (document.getElementById('input_diff_name').value == null || document.getElementById('input_diff_name').value == "") {
        document.getElementById('bottom_text').innerHTML = "Please write a name for your custom diff";
        return false;
    }
    if (isNaN(document.getElementById('input_bpm').value) || Number(document.getElementById('input_bpm').value) < 0.5 ||  Number(document.getElementById('input_bpm').value) > 2.0) {
        document.getElementById('bottom_text').innerHTML = "BPM multiplier must be between 0.5 and 2.0";
        return false;
    }
    if (!/^(10|10\.0|[0-9]\.[0-9]|[0-9])$/gm.test(document.getElementById('input_ar').value)) {
        document.getElementById('bottom_text').innerHTML = "AR must be a number between 0 and 10 to up to 1 decimal place";
        return false;
    }
    if (!/^(10|10\.0|[0-9]\.[0-9]|[0-9])$/gm.test(document.getElementById('input_cs').value)) {
        document.getElementById('bottom_text').innerHTML = "CS must be a number between 0 and 10 to up to 1 decimal place";
        return false;
    }
    if (!/^(10|10\.0|[0-9]\.[0-9]|[0-9])$/gm.test(document.getElementById('input_od').value)) {
        document.getElementById('bottom_text').innerHTML = "OD must be a number between 0 and 10 to up to 1 decimal place";
        return false;
    }
    if (!/^(10|10\.0|[0-9]\.[0-9]|[0-9])$/gm.test(document.getElementById('input_hp').value)) {
        document.getElementById('bottom_text').innerHTML = "HP must be a number between 0 and 10 to up to 1 decimal place";
        return false;
    }
    return true;
}

/*
Modify hit objects
*/
function editHitObject(match) {
    var vals = match.split(',');
    if (vals.every((x) => !isNaN(x)) && vals.length == 8) { // Check if it's actually a timing point
        return match;
    }
    vals[2] = String(Math.round(Number(vals[2])/Number(document.getElementById('input_bpm').value)));
    if (Number(vals[3]) & (1 << 3)) { // spinner
        console.log("spinner detected " + vals[3]);
        vals[5] = String(Math.round(Number(vals[5])/Number(document.getElementById('input_bpm').value)));
    }
    return vals.join(',');
}

/*
Modify found timing point according to speed
*/
function editTimingPoint(match, p1, offset, string) {
    var vals = p1.split(',');
    vals[0] = String(Math.round(Number(vals[0])/Number(document.getElementById('input_bpm').value)));
    var bpm = Number(vals[1]);
    if (bpm > 0) {
        vals[1] = String(bpm/Number(document.getElementById('input_bpm').value));
    }
    return vals.join(',');
}

/*
Modify found hitcircle according to new speed
*/
function editCircle(match, p1, offset, string) {
    var vals = p1.split(',');
    vals[2] = String(Math.round(Number(vals[2])/Number(document.getElementById('input_bpm').value)));
    return vals.join(',');
}

/*
Modify found slider according to new speed
*/
function editSlider(match, p1, offset, string) {
    var vals = match.split(',');
    vals[2] = String(Math.round(Number(vals[2])/Number(document.getElementById('input_bpm').value)));
    return vals.join(',');
}

function editPreviewTime(match, p1, offset, string) {
    return "PreviewTime: " + String(Math.round(Number(p1) / Number(document.getElementById('input_bpm').value)));
}

function editBreakTiming(math, p1, offset, string) {
    var vals = match.split(',');
    vals[1] = String(Math.round(Number(vals[1])/Number(document.getElementById('input_bpm').value)));
    vals[2] = String(Math.round(Number(vals[2])/Number(document.getElementById('input_bpm').value)));
    return vals.join(',');
}

function editSpinner(match, p1, offset, string) {
    var vals = match.split(',');
    vals[2] = String(Math.round(Number(vals[2])/Number(document.getElementById('input_bpm').value)));
    vals[5] = String(Math.round(Number(vals[5])/Number(document.getElementById('input_bpm').value)));
    return vals.join(',');
}

/*
Code to fetch requisite beatmap, modify according to input, and download
*/
async function handleDownload() {
    // Check if values are valid
    if (!verifyFields()) return false;

    document.getElementById('download_button').disabled = true;

    document.getElementById('bottom_text').innerHTML = "Downloading .osz...";

    // Fetch zipped beatmap data with API call
    let osz = await fetch("https://api.chimu.moe/v1/download/" + set_id + "/");
    osz = await osz.blob();

    document.getElementById('bottom_text').innerHTML = "Creating custom .osu file...";

    // Unzip and read beatmap data
    const reader = new zip.ZipReader(new zip.BlobReader(osz));
    var arr = await reader.getEntries({filenameEncoding : "utf-8"});

    // Construct zip to send to
    var result = new zip.BlobWriter({mimeString: 'application/octet-stream'});
    var writer = new zip.ZipWriter(result);
    
    var diffFile;
    var diffFileSearchSucceeded = false;
    // Find .osu file which corresponds to current beatmap ID
    for (let i = 0; i < arr.length; i++) {
        if (RegExp("^.+\.osu$").test(arr[i].filename)) {
            var txtReader = new zip.TextWriter();
            diffFile = await arr[i].getData(txtReader);
            if (diffFile.includes("BeatmapID:" + diff_id)) {
                diffFileSearchSucceeded = true;
                audio_fname = diffFile.match(RegExp("AudioFilename:([ \s]*)(.+)"))[2];

                // Alter beatmap characteristics according to input
                diffFile = diffFile.replace(RegExp("PreviewTime:[ \s]*(.+)"), editPreviewTime);
                diffFile = diffFile.replace(RegExp("Version:(.+)"), "Version:" + document.getElementById("input_diff_name").value);
                diffFile = diffFile.replace(RegExp("BeatmapID:[0-9]+"), "BeatmapID:0"); // Turn beatmap to unsubmitted
                diffFile = diffFile.replace(RegExp("HPDrainRate:(.+)"), "HPDrainRate:" + document.getElementById("input_hp").value);
                diffFile = diffFile.replace(RegExp("CircleSize:(.+)"), "CircleSize:" + document.getElementById("input_cs").value);
                diffFile = diffFile.replace(RegExp("OverallDifficulty:(.+)"), "OverallDifficulty:" + document.getElementById("input_od").value);
                diffFile = diffFile.replace(RegExp("ApproachRate:(.+)"), "ApproachRate:" + document.getElementById("input_ar").value);

                // Alter beatmap timing points & hit objects according to input bpm
                diffFile = diffFile.replaceAll(/(^[-\.0-9]+,[-\.0-9]+,[-\.0-9]+,[-\.0-9]+,[-\.0-9]+,[-\.0-9]+,[-\.0-9]+,[-\.0-9]+$)/gm, editTimingPoint);
                diffFile = diffFile.replaceAll(/^[0-9]+,[0-9]+,[0-9]+,[0-9]+,[0-9]+.*$/gm, editHitObject);
                diffFile = diffFile.replaceAll(/^(2|Break),[0-9]+,[0-9]+$/gm, editBreakTiming);

                // Add modified .osu file to result zip folder
                var txtWriter = new zip.TextReader(diffFile);
                await writer.add(set_info.Artist + " - " + set_info.Title + "(" + set_info.Creator + ") (edited) [" + document.getElementById("input_diff_name").value + "].osu", txtWriter);
                break;
            }
        }
    }

    if (!diffFileSearchSucceeded) {
        display_error("Failed to find diff in downloaded zip");
        document.getElementById('download_button').disabled = false;
        return false;
    }

    document.getElementById('bottom_text').innerHTML = "Modifying audio file...";

    // Handle other files inside the zip
    for (let i = 0; i < arr.length; i++) {
        // Case for audio file
        if (arr[i].filename == audio_fname) {
            var file_ext = audio_fname.match(RegExp("(\..+)$"))[1];
            var arrReader = new zip.BlobWriter();
            var arrData = await arr[i].getData(arrReader);

            if (Number(document.getElementById('input_bpm').value) == 1) {
                var arrWriter = new zip.BlobReader(arrData);
                await writer.add(arr[i].filename, arrWriter);
                continue;
            }

            var fileData = new File([arrData], "test1829381" + file_ext);

            await ffmpeg.load();

            await ffmpeg.FS('writeFile', "test1829381" + file_ext, await fetchFile(fileData));
            await ffmpeg.run(...['-i', "test1829381" + file_ext, '-filter:a', 'atempo=' + document.getElementById("input_bpm").value, '-vn', audio_fname]);

            var outBlob = new Blob([ffmpeg.FS('readFile', audio_fname).buffer]);
            await ffmpeg.exit();
            var arrWriter = new zip.BlobReader(outBlob);
            await writer.add(arr[i].filename, arrWriter);
            continue;
        }

        // Case for .osu files (all of them get dropped)
        else if (RegExp("^.+\.osu$").test(arr[i].filename)) {
            continue;
        }

        // Case for background (currently no background switching implemented yet)
        else if (RegExp("^.+\.jpg$").test(arr[i].filename) || RegExp("^.+\.png$").test(arr[i].filename)) {
            var arrReader = new zip.BlobWriter();
            var arrData = await arr[i].getData(arrReader);
            var arrWriter = new zip.BlobReader(arrData);
            await writer.add(arr[i].filename, arrWriter);
            continue;
        }

        // All other files simply get added
        else {
            var arrReader = new zip.BlobWriter();
            var arrData = await arr[i].getData(arrReader);
            var arrWriter = new zip.BlobReader(arrData);
            await writer.add(arr[i].filename, arrWriter);
            continue;
        }
    }

    document.getElementById('bottom_text').innerHTML = "Downloading modified beatmap!";

    // Download finished zip file
    await writer.close();
    var result_blob = await result.getData();
    result_blob = result_blob.slice(0, result_blob.size, "application/octet-stream");
    const result_url = URL.createObjectURL(result_blob);
    result_fname = set_id + ' ' + set_info.Title + '.osz';
    chrome.downloads.download({url : result_url, filename : result_fname});
    document.getElementById('bottom_text').innerHTML = "Downloaded!";
    document.getElementById('download_button').disabled = false;
    return false;
}

async function main() {
    const tab = await getCurrentTab();
    url = tab.url;

    if (match_osu_url.test(url)) {
        if (url.match(match_osu_url)[2] == "osu") {
            display_supported();
            await get_vals();
        }
        else {
            display_error("This extension only supports std gamemode :c")
        }
    } else {
        display_error("This extension does not support this webpage :c");
    }
}

main();