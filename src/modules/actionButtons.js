class ActionButtons {
	constructor(parent, size = {width: 120, height: 24}, okText = 'OK', cancelText = 'キャンセル') {
		this.parent = parent

		this.group = parent.add('group')
		this.group.orientation = "row"

		// Windows はボタンの位置を逆に
		if (/^windows/i.test($.os)) {
			this.addOK(okText)
			this.addCancel(cancelText)
		} else {
			this.addCancel(cancelText)
			this.addOK(okText)
		}

		this.ok.preferredSize = size
		this.cancel.preferredSize = size
		this.ok.active = true
	}
	addOK(okText) {
		this.ok = this.group.add('button', undefined, okText, {
			name: 'ok',
		})
	}
	addCancel(cancelText) {
		this.cancel = this.group.add('button', undefined, cancelText, {
			name: 'cancel',
		});
	}
}

export default ActionButtons