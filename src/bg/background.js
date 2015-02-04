var baseUrl = 'https://ocn.rastalulz.com/api/';

var mapsJson, serversJson;

var firstRefresh = true;

var refreshTimer = 30;

$(document).ready(function() {

	initDatabase(true);

	if(getDatabase().isNew()) {

		initSettings();

	}

	triggerRefresh();

	setInterval(function() { triggerRefresh(); }, refreshTimer * 1000);

	/* Prevent old notifications from displaying late. */

	setInterval(function() { clearOldNotifications(30); }, 1000); // Clear any notification 30 seconds.

});

function triggerRefresh() {

	$.getJSON(baseUrl + 'maps', function(data) {

		mapsJson = data;

	}).promise().done(function() {

		$.getJSON(baseUrl + 'servers', function(data) {

			serversJson = data;
			
	    }).promise().done(function() {

	    	checkMaps();

	    })

	});

}

function checkMaps() {

	getDatabase().query("playing", function(rowData) {

		var serverId = rowData.serverId;

		if(firstRefresh || serversJson.servers[serverId] === undefined || serversJson.servers[serverId].map.id != rowData.mapId || !isSettingSet('region', serversJson.servers[serverId].region)) {

			removePlaying(serverId);

		}

	});

	var mapsPlayingTotal = 0;

	$.each(serversJson.servers, function(serverId, serverData) {

		if(isPlaying(serverId) && !isMapFavorited(serverData.map.id)) {

			removePlaying(serverId);

		}else if(isMapFavorited(serverData.map.id)) {

			if(isSettingSet('region', serverData.region)) {

				mapsPlayingTotal++;

				if(!isPlaying(serverId)) {

					addPlaying(serverId, serverData.map.id);

					if(isSettingSet('notification', 'maps')) {

					    createNotification(serverData.map.name, mapsJson.maps[serverData.map.id].thumb, serverData.name, serverData.region, serverData.playing, serverId); 	

					}	

				}

			}

		}

	});

    chrome.browserAction.setBadgeBackgroundColor({ color: [0, 123, 205, 237] });

	chrome.browserAction.setBadgeText({text: '' + mapsPlayingTotal});

	var updateMapsSet = firstRefresh;

	firstRefresh = false; 

	/* Check if popup is open, and refresh data if so. */

	var getAppPopup = chrome.extension.getViews({type: "popup"});

	if(getAppPopup.length > 0) {

	    var appPopup = getAppPopup[0];

        appPopup.pageMapsPlaying();

	    if(updateMapsSet) {

	    	appPopup.pageMapsSet();

	    }

	}

}

function createNotification(mapName, mapThumb, serverName, serverRegion, serverPlayers, serverId) {

	var opt = {
	    type: "basic",
	    title: mapName + ' is now playing!',
	    message: 'Server: ' + serverName + ' (' + serverRegion.toUpperCase() + ')\nPlayers: ' + serverPlayers,
	    iconUrl: mapThumb
	};

	var currentTime    = new Date().getTime();

	var notificationId = serverId + '.' + currentTime;

	chrome.notifications.create(notificationId, opt, function() {});

}

function isMapFavorited(mapId) {

	return (getDatabase().query('favorites', {mapId: mapId}).length > 0);
}

function addPlaying(serverId, mapId) {

	console.log('Added: ' + serverId);

	if(!isPlaying(serverId)) {

		var timeStarted = new Date().getTime();

	    getDatabase().insert("playing", {
	    	serverId: serverId, 
	    	mapId: mapId, 
	    	matchStarted: (!firstRefresh ? timeStarted : false)
	    });

	    getDatabase().commit();

	}

}

function removePlaying(serverId) {

	console.log('Removed: ' + serverId);

    getDatabase().deleteRows("playing", {serverId: serverId});

    getDatabase().commit();

}

function isPlaying(serverId) {

	return (getDatabase().query('playing', {serverId: serverId}).length > 0);

}

function initSettings() {

	getDatabase().createTableWithData("settings", [{type: "notification", value: "maps"}, {type: "region", value: "eu"}, {type: "region", value: "us"}]);

	getDatabase().createTable("playing", ["serverId", "mapId", "matchStarted"]);

	getDatabase().createTable("favorites", ["mapId"]);

	getDatabase().commit();

}

function clearOldNotifications(seconds) {

	chrome.notifications.getAll(function(ids) {

		for(id in ids) {

			var getNotificationData = id.split('.');

			var currentTime = new Date().getTime();

			if(parseInt(currentTime, 10) > (parseInt(getNotificationData[1], 10) + (parseInt(seconds, 10) * 1000))) {

				chrome.notifications.clear(id, function(){});

			}

		}

	});

}