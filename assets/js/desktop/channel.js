$(document).ready(function(){

	$('#main-content').unbind('click').on('click', '.media a', function(e){
		e.preventDefault(); var title = $(this).text();
		renderPage($(this).attr('href'), {
            title:title
		});
	});

	$('#main-content').on('click', '#load-more', function(e) {
        e.preventDefault();
        var link = $(this).attr('href'),
            parent = $(this).parent();
        parent.html('<i class="fa fa-fw fa-spin fa-circle-o-notch"></i>');
        renderPage(link, {
            spin: false,logHistory:false,
            contentid: '#load-more-container',
            successCallback: function(data) {
                $('#load-more-container').remove(); $('#channel-content').append(data);
            },
        });
    });

    $(document).unbind('click').on('click', '#channel-page-nav li a', function(e){
        e.preventDefault(); var link = $(this).attr('href');
        $(this).parent().addClass('active').siblings().removeClass('active');
        renderPage(link, {
            logHistory:false,contentid: '#channel-content',
        });
    });

});