$(document).ready(function(){

    var isShowingFilters = false;

    $(document).on('click', '#search-filter-heading', function(){
        if (!isShowingFilters) { isShowingFilters = true;
            $('#search-filter-caret').html('<i class="fa fa-fw fa-caret-up"></i>');
            $('#search-filter-filters').removeClass('hidden-xs hidden-sm');
        } else { isShowingFilters = false;
            $('#search-filter-caret').html('<i class="fa fa-fw fa-caret-down"></i>');
            $('#search-filter-filters').addClass('hidden-xs hidden-sm');
        }
    });

    $(document).on('change', '#search-filter-resource', function(){
        var resource = $('#search-filter-resource :selected').val();
        if (resource == 'video') $('#search-filter-duration').parent().removeClass('hidden-sm hidden-xs'); 
        else { 
            $('#search-filter-duration').parent().addClass('hidden-sm hidden-xs');
            $('#search-filter-duration>option:eq(4)').prop('selected',true);
            $('#search-duration').val('');
        }
        $('#search-type').val(resource);
    });

    $(document).on('change', '#search-filter-duration', function(){
        var duration = $('#search-filter-duration :selected').val();
        if (duration != '') {
            $('#search-type').val('video');
            $('#search-filter-resource>option:eq(1)').prop('selected',true);
        }
        else $('#search-filter-resource>option:eq(0)').prop('selected',true);
        $('#search-duration').val(duration);
    });

    $(document).on('change', '#search-filter-order', function(){
        var order = $('#search-filter-order :selected').val();
        $('#search-order').val(order);
    });

	$('#main-content').on('click', '.media a', function(e){
		e.preventDefault(); var title = $(this).text();
		renderPage($(this).attr('href'), {
			contentid:'#main-content',
            title:title,
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
                $('#load-more-container').remove(); $('#main-content').append(data);
            },
        });
    });
});