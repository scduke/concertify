import React, {Component} from 'react';
import SpotifyButton from './SpotifyButton';
import $ from 'jquery';
import qs from 'qs'

// Pivot the app to do base functionality, but also tofind users music cities

class App extends Component {

    constructor(){
        super();
        this.state = {spotifyClientId : '3584c956d9104cc2a666609435b5f7cb',
                      songkickApiKey : 'OOaB00KnFpvUzkjR',
                      userArtists : new Set(),
                      metroEvents: []};

        this.spotifyAuth = this.spotifyAuth.bind(this);
        this.getSavedArtists = this.getSavedArtists.bind(this);
        this.getSavedArtistsFromPlaylists = this.getSavedArtistsFromPlaylists.bind(this);
        this.getSpotifyUserTracks = this.getSpotifyUserTracks.bind(this);
        this.getSpotifyUserInfo = this.getSpotifyUserInfo.bind(this);
        this.saveArtists = this.saveArtists.bind(this);
        this.saveUserArtistsFromPlaylist = this.saveUserArtistsFromPlaylist.bind(this);
        this.saveSongkickConcerts = this.saveSongkickConcerts.bind(this);
        this.reduceConcertsByArtist = this.reduceConcertsByArtist.bind(this);
    }

    extractQueryStringParameter(){

        let self = this;
        let url = window.location.hash;
        url = url.substring(1, url.length);
        console.log('URL: ',url);

        let urlParams = qs.parse(url);

        this.setState({urlParams : urlParams},()=>{
            console.log('Url params: ',urlParams);
            self.spotifyAuth();
        });
    }

    componentDidMount(){

        this.extractQueryStringParameter();
    }

    getSpotifyUserInfo(){

        $.ajax({
            url: 'https://api.spotify.com/v1/me',
            beforeSend : (jqXHR, settings) => {
                            jqXHR.setRequestHeader('Authorization', 'Bearer ' + this.state.urlParams.access_token)},
            success: (response)=>{
                this.setState({userId : response.id},
                    ()=>{
                        this.getSpotifyUserTracks();
                    });
            }
        });
    }

    saveUserArtistsFromPlaylist(playlistUri) {

        let offset = 0;
        let total;
        let playlistTracksUri = playlistUri + '/tracks?limit=100&fields=items(track(name,href,artists(name)))&offset=' + offset;

        $.ajax({
           url: playlistTracksUri,
           headers: {'Authorization':'Bearer ' + this.state.urlParams.access_token},
           success: (response) => {

               console.log('Response from playlist artists request: ', response);

               let items = response.items;
               items.forEach((item) => {
                   let artists = item.track.artists;
                   artists.forEach((artist) => {

                       let name = artist.name;
                       this.setState({userArtists : this.state.userArtists.add(name)},() => {
                           console.log('Added artist: ', name);
                       });
                   });
               });
           }
        });
    }

    getSavedArtistsFromPlaylists() {

        console.log('Getting user saved artists');

        let offset = 0;
        let total;
        let uriBase = 'https://api.spotify.com/v1/me/playlists?limit=50&offset=';
        let uri = uriBase + offset;

        $.ajax({
            url: uri,
            headers: {'Authorization':'Bearer ' + this.state.urlParams.access_token},
            success: (response) => {

                total = response.total;
                offset += 50;

                console.log('Fetching saved artists from playlists, total number of playlists: ', total);

                let items = response.items;
                // Iterate through each playlist in this page
                items.forEach((item) => {

                    let playlistHref = item.href;
                    this.saveUserArtistsFromPlaylist(playlistHref);
                });

                while(offset < total - 50){

                    uri = uriBase + offset;

                    console.log('Stuck in the saveArtists from playlist while loop, offset is now: ', offset);

                    $.ajax({
                        url: uri,
                        headers: {'Authorization':'Bearer ' + this.state.urlParams.access_token},
                        success: (response) => {

                            let items = response.items;
                            // Iterate through each playlist in this page
                            items.forEach((item) => {

                                let playlistHref = item.href;
                                this.saveUserArtistsFromPlaylist(playlistHref);
                            });
                        }
                    });
                    offset += 50;
                }
            }
        });
    }

    saveArtists(page) {

        let items = page.items;
        items.forEach((item) =>{
            let artists = item.track.artists;
            artists.forEach((artist) => {
                let name = artist.name;
                this.setState({userArtists : this.state.userArtists.add(name)}, () => {
                    console.log('Added artist: ', name);
                });
            });
        });
    }

