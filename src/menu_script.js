var match_osu_url = new RegExp("^https:\/\/osu\.ppy\.sh\/beatmapsets\/([0-9]+)#(osu|fruits|taiko|mania)\/([0-9]+)$");
var set_id;
var beatmap_mode;
var diff_id;
var set_info;
var set_index;
var url;
var result_fname;
var audio_fname;

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
    download_button.innerHTML = 'Download!';
    download_button.setAttribute('id', 'download_button');
    download_button.addEventListener('click', handleDownload);

    root_div.setAttribute('title', 'placeholder');
    root_div.className = "supported";
    root_div.appendChild(form);
    root_div.appendChild(reset_button);
    root_div.appendChild(download_button);
}

/*
Refill form values back to the default (whatever the indicated map had originally)
*/
function fillDefault() {
    document.getElementById('input_diff_name').value = set_info.ChildrenBeatmaps[set_index].DiffName;
    document.getElementById('input_bpm').value = set_info.ChildrenBeatmaps[set_index].BPM;
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

    document.getElementById('input_diff_name').setAttribute('value', set_info.ChildrenBeatmaps[set_index].DiffName);
    document.getElementById('input_bpm').setAttribute('value', set_info.ChildrenBeatmaps[set_index].BPM);
    document.getElementById('input_ar').setAttribute('value', set_info.ChildrenBeatmaps[set_index].AR);
    document.getElementById('input_cs').setAttribute('value', set_info.ChildrenBeatmaps[set_index].OD);
    document.getElementById('input_od').setAttribute('value', set_info.ChildrenBeatmaps[set_index].CS);
    document.getElementById('input_hp').setAttribute('value', set_info.ChildrenBeatmaps[set_index].HP);

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
    console.log("lmao");
}

/*
Code to fetch requisite beatmap, modify according to input, and download
*/
async function handleDownload() {
    verifyFields();
    // Fetch zipped beatmap data with API call
    let osz = await fetch("https://api.chimu.moe/v1/download/" + set_id + "/");
    osz = await osz.blob();

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
                audio_fname = diffFile.match(RegExp("AudioFilename:\s*(.+)\n"))[1];
                console.log(audio_fname);
                break;
            }

            // Alter beatmap characteristics according to input
            diffFile = diffFile.replace(RegExp("BeatmapID:[0-9]+"), "BeatmapID:0"); // Turn beatmap to unsubmitted
            diffFile = diffFile.replace(RegExp("HPDrainRate:(.+)\n", "HPDrainRate:" + document.getElementByID("input_hp").value + "\n"));
            diffFile = diffFile.replace(RegExp("CircleSize:(.+)\n", "CircleSize:" + document.getElementByID("input_cs").value + "\n"));
            diffFile = diffFile.replace(RegExp("OverallDifficulty:(.+)\n", "OverallDifficulty:" + document.getElementByID("input_od").value + "\n"));
            diffFile = diffFile.replace(RegExp("ApproachRate:(.+)\n", "ApproachRate:" + document.getElementByID("input_ar").value + "\n"));


            // Add modified .osu file to result zip folder
            var fname = arr[i].filename.match(RegExp("^(.+)\.osu$"))[1];
            var txtWriter = new zip.TextReader(diffFile);
            await writer.add(fname + " (edited).osu", txtWriter);
        }
    }

    if (!diffFileSearchSucceeded) {
        display_error("Failed to find diff in downloaded zip");
        return;
    }

    // Handle other files inside the zip
    for (let i = 0; i < arr.length; i++) {
        // Case for audo file
        if (RegExp("^audio\.").test(arr[i].filename)) {
            console.log("lmao");
        }
        // Case for hitsounds
        else if (RegExp("^.+\.wav$").test(arr[i].filename) || RegExp("^.+\.ogg$").test(arr[i].filename)) {
            var arrReader = new zip.BlobWriter();
            var arrData = await arr[i].getData(arrReader);
            var arrWriter = new zip.BlobReader(arrData);
            await writer.add(arr[i].filename, arrWriter);
            continue;
        }
        // Case for .osu files
        else if (RegExp("^.+\.osu").test(arr[i].filename)) {
            console.log("lmao");
        }

        // Case for background
        else if (RegExp("^.+\.jpg$").test(arr[i].filename) || RegExp("^.+\.png$").test(arr[i].filename)) {
            var arrReader = new zip.BlobWriter();
            var arrData = await arr[i].getData(arrReader);
            var arrWriter = new zip.BlobReader(arrData);
            await writer.add(arr[i].filename, arrWriter);
            continue;
        }

        // Case for other files
        else {
            console.log("Unsupported file detected: " + arr[i].filename);
        }
    }

    // Download finished zip file
    await writer.close();
    var result_blob = await result.getData();
    result_blob = result_blob.slice(0, result_blob.size, "application/octet-stream");
    const result_url = URL.createObjectURL(result_blob);
    result_fname = set_id + ' ' + set_info.Title + '.osz';
    console.log(result_url);
    console.log(result_fname);
    chrome.downloads.download({url : result_url, filename : result_fname});
}

async function main() {
    await chrome.downloads.onDeterminingFilename.addListener(
        (downloadItem, suggest) => {
            suggest({filename: result_fname, conflictAction: "overwrite"});
        }                     
    );
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