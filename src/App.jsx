import React, {Component} from 'react';
import SpotifyButton from './SpotifyButton';

class App extends Component {

    constructor(){
        super();
        this.state = {spotifyClientId : '3584c956d9104cc2a666609435b5f7cb',
                      songkickApiKey : 'OOaB00KnFpvUzkjR'};
        this.spotifyAuth = this.spotifyAuth.bind(this);
        this.getSpotifyUserPlaylists = this.getSpotifyUserPlaylists.bind(this);
    }

    extractAccessToken(){

        return $.url().param('acess_token');
    }

    getSpotifyUserInfo(){


    }

    getSpotifyUserTracks(){

        if (this.state.userTracksNextUri != null){
            $.ajax({
                url: this.state.userTracksNextUri,
                headers: {'Authorization':this.state.accessToken},
                success: (response)=>{
                    this.setState({userTracksNextUri : response.next},
                        ()=>{

                        });
                }

            });
        }

        if (this.state.userPlaylistsNextUri != null){
            $.ajax({

            });
        }
    }

    spotifyAuth() {

        let spotifyAuthURL = encodeURIComponent('https://accounts.spotify.com/authorize');
        spotifyAuthURL += encodeURIComponent('?response_type=token');
        spotifyAuthURL += encodeURIComponent('&client_id=');
        spotifyAuthURL += encodeURIComponent(this.state.spotifyClientId);
        spotifyAuthURL += encodeURIComponent('&redirect_uri=http://localhost:3000/index.html');
        spotifyAuthURL += encodeURIComponent('&scope=user-library-read playlist-read-private');
        spotifyAuthURL += encodeURIComponent('&state=' + Date.now());
        window.location = spotifyAuthURL;

        /* Pull the access token from our current url */
        let accessToken = this.extractAccessToken();
        this.setState({accessToken : accessToken,
                       userTracksNextUri : 'https://api.spotify.com/v1/me/tracks?limit=50&offset=0'},
            ()=> {
                getSpotifyUserTracks();
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
