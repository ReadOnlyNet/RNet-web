/* eslint-disable no-invalid-this */
/* global window */
import React from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import Modal from 'react-responsive-modal';
import RichSelect from '../../dashboard/common/RichSelect.jsx';

export default class ActivatedServers extends React.Component {
    constructor() {
        super();
        this.state = {
            addServerModal: {
                open: false,
                disabled: false,
                server: null,
                subscriptionType: null,
            },
            remServerModal: {
                open: false,
                disabled: false,
            },
        };
    }

    addServer = () => {
        if (this.props.isImpersonating) return;
        this.setState({ addServerModal: { open: true } });
    }

    deactivate = async (server) => {
        if (this.props.isImpersonating) return;
        this.setState({ remServerModal: { open: true, server } });
    }

    addServerModalClose = () => {
        this.setState({ addServerModal: { open: false } });
    }

    remServerModalClose = () => {
        this.setState({ remServerModal: { open: false } });
    }

    handleAddServer = (props, selectedOption) => {
        const { addServerModal } = this.state;
        addServerModal.server = selectedOption;
        this.setState({ addServerModal });
    }

    handleSubscription = (props, selectedOption) => {
        const { addServerModal } = this.state;
        addServerModal.subscriptionType = selectedOption;
        this.setState({ addServerModal });
    }

    activateServer = async () => {
        if (this.props.isImpersonating) return;
        this.setState({ addServerModal: { ...this.state.addServerModal, disabled: true } });
        try {
            await axios.post('/account/activate', { serverId: this.state.addServerModal.server.value, subscriptionType: this.state.addServerModal.subscriptionType.value });
            this.setState({ addServerModal: { open: false } });
            this.props.getData();
        } catch (err) {
            console.log(err);
            let error = (err.response ? err.response.data : 'Failed to save, try again later');
            this.setState({ addServerModal: { ...this.state.addServerModal, error, disabled: false } });
        }
    }

    deactivateServer = async () => {
        // if (this.props.isImpersonating) return;
        this.setState({ remServerModal: { ...this.state.remServerModal, disabled: true } });
        try {
            await axios.post('/account/deactivate', { serverId: this.state.remServerModal.server._id });
            this.setState({ remServerModal: { open: false } });
            this.props.getData();
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
            dynoPremiumSubscriptions = dynoPremiumSubscriptions.map(s => { s.canCancel = true; return s; });
            dynoPremiumServers = dynoPremiumSubscriptions.map(i => i.qty).reduce((a, c) => a + c);
        }

        if (userData && userData.otherSubscriptions) {
            let otherSubscriptions = userData.otherSubscriptions.reduce((a, b) => a += b.qty, 0);
            dynoPremiumSubscriptions = dynoPremiumSubscriptions.concat(userData.otherSubscriptions);
            dynoPremiumServers += otherSubscriptions || 0;
        }

        if (userData && userData.patreonSubscriptions) {
            let patreonSubscriptions = userData.patreonSubscriptions.reduce((a, b) => a += b.qty, 0);
            dynoPremiumSubscriptions = dynoPremiumSubscriptions.concat(userData.patreonSubscriptions);
            dynoPremiumServers += patreonSubscriptions || 0;
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
                            {/* <div className={'subscription-title'}>
                                <h5 className={'title is-5'}>Activated Servers</h5>
                            </div> */}
                            <div className={'active-subscriptions'}>
                                <p>Activated <strong className="has-text-primary">{this.props.subscriptionGuilds.length}</strong> dyno premium servers out of <strong className="has-text-primary">{dynoPremiumServers > 10000 ? '∞' : dynoPremiumServers}</strong> available.</p>
                                <p>Once you have activated a server, click the button to add the Premium bot to your server.</p>
                                <a className={'button is-info is-rounded is-medium add-server-button'} onClick={this.addServer}>Add Server</a>
                                {
                                    this.props.subscriptionGuilds.map((i, k) => (<div key={k} className={'active-subscription'}>
                                        <div className={'subscription-header'}>
                                            <div className={'title is-5 with-image'}><img alt="Discord server logo" className="image is-32x32" src={i.iconURL} /> {i.name}</div>
                                            <div className={'button-group'}>
                                                <a className={'button is-info is-rounded'} href={`https://discordapp.com/oauth2/authorize?client_id=168274214858653696&scope=bot&permissions=2134207671&guild_id=${i._id}`}>Add Premium Bot</a>
                                                <a className={'button is-light is-rounded'} onClick={() => { this.deactivate(i); }}>Deactivate</a>
                                            </div>
                                        </div>
                                        <p className="has-text-grey">Since: {moment.tz(i.premiumSince, 'UTC').tz(moment.tz.guess()).format('Do MMMM YYYY hh:mmA')} EST</p>
                                    </div>))
                                }
                            </div>
                            { this.props.patreonGuilds.length > 0 &&
                                <div className={'subscription-title'}>
                                    <h5 className={'title is-5'}>Patreon Servers</h5>
                                </div>
                            }
                            { this.props.patreonGuilds.length > 0 &&
                                <div className={'active-subscriptions'}>
                                    <p>These servers were enabled using the old subscription model (Patreon).</p>
                                    <p>To enable or transfer servers on this list, please contact us on the <strong>#donators</strong> channel at <a href="https://discord.gg/dyno">our support server</a>.</p>
                                    {this.props.patreonGuilds.map((i, k) => (<div key={k} className={'active-subscription'}>
                                        <div className={'subscription-header'}>
                                            <div className={'title is-5 with-image'}><img alt="Discord server logo" className="image is-32x32" src={i.iconURL} /> {i.name}</div>
                                            <div className={'button-group'}>
                                                <a className={'button is-info is-rounded'} href={`https://discordapp.com/oauth2/authorize?client_id=168274214858653696&scope=bot&permissions=2134207671&guild_id=${i._id}`}>Add Premium Bot</a>
                                                <a className={'button is-light is-rounded'} onClick={() => { this.deactivate(i); }}>Deactivate</a>
                                            </div>
                                        </div>
                                        <p className="has-text-grey">Since: {moment.tz(i.premiumSince, 'UTC').tz(moment.tz.guess()).format('Do MMMM YYYY hh:mmA')} EST</p>
                                    </div>))}
                                </div>
                            }
                        </div>
                    </div>
                </div>
                <Modal open={this.state.addServerModal.open} classNames={modalClasses} onClose={this.addServerModalClose}>
                    <h5 className={'title is-5'}>Activate RNet Premium on a server</h5>
                    {dynoPremiumSubscriptions.length > 0 && (
                        <RichSelect
                            text='Subscription'
                            defaultOption='Select Subscription'
                            disabled={this.state.addServerModal.disabled}
                            options={dynoPremiumSubscriptions.map((sub, i) => ({ label: sub.name || sub.planObject.name, value: sub.type || 'braintree' }))}
                            onChange={this.handleSubscription}
                        />
                    )}
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