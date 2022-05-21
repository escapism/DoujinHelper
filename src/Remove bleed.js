import { loadconfig, convertFloat } from './modules/utils'
import ActionButtons from "./modules/actionButtons"

const DEFAULT = loadconfig(NAME, {
	bleed: 3
});

(function () {
	// 入力窓
	const dialog = new Window('dialog', '断ち切り削除')

	const inputBleed = dialog.add("Group{\
		label:StaticText{text:'断ち切り',justify:'right'},\
		edit:EditText{text:'" + DEFAULT.bleed + "',characters:15,justify:'right'},\
		unit:StaticText{text:'mm'}\
	}")

	new ActionButtons(dialog)

	const ret = dialog.show()

	// キャンセル
	if (ret != 1) {
		return
	}

	bleed = convertFloat(inputBleed.edit.text, 0, false)

	const unitCache = preferences.rulerUnits

	// 単位を mm に変更
	preferences.rulerUnits = Units.MM

	const width = activeDocument.width,
		height = activeDocument.height

	activeDocument.resizeCanvas(width - bleed * 2, height - bleed * 2, AnchorPosition.MIDDLECENTER)

	// 単位を元の設定に戻す
	preferences.rulerUnits = unitCache
})()