var app = angular.module('songhop.controllers', ['ionic', 'songhop.services'])


/*
Controller for the discover page
*/
app.controller('DiscoverCtrl', function($scope, $ionicLoading, $timeout, User, Recommendations) {
	// Mock out three songs
	
	// $scope.songs = [
	// 	{
	// 		"title":"Pretty Hate Machine",
	// 		"artist":"Nine Inch Nails",
	// 		"image_small":"http://ecx.images-amazon.com/images/I/41JQDC303VL.jpg",
	// 		"image_large":"http://trent-reznor.narod.ru/pretty_hate_machine_2.jpg"
	// 	},
	// 	{
	// 		"title":"Jenny Was a Friend Of Mine",
	// 		"artist":"The Killers",
	// 		"image_small":"http://i.ytimg.com/vi/qlOqXcPkUis/hqdefault.jpg",
	// 		"image_large":"http://www.lyrics007.com/images/cover_art/82/4/60"
	// 	},
	// 	{
	// 		"title":"Do It",
	// 		"artist":"Ziggy",
	// 		"image_small":"https://i.scdn.co/image/1a4ba26961c4606c316e10d5d3d20b736e3e7d27",
	// 		"image_large":"https://i.scdn.co/image/91a396948e8fc2cf170c781c93dd08b866812f3a"
	// 	}
	// ];

	// $scope.currentSong = angular.copy($scope.songs[0]);

	// Helper functions for loading
	var showLoading = function showLoadFunc() {
		$ionicLoading.show({
			template: '<i class="ion-loading-c"></i>',
			noBackdrop: true
		});
	}

	var hideLoading = function hideLoadFunc() {
		$ionicLoading.hide();
	}

	// Set loading to true the first time while we retrieve songs from the server.
	showLoading();

	// Get a queue of songs from the server using the Recommendations service.
	$scope.nextAlbumImg = function() {
		if (Recommendations.queue.length > 1) {
			return Recommendations.queue[1].image_large;
		}

		return '';
	}

	Recommendations.init()
		.then(function() {
			$scope.currentSong = Recommendations.queue[0];
			Recommendations.playCurrentSong();
		})
		.then(function() {
			// Turn loading indicator off
			hideLoading();
			$scope.currentSong.loaded = true;
		});

	$scope.sendFeedback = function sendFeedback(bool) {

		// First, add to favorites if the song has been favorited
		if(bool) User.addSongToFavorites($scope.currentSong);

		$scope.currentSong.rated = bool;
		$scope.currentSong.hide - true;

		//$timeout(function() {
		
		// Set the current song to one of our three mocked songs
		// var randomSong = Math.round(Math.random() * ($scope.songs.length - 1));

		// Update the current song in scope
		// $scope.currentSong = angular.copy($scope.songs[randomSong]);
		// }, 250);

		// Prepare the next song
		Recommendations.nextSong();

		// Update the current song in scope, timeout is there ot allow animation to complete
		$timeout(function() {
			$scope.currentSong = Recommendations.queue[0];
			$scope.currentSong.loaded = false;
		}, 250);

		Recommendations.playCurrentSong()
			.then(function() {
				$scope.currentSong.loaded = true;
			});
	};	
})

/*
Controller for the favorites page
*/
app.controller('FavoritesCtrl', function($scope, $window, User) {
	// Get the list of favorites from the User service
	$scope.favorites = User.favorites;

	$scope.username = User.username;


	$scope.removeSong = function removeSongFunc(song, index) {
		User.removeSongFromFavorites(song, index);
	}

	$scope.openSong = function openSongFunc(song) {
		$window.open(song.open_url, "_system");
	}
	// $scope.removeSong = User.removeSongFromFavorites;


})


/*
Controller for our tab bar
*/
app.controller('TabsCtrl', function($scope, $window, User, Recommendations) {
	// Stop audio from the discovery tab when navigating to Favorites tab
	$scope.enteringFavorites = function() {
		User.newFavorites = 0;
		Recommendations.haltAudio();
	}

	$scope.leavingFavorites = function() {
		Recommendations.init();
	}

	$scope.favCount = User.favoriteCount;

	$scope.logout = function logoutFunc() {
		User.destroySession();

		// Instead of using $state.go, we'll redirect.
		// Reason: We need to ensure views are not cached.
		$window.location.href = 'index.html';
	}
	
});

app.controller('SplashCtrl', function($scope, $state, User) {
	$scope.submitForm = function(username, signingUp) {
		User.auth(username, signingUp).then(function() {
			// Session is now set, redirect to discover page
			$state.go('tab.discover');
		}, function() {
			alert('Not a known user name, please try another username.');
		});
	}
});