$(document).ready(function(){
	
	$('#page-nav li a').click(function(e){
		e.preventDefault(); $(this).parent().addClass('active').siblings().removeClass('active');
		var title = "Welcome to Ascolta | the YouTube Music Streamer | the YouTube MP3 Downloader";
		switch ($(this).attr('id')){
			case 'trending': title = "What's Trending on Ascolta?"; break;
			case 'playlists': title = "Editor's Choice and Trending Playlists"; break;
		}
		renderPage($(this).attr('href'), {
			contentid:'#page-content',title:title,pathname:'/',logHistory:false,
		});
	});

	$(document).on('click','#trending-load-more',function(e){
		e.preventDefault(); var link = $(this).attr('href'), parent = $(this).parent();
		parent.html('<i class="fa fa-fw fa-spin fa-circle-o-notch"></i>');
		parent.addClass('active').siblings().removeClass('active');
		renderPage(link, {
			contentid:'#page-content',spin:false,logHistory:false,
			successCallback:function(data){
				parent.remove(); $('#page-content').append(data);
			},
		});
	});

	$(document).on('click', '.trending-video a', function(e){
		e.preventDefault(); var link = $(this).attr('href'), title = $(this).find('.title').text();
		renderPage(link, {
			contentid:'#main-content',title:title
		});
	});
	
});