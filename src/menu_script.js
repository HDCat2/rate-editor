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

    form.appendChild(input_bpm);
    form.appendChild(input_ar);
    form.appendChild(input_cs);
    form.appendChild(input_od);
    form.appendChild(input_hp);

    root_div.setAttribute('title', 'placeholder');
    root_div.className = "supported";
    root_div.appendChild(form);
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    console.log("got tab", tab.url);
    return tab;
}

let match_osu_url = new RegExp("^https:\/\/osu\.ppy\.sh\/beatmapsets\/[0-9]+#(osu|fruits|taiko|mania)\/[0-9]+$");

async function main() {
    const tab = await getCurrentTab();
    const url = tab.url;

    if (match_osu_url.test(url)) {
        display_supported();
    } else {
        display_unsupported();
    }
}

main();