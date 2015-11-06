var app = angular.module('songhop.services', ['ionic.utils']);

app.factory('User', function($http, $q, $localstorage, SERVER) {
	var o = {
		username: false,
		session_id: false,
		favorites: [],
		newFavorites: 0
	}

	o.addSongToFavorites = function (song) {
		// Make sure there's an actual song to add
		if(!song) return false;

		// Add the song to the favorites array
		o.favorites.unshift(song);
		o.newFavorites++;

		return $http.post(SERVER.url + '/favorites', { session_id: o.session_id, song_id:song.song_id });
	}

	o.removeSongFromFavorites = function (song, index) {
		// Make sure there's a song to remove
		if(!song) return false;

		// Remove song from favorites array
		o.favorites.splice(index, 1);

		// This should persist to the server
		return $http({
			method: 'DELETE',
			url: SERVER.url + '/favorites',
			params: { session_id: o.session_id, song_id: song.song_id }
		});
	}

	o.favoriteCount = function() {
		return o.newFavorites;
	}

	// This should get the entire list of the user's favorites from the server
	o.populateFavorites = function() {
		return $http({
			method: 'GET',
			url: SERVER.url + '/favorites',
			params: { session_id: o.session_id }
		}).success(function(data) {
			// Merge data into the queue
			o.favorites = data;
		});
	}

	o.auth = function(username, signingUp) {
		var authRoute;

		if(signingUp) {
			authRoute = 'signup';
		}
		else {
			authRoute = 'login';
		}

		return $http.post(SERVER.url + '/' + authRoute, {username: username})
			.success(function(data){
				o.setSession(data.username, data.session_id, data.favorites);
			});
	}

	o.setSession = function (username, session_id, favorites) {
		if(username) o.username = username;
		if(session_id) o.session_id = session_id;
		if(favorites) o.favorites = favorites;

		// Set data in localstorage object
		$localstorage.setObject('user', { username:username, session_id: session_id });
	}

	o.checkSession = function () {
		var defer = $q.defer();

		if(o.session_id) {
			// If this session is already initialized in the service
			defer.resolve(true);
		}
		else {
			// Detect if there's a session in localstorage form previous use.
			// If there is, pull into our service
			var user = $localstorage.getObject('user');

			if(user.username) {
				// If there is a user, grab their favorite songs from the server
				o.setSession(user.username, user.session_id);
				o.populateFavorites().then(function(){
					defer.resolve(true);
				});
			}
			else {
				// No user info found in localstorage, reject here
				defer.resolve(false);
			}
		}

		return defer.promise;
	}

	// Set everything back to an empty session
	o.destroySession = function() {
		$localstorage.setObject('user', {});
		o.username = false;
		o.session_id = false;
		o.favorites = [];
		o.newFavorites = 0;
	}

	return o;
})

app.factory('Recommendations', function($http, $q, SERVER) {
	var o = {
		queue : []
	};

	var media;

	o.playCurrentSong = function() {
		var defer = $q.defer();

		media = new Audio(o.queue[0].preview_url);

		media.addEventListener("loadeddata", function() {
			defer.resolve();
		});

		media.play();

		return defer.promise;
	}

	// Used when switching to favorites tab
	o.haltAudio = function() {
		if(media) media.pause();
	}

	o.getNextSongs = function() {
		return $http({
			method: 'GET', 
			url: SERVER.url + '/recommendations'
		}).success(function(data) {
			// Merge data into the queue
			o.queue = o.queue.concat(data);
		});
	}

	o.nextSong = function() {
		// Pop the index 0 off the array
		o.queue.shift();

		o.haltAudio();

		// If the queue is low (less than 3 songs) then fill it back up
		if (o.queue.length <= 3) {
			o.getNextSongs();
		}
	}

	o.init = function() {
		if(o.queue.length === 0) {
			return o.getNextSongs();
		}
		else {
			// Otherwise, play the current song
			return o.playCurrentSong();
		}
	}

	return o;
})
