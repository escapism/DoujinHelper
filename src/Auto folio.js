import { loadconfig, convertInt, convertFloat, selectionByTransparent, pxArrayUnique } from './modules/utils'
import FontSelector from "./modules/fontSelector"
import ActionButtons from "./modules/actionButtons"
import ColorPickerButton from "./modules/colorPickerButton"
import FolioCoords from "./modules/folioCoords"

/** デフォルト設定 */
const DEFAULT = loadconfig(NAME, {
	fontsize: 9,
	fontfamily: 'Verdana',
	fontstyle: 'Regular',
	colorCMYK: [0, 0, 0, 100],
	colorRGB: [0, 0, 0],
	initNum: 5,
	bleed: 3,
	verticalMode: FolioCoords.FOOT,
	verticalSpace: 5,
	horizontalMode: FolioCoords.FORE,
	horizontalSpace: 5,
	digits: 1,
	flatten: false,
	bind: 'right',
	autoSave: false,
	enableAlert: true,
});

if (typeof DEFAULT.verticalMode === 'string') {
	DEFAULT.verticalMode = FolioCoords[DEFAULT.verticalMode.toUpperCase()] || 1
}

if (typeof DEFAULT.horizontalMode === 'string') {
	DEFAULT.horizontalMode = FolioCoords[DEFAULT.horizontalMode.toUpperCase()] || 1
}

