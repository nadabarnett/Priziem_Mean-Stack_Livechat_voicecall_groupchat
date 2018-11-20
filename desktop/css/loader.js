var http = require('https');
var fs = require('fs');

fs.readFile("roboto.css", 'utf8', function(err, data) {
    if (err) throw err;
    var result=data.match(/https[^)]+/g);
    var next=(i)=>
    {
        var url=result[i];
        if(!url)
        {
            process.exit(0);
            return;
        }
        var filename = url.substring(url.lastIndexOf('/')+1);

        var file = fs.createWriteStream('fonts/'+filename);

        var request = http.get(url, function (response) {
            response.pipe(file);
            console.log(filename);
            setTimeout(next,1000,i+1);
        })
    }
    next(0);



});
