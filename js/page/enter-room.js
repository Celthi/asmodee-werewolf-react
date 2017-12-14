
DeclareModule('page/enter-room', () => {
	ShowMessage('');

	function ReadSession() {
		let sessions = localStorage.getItem('room-session');
		if (sessions) {
			try {
				sessions = JSON.parse(sessions);
			} catch (e) {
				alert(e.toString());
				sessions = {};
			}
			sessions = sessions;
		} else {
			sessions = {};
		}
		return sessions;
	}

	function FetchRole() {
		let sessions = ReadSession();

		// Find current session
		if (sessions[$room.salt]) {
			let session = sessions[$room.salt];
			if (session.expiry >= new Date().getTime()) {
				$user.role = session.role;
				$('#my-role').trigger('update-role');
				return true;
			}
		}

		return false;
	}

	function SaveRole() {
		let sessions = ReadSession();

		// Clear expired sessions
		let now = new Date().getTime();
		for (let salt in sessions) {
			let session = sessions[salt];
			if (!session.expiry || session.expiry <= now) {
				delete sessions[salt];
			}
		}

		sessions[$room.salt] = {
			role: $user.role,
			expiry: new Date().getTime() + 30 * 60 * 1000
		};
		localStorage.setItem('room-session', JSON.stringify(sessions));
	}

	let root = $('#root');
	root.html('');

	let room_info = $('<div class="inline-message"></div>');
	room_info.html(`房间号 ${$room.id}`);
	root.append(room_info);

	function create_icon(role_id){
		let li = $('<li></li>');
		li.data('role-id', role_id);
		let icon = Role.createImage(role_id);
		li.append(icon);
		let name = $('<span class="name"></span>');
		name.text(Role.convertToName(role_id));
		li.append(name);
		return li;
	}

	let werewolf_roles = [
		Role.WolfKing,
		Role.WhiteWolfKing,
		Role.WolfBeauty,
		Role.SecretWolf
	];

	let role_table = $('<div class="role-table"></div>');

	let werewolf_team = $('<div class="box"><h3>狼人阵营</h3></div>');
	let werewolf_list = $('<ul class="role-list"></ul>');
	werewolf_team.append(werewolf_list);
	let special_werewolf_list = $('<ul class="role-list"></ul>');
	werewolf_team.append(special_werewolf_list);
	role_table.append(werewolf_team);

	let villager_team = $('<div class="box"><h3>神民阵营</h3></div>');
	let villager_list = $('<ul class="role-list"></ul>');
	villager_team.append(villager_list);
	let god_list = $('<ul class="role-list"></ul>');
	villager_team.append(god_list);
	role_table.append(villager_team);

	root.append(role_table);

	let update_roles = () => {
		let werewolves = [];
		let special_werewolves = [];
		let villagers = [];
		let gods = [];
		$room.roles.forEach(role => {
			if (role == Role.Werewolf) {
				werewolves.push(role);
			} else if (role == Role.Villager) {
				villagers.push(role);
			} else if (werewolf_roles.indexOf(role) != -1) {
				special_werewolves.push(role);
			} else {
				gods.push(role);
			}
		});

		werewolf_list.html('');
		werewolves.forEach(role => {
			werewolf_list.append(create_icon(role));
		});

		special_werewolf_list.html('');
		if (werewolves.length < 4 && special_werewolves.length < 4) {
			special_werewolves.forEach(role => {
				werewolf_list.append(create_icon(role));
			});
		} else {
			special_werewolves.forEach(role => {
				special_werewolf_list.append(create_icon(role));
			});
		}

		villager_list.html('');
		villagers.forEach(role => {
			villager_list.append(create_icon(role));
		});

		god_list.html('');
		if (villager_list.length < 4 && gods.length < 4) {
			gods.forEach(role => {
				villager_list.append(create_icon(role));
			});
		} else {
			gods.forEach(role => {
				god_list.append(create_icon(role));
			});
		}
	};
	role_table.on('update-role', update_roles);
	update_roles();

	if ($room.owner.id != $user.id) {
		let my_role_box = $('<div class="box"><h3>你的身份</h3></div>');
		let my_role = $('<div id="my-role" class="role-area"></div>');
		my_role_box.append(my_role);
		root.append(my_role_box);

		my_role.on('update-role', () => {
			if ($user.role) {
				let name = Role.convertToName($user.role);
				let name_box = `<div class="name">${name}</div>`;
				my_role.html(name_box + Role.createImage($user.role));
				SaveRole();
			} else {
				my_role.html('该房间人数已满。');
			}
		});

		if (!FetchRole()) {
			let role_area = $('<div class="button-area"></div>');
			let fetch_role_button = $('<button type="button"></button>');
			fetch_role_button.html('查看身份');
			fetch_role_button.click(() => {
				my_role.html('你的身份是...');
				$client.request(net.FetchRole);
			});
			role_area.append(fetch_role_button);
			my_role.append(role_area);
		}
	}

	let current_site_url = () => {
		let match = location.href.match(/^\w+\:\/\/[^/]+\/(?:compat\/)?/i);
		if (match && match[0]) {
			return match[0];
		} else {
			return '';
		}
	};

	let share_link_area = $('<div class="box share-link-area"></div>');
	let share_label = $('<span class="label"></span>');
	share_label.html('邀请链接');
	share_link_area.append(share_label);
	let share_url = current_site_url() + '?room_id=' + $room.id;
	let link_anchor = $('<a target="_blank"></a>');
	let link_input = $('<input type="text">');
	link_input.prop('readonly', true);
	link_input.val(share_url);
	link_anchor.prop('href', share_url);
	link_anchor.append(link_input);
	share_link_area.append(link_anchor);
	root.append(share_link_area);

	link_input.mouseup(e => {
		e.preventDefault();
		link_input.prop('contentEditable', true);
		link_input.prop('readonly', false);
		link_input.focus();
		link_input.select();
		let range = document.createRange();
		range.selectNodeContents(link_input.get(0));
		let selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		link_input.get(0).setSelectionRange(0, link_input.val().length);
		let result = document.execCommand('copy');
		link_input.prop('readonly', true);
		if (result) {
			MakeToast('成功复制该链接。');
		} else {
			MakeToast('复制失败。请手动长按该链接，然后分享给好友。');
		}
	});

	link_anchor.click(e => {
		e.preventDefault();
	});

	let button_area = $('<div class="button-area"></div>');
	let return_button = $('<button type="button"></button>');
	return_button.html('返回');
	button_area.append(return_button);
	root.append(button_area);

	return_button.click(() => {
		button_area.html('加载中...');
		if ($client.connected) {
			LoadPage('enter-lobby');
		} else {
			LoadPage('login');
		}
	});
});
