
import React from 'react';

import Role from '../../../game/Role';

import './index.scss';

class RoleIcon extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		let style = {};
		if (this.props.role && this.props.role != Role.Unknown) {
			let key = this.props.role.key.toLowerCase();
			style.backgroundImage = `url(style/role/${key}.jpg)`;
		}
		return <div className="role" style={style}></div>;
	}
}

export default RoleIcon;
