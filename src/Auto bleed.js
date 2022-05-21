import { loadconfig, convertFloat } from './modules/utils'
import ActionButtons from './modules/actionButtons'

const DEFAULT = loadconfig(NAME, {
	bleed: 3,
	spine: '',
	addBleed: false,
});

(function () {
	// 入力窓
	const dialog = new Window('dialog', '断ち切りガイド', undefined)

	const labelWidth = 48

	const inputBleed = dialog.add("Group{\
		label:StaticText{text:'断ち切り',justify:'right'},\
		edit:EditText{text:'" + DEFAULT.bleed + "',characters:15,justify:'right'},\
		unit:StaticText{text:'mm'}\
	}")
	inputBleed.label.preferredSize.width = labelWidth

	const inputSpine = dialog.add("Group{\
		label:StaticText{text:'背幅',justify:'right'},\
		edit:EditText{text:'',characters:15,justify:'right'},\
		unit:StaticText{text:'mm'}\
	}")
	inputSpine.label.preferredSize.width = labelWidth

	const inputAddBleed = dialog.add('checkbox', undefined, '断ち切り追加')
	inputAddBleed.value = DEFAULT.addBleed

	new ActionButtons(dialog)

	const ret = dialog.show()

	// キャンセル
	if (ret != 1) {
		return
	}

	const bleed = convertFloat(inputBleed.edit.text, 0, true),
		spine = inputSpine.edit.text === '' ? -1 : convertFloat(inputSpine.edit.text, 0),
		addBleed = inputAddBleed.value

	const unitCache = preferences.rulerUnits

	// 単位を mm に変更
	preferences.rulerUnits = Units.MM

	if (addBleed) {
		activeDocument.resizeCanvas(
			activeDocument.width + bleed * 2,
			activeDocument.height + bleed * 2,
			AnchorPosition.MIDDLECENTER
		)
	}

	const width = parseFloat(activeDocument.width),
		height = parseFloat(activeDocument.height)

	// 断ち切りガイド
	if (bleed) {
		activeDocument.guides.add(Direction.VERTICAL, bleed)
		activeDocument.guides.add(Direction.VERTICAL, width - bleed)

		activeDocument.guides.add(Direction.HORIZONTAL, bleed)
		activeDocument.guides.add(Direction.HORIZONTAL, height - bleed)
	}

	// 背幅ガイド
	if (spine > -1) {
		const spineLeft = (width - spine) / 2
		activeDocument.guides.add(Direction.VERTICAL, spineLeft)
		if (spine > 0) {
			activeDocument.guides.add(Direction.VERTICAL, spineLeft + spine)
		}
	}

	// 単位を元の設定に戻す
	preferences.rulerUnits = unitCache
})()