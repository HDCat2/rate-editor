/*function get_tab() {
    let opts = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(opts);
    return tab;
}*/

function set_style() {

}

function display_unsupported() {
    document.getElementById("root_div").className = "unsupported";
    document.getElementById("root_div").innerHTML = "This extension does not support this webpage 😭";
}

//let url = get_tab();
//let match_osu_url = new RegExp("https://osu.ppy.sh/beatmapsets/")


display_unsupported();