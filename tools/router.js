var fs = require('fs');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var http = require('http');

module.exports = function(app){
    /*jslint unparam: true*/
    app.get('/', function(req, res){
        res.send('Hello World');
    });
    app.post('/html2pdf', function(req, res){
        var data = req.body.file;
        var tmp_file_name = './' + Math.floor(Math.random() * 10000000) + '.html';
        fs.writeFileSync(tmp_file_name, data);
        var cmd = 'wkhtmltopdf ' + tmp_file_name + ' ' + tmp_file_name + '.pdf';
        //console.log(req._startTime);
        exec(cmd, function (error, stdout, stderr) {
            var pdf_file = fs.readFileSync(tmp_file_name + '.pdf');
            res.setHeader('content-type','application/pdf');
            res.send(pdf_file);
            fs.unlink(tmp_file_name);
            fs.unlink(tmp_file_name + '.pdf');
        });
    });
    /*jslint unparam: false*/
};
