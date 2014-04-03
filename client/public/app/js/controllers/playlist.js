'use strict;'

angular.module('piplaylist.controllers', [])
    .factory('miscMethods', function() {
        return ({
            toPlJsonExt: function(file){
                return '__'+file+'.json';
            }
        })
    })
    .controller('PlaylistCtrl',['$scope', '$http', '$rootScope', 'piUrls',
        '$location', '$document', '$window', 'Navbar', '$route', '$routeParams','miscMethods',
        function($scope, $http, $rootScope, piUrls, $location, $document, $window, Navbar,$route, $routeParams,miscMethods){

            Navbar.showPrimaryButton= true;
            $http.get(piUrls.getStatus,{}).success(function(data,status){
                if(data.data.playlistOn){
                    Navbar.primaryButtonText= 'STOP';
                    Navbar.primaryButtonTypeClass= "btn-danger";
                }else{
                    Navbar.primaryButtonText= 'PLAY';
                    Navbar.primaryButtonTypeClass= "btn-info";
                }
                
            });
            $scope.$parent.title='Playlist';
            $scope.videos=[];
                        
            $scope.$watch('playlistform.$dirty', function(newVal, oldVal) {
                if(newVal) {
                    Navbar.primaryButtonText= "SAVE";
                    Navbar.primaryButtonTypeClass= "btn-success";
                }
            });

            if ($routeParams.file) {
                $http
                .get('/files', {params: { withplaylist: miscMethods.toPlJsonExt($routeParams.file) } })
                .success(function(data, status) {
                    if (data.success) {
                        $scope.playlist=[];
                        if(data.data){
                            data.data.forEach(function(itm){
                                $scope.playlist.push({
                                    filename: itm.filename || itm,
                                    duration: itm.duration || 10,
                                    selected: itm.selected || 'false',
                                    deleted: itm.deleted || false
                                });
                            });
                        }
                    }
                })
                .error(function(data, status) {
                });
    
                $scope.sortableOptions = {
                    update: function(e, ui) {
                        Navbar.primaryButtonText= "SAVE";
                        Navbar.primaryButtonTypeClass= "btn-success";
                    }
                };
    
                $scope.imgChk= function(name){
                    if(name.match(/(jpg|jpeg|png|gif|html)$/gi)){
                        $scope.noimg= false;
                        return true;
                    }else{
                        $scope.noimg=true
                        return false;
                    }
                }
            }

            $scope.pbHandler = function(buttonText){
                if (buttonText == "SAVE") {
                    $scope.notify= true;
                    var createplaylist=[];
                    $scope.playlist.forEach(function(itm){
                        if(itm.selected == true) createplaylist.push(itm);
                    });
                    $http
                        .post('/playlists', {                            
                            file: miscMethods.toPlJsonExt($routeParams.file),
                            assets: (createplaylist.length)? createplaylist : {}
                        })
                        .success(function(data, status) {
                            if (data.success) {
                                //console.log(data.stat_message);
                                $route.reload();
                            }
                        })
                        .error(function(data, status) {
                            console.log(status);
                        });
                    Navbar.primaryButtonText = "PLAY";
                } else if (buttonText == "PLAY") {
                    Navbar.primaryButtonText = "WAIT";
                    Navbar.primaryButtonTypeClass= "btn-warning";
                    $http
                        .post('/play/playlists/'+'default', { play: true})
                        .success(function(data,success){
                            if (data.success) {
                                $location.path('/');
                                Navbar.primaryButtonText = "STOP";
                                Navbar.primaryButtonTypeClass= "btn-danger";
                            }else {
                            }
                        })
                        .error(function(data,status){
                            console.log('playall request failed');
                        })
                } else if (buttonText == "STOP") {
                    Navbar.primaryButtonText = "WAIT";
                    Navbar.primaryButtonTypeClass= "btn-warning";
                    $http
                        .post('/play/playlists/'+'default', { stop: true})
                        .success(function(data,success){
                            if (data.success) {
                                Navbar.primaryButtonText = "PLAY";
                                Navbar.primaryButtonTypeClass= "btn-info";
                            }else {

                            }
                        })
                }
            }
    }])
    .controller('PlaylistViewCtrl',['$scope', '$http', 'Navbar', '$location', '$route','miscMethods',
        function($scope, $http, Navbar, $location, $route, miscMethods){
            
            Navbar.showPrimaryButton= true;
            Navbar.primaryButtonText = "EDIT";
            Navbar.primaryButtonTypeClass= "btn-info";
            
            $scope.newfile= false;
            $scope.newfilename;
            
            var processFilename= function(){
                var filenames=[];
                for(var key in $scope.playlistfiles){
                    if($scope.playlistfiles[key].filename.match(/^playlist\d+/g)){
                        filenames.push(name);
                    }
                }
                return(!filenames.length)? "playlist1": "playlist"+(filenames.length+1);
            }
            
            $http
            .get('/playlists', {})            
            .success(function(data, status) {
                if (data.success) {
                    $scope.playlistfiles= data.data;                    
                    processFilename();
                }
            })
            .error(function(data, status) {                
            });
            
            $scope.addplaylist= function(){
                $scope.newfilename= processFilename();
                $scope.disableAddPlaylist= true;
                $http
                    .post('/playlists/'+$scope.newfilename, {})            
                    .success(function(data, status) {
                        if (data.success) {
                            $scope.playlistfiles.push({filename: $scope.newfilename, settings: ""});
                            $scope.newfile= true;
                        }
                    })
                    .error(function(data, status) {                
                    });
            }
            
            $scope.pbHandler = function(buttonText){                
                $location.path('/playlists/edit/');
            }
            
            $scope.rename= function(file, index){
                $http
                    .post('/files/'+miscMethods.toPlJsonExt(file),
                            {  oldname: miscMethods.toPlJsonExt($scope.newfilename) })
                    .success(function(data, status) {
                        if (data.success) {
                            $scope.playlistfiles.splice($scope.playlistfiles.indexOf(miscMethods.toPlJsonExt(file)), 1 , $scope.newfilename); 
                            $route.reload();
                            $scope.newfile= false;
                        }
                    })
                    .error(function(data, status) {            
                    });
                $scope.disableAddPlaylist= false;
            }
            
            $scope.goTo= function(loc){
                $location.path(loc);
            }
            
    }])
    .controller('PlaylistEditCtrl',['$scope', '$http', 'Navbar', '$location', '$route', 'miscMethods',
        function($scope, $http, Navbar, $location, $route, miscMethods){
            
            Navbar.showPrimaryButton= true;
            Navbar.primaryButtonText = "DONE";
            Navbar.primaryButtonTypeClass= "btn-success";           
            
            $http
            .get('/playlists', {})            
            .success(function(data, status) {
                if (data.success) {
                    $scope.playlistfiles= data.data;
                    $scope.filescopy= angular.copy($scope.playlistfiles);
                }
            })
            .error(function(data, status) {                
            });
            
            $scope.pbHandler = function(buttonText){
                $location.path('/playlists');
            }
            
            $scope.delete= function(file){
                var filename= miscMethods.toPlJsonExt(file);
                $http
                    .delete('/files/'+filename)
                    .success(function(data, status) {
                        if (data.success) {
                            $scope.playlistfiles.splice($scope.playlistfiles.indexOf(file),1);                        }
                    })
                    .error(function(data, status) {            
                    });                            
            }
            $scope.rename= function(file, index){
                $http
                    .post('/files/'+miscMethods.toPlJsonExt(file), {
                        oldname: miscMethods.toPlJsonExt($scope.filescopy[index].filename)})
                    .success(function(data, status) {
                        if (data.success) {
                            $scope.playlistfiles.splice($scope.playlistfiles.indexOf($scope.filescopy[index].filename), 1 , file); 
                            $route.reload();
                        }
                    })
                    .error(function(data, status) {            
                    });                                
            }
            
    }])
    .controller('PlaylistCalendarCtrl',['$scope', '$http', 'Navbar', '$location', '$route', '$routeParams', 'miscMethods',
        function($scope, $http, Navbar, $location, $route, $routeParams, miscMethods){
        $scope.playlistsettings= {
            startdate: '',
            enddate: '',
            starttime: '',
            endtime: ''
        }
        $http
            .get('/playlists', { params: {file: miscMethods.toPlJsonExt($routeParams.file) } })   
            .success(function(data, status) {                
                if(data.success) {
                    $scope.playlistsettings = data.data.settings;
                }                    
            })
            .error(function(data, status) {                
            });

        $scope.saveplaylistsettings= function(name){
            $http
                .post('/playlists', { 
                    file: miscMethods.toPlJsonExt($routeParams.file),
                    settings: $scope.playlistsettings
                })   
                .success(function(data, status) {                
                    if(data.success) {                        
                        $location.path('/playlists');
                    }                    
                })
                .error(function(data, status) {                
                });
        }
        
    }])