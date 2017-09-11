$(document).ready(function(){

	$('.recommended').html('<div class="text-center"><i class="fa fa-fw fa-spin fa-circle-o-notch fa-2x"></i></div>');
	renderPage('/ajax/recommended', {
		contentid:'.recommended',logHistory:false,spin:false
	});

	$(document).on('click','.recommended-load-more',function(e){
		e.preventDefault(); var link = $(this).attr('href'), parent = $(this).parent();
		$(this).html('<h5 class="brand"><i class="fa fa-fw fa-spin fa-circle-o-notch"></i> Loading</h5>');
		renderPage(link, {
			contentid:parent,spin:false,logHistory:false,
			successCallback:function(data){
				parent.closest('.recommended-playlist').append(data); parent.remove();
			},
		});
	});

});