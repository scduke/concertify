import React, {Component} from 'react';
import $ from 'jquery';


export default class SpotifyButton extends Component {

    render(){
        return (
          <button id="spotify-auth" className="btn" onClick={this.props.onClick}/>
        );
    }
}
