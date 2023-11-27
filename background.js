chrome.tabs.onActivated.addListener(function(activeInfo) {
    // how to fetch tab url using activeInfo.tabid
    chrome.tabs.get(activeInfo.tabId, function(tab){
        if (/^https:\/\/osu\.ppy\.sh\/beatmapsets\/([0-9]+)#(osu)\/([0-9]+)$/.test(tab.url)) {
            chrome.action.setIcon({path: "../images/icon-activated.png"});
        }
        else {
            chrome.action.setIcon({path: "../images/icon.png"});
        }
    });
}); 