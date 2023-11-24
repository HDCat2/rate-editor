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
    document.getElementById("root_div").innerHTML = "The extension ran into an error. Please try again by clicking out and back into the extension :c";
    var error_display = document.createElement('p');
    error_display.style.fontSize = 'x-small';
    error_display.innerHTML = error_msg;
    document.appendChild(error_display);
}

/*
Display HTML in the case the popup opens on page that is not a beatmap page
*/
function display_unsupported() {
    document.getElementById("root_div").className = "unsupported";
    document.getElementById("root_div").innerHTML = "This extension does not support this webpage :c";
}

/*
Display HTML for a beatmap page
*/
function display_supported() {
    var root_div = document.getElementById("root_div")

    var form = document.createElement('form');
    form.setAttribute('onsubmit', "return handleDownload()");

    var input_diff_name = document.createElement('input');
    var input_bpm = document.createElement('input');
    var input_ar = document.createElement('input');
    var input_cs = document.createElement('input');
    var input_od = document.createElement('input');
    var input_hp = document.createElement('input');

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
    input_ar.setAttribute('title', "Input a number between 0 and 10 inclusive, to at most 1 decimal place");
    input_cs.setAttribute('title', "Input a number between 0 and 10 inclusive, to at most 1 decimal place");
    input_od.setAttribute('title', "Input a number between 0 and 10 inclusive, to at most 1 decimal place");
    input_hp.setAttribute('title', "Input a number between 0 and 10 inclusive, to at most 1 decimal place");

    form.appendChild(input_diff_name);
    form.appendChild(input_bpm);
    form.appendChild(input_ar);
    form.appendChild(input_cs);
    form.appendChild(input_od);
    form.appendChild(input_hp);

    var reset_button = document.createElement('button');
    reset_button.innerHTML = 'Reset Selection';
    reset_button.setAttribute('id', 'reset_button');
    reset_button.addEventListener('click', fillDefault);

    var download_button = document.createElement('button');
    download_button.innerHTML = 'Download';
    download_button.setAttribute('id', 'download_button');
    download_button.addEventListener('click', handleDownload);

    root_div.className = "supported";
    root_div.appendChild(form);
    root_div.appendChild(reset_button);
    root_div.appendChild(download_button);

    var bottom_text = document.createElement('p');
    bottom_text.setAttribute('id', 'bottom_text');
    root_div.appendChild(bottom_text);
}

/*
Refill form values back to the default (whatever the indicated map had originally)
*/
function fillDefault() {
    document.getElementById('input_diff_name').value = set_info.ChildrenBeatmaps[set_index].DiffName;
    document.getElementById('input_bpm').value = "1.0";
    document.getElementById('input_ar').value = set_info.ChildrenBeatmaps[set_index].AR;
    document.getElementById('input_cs').value = set_info.ChildrenBeatmaps[set_index].OD;
    document.getElementById('input_od').value = set_info.ChildrenBeatmaps[set_index].CS;
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
    var n_err = 0;
    if (document.getElementById('input_diff_name').value == null || document.getElementById('input_diff_name').value == "") {
        document.getElementById('bottom_text').innerHTML = "Please write a name for your custom diff";
        return false;
    }
    if (isNaN(document.getElementById('input_bpm').value) || Number(document.getElementById('input_bpm').value) < 0.5 ||  Number(document.getElementById('input_bpm').value) > 2.0) {
        n_err++;
    }
    if (!RegExp("^(10|10\.0|[0-9]\.[0-9]|[0-9])$").test(document.getElementById('input_ar').value)) {
        n_err++;
    }
    if (!RegExp("^(10|10\.0|[0-9]\.[0-9]|[0-9])$").test(document.getElementById('input_cs').value)) {
        n_err++;
    }
    if (!RegExp("^(10|10\.0|[0-9]\.[0-9]|[0-9])$").test(document.getElementById('input_od').value)) {
        n_err++;
    }
    if (!RegExp("^(10|10\.0|[0-9]\.[0-9]|[0-9])$").test(document.getElementById('input_hp').value)) {
        n_err++;
    }
    if (n_err) {
        document.getElementById('bottom_text').innerHTML = "Please ensure that BPM multiplier is between 0.5 and 2.0 and all other submissions are numbers between 0 and 10 with at most 1 decimal place";
        return false;
    }
    document.getElementById('bottom_text').innerHTML = "Downloading .osz...";
    return true;
}

/*
Code to fetch requisite beatmap, modify according to input, and download
*/
async function handleDownload() {
    // Check if values are valid
    if (!verifyFields()) return false;
    // Fetch zipped beatmap data with API call
    let osz = await fetch("https://api.chimu.moe/v1/download/" + set_id + "/");
    osz = await osz.blob();

    document.getElementById('bottom_text').innerHTML = "Finding and editing diff...";

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
                diffFile = diffFile.replace(RegExp("Version:(.+)"), "Version:" + document.getElementById("input_diff_name").value);
                diffFile = diffFile.replace(RegExp("BeatmapID:[0-9]+"), "BeatmapID:0"); // Turn beatmap to unsubmitted
                diffFile = diffFile.replace(RegExp("HPDrainRate:(.+)"), "HPDrainRate:" + document.getElementById("input_hp").value);
                diffFile = diffFile.replace(RegExp("CircleSize:(.+)"), "CircleSize:" + document.getElementById("input_cs").value);
                diffFile = diffFile.replace(RegExp("OverallDifficulty:(.+)"), "OverallDifficulty:" + document.getElementById("input_od").value);
                diffFile = diffFile.replace(RegExp("ApproachRate:(.+)"), "ApproachRate:" + document.getElementById("input_ar").value);

                // Add modified .osu file to result zip folder
                var txtWriter = new zip.TextReader(diffFile);
                await writer.add(set_info.Artist + " - " + set_info.Title + "(" + set_info.Creator + ") (edited) [" + document.getElementById("input_diff_name").value + "].osu", txtWriter);
                break;
            }
        }
    }

    if (!diffFileSearchSucceeded) {
        display_error("Failed to find diff in downloaded zip");
        return false;
    }

    document.getElementById('bottom_text').innerHTML = "Preparing modified beatmap for download...";

    // Handle other files inside the zip
    for (let i = 0; i < arr.length; i++) {
        // Case for audio file
        if (arr[i].filename == audio_fname) {
            var file_ext = audio_fname.match(RegExp("(\..+)$"))[1];
            var arrReader = new zip.BlobWriter();
            var arrData = await arr[i].getData(arrReader);
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
    return false;
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