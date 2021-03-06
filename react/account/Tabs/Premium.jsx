/* eslint-disable no-invalid-this */
/* global window */
import React from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import Modal from 'react-responsive-modal';
import RichSelect from '../../dashboard/common/RichSelect.jsx';

export default class Premium extends React.Component {
    constructor() {
        super();
        this.state = {
            addServerModal: {
				open: false,
				disabled: false,
				selectedOption: null,
			},
			remServerModal: {
				open: false,
				disabled: false,
			},
        };
    }

    addServer = () => {
		this.setState({ addServerModal: { open: true } });
	}

	deactivate = async (server) => {
		this.setState({ remServerModal: { open: true, server } });
	}

	addServerModalClose = () => {
		this.setState({ addServerModal: { open: false } });
	}

	remServerModalClose = () => {
		this.setState({ remServerModal: { open: false } });
	}

	handleAddServer = (props, selectedOption) => {
		this.setState({ addServerModal: { open: this.state.addServerModal.open, selectedOption } });
	}

	activateServer = async () => {
		this.setState({ addServerModal: { ...this.state.addServerModal, disabled: true } });
		try {
			const response = await axios.post('/account/activate', { serverId: this.state.addServerModal.selectedOption.value });
			this.setState({ addServerModal: { open: false } });
			this.getData();
		} catch (err) {
			let error = (err.response ? err.response.data : 'Failed to save, try again later');
			this.setState({ addServerModal: { ...this.state.addServerModal, error, disabled: false } });
		}
	}

	deactivateServer = async () => {
		this.setState({ remServerModal: { ...this.state.remServerModal, disabled: true } });
		try {
			const response = await axios.post('/account/deactivate', { serverId: this.state.remServerModal.server._id });
			this.setState({ remServerModal: { open: false } });
			this.getData();
		} catch (err) {
			let error = (err.response ? err.response.data : 'Failed to save, try again later');
			this.setState({ remServerModal: { ...this.state.remServerModal, error, disabled: false } });
		}
	}

	render() {
		let { userData } = this.props;
		if (userData === null) {
			return (<div className={'container'}><p>Please wait...</p></div>);
		}

		let dynoPremiumSubscriptions = userData ? userData.subscriptions.filter(subscription => subscription.planId.startsWith('premium-')) : [];
		let dynoPremiumServers = 0;
		if (dynoPremiumSubscriptions.length) {
			dynoPremiumServers = dynoPremiumSubscriptions.map(i => i.qty).reduce((a, c) => a + c);
		}

		const modalClasses = {
			modal: 'add-server-modal',
		};

		return (
		<div>
			{/* <h3 className={'title is-3'}>My subscriptions</h3> */}
			<div className={'columns'}>
				<div className={'column'}>
					<div className={'subscription premium'}>
						<div className={'subscription-title'}>
							<h5 className={'title is-5'}>RNet Premium</h5>
							<a className={'button is-info'} href='/upgrade'>Add Subscription</a>
						</div>
						<div className={'active-subscriptions'}>
							<p>You have <strong>{dynoPremiumSubscriptions.length}</strong> RNet Premium subscription(s), giving you a total of <strong>{dynoPremiumServers}</strong> RNet Premium server(s).</p>
							{dynoPremiumSubscriptions.map(sub => (<div className={'active-subscription'}>
								<div className={'subscription-header'}>
									<div className={'title is-5 with-image'}><img className="image is-32x32" src={'https://premium.dyno.gg/images/premium-transparent.png'} /> RNet {sub.planObject.name}</div>
									{sub.cancelled ? '' : (<a className={'button is-danger'} onClick={() => { if (window.confirm('Are you sure? This action is irreversible.')) { this.props.cancelSubscription(sub._id); } }}>Cancel Subscription</a>)}
								</div>
								<p>Subscribed: {moment(sub.firstBillingDate).format('Do MMMM YYYY')}</p>
								{sub.cancelled ? (<p>Subscription will expire on {moment(sub.nextBillingDate).format('Do MMMM YYYY')}</p>) : (<p>Next charge: {moment(sub.nextBillingDate).format('Do MMMM YYYY')}</p>)}
								<p>Amount: ${sub.planObject.price}</p>
							</div>))}
						</div>
						<div className={'subscription-title'}>
							<h5 className={'title is-5'}>Activated Servers</h5>
							<a className={'button is-success'} onClick={this.addServer}>Add Server</a>
						</div>
						<div className={'active-subscriptions'}>
							<p>You have activated <strong>{this.props.activatedGuilds.length}</strong> out of <strong>{dynoPremiumServers}</strong> RNet Premium server(s).</p>
							<p>Once you have activated a server, click the button to add the Premium bot to your server.</p>
							{this.props.activatedGuilds.map(i => (<div className={'active-subscription'}>
								<div className={'subscription-header'}>
									<div className={'title is-5 with-image'}><img className="image is-32x32" src={i.iconURL} /> {i.name}</div>
									<div className={'button-group'}>
										<a className={'button is-info'} href={`https://discordapp.com/oauth2/authorize?client_id=<PREMIUM_CLIENT_ID>&scope=bot&permissions=2134207671&guild_id=${i._id}`}>Add Premium Bot</a>
										<a className={'button is-danger'} onClick={() => { this.deactivate(i); }}>Deactivate</a>
									</div>
								</div>
								<p>Since: {moment.tz(i.premiumSince, 'UTC').tz(moment.tz.guess()).format('Do MMMM YYYY hh:mmA z')}</p>
							</div>))}
						</div>
					</div>
				</div>
			</div>
			<Modal open={this.state.addServerModal.open} classNames={modalClasses} onClose={this.addServerModalClose}>
				<h5 className={'title is-5'}>Activate RNet Premium on a server</h5>
				<RichSelect
					text='Server'
					defaultOption='Select server'
					disabled={this.state.addServerModal.disabled}
					options={this.props.guilds}
					onChange={this.handleAddServer}
				/>
				<p>This server will be upgraded to RNet Premium instantly.</p>
				{this.state.addServerModal.error ? (<p className={'error'}>{this.state.addServerModal.error}</p>) : ''}
				<button className='button is-success' disabled={this.state.addServerModal.disabled && !this.state.addServerModal.error} onClick={this.activateServer}>{this.state.addServerModal.disabled && !this.state.addServerModal.error ? `Processing...` : `Activate`}</button>
			</Modal>
			<Modal open={this.state.remServerModal.open} classNames={modalClasses} onClose={this.remServerModalClose}>
				<h5 className={'title is-5'}>Deactivating RNet Premium</h5>
				{this.state.remServerModal.server ? (<p>Are you sure you wish to deactivate RNet Premium for <strong>{this.state.remServerModal.server.name}</strong>?</p>) : ''}
				<p>This server will lose RNet Premium benefits instantly.</p>
				{this.state.remServerModal.error ? (<p className={'error'}>{this.state.remServerModal.error}</p>) : ''}
				<button className='button is-danger' disabled={this.state.remServerModal.disabled && !this.state.remServerModal.error} onClick={this.deactivateServer}>{this.state.remServerModal.disabled && !this.state.remServerModal.error ? `Processing...` : `Deactivate`}</button>
			</Modal>
		</div>);
	}
}
