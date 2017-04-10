javascript:(function() {
    var head = document.getElementsByTagName('head')[0],
    _createScript = function(path, onload) {
        var element = document.createElement('script');
        element.src = path;
        element.type = 'text/javascript';

        if (onload) {
            element.onload = onload;
        }

        head.appendChild(element);
    },
    _createStyle = function(path) {
        var element = document.createElement('link');
        element.href = path;
        element.rel = 'stylesheet';
        head.appendChild(element);
    },
    _done = function() {
        [
            'https://cdn.rawgit.com/dom111/terminal-preview/master/dist/terminal-min.css',
            'https://cdn.rawgit.com/dom111/terminal-preview/master/dist/terminal-min.js',
            'https://cdn.rawgit.com/dom111/terminal-preview/master/dist/parse-min.js'
        ].forEach(function(file) {
            (file.match(/css$/) ? _createStyle : _createScript)(file);
        });
    };

    if (!('jQuery' in window)) {
        _createScript('https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js', _done);
    }
    else {
        _done();
    }
})();
