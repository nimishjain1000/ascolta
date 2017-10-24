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
        $('.jAudio--control-play').click();
        renderRelated($('#currentTrack').attr('data-id'));
    }

    jAudioInitiate($('#jAudio--core-data').attr('value'));

    $(document).on('click', '.row a', function(e) {
        e.preventDefault(); var title = $(this).find('.title').eq(0).text();
        renderPage($(this).attr('href'),{title:title});
    });

    $('#main-content').on('click', '.recommended-load-more', function(e){
        e.preventDefault(); var link = $(this).attr('href'), parent = $(this).parent();
        $(this).html('<h5 class="brand"><i class="fa fa-fw fa-spin fa-circle-o-notch"></i> Loading</h5>');
        renderPage(link, {
            contentid:'#related',spin:false,logHistory:false,
            successCallback:function(data){
                parent.remove(); $('#related').append(data);
            },
            failureCallback:function(){},
        });
    });

});