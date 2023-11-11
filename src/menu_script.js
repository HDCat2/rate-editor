function display_unsupported() {
    document.getElementById("root_div").className = "unsupported";
    document.getElementById("root_div").innerHTML = "This extension does not support this webpage :c";
}

function display_supported() {
    document.getElementById("root_div").className = "supported";
    document.getElementById("root_div").innerHTML = "lmao";
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