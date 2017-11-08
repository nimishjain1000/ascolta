$(document).ready(function() {

    var firstTime = true;

    function renderRelated(relatedToVideoId) {
        renderPage('/search?page=thumbs&maxResults=20&relatedToVideoId=' + relatedToVideoId, {
            spin:false,logHistory:false,
            successCallback: function(data) {
                $('#related').append(data);
            }, failureCallback: function(msg) {}
        });
    }

    $('#main-content').on('click', '.recommended-load-more', function(e) {
        e.preventDefault(); var link = $(this).attr('href');
        $('.recommended-load-more-container').html('<i class="fa fa-fw fa-spin fa-circle-o-notch"></i>');
        renderPage(link, {
            spin: false,logHistory:false,
            contentid: '.recommended-load-more-container',
            successCallback: function(data) {
                $('.recommended-load-more-container').remove();$('#main-content').append(data);
            },
            failureCallback:function(){}
        });
    });

    function durationSeconds(str) {
        var p = str.split(':'),
            s = 0,
            m = 1;
        while (p.length > 0) {
            s += m * parseInt(p.pop(), 10);
            m *= 60;
        }
        return parseInt(s);
    }

    function jAudioInitiate(v) {
        video = $.parseJSON(v), playlist = [];
        for (var i = 0; i < video.videos.length; i++) {
            vid = video.videos[i]; var id = vid.id || vid.videoId, thumb = '#';
            if (typeof vid.thumbnails.maxres != 'undefined') thumb = vid.thumbnails.medium.url;
            else if (typeof vid.thumbnails.medium != 'undefined') thumb = vid.thumbnails.medium.url;
            else if (typeof vid.thumbnails.default != 'undefined') thumb = vid.thumbnails.default.url;
            playlist.push({
                file: "/ajax/stream?v=" + id,
                id:id,
                thumb:thumb,
                trackName: vid.title,
                trackArtist: vid.channelTitle,
                trackDuration: vid.duration,
                trackSeconds: durationSeconds(vid.duration)
            });
        }
        var type = $('#jAudio--core-type').val();
        window.playlist = playlist;
        if (firstTime == true) {
            $(".jAudio").jAudio();
            firstTime = false;
        } else {
            window.jAudioCore.renderPlaylist();
            window.jAudioCore.changeTrack(0);
            window.jAudioCore.updateTotalTime();
            window.jAudioCore.events();
        }
        renderRelated($('#currentTrack').attr('data-id'));
    }

    jAudioInitiate($('#jAudio--core-data').attr('value'));

    $('#main-content').on('click', '.video a', function(e) {
        e.preventDefault(); var title = $(this).find('.title').eq(0).text();
        renderPage($(this).attr('href'),{title:title});
    });

});