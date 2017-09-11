$(document).ready(function(){

	var q = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('q'),
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		remote: {url:'/ajax/query?q=%QUERY',wildcard:'%QUERY'}
	});

	q.initialize();

	$('#search-bar').typeahead({
		hint:true,
		highlight:true,
		minLength:2
	}, {
		name:'q',
		displayKey:'q',
		source:q.ttAdapter()
	});

	$('#search-bar-search').click(function(e){
		e.preventDefault(); var q = $('#search-bar').val();
		q = q.replace(/[^a-zA-Z0-9:\/$@({}).?=_ -&]/gi, '');
		$('#search-bar').val(q);
		var type = $('#search-type').val().replace(/\s/g, '').length > 0 ? '&type='+$('#search-type').val() : '';
		var pageToken = $('#search-pageToken').val().replace(/\s/g, '').length > 0 ? '&pageToken='+$('#search-pageToken').val() : '';
		var duration = $('#search-duration').val().replace(/\s/g, '').length > 0 ? '&duration='+$('#search-duration').val() : '';
		var order = $('#search-order').val().replace(/\s/g, '').length > 0 ? '&order='+$('#search-order').val() : '';
		renderPage('/search?q='+q+type+pageToken+duration+order+'&page=search',{
			title:'You searched for "'+q+'" | Ascolta',
		});
	});

});
