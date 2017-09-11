var spinning = '<div class="box-container"><div class="main-container contain-top text-center"><i class="fa fa-spin fa-circle-o-notch fa-fw fa-2x"></i></div></div>';

$(window).on('popstate', function() {
    renderPage(location.href, {
        title: history.state != null ? history.state.title : "Welcome to Ascolta"
    });
});

function getLocation(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
}

function renderPage(name, params) {
    var randomId = Math.random().toString(36).substr(2, 5); $('html').attr('data-get-id', randomId);
    NProgress.start(); params = params || {};
    pathname = getLocation(params.pathname || name), title = (params.title || "Welcome to Ascolta") + " | Ascolta";
    logHistory = typeof params.logHistory == 'undefined' ? true : params.logHistory;
    if (logHistory) {
        history.pushState({
            title: (params.title || "Welcome to Ascolta")
        }, title, pathname.pathname + pathname.search);
        $('title').text(title);
    } else {
        if (typeof params.title != 'undefined') {
            $('title').text(title);
        }
    }
    spin = typeof params.spin == 'undefined' ? true : params.spin;
    contentid = params.contentid || '#main-content';
    if (spin) $(contentid).html(spinning);
    successCallback = params.successCallback || successPage;
    failureCallback = params.failureCallback || errorPage;
    $.get(name, function(data) {
        if ($('html').attr('data-get-id') == randomId) successCallback(data, contentid);
        NProgress.done();
    }).fail(function(e, ex) {
        var msg = '';
        if (e.status === 0) msg = 'No Internet Connection.';
        else if (e.status == 404) msg = 'Couldn\'t find the page.';
        else if (e.status == 500) msg = 'We messed up. Internal Server Error.';
        else if (ex === 'parsererror') msg = 'Couldn\'t make sense of the data we recieved.';
        else if (ex === 'timeout') msg = 'We only have so much time. Request timed out.';
        else if (ex === 'abort') msg = 'Abort! Abort! Mission Aborted! Page request aborted!';
        else msg = 'Uncaught Error.' + e.responseText;
        if ($('html').attr('data-get-id') == randomId) failureCallback('<div class="alert alert-danger"><p class="lead text-center"><b>Oops!</b> - ' + msg + '</p></div>', contentid);
        NProgress.done();
    });
}

function successPage(data, contentid) {
    contentid = contentid || '#main-content';
    $(contentid).html(data);
}

function errorPage(msg, contentid) {
    contentid = contentid || '#main-content';
    $(contentid).html('<div class="box-container"><div class="contain-top main-container">' + msg + '</div></div>');
}

function getCookie(o) {
    for (var n = o + "=", i = document.cookie.split(";"), t = 0; t < i.length; t++) {
        for (var e = i[t];
            " " == e.charAt(0);) e = e.substring(1);
        if (0 == e.indexOf(n)) return e.substring(n.length, e.length)
    }
    return ""
}

function notify(o, n, i) {
    if (Notification)
        if ("granted" !== Notification.permission) Notification.requestPermission();
        else {
            var t = new Notification(o, {
                icon: "http://s2.googleusercontent.com/s2/favicons?domain=monkfromearth.com",
                body: n
            });
            t.onclick = function() {
                window.open(i)
            }
        }
}

document.addEventListener("DOMContentLoaded", function() {
    "granted" !== Notification.permission && Notification.requestPermission()
});

$.get('/assets/js/global/countries.json', function(countries) {
    $.get('/ajax/get_location', function(ajax) {
        var selectedRegionNo;
        for (i in countries) {
            if (countries[i].code == ajax.selected.countryCode) selectedRegionNo = i;
            var o = new Option(countries[i].name, countries[i].name + "|" + countries[i].code);
            $(o).html(countries[i].name);
            $("#changeLocationModal-dropdown").append(o);
        }
        $('#changeLocationModal-dropdown>option:eq(' + selectedRegionNo + ')').prop('selected', true);
    }).fail(function() {
        for (i in countries) {
            var o = new Option(countries[i].name, countries[i].name + "|" + countries[i].code);
            $(o).html(countries[i].name);
            $("#changeLocationModal-dropdown").append(o);
        }
    });
});

$(document).on('change', '#changeLocationModal-dropdown', function() {
    var region = $('#changeLocationModal-dropdown :selected').val();
    $.get('/ajax/change_location?region=' + region, function(ajax) {
        if (ajax.status) {
            $('#changeLocationModal .announce').html('<div class="alert alert-success">Location changed succesfully!</div>');
            $('#footer-countryName').html($('#changeLocationModal-dropdown :selected').text());
        } else $('#changeLocationModal .announce').html('<div class="alert alert-danger">Sorry, couldn\'t change the location!</div>');
    });
    setTimeout(function(){ $('#changeLocationModal').modal('hide'); }, 1000);
});

$(document).on('click', 'footer .no-js-link', function(e){
    e.preventDefault(); renderPage($(this).attr('href'));
});

$(document).on('click', '#changeLocation', function(e){
    e.preventDefault(); $('#changeLocationModal').modal('show');
});