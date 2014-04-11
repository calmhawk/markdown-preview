# Markdown Preview Plus

Port from Markdown Preview Plus. Add advanced features for exporting HTML and pdf.

Usage
--------

1. Install extension. 
2. Check "Allow access to file URLs" in `chrome://extensions` listing: ![fileurls](http://i.imgur.com/qth3K.png)
3. Open local or remote .md file in Chrome.
4. See nicely formatted HTML!

Pdf export
--------

1. Install [wkhtmltopdf][wk], which supports windows and linux(note the font problem btw).
1. Add executable path of wkhtmltopdf to the system bin path.
1. Configure a web service for pdf exporting.(a nodejs example attached in tools)
1. Configure the server url in options.
1. Notice that the wkhtmltopdf is a little slow.

Thanks
-------

Thanks 
to volca for his [markdown-preview][mpp],
to Kevin Burke for his [markdown-friendly stylesheet][style],
to John Fraser for his [JavaScript markdown processor][showdown],
to Boris Smus for his [Markdown Preview][mp] and to
Swartz and Gruber for [Markdown][md].

[style]: http://kevinburke.bitbucket.org/markdowncss
[marked]: https://github.com/chjj/marked
[md]: http://en.wikipedia.org/wiki/Markdown
[mp]: https://github.com/borismus/markdown-preview
[mpp]: https://github.com/volca/markdown-preview
[wk]: http://wkhtmltopdf.org/index.html


