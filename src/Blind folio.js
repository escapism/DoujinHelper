import { loadconfig, convertInt, convertFloat, selectionByTransparent, pxArrayUnique } from './modules/utils'
import FontSelector from "./modules/fontSelector"
import ActionButtons from "./modules/actionButtons"

/** デフォルト設定 */
const DEFAULT = loadconfig(NAME, {
	fontsize: 6,
	fontfamily: 'Verdana',
	initNum: 3,
	bleed: 3,
	flatten: false,
	bind: 'right',
	autoSave: false,
	enableAlert: true,
});

(function () {
	const docNum = documents.length
	if (!docNum) return

	// 入力窓
	const dialog = new Window('dialog', '隠しノンブル')

	const innerWidth = 280, labelWidth = 48

	const fs = new FontSelector(dialog, { width: innerWidth }, DEFAULT.fontfamily)
	const inputNum = dialog.add("Group{\
		label:StaticText{text:'初期値',justify:'right'},\
		edit:EditText{text:'" + DEFAULT.initNum + "'}\
	}")
	inputNum.preferredSize.width = innerWidth
	inputNum.label.preferredSize.width = labelWidth
	inputNum.edit.preferredSize.width = innerWidth - labelWidth - inputNum.spacing

	const inputBleed = dialog.add("Group{\
		label:StaticText{text:'断ち切り',justify:'right'},\
		edit:EditText{text:'" + DEFAULT.bleed + "'}\
		unit:StaticText{text:'mm',justify:'left'}\
	}")
	inputBleed.preferredSize.width = innerWidth
	inputBleed.label.preferredSize.width = labelWidth
	inputBleed.edit.preferredSize.width = 180

	const inputSkipPage = dialog.add("Group{\
		label:StaticText{text:'除外ページ',justify:'right'},\
		edit:EditText{text:''}\
	}")
	inputSkipPage.preferredSize.width = innerWidth
	inputSkipPage.label.preferredSize.width = 60
	inputSkipPage.edit.preferredSize.width = innerWidth - inputSkipPage.label.preferredSize.width - inputSkipPage.spacing * 2

	const flugGroup = dialog.add("Group{\
		binarization:Checkbox{text:'2値化'},\
		flatten:Checkbox{text:'統合'},\
		bindR:RadioButton{text:'右綴じ'},\
		bindL:RadioButton{text:'左綴じ'}\
	}")
	if (DEFAULT.bind.toLowerCase() === 'left') {
		flugGroup.bindL.value = true
	} else {
		flugGroup.bindR.value = true
	}

	flugGroup.binarization.onClick = function (e) {
		if (flugGroup.binarization.value) {
			flugGroup.flatten.value = true
		}
	}
	flugGroup.flatten.onClick = function (e) {
		if (!flugGroup.flatten.value) {
			flugGroup.binarization.value = false
		}
	}

	if (activeDocument.mode === DocumentMode.BITMAP) {
		// 2値のときtrue
		flugGroup.binarization.value =
			flugGroup.flatten.value = true
	} else {
		flugGroup.flatten.value = DEFAULT.flatten
	}

	const inputSave = dialog.add('checkbox', undefined, '保存して閉じる')
	inputSave.value = DEFAULT.autoSave

	new ActionButtons(dialog)

	const ret = dialog.show()

	// キャンセル
	if (ret != 1) {
		return
	}

	const autoSave = inputSave.value

	// ディレクトリ選択
	let fObj;
	if (autoSave) {
		fObj = Folder.selectDialog('保存するディレクトリを選択')
		if (!fObj) return

		let alertFlag = false,
			docPath
		for (let i = 0; i < docNum; i++) {
			try {
				docPath = documents[i].path
			} catch (e) {
				docPath = false
			}
			if (docPath && docPath.fullName == fObj.fullName) {
				alertFlag = true
				break
			}
		}

		if (alertFlag) {
			const conf = Window.confirm('同一のディレクトリに保存されているファイルがあります。このまま実行してよろしいですか？', false, '警告')
			if (!conf) return
		}
	}

	const selectedFont = fs.getPostScriptName(),
		fontsize = DEFAULT.fontsize,
		color = new SolidColor()

	if (activeDocument.mode === DocumentMode.RGB) {
		color.rgb.red = 0
		color.rgb.green = 0
		color.rgb.blue = 0
	} else {
		color.cmyk.cyan = 0
		color.cmyk.magenta = 0
		color.cmyk.yellow = 0
		color.cmyk.black = 100
	}

	const initNum = convertInt(inputNum.edit.text, 3),
		bleed = convertFloat(inputBleed.edit.text, 0),
		binarization = flugGroup.binarization.value,
		flatten = flugGroup.flatten.value,
		bindRight = flugGroup.bindR.value,
		enableAlert = DEFAULT.enableAlert

	const skipPage = inputSkipPage.edit.text.split(/,\s*|\s+/)

	if (skipPage.length) {
		skipPage.unique().reverse()
	}

	const gutterDistance = bleed + .3

	const unitCache = {
		ruler: preferences.rulerUnits,
		type: preferences.typeUnits
	}

	// 単位を mm, pt に変更
	preferences.rulerUnits = Units.MM
	preferences.typeUnits = TypeUnits.POINTS

	let pageNum = initNum; // 現在のページ番号

	for (let i = 0; i < docNum; i++) {
		activeDocument = documents[autoSave ? 0 : i]

		if (activeDocument.mode === DocumentMode.BITMAP) {
			activeDocument.changeMode(ChangeMode.GRAYSCALE)
		}

		const doc = activeDocument

		const docWidth = parseFloat(doc.width),
			docHeight = parseFloat(doc.height)

		if (skipPage.length) {
			for (let j = skipPage.length + 1; j >= 0; j--) {
				if (skipPage[j] == pageNum) {
					skipPage.splice(j, 1)
					pageNum++
				} else if (skipPage[j] < pageNum) {
					skipPage.splice(j, 1)
				} else {
					break
				}
			}
		}

		const layer = doc.artLayers.add()
		layer.kind = LayerKind.TEXT
		layer.textItem.contents = '0'
		layer.textItem.size = fontsize + 'pt'
		layer.textItem.font = selectedFont
		layer.textItem.color = color
		layer.textItem.useAutoLeading = false
		layer.textItem.leading = fontsize + 'pt'
		layer.textItem.justification = Justification.CENTER

		if (binarization ||
			activeDocument.mode === DocumentMode.GRAYSCALE ||
			activeDocument.mode === DocumentMode.BITMAP) {
			layer.textItem.antiAliasMethod = AntiAlias.NONE
		} else {
			layer.textItem.antiAliasMethod = AntiAlias.SHARP
		}

		let text = pageNum.toString(10)
		if (text.length > 1) {
			let _text = text[0]
			for (let j = 1, m = text.length; j < m; j++) {
				_text += '\r' + text[j]
			}
			text = _text
		}

		layer.textItem.contents = text

		const lb = layer.bounds

		let x, y = docHeight - 8 - parseFloat(lb[3])
		const odd = pageNum % 2

		if (bindRight == odd) {
			// 右綴じ奇数ページ or 左綴じ偶数ページ
			x = docWidth - gutterDistance - parseFloat(lb[2])
		} else {
			// 右綴じ偶数ページ or 左綴じ奇数ページ
			x = gutterDistance - parseFloat(lb[0])
		}
		layer.translate(x, y)

		activeDocument.activeLayer = layer

		// 白く縁取り
		const uv = UnitValue(0.3, 'mm')
		uv.baseUnit = UnitValue(1 / activeDocument.resolution, 'in')

		selectionByTransparent()
		activeDocument.selection.expand(uv.as('px'))

		const backLayer = activeDocument.artLayers.add()
		backLayer.move(layer, ElementPlacement.PLACEAFTER)

		const white = new SolidColor()
		white.rgb.red = 255
		white.rgb, green = 255
		white.rgb, blue = 255

		activeDocument.selection.fill(white)
		activeDocument.selection.deselect()

		// 2値化
		if (binarization) {
			if (activeDocument.mode !== DocumentMode.GRAYSCALE) {
				activeDocument.changeMode(ChangeMode.GRAYSCALE)
			}

			const opt = new BitmapConversionOptions()
			opt.method = BitmapConversionType.HALFTHRESHOLD
			opt.resolution = activeDocument.resolution
			activeDocument.changeMode(ChangeMode.BITMAP, opt)
		}
		// レイヤーを統合
		else if (flatten) {
			activeDocument.flatten()
		}

		// 別名で保存して閉じる
		if (autoSave) {
			const fileobj = new File(`${fObj.fullName}/${activeDocument.name}`)
			activeDocument.saveAs(fileobj)
			activeDocument.close(SaveOptions.SAVECHANGES)
		}
		pageNum++
	}

	// 単位を元の設定に戻す
	preferences.rulerUnits = unitCache.ruler
	preferences.typeUnits = unitCache.type

	if (enableAlert) alert('すべての処理が完了しました。')
})()