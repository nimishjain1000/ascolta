$(document).ready(function(){

	$('#nav-search').click(function(e){
		e.preventDefault();$('#search-bar-container').removeClass('hidden-xs hidden-sm');
		$('html, body').animate({
          	scrollTop: $('#search-bar-container').offset().top-36
        }, 500, function(){
        	$('#search-bar').focus();
        }); 
	});

	$('.navbar-brand').click(function(e){
		e.preventDefault();renderPage('/',{title:"Welcome to Ascolta | the YouTube Music Streamer | the YouTube MP3 Downloader"});
	});

});