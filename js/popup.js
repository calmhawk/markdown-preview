"use strict";

var pageKey, 
    storage = chrome.storage.local,
    themePrefix = 'theme_',
    specialThemePrefix = 'special_',
    defaultThemes = ['Clearness', 'ClearnessDark', 'Github', 'TopMarks'];

storage.get('theme', function(items) {
    var theme = items.theme ? items.theme : 'Clearness';
    $('#current-theme').html(theme);
});

// theme
function getThemes() {
    storage.get(['custom_themes', pageKey], function(items) {
        if(items.custom_themes) {
            var k, v, themes = items.custom_themes;
            var group = $('<optgroup label="Custom themes"></optgroup>');

            $('#theme optgroup[label="Custom themes"]').empty().remove();
            for(k in themes) {
                v = themes[k];
                group.append($("<option></option>").text(v)); 
            }
            $('#theme').append(group);
        }

        if(items[pageKey]) {
            $('#theme').val(items[pageKey]);
        } 
    });
}

chrome.tabs.getSelected(null, function(tab) {
    pageKey = specialThemePrefix + tab.url;
    getThemes();
    $('#theme').change(function() {
        var obj = {};
        obj[pageKey] = $(this).val();
        storage.set(obj);
    });
});

function triggerSaveEvent(name, url){
    var saveLink = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
    saveLink.download = name;
    saveLink.href = url;
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent(
        "click", true, false, window, 0, 0, 0, 0, 0
        , false, false, false, false, 0, null
    );
    saveLink.dispatchEvent(event);
}

$('#btn-export').click(function() {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {method: "getHtml"}, function(response) {
            if(response.method=="getHtml"){
                var html = response.data;

                var urlObject = window.URL || window.webkitURL || window,
                    builder = new Blob([html], {type: 'text/plain; charset=utf-8'});
                var url = urlObject.createObjectURL(builder);

                triggerSaveEvent('export.html', url);
            }
        });
    });
});

$('#btn-export-pdf').click(function() {
    // TODO layer
    chrome.tabs.getSelected(null, function(tab) {
        var port = chrome.tabs.connect(tab.id, {name: "getPdf"});
        port.postMessage({method: "getPdf"});
        port.onMessage.addListener(function(response) {
            if(response.method=="getPdf"){
                if(response.code === -1){
                    // TODO error
                    return;
                }
                var url = response.data;

                triggerSaveEvent('export.pdf', url);
                port.disconnect();
            }
        });
    });
});

