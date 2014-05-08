'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
   .controller('HomeCtrl', ['$scope', 'syncData', function($scope, syncData) {
      // syncData('syncedValue').$bind($scope, 'syncedValue');

      // $scope.songs = syncData('songs', 20);
      $scope.songs = [];
      $scope.loading = true;
      var songs = syncData('songs');

      songs.$on('loaded', function() {
         var indexes = songs.$getIndex();
         $scope.songs = [];
         indexes.forEach(function(id) {
            var item = songs[id];
            item._id = id;
            $scope.songs.push(item);
         });
         $scope.loading = false;
      });
   }])

   .controller('SongCtrl', ['$scope', 'syncData', '$routeParams', '$sce', function($scope, syncData, $routeParams, $sce) {
      // syncData('syncedValue').$bind($scope, 'syncedValue');
      // var sync = syncData(['songs', $routeParams.id]);
      // syncData('songs').startAt($routeParams.id).endAt($routeParams.id).once('value', function(snap) {
      //    $scope.song = snap;   
      // });
      $scope.song = syncData(['songs', $routeParams.id]);
      $scope.mediaurl = $sce.trustAsResourceUrl('http://mozilla.github.io/pdf.js/web/viewer.html');
      // data.$push();
      // data.$set({id: $routeParams.id});

      // $scope.song = data;
      $scope.song.$on('loaded', function() {
         $scope.mediaurl = $sce.trustAsResourceUrl('http://mozilla.github.io/pdf.js/web/viewer.html?file='+$scope.song.chord);
      });
   }])

  .controller('ChatCtrl', ['$scope', 'syncData', function($scope, syncData) {
      $scope.newMessage = null;

      // constrain number of messages by limit into syncData
      // add the array into $scope.messages
      $scope.messages = syncData('messages', 10);

      // add new messages to the list
      $scope.addMessage = function() {
         if( $scope.newMessage ) {
            $scope.messages.$add({text: $scope.newMessage});
            $scope.newMessage = null;
         }
      };
   }])

   .controller('LoginCtrl', ['$scope', 'loginService', '$location', function($scope, loginService, $location) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;

      $scope.login = function(cb) {
         $scope.err = null;
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else {
            loginService.login($scope.email, $scope.pass, function(err, user) {
               $scope.err = err? err + '' : null;
               if( !err ) {
                  cb && cb(user);
               }
            });
         }
      };

      $scope.createAccount = function() {
         $scope.err = null;
         if( assertValidLoginAttempt() ) {
            loginService.createAccount($scope.email, $scope.pass, function(err, user) {
               if( err ) {
                  $scope.err = err? err + '' : null;
               }
               else {
                  // must be logged in before I can write to my profile
                  $scope.login(function() {
                     loginService.createProfile(user.uid, user.email);
                     $location.path('/account');
                  });
               }
            });
         }
      };

      function assertValidLoginAttempt() {
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else if( $scope.pass !== $scope.confirm ) {
            $scope.err = 'Passwords do not match';
         }
         return !$scope.err;
      }
   }])

   .controller('AccountCtrl', ['$scope', 'loginService', 'syncData', '$location', function($scope, loginService, syncData, $location) {
      syncData(['users', $scope.auth.user.uid]).$bind($scope, 'user');

      $scope.logout = function() {
         loginService.logout();
      };

      $scope.oldpass = null;
      $scope.newpass = null;
      $scope.confirm = null;

      $scope.reset = function() {
         $scope.err = null;
         $scope.msg = null;
      };

      $scope.updatePassword = function() {
         $scope.reset();
         loginService.changePassword(buildPwdParms());
      };

      function buildPwdParms() {
         return {
            email: $scope.auth.user.email,
            oldpass: $scope.oldpass,
            newpass: $scope.newpass,
            confirm: $scope.confirm,
            callback: function(err) {
               if( err ) {
                  $scope.err = err;
               }
               else {
                  $scope.oldpass = null;
                  $scope.newpass = null;
                  $scope.confirm = null;
                  $scope.msg = 'Password updated!';
               }
            }
         }
      }

   }]);