$(document).ready(function(){

    var isShowingFilters = false;

    $(document).on('click', '#search-filter-heading', function(){
        if (!isShowingFilters) { isShowingFilters = true;
            $('#search-filter-caret').html('<i class="fa fa-fw fa-caret-up"></i>');
            $('#search-filter-filters').removeClass('hidden-md hidden-lg');
        } else { isShowingFilters = false;
            $('#search-filter-caret').html('<i class="fa fa-fw fa-caret-down"></i>');
            $('#search-filter-filters').addClass('hidden-md hidden-lg');
        }
    });

    $(document).on('change', '#search-filter-resource', function(){
        var resource = $('#search-filter-resource :selected').val();
        if (resource == 'video') $('#search-filter-duration').parent().removeClass('hidden-md hidden-lg'); 
        else { 
            $('#search-filter-duration').parent().addClass('hidden-md hidden-lg');
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

	$(document).on('click', '.media a', function(e){
		e.preventDefault(); var title = $(this).closest('.media').find('.media-heading a').eq(0).text();
		renderPage($(this).attr('href'), {title:title});
	});

	$(document).on('click', '#search-load-more', function(e) {
        e.preventDefault(); var link = $(this).attr('href'), parent = $(this).parent();
        $(this).html('<h6 class="brand"><i class="fa fa-fw fa-spin fa-circle-o-notch"></i> Loading</h6>');
        renderPage(link, {
            spin: false,logHistory:false,
            contentid:'#load-more-container',
            successCallback: function(data) {
                parent.remove(); parent.parent().append(data);
            }
        });
    });
});