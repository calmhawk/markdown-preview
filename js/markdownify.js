(function(document) {

    var interval, 
        storage = chrome.storage.local;

    function parseMatchPattern(input) {
        if (typeof input !== 'string') {
            return null;
        }
        var match_pattern = '(?:^', 
            regEscape = function(s) {return s.replace(/[[^$.|?*+(){}\\]/g, '\\$&');},  
            result = /^(\*|https?|file|ftp|chrome-extension):\/\//.exec(input);

        // Parse scheme
        if (!result) return null;
        input = input.substr(result[0].length);
        match_pattern += result[1] === '*' ? 'https?://' : result[1] + '://';

        // Parse host if scheme is not `file`
        if (result[1] !== 'file') {
            if (!(result = /^(?:\*|(\*\.)?([^\/*]+))/.exec(input))) return null;
            input = input.substr(result[0].length);
            if (result[0] === '*') {    // host is '*'
                match_pattern += '[^/]+';
            } else {
                if (match[1]) {         // Subdomain wildcard exists
                    match_pattern += '(?:[^/]+\.)?';
                }
                // Append host (escape special regex characters)
                match_pattern += regEscape(match[2]) + '/';
            }
        }
        // Add remainder (path)
        match_pattern += input.split('*').map(regEscape).join('.*');
        match_pattern += '$)';
        return match_pattern;
    }

    // Onload, take the DOM of the page, get the markdown formatted text out and
    // apply the converter.
    function makeHtml(data) {
        marked.setOptions({
          gfm: true,
          tables: true,
          breaks: false,
          pedantic: false,
          sanitize: false,
          smartLists: true,
          smartypants: false,
        });
        var html = marked(data);
        $(document.body).html(html);
        setCodeHighlight();
    }

    function getThemeCss(theme) {
        return chrome.extension.getURL('theme/' + theme + '.css');
    }

    function setTheme(theme) {
        var defaultThemes = ['Clearness', 'ClearnessDark', 'Github', 'TopMarks'];

        if($.inArray(theme, defaultThemes) != -1) {
            var link = $('#theme');
            $('#custom-theme').remove();
            if(!link.length) {
                var ss = document.createElement('link');
                ss.rel = 'stylesheet';
                ss.id = 'theme';
                ss.href = getThemeCss(theme);
                document.head.appendChild(ss);
            } else {
                link.attr('href', getThemeCss(theme));
            }
        } else {
            var themePrefix = 'theme_',
                key = themePrefix + theme;
            storage.get(key, function(items) {
                if(items[key]) {
                    $('#theme').remove();
                    var theme = $('#custom-theme');
                    if(!theme.length) {
                        var style = $('<style/>').attr('id', 'custom-theme')
                                        .html(items[key]);
                        $(document.head).append(style);
                    } else {
                        theme.html(items[key]);
                    }
                }
            });
        }
    }

    function setCodeHighlight() {
        hljs.tabReplace = ' ';
        $('pre code').each(function(i, e) {hljs.highlightBlock(e)});
    }

    function stopAutoReload() {
        clearInterval(interval);
    }

    function startAutoReload() {
        stopAutoReload();
        interval = setInterval(function() {
            $.ajax({
                url : location.href, 
                cache : false,
                success : function(data) { 
                    makeHtml(data); 
                }
            });
        }, 3000);
    }

    function render() {
        $.ajax({
            url : location.href, 
            cache : false,
            complete : function(xhr, textStatus) {
                var contentType = xhr.getResponseHeader('Content-Type');
                if(contentType && (contentType.indexOf('html') > -1)) {
                    return;    
                }

                makeHtml(document.body.innerText);
                var specialThemePrefix = 'special_',
                    pageKey = specialThemePrefix + location.href;
                storage.get(['theme', pageKey], function(items) {
                    theme = items.theme ? items.theme : 'Clearness';
                    if(items[pageKey]) {
                        theme = items[pageKey];
                    }
                    setTheme(theme);
                });

                storage.get('auto_reload', function(items) {
                    if(items.auto_reload) {
                        startAutoReload();
                    }
                });

                chrome.storage.onChanged.addListener(function(changes, namespace) {
                    for (key in changes) {
                        var value = changes[key];
                        if(key == pageKey) {
                            setTheme(value.newValue);
                        } else if(key == 'theme') {
                            storage.get(pageKey, function(items) {
                                if(!items[pageKey]) {
                                    setTheme(value.newValue);
                                }
                            });
                        } else if(key == 'auto_reload') {
                            if(value.newValue) {
                                startAutoReload();
                            } else {
                                stopAutoReload();
                            }
                        }
                    }
                });
            }
        });
    }

    storage.get('exclude_exts', function(items) {
        var exts = items.exclude_exts;
        if(!exts) {
            render();
            return;
        }

        var parsed = $.map(exts, function(k, v) {
            return parseMatchPattern(v);
        });
        var pattern = new RegExp(parsed.join('|'));
        if(!parsed.length || !pattern.test(location.href)) {
            render();
        }
    });

    var pdf_server;
    storage.get('pdf_server', function(items){
        pdf_server = items.pdf_server;
    });

    function get_document_html(){
        var html = document.all[0].outerHTML;
        html = html.replace('<head>', '<head><meta http-equiv="Content-Type" content="text/html;charset=UTF-8">');
        var pattern = new RegExp(/<link[^>]+href="([^"]+)"[^>]*>/g);
        var match;
        while((match = pattern.exec(html)) !== null){
            var link = match[0], href = match[1];
            $.ajax({
                async: false,
                url : href, 
                cache : false,
                success : function(data) { 
                    style = '<style>' + data + '</style>';
                    html = html.replace(link, style);
                }
            });
        }

        return html;
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if(request.method == "getHtml"){
            html = get_document_html();
            sendResponse({data: html, method: "getHtml"});
        }
    });

    chrome.runtime.onConnect.addListener(function(port) {
        port.onMessage.addListener(function(request) {
            if(request.method == "getPdf"){
                if(pdf_server === '')
                    port.postMessage({data: '', method: "getPdf", code: -1});

                var html = get_document_html();

                var xhttp = new XMLHttpRequest();
                var method = "POST", 
                    post_data = "file=" + encodeURIComponent(html);

                xhttp.onload = function(){
                    var urlObject = window.URL || window.webkitURL || window;
                    var url = urlObject.createObjectURL(xhttp.response);

                    console.log('pdf');
                    port.postMessage({data: url, method: "getPdf", code: 0});
                };
                xhttp.open(method, pdf_server, true);
                xhttp.responseType = 'blob';
                xhttp.timeout = 100000;
                xhttp.ontimeout = function(){ console.log("Timed out!!!"); };
                xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
                xhttp.send(post_data);

                // async call need return true
                return true;
            }
        });
    });

}(document));