(function () {
	var docNum = documents.length
	if (!docNum) return

	// 入力窓
	var dialog = new Window('dialog', '自動ノンブル')

	const innerWidth = 320

	const fs = new FontSelector(dialog, { width: innerWidth }, DEFAULT.fontfamily, DEFAULT.fontstyle)

	const fontSetting = dialog.add("Group{\
		fontsize:Group{\
			label:StaticText{text:'フォントサイズ'},\
			edit:EditText{text:'" + DEFAULT.fontsize + "',justify:'right',characters:4},\
			unit:StaticText{text:'pt'}\
		},\
		color:Group{\
			label:StaticText{text:'カラー'}\
		}\
	}")
	const defaultColor = activeDocument.mode === DocumentMode.RGB ? DEFAULT.colorRGB : DEFAULT.colorCMYK
	const fontColor = new ColorPickerButton(fontSetting.color, undefined, defaultColor)

	const numGroup = dialog.add('group')
	numGroup.preferredSize.width = innerWidth
	const inputNum = numGroup.add("Group{\
		label:StaticText{text:'初期値',justify:'right'},\
		edit:EditText{text:'" + DEFAULT.initNum + "'}\
	}")
	inputNum.preferredSize.width = 220
	inputNum.label.preferredSize.width = 48
	inputNum.edit.preferredSize.width = inputNum.preferredSize.width - inputNum.label.preferredSize.width - inputNum.spacing

	const inputDigits = numGroup.add("Group{\
		label:StaticText{text:'桁数',justify:'right'},\
		list:DropDownList{properties:{items:[1,2,3,4]}}\
	}")
	inputDigits.preferredSize.width = innerWidth - inputNum.preferredSize.width - numGroup.spacing
	inputDigits.label.preferredSize.width = 24
	inputDigits.list.preferredSize.width = inputDigits.preferredSize.width - inputDigits.label.preferredSize.width - inputDigits.spacing
	inputDigits.list.selection = DEFAULT.digits - 1

	const inputBleed = dialog.add("Group{\
		label:StaticText{text:'断ち切り',justify:'right'},\
		edit:EditText{text:'" + DEFAULT.bleed + "',justify:'right'}\
		unit:StaticText{text:'mm',justify:'left'}\
	}")
	inputBleed.preferredSize.width = innerWidth
	inputBleed.label.preferredSize.width = 48
	inputBleed.edit.preferredSize.width = 225

	const inputVertical = new FolioCoords(dialog, 'vertical', DEFAULT.verticalMode, DEFAULT.verticalSpace)
	const inputHorizontal = new FolioCoords(dialog, 'horizontal', DEFAULT.horizontalMode, DEFAULT.horizontalSpace)

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

	flugGroup.binarization.onClick = function () {
		if (flugGroup.binarization.value) {
			flugGroup.flatten.value = true
		}
	}
	flugGroup.flatten.onClick = function () {
		if (!flugGroup.flatten.value) {
			flugGroup.binarization.value = false
		}
	}

	const flugGroup2 = dialog.add("Group{\
		white:Checkbox{text:'白フチ'},\
		save:Checkbox{text:'保存して閉じる'}\
	}")
	const inputSave = flugGroup2.save
	inputSave.value = DEFAULT.autoSave

	if (activeDocument.mode === DocumentMode.BITMAP) {
		// 2値のときtrue
		flugGroup.binarization.value =
			flugGroup.flatten.value =
			flugGroup2.white.value = true
	} else {
		flugGroup.flatten.value = DEFAULT.flatten
	}

	new ActionButtons(dialog)

	const ret = dialog.show()

	// キャンセル
	if (ret != 1) {
		return
	}

	const autoSave = inputSave.value

	// ディレクトリ選択
	let fObj
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
		fontsize = convertFloat(fontSetting.fontsize.edit.text, DEFAULT.fontsize),
		color = fontColor.getColor()

	const initNum = convertInt(inputNum.edit.text, 3),
		bleed = convertFloat(inputBleed.edit.text, 0),
		binarization = flugGroup.binarization.value,
		flatten = flugGroup.flatten.value,
		bindRight = flugGroup.bindR.value,
		verticalMode = inputVertical.mode,
		verticalSpace = inputVertical.getValue() + bleed,
		horizontalMode = inputHorizontal.mode,
		horizontalSpace = inputHorizontal.getValue() + bleed,
		whiteBorder = flugGroup2.white.value,
		digits = inputDigits.list.selection === null ? 1 : parseInt(inputDigits.list.selection.text, 10),
		enableAlert = DEFAULT.enableAlert

	const zeropad = Array(digits).join('0')

	const skipPage = inputSkipPage.edit.text.split(/,\s*|\s+/)

	if (skipPage.length) {
		skipPage.unique().reverse()
	}

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
		layer.textItem.size = fontsize
		layer.textItem.font = selectedFont
		layer.textItem.color = color
		layer.textItem.useAutoLeading = false
		layer.textItem.leading = fontsize
		layer.textItem.justification = Justification.CENTER
		
		if (binarization ||
			activeDocument.mode === DocumentMode.GRAYSCALE ||
			activeDocument.mode === DocumentMode.BITMAP) {
			layer.textItem.antiAliasMethod = AntiAlias.NONE
		} else {
			layer.textItem.antiAliasMethod = AntiAlias.SHARP
		}
		
		let folio = pageNum.toString(10)
		if (folio.length < digits) {
			folio = (zeropad + folio).slice(-digits)
		}

		layer.textItem.contents = folio

		const lb = layer.bounds,
			lwidth = parseFloat(lb[2] - lb[0]),
			lheight = parseFloat(lb[3] - lb[1])

		const odd = pageNum % 2
		let x, y

		// x座標
		if (horizontalMode === FolioCoords.FORE) {
			// 小口
			if (bindRight == odd) {
				// 右綴じ奇数ページ or 左綴じ偶数ページ
				x = horizontalSpace
			} else {
				// 右綴じ偶数ページ or 左綴じ奇数ページ
				x = docWidth - horizontalSpace - lwidth
			}
		} else if (horizontalMode === FolioCoords.GUTTER) {
			// ノド
			if (bindRight == odd) {
				// 右綴じ奇数ページ or 左綴じ偶数ページ
				x = docWidth - horizontalSpace - lwidth
			} else {
				// 右綴じ偶数ページ or 左綴じ奇数ページ
				x = horizontalSpace
			}
		} else {
			// 中央
			x = (docWidth - lwidth) / 2
		}

		// y座標
		if (verticalMode === FolioCoords.HEAD) {
			// 天
			y = verticalSpace
		} else if (verticalMode === FolioCoords.FOOT) {
			// 地
			y = docHeight - verticalSpace - lheight
		} else {
			// 中央
			y = (docHeight - lheight) / 2
		}

		layer.translate(x - parseFloat(lb[0]), y - parseFloat(lb[1]))

		activeDocument.activeLayer = layer

		// 白く縁取り
		if (whiteBorder) {
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
		}

		// 2値化
		if (binarization) {
			if (activeDocument.mode !== DocumentMode.GRAYSCALE) {
				activeDocument.changeMode(ChangeMode.GRAYSCALE)
			}

			var opt = new BitmapConversionOptions()
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
			const fileobj = new File(fObj.fullName + '/' + activeDocument.name)
			activeDocument.saveAs(fileobj)
			activeDocument.close(SaveOptions.PROMPTTOSAVECHANGES)
		}

		pageNum++
	}

	// 単位を元の設定に戻す
	preferences.rulerUnits = unitCache.ruler
	preferences.typeUnits = unitCache.type

	if (enableAlert) alert('すべての処理が完了しました。')
})()