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

    $('#main-content').on('click', '.jAudio--control-download', function(e) {
        e.preventDefault();  var title = $('#currentTrack').attr('data-title') + " - " + $('#currentTrack').attr('data-artist'), id = $('#currentTrack').attr('data-id');
         window.open('https://www.youtubeinmp3.com/fetch?video=https://www.youtube.com/watch?v='+id+'&title=[Ascolta.ml]%20'+title, '_self');
    });

    $('#main-content').on('click', '#load-more', function(e) {
        e.preventDefault(); var link = $(this).attr('href');
        $('#load-more-container').html('<i class="fa fa-fw fa-spin fa-circle-o-notch"></i>');
        renderPage(link, {
            spin: false,logHistory:false,
            contentid: '#load-more-container',
            successCallback: function(data) {
                $('#load-more-container').remove();$('#main-content').append(data);
            },
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
        $('.jAudio--control-play').click();
        renderRelated($('#currentTrack').attr('data-id'));
    }

    jAudioInitiate($('#jAudio--core-data').attr('value'));

    $('#main-content').on('click', '.row a', function(e) {
        e.preventDefault(); var title = $(this).closest('.row').find('.title').eq(0).text();
        renderPage($(this).attr('href'),{title:title});
    });

    $('#main-content').on('click', '.recommended-load-more', function(e){
        e.preventDefault(); var link = $(this).attr('href'), parent = $(this).parent();
        $(this).html('<h5 class="brand"><i class="fa fa-fw fa-spin fa-circle-o-notch"></i> Loading</h5>');
        renderPage(link, {
            contentid:'.related',spin:false,logHistory:false,
            successCallback:function(data){
                parent.remove(); $('#related').append(data);
            },
            failureCallback:function(){},
        });
    });

});