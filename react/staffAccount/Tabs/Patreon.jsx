import axios from 'axios';
import React from 'react';
import OauthPopup from '../../common/OauthPopup.jsx';

export default class Patreon extends React.Component {
	oauthURL = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=<CLIENT_ID>&redirect_uri=http://localhost.com:8000/patreon`;
		// &state=<optional string>`;

	onCode = async (code, params) => {
		try {
			const response = await axios.post(`/patreon/process`, { code });
			console.log(response.data);
		} catch (err) {
			console.error(err);
		}
		console.log(code, params);
	}

    render() {
		console.log(this.oauthURL);
        return (
            <div className={'columns'}>
                <div className={'column'}>
                    <div className={'subscription patreon'}>
						<OauthPopup url={this.oauthURL} type='patreon' onCode={this.onCode} height={800}>
							<div>Click me to open a Popup</div>
						</OauthPopup>
                    </div>
                </div>
            </div>
        );
    }
}
