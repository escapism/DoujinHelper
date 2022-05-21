// 設定読み込み
function loadconfig(name, def) {
	const scriptFile = new File($.fileName)
	const configFile = new File(scriptFile.parent + '/DOUJINHELPER.conf')

	if (configFile.exists) {
		$.evalFile(configFile)
	}

	if (typeof CONFIG !== 'undefined' && CONFIG[name]) {
		const obj = {}

		for (let i in def) {
			obj[i] = i in CONFIG[name] ? CONFIG[name][i] : def[i]
		}
		return obj
	}
	return def
}

// string to int
function convertInt(text, def = 0, abs = true) {
	text = full2half(text)
	let num = parseInt(text, 10)

	if (isNaN(num)) {
		num = def
	} else if (abs) {
		num = Math.abs(num)
	}
	return num
}

// string to float
function convertFloat(text, def = 0, abs = true) {
	text = full2half(text)
	let num = parseFloat(text)

	if (isNaN(num)) {
		num = def
	} else if (abs) {
		num = Math.abs(num)
	}
	return num
}

// 全角数字を半角数字に変換
function full2half(str) {
	if (typeof str !== 'string') return str
	return str.replace(/[０-９]/g, s =>String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
}

// 透明部分から選択範囲を読み込むアクション
function selectionByTransparent() {
	const idc = stringIDToTypeID('channel')
	const ref1 = new ActionReference()
	ref1.putProperty(
		idc,
		stringIDToTypeID('selection')
	)

	const desc = new ActionDescriptor()
	desc.putReference(
		stringIDToTypeID('null'),
		ref1
	)

	const ref2 = new ActionReference()
	ref2.putEnumerated(idc, idc, stringIDToTypeID('transparencyEnum'))
	desc.putReference(
		stringIDToTypeID('to'),
		ref2
	)
	executeAction(
		stringIDToTypeID('set'),
		desc
	)
}

// prototype拡張
// 配列の項目を整数値に変換して重複を削除
const pxArrayUnique = (() => {
	Array.prototype.unique = function () {
		const copy = this.splice(0).sort((a, b) => a - b)
	
		for (let i = 0; i < copy.length; i++) {
			copy[i] = parseInt(copy[i], 10)
			if (isNaN(copy[i])) {
				continue
			}
			if (!i || copy[i] != copy[i - 1]) {
				this.push(copy[i])
			}
		}
		return this
	}
})();

export {loadconfig, convertInt, convertFloat, selectionByTransparent, pxArrayUnique}