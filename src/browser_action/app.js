$(document).ready(function() {

	initDatabase(false);

	pageMapsPlaying();

	pageMapsSet();

	pageOptions();

});

function pageMapsPlaying() {

	if(isDataReady()) {

		if($('.map-list-playing').is(':not(:empty)')) {

			$('.map-list-playing .list-group').html('');

		}

		db = new localStorageDB("ocnotifier", localStorage);

		var playingServers = db.queryAll("playing", {sort: [["mapId", "ASC"]]});

		if(playingServers.length <= 0) {

	    	$('.map-list-playing .list-group').html('<li class="list-group-item list-group-item-info">Sorry, none of your favorite maps are playing.</li>');

		}else{

			var lastMapId;

			playingServers.forEach(function(playingServer) {

				if(lastMapId != playingServer.mapId) {

			        $('.map-list-playing .list-group').append('<li class="list-group-item list-group-item-info">' + getJson('maps').maps[playingServer.mapId].name + '</li>');

			    }

	    		var serverInfo = getJson('servers').servers[playingServer.serverId];

	    		$('.map-list-playing .list-group').append('<li class="list-group-item">' +
	    			                                          '<span class="badge alert-success">' + serverInfo.playing + '</span>' +
	    		                                              '<span class="label label-primary">' + serverInfo.region.toUpperCase() + '</span> ' + serverInfo.name + 
	    		                                          '</li>');

	    		lastMapId = playingServer.mapId;

		    });

		}

		$('#page-maps-playing .loading').addClass('display-none');

		$('#page-maps-playing .table').removeClass('display-none');

	}

}

function pageMapsSet() {

	if(isDataReady()) {

		/* Allows for case insensitive searches. */

		$.expr[":"].contains = $.expr.createPseudo(function(arg) {
		    return function( elem ) {
		        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
		    };
		});

		/* Load in list of maps. */

		$.each(getJson('maps').maps, function(mapId, mapData) {

			$('#page-maps-set .table').append('<tr><td><div class="checkbox"><label><input id="' + mapId + '" type="checkbox" class="map-check"> ' + mapData.name + '</label></div></td></tr>');

			if(getDatabase().query('favorites', {mapId: mapId}).length > 0) {

				$('#page-maps-set #' + mapId).attr('checked', 'checked');

			}

		});

		$('#page-maps-set .loading').addClass('display-none');

		$('#page-maps-set #toggle-maps').removeClass('display-none');

		$('#page-maps-set .map-list').removeClass('display-none');

		$('#page-maps-set .map-search').removeAttr('disabled');

		$('#page-maps-set td:first').addClass('no-border');

		/* Show only checked maps. */

		$('#toggle-maps').on('click', function(event) {

			if(!$('#' + event.target.id).hasClass('active')) {

				$('#page-maps-set .map-search').val('');

				$('#page-maps-set td').removeClass('display-none');			

				$('#page-maps-set #maps-all').toggleClass('active');

				$('#page-maps-set #maps-checked').toggleClass('active');

				if(event.target.id == 'maps-checked') {

					$("#page-maps-set input:checkbox:not(:checked)").closest('td').toggleClass('display-none');

				}

			}

			fixSearchResultBorder();

			$("#page-maps-set .map-list").scrollTop(0);

		});

	    /* Check if a check box is checked or unchecked. */

	    $('#page-maps-set .map-check').on('change', function() {

	    	var mapObj = $(this);

	    	var mapId = mapObj.attr('id');

			if(this.checked) {

				getDatabase().insert("favorites", {mapId: mapId});

			}else{

				getDatabase().deleteRows("favorites", {mapId: mapId});

			}

			getDatabase().commit();

			if($('#page-maps-set #maps-checked').hasClass('active')) {

				mapObj.closest('td').toggleClass('display-none');

			}

			refreshPlayingMaps();

		});

		/* Perform map searches. */

		$('#page-maps-set .map-search').on('change', function() {

			var searchQuery = $(this).val();

			$('#page-maps-set td').addClass('display-none');

		    $('#page-maps-set td:contains(' + searchQuery + ')').removeClass('display-none');

			if($('#page-maps-set #maps-checked').hasClass('active')) {

			    $("#page-maps-set input:checkbox:not(:checked)").closest('td').addClass('display-none');

			}

			fixSearchResultBorder();

		}).keyup(function () {

			$(this).change();

	    });

	}

}

function pageOptions() {

	/* Region settings. */

	getDatabase().query("settings", function(row) {

		if(row.type == 'region') {

			$('.option-region[value="' + row.value + '"]').attr('checked', true);

		}

	});

	$('.option-region').on('click', function() {

		var serverRegion = $(this).attr('value');

		toggleSetting('region', serverRegion);

		refreshPlayingMaps();

	});

	/* Notification settings. */

	getDatabase().query("settings", function(row) {

		if(row.type == 'notification') {

			$('.option-notification[value="' + row.value + '"]').attr('checked', true);

		}

	});

	$('.option-notification').on('click', function() {

		var notificationSetting = $(this).attr('value');

		toggleSetting('notification', notificationSetting);

	});

}

function fixSearchResultBorder() {

	$('#page-maps-set .table').find('.no-border').removeClass('no-border');

	$('#page-maps-set td:visible:first').addClass('no-border');

}

/* Background.js Shortcuts */

function refreshPlayingMaps() {

	chrome.extension.getBackgroundPage().checkMaps();

}

function getJson(savedJson) {

	switch(savedJson) {

		case 'maps':    return chrome.extension.getBackgroundPage().mapsJson;    break;

		case 'servers': return chrome.extension.getBackgroundPage().serversJson; break;

	}

}

function isDataReady() {

	return (chrome.extension.getBackgroundPage().firstRefresh ? false : true);

}