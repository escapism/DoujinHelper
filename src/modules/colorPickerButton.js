class ColorPickerButton {
	constructor(parent, size = [36, 24], defaultColor) {
		this.parent = parent
		this.button = this.parent.add('button', undefined, '')
		this.button.preferredSize = size

		this.color = new SolidColor()

		if (!defaultColor || defaultColor.length < 3) {
			if (app.activeDocument.mode === DocumentMode.RGB) {
				defaultColor = [0, 0, 0]
			} else {
				defaultColor = [0, 0, 0, 100]
			}
		}

		if (defaultColor.length === 4) {
			this.color.cmyk.cyan = Math.min(Math.max(defaultColor[0], 0), 100)
			this.color.cmyk.magenta = Math.min(Math.max(defaultColor[1], 0), 100)
			this.color.cmyk.yellow = Math.min(Math.max(defaultColor[2], 0), 100)
			this.color.cmyk.black = Math.min(Math.max(defaultColor[3], 0), 100)
		} else {
			this.color.rgb.red = Math.min(Math.max(defaultColor[0], 0), 255)
			this.color.rgb.green = Math.min(Math.max(defaultColor[1], 0), 255)
			this.color.rgb.blue = Math.min(Math.max(defaultColor[2], 0), 255)
		}

		this.cacheColor = app.foregroundColor
		app.foregroundColor = this.color

		this.fillButton()
		this.button.strokePen = this.button.graphics.newPen(
			this.parent.graphics.PenType.SOLID_COLOR,
			[0, 0, 0],
			1
		)

		this.button.onDraw = function () {
			this.graphics.drawOSControl()
			this.graphics.rectPath(0, 0, this.size[0], this.size[1])
			this.graphics.fillPath(this.fillBrush)
			this.graphics.strokePath(this.strokePen)
		}

		this.button.onClick = (function (_this) {
			return function () {
				_this.selectColor()
			}
		})(this)
	}
	selectColor() {
		const res = app.showColorPicker()

		if (res) {
			this.color = app.foregroundColor

			this.fillButton()
			app.foregroundColor = this.cacheColor
		}
	}
	fillButton() {
		this.button.fillBrush = this.button.graphics.newBrush(
			this.parent.graphics.BrushType.SOLID_COLOR,
			[
				this.color.rgb.red / 255,
				this.color.rgb.green / 255,
				this.color.rgb.blue / 255,
			]
		)
	}
	getColor() {
		return this.color
	}
}

export default ColorPickerButton