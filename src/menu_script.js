function display_unsupported() {
    document.getElementById("root_div").className = "unsupported";
    document.getElementById("root_div").innerHTML = "This extension does not support this webpage 😭";
}

function display_supported() {
    document.getElementById("root_div").className = "unsupported";
    document.getElementById("root_div").innerHTML = "lmao";
}

let opts = { active: true, lastFocusedWindow: true };
let [url] = await chrome.tabs.query(opts);
let match_osu_url = new RegExp("^https:\/\/osu\.ppy\.sh\/beatmapsets\/[0-9]+#(osu|fruits|taiko|mania)\/[0-9]+$")

if (match_osu_url.test(url)) {
    display_supported();
} else {
    display_unsupported();
}