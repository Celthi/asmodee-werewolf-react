
import React from 'react';

import Role from '../../core/Role';

import $client from '../../net/Client';
import RoleIcon from './RoleIcon';
const net = $client.API;

// Pure new user. Add input and buttons.
const ERROR_MESSAGE = {
	ROOM_EXPIRED: '房间不存在，可能已过期。',
	INVALID_SEAT: '座位号错误，请重新输入。',
	SEAT_TAKEN: '该座位已使用，请重新输入。',
	ROOM_FULL: '房间人数已满。'
};

class RoleViewer extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			visible: true,
			role: null,
			cards: []
		};

		let config = props.config;
		this.roomId = config.id;

		let session = config.readSession();
		if (session) {
			if (session.ownerKey) {
				this.state.visible = false;
			} else {
				if (session.role) {
					this.state.role = Role.fromNum(session.role);
				}
				if (session.cards && session.cards instanceof Array) {
					this.state.cards = session.cards.map(card => Role.fromNum(card));
				}
			}
		}

		this.fetchCard = this.fetchCard.bind(this);
		this.handleSeatInput = this.handleSeatInput.bind(this);
	}

	showMessage(message) {
		this.message.innerHTML = message;
	}

	fetchCard() {
		this.showMessage('你的身份是...');
		$client.request(net.FetchRole, {id: this.roomId, seat: this.seat}, result => {
			if (result.error) {
				result = ERROR_MESSAGE[result.error] ? ERROR_MESSAGE[result.error] : result.error;
				this.showMessage(result);
				return;
			}

			let role = Role.fromNum(result.role);
			let cards = [];
			if (result.cards && result.cards instanceof Array) {
				cards = result.cards.map(card => Role.fromNum(card));
			}

			this.setState({
				role: role,
				cards: cards
			});

			let config = this.props.config;
			config.writeSession({
				role: role.toNum(),
				cards: cards.map(card => card.toNum())
			});
		});
	}

	handleSeatInput(e) {
		this.seat = e.target.value;
	}

	renderCard() {
		if (!this.state.role) {
			return <div className="role-area button-area">
				<input type="number" placeholder="座位号" onChange={this.handleSeatInput} />
				<button type="button" onClick={this.fetchCard}>查看身份</button>
				<div className="inline-message" ref={message => {this.message = message;}}></div>
			</div>;
		}

		let role = this.state.role;
		let cards = this.state.cards;

		if (cards.length <= 0) {
			return <div className="role-area">
				<div className="name">{role.name}</div>
				<RoleIcon role={role} />
			</div>;
		} else {
			let key = 0;
			let extra_list = cards.map(role => {
				return <li key={key++}>
					<RoleIcon role={role} />
					<span className="name">{role.name}</span>
				</li>;
			});

			return <div className="role-area">
				<div className="name">{role.name}</div>
				<RoleIcon role={role} />
				<ul className="role-list extra-cards">
					{extra_list}
				</ul>
			</div>;
		}
	}

	render() {
		if (!this.state.visible) {
			return null;
		}

		return <div className="box">
			<h3>你的身份</h3>
			{this.renderCard()}
		</div>;
	}

}

export default RoleViewer;