    getSavedArtists() {

        let offset = 0;
        let total;
        let uriBase = 'https://api.spotify.com/v1/me/tracks?limit=50&offset=';

        $.ajax({
            url: uriBase + offset,
            headers: {'Authorization': 'Bearer ' + this.state.urlParams.access_token},
            success: (response) => {

                total = response.total;
                offset += 50;

                console.log('Fetching saved artists, total number of saved tracks ',total);

                while (offset < total - 20) {

                    console.log('Stuck in the saveArtists while loop, offset is now: ', offset);

                    $.ajax({
                       url: uriBase + offset,
                        headers: {'Authorization': 'Bearer ' + this.state.urlParams.access_token},
                        success: (response) => {

                            this.saveArtists(response);
                        }
                    });
                    offset += 50;
                }
            }
        });
    }

    getSpotifyUserTracks(){

        this.getSavedArtistsFromPlaylists();
        this.getSavedArtists();
        this.getSongkickConcertsByCity();
        this.reduceConcertsByArtist();
    }

    saveSongkickConcerts(response){

        let events = response.responsePage.results.event;
        events.forEach((event) => {

            this.setState({metroEvents: this.state.metroEvents.concat(event)})
        });
    }

    getSongkickConcertsByCity() {

        navigator.geolocation.getCurrentPosition((position) => {

            let latitude = position.coords.latitude;
            let longitude = position.coords.longitude;

            let page = 1;
            let perPage = 50;
            let total;

            let locationSearchUri = 'http://api.songkick.com/api/3.0/search/locations.json?location=geo:{' + latitude + ',' + longitude + '}&apikey={' + this.state.songkickApiKey + '}';

            // Request to get metroAreaId of user location
            $.ajax({
                url: locationSearchUri,
                success: (response) => {

                    let locationList = response.resultsPage.results.location;
                    let metroAreaId = locationList[0].metroArea.id;
                    this.setState({metroAreaId: metroAreaId}, () => {

                        let baseMetroEventsUri = 'http://api.songkick.com/api/3.0/metro_areas/' + this.state.metroAreaId + '/calendar.json?apikey={'+ this.state.songkickApiKey + '}';
                        let metroEventsUri = baseMetroEventsUri + '&page=' + page + '&per_page=' + perPage;

                        $.ajax({
                            url: metroEventsUri,
                            success: (response) => {

                                total = response.resultsPage.totalEntries;

                                // Process first page of concerts

                                while ((page * perPage) < total - perPage) {

                                    let metroEventsUri = baseMetroEventsUri + '&page=' + page + '&per_page=' + perPage;

                                    $.ajax({
                                       url: metroEventsUri,
                                        success: (response) => {

                                            this.saveSongkickConcerts(response);
                                        }
                                    });
                                    page++;
                                }
                            }
                        })

                    });
                }

            });
        });
    }

    reduceConcertsByArtist (){

        // iterate over events, if displayName is contained in artist set, then add it to a list
        let userConcerts = [];
        let metroEvents = this.state.metroEvents;

        metroEvents.forEach((event) => {

            let foundArtistInEvent = false;
            let eventPerformances = event.performance;
            for (let i = 0; i < eventPerformances.length; i++){
                if (this.state.userArtists.has(eventPerformances[i].displayname)) {
                    userConcerts = userConcerts.concat(event);
                    foundArtistInEvent = true;
                    break;
                }
            }
        });
        this.setState({userConcerts: userConcerts}, () => {

            // Display concerts to user
        });
    }

    spotifyAuth() {

        let self = this;

        console.log(this.state);

        if (!this.state.urlParams.hasOwnProperty('access_token')){

            console.log('Getting authorization . . .');
            let spotifyAuthURL = 'https://accounts.spotify.com/authorize';
            spotifyAuthURL += '?response_type=token';
            spotifyAuthURL += '&client_id=';
            spotifyAuthURL += this.state.spotifyClientId;
            spotifyAuthURL += '&redirect_uri=http://localhost:3000/index.html';
            spotifyAuthURL += '&scope=user-library-read playlist-read-private';
            spotifyAuthURL += '&state=' + Date.now();
            window.location = spotifyAuthURL;
        } else {
            console.log('Have an access token!');
        }

        this.setState({access_token : self.state.urlParams.access_token,
                       userTracksNextUri : 'https://api.spotify.com/v1/me/tracks?limit=50&offset=0'},
            ()=> {
                self.getSpotifyUserInfo();
            }
        );
    }

  render() {

        return (
            <SpotifyButton onClick={this.spotifyAuth}/>
        );
  }
}
export default App;
