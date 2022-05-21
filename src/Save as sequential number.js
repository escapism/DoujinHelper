import { loadconfig, convertInt, pxArrayUnique } from './modules/utils'
import ActionButtons from "./modules/actionButtons"

/** デフォルト設定 */
const DEFAULT = loadconfig(NAME, {
	initNum: 3,
	digits: 0,
	prefix: '',
	flatten: false,
	autoClose: true,
	enableAlert: true,
})

DEFAULT.digits = convertInt(DEFAULT.digits, 0);

(function () {
	const docNum = documents.length
	if (!docNum) return

	// 入力窓
	const dialog = new Window('dialog', '連番保存')

	const innerWidth = 280

	const inputNum = dialog.add("Group{\
		label:StaticText{text:'初期値',justify:'right'},\
		edit:EditText{text:'" + DEFAULT.initNum + "'}\
	}")
	inputNum.label.preferredSize.width = 36
	inputNum.edit.preferredSize.width = innerWidth - inputNum.label.preferredSize.width - inputNum.spacing

	const nameGroup = dialog.add('group')
	nameGroup.preferredSize.width = innerWidth

	const inputDigits = nameGroup.add("Group{\
		label:StaticText{text:'桁数',justify:'right'},\
		list:DropDownList{properties:{items:['Auto',1,2,3,4]}}\
	}")
	inputDigits.label.preferredSize.width = 24
	inputDigits.list.preferredSize.width = 60
	inputDigits.list.selection = DEFAULT.digits

	const inputPrefix = nameGroup.add("Group{\
		label:StaticText{text:'接頭辞',justify:'right'}\
		edit:EditText{text:'" + DEFAULT.prefix + "'}\
	}")
	inputPrefix.label.preferredSize.width = 36
	inputPrefix.edit.preferredSize.width = innerWidth - inputDigits.label.preferredSize.width - inputDigits.list.preferredSize.width - inputPrefix.label.preferredSize.width - nameGroup.spacing * 3

	const inputSkipPage = dialog.add("Group{\
		label:StaticText{text:'除外ページ',justify:'right'},\
		edit:EditText{text:''}\
	}")
	inputSkipPage.label.preferredSize.width = 60
	inputSkipPage.edit.preferredSize.width = innerWidth - inputSkipPage.label.preferredSize.width - inputSkipPage.spacing

	const flugGroup = dialog.add("Group{\
		binarization:Checkbox{text:'2値化'},\
		flatten:Checkbox{text:'統合'},\
		close:Checkbox{text:'保存後閉じる'}\
	}")

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
			flugGroup.flatten.value =
			flugGroup2.white.value = true
	} else {
		flugGroup.flatten.value = DEFAULT.flatten
	}

	flugGroup.close.value = DEFAULT.autoClose

	new ActionButtons(dialog)

	const ret = dialog.show()

	// キャンセル
	if (ret != 1) {
		return
	}

	// ディレクトリ選択
	const fObj = Folder.selectDialog('保存するディレクトリを選択')
	if (!fObj) return

	let alertFlag = false,
		docPath
	for (var i = 0; i < docNum; i++) {
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

	const initNum = convertInt(inputNum.edit.text, 1),
		prefix = inputPrefix.edit.text,
		binarization = flugGroup.binarization.value,
		flatten = flugGroup.flatten.value,
		autoClose = flugGroup.close.value,
		enableAlert = DEFAULT.enableAlert

	let digits
	
	if (inputDigits.list.selection === null) {
		digits = 0
	} else {
		digits = inputDigits.list.selection.text === 'Auto' ? 0 : parseInt(inputDigits.list.selection.text, 10)
	}

	if (!digits) {
		const lastNum = initNum + docNum - 1
		digits = lastNum.toString().length
		digits = digits === 1 ? 2 : digits
	}
	const zeropad = Array(digits).join('0')

	const skipPage = inputSkipPage.edit.text.split(/,\s*|\s+/)

	if (skipPage.length) {
		skipPage.unique().reverse()
	}

	let pageNum = initNum; // 現在のページ番号

	for (let i = 0; i < docNum; i++) {
		activeDocument = documents[autoClose ? 0 : i]

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

		let fileName = pageNum.toString(10)
		if (fileName.length < digits) {
			fileName = (zeropad + fileName).slice(-digits)
		}
		fileName = prefix + fileName

		// sanitize
		if (/^windows/i.test($.os)) {
			fileName = fileName.replace(/[\\\/:*?"<>|]/g, '')
		} else {
			fileName = fileName.replace(/\//g, '')
		}

		if (binarization && activeDocument.mode !== DocumentMode.BITMAP) {
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

		const fileobj = new File(`${fObj.fullName}/${fileName}`)
		activeDocument.saveAs(fileobj)
		if (autoClose) {
			activeDocument.close(SaveOptions.SAVECHANGES)
		}
		pageNum++
	}

	if (enableAlert) alert('すべての処理が完了しました。')
})()