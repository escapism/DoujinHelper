class FontSelector {
	constructor(dialog, size = {}, defaultFont = '', defaultStyle = '') {
		this.dialog = dialog

		this.group = dialog.add('group')

		size.width = size.width || 280
		size.height = size.height || 24

		this.group.alignChildren = 'fill'
		this.group.preferredSize = size

		let styleWidth = Math.round((size.width - 10) * .32)
		if (styleWidth > 80) styleWidth = 80
		const familyWidth = size.width - styleWidth - this.group.spacing

		this.currentFont = null;
		this.fontList = this.group.add("dropdownlist", undefined, FontSelector.items)
		this.styleList = this.group.add("dropdownlist", undefined, [])
		this.fontList.preferredSize.width = familyWidth
		this.styleList.preferredSize.width = styleWidth

		this.fontList.onChange = () => {
			this.setStyleList()
		}
		this.styleList.onChange = () => {
			this.setCurrentFont()
		}

		let def = -1, def2 = -1
		if (defaultFont) {
			for (let i = 0; i < FontSelector.items.length; i++) {
				if (FontSelector.items[i] === defaultFont) {
					def = i;
					break;
				}
			}
			if (def >= 0 && defaultStyle) {
				const style = FontSelector.fontSet[def].style
				for (i = 0; i < style.length; i++) {
					if (style[i] === defaultStyle) {
						def2 = i;
						break;
					}
				}
			}
		}
		this.fontList.selection = def < 0 ? 0: def
		if (def2 >= 0) {
			this.styleList.selection = def2;
		}
	}
	setStyleList() {
		const index = this.fontList.selection.index;

		if (FontSelector.fontSet[index]) {
			const currentFontStyle = FontSelector.fontSet[index].style
			let def = currentFontStyle.length > 1 ? -1 : 0

			this.styleList.removeAll()
			for (let i = 0; i < currentFontStyle.length; i++) {
				this.styleList.add('item', currentFontStyle[i])

				if (def < 0) {
					const style = currentFontStyle[i].toLowerCase()
					if (style === 'regular' ||
						style === 'r' ||
						style === 'r-kl' ||
						style === 'w3' ||
						style === 'medium' ||
						style === 'm' ||
						style === 'm-kl') {
						def = i
					}
				}
			}
			this.styleList.selection = def < 0 ? 0 : def
		}
	}
	setCurrentFont() {
		const selected = this.fontList.selection.index
		const fontIndex = FontSelector.fontSet[selected].index + this.styleList.selection.index;

		this.currentFont = app.fonts[fontIndex]
	}
	getPostScriptName() {
		return this.currentFont.postScriptName
	}
	static fontSet = []
	static items = (() => {
		const items = []
		let fontFamily = '',
			counter = -1

		for (let i = 0; i < app.fonts.length; i++) {
			if (app.fonts[i].family !== fontFamily) {
				counter++
				fontFamily = app.fonts[i].family

				items.push(fontFamily)
				FontSelector.fontSet.push({
					index: i,
					family: fontFamily,
					style: [app.fonts[i].style]
				})
			} else {
				FontSelector.fontSet[counter].style.push(app.fonts[i].style)
			}
		}
		return items
	})()
}

export default FontSelector