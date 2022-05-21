import { convertFloat } from './utils'

class FolioCoords {
	constructor(parent, type = 'vertical', mode = 1, value = 5) {
		this.parent = parent;
		this.group = this.parent.add("Group{\
			rb0:RadioButton{text:''},\
			rb1:RadioButton{text:''},\
			rb2:RadioButton{text:'中央'},\
			edit:EditText{justify:'right'},\
			unit:StaticText{text:'mm',justify:'left'}\
		}")

		this.mode = Math.min(Math.abs(mode), 2)

		this.rb0 = this.group.rb0
		this.rb1 = this.group.rb1
		this.rb2 = this.group.rb2
		this.edit = this.group.edit

		if (type === 'horizontal') {
			this.rb0.text = 'ノド'
			this.rb1.text = '小口'
		} else {
			this.rb0.text = '天'
			this.rb1.text = '地'
		}
		this.rb0.preferredSize.width = 52
		this.rb1.preferredSize.width = 52
		this.edit.preferredSize.width = 64

		this['rb' + this.mode].value = true
		this.edit.text = value

		const _this = this
		this.rb0.onClick = function() {
			_this.change(this)
		}
		this.rb1.onClick = function() {
			_this.change(this)
		}
		this.rb2.onClick = function() {
			_this.change(this)
		}
	}
	change(btn) {
		this.mode = FolioCoords.modeList[btn.text]

		if (btn.text === '中央') {
			this.edit.enabled = false
		} else {
			this.edit.enabled = true
		}
	}
	getValue() {
		return this.edit.enabled ? convertFloat(this.edit.text, 0) : null
	}
	static HEAD = 0
	static FOOT = 1
	static GUTTER = 0
	static FORE = 1
	static CENTER = 2
	static modeList = {
		'天': FolioCoords.HEAD,
		'地': FolioCoords.FOOT,
		'ノド': FolioCoords.GUTTER,
		'小口': FolioCoords.FORE,
		'中央': FolioCoords.CENTER
	}
}

export default FolioCoords