/*
 * Save as sequential number
 * Version 1.0
 *
 * (c) 2022 uco
 *
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

/*
<javascriptresource>
<name>すべてのドキュメントを連番で保存</name>
<category>doujinhelper</category>
<enableinfo>true</enableinfo>
</javascriptresource>
*/

#target photoshop

var NAME = 'Save as sequential number';

function loadconfig(name, def) {
  var scriptFile = new File($.fileName);
  var configFile = new File(scriptFile.parent + '/DOUJINHELPER.conf');

  if (configFile.exists) {
    $.evalFile(configFile);
  }

  if (typeof CONFIG !== 'undefined' && CONFIG[name]) {
    var obj = {};

    for (var i in def) {
      obj[i] = i in CONFIG[name] ? CONFIG[name][i] : def[i];
    }

    return obj;
  }

  return def;
}

function convertInt(text, def, abs) {
  if (def === void 0) {
    def = 0;
  }

  if (abs === void 0) {
    abs = true;
  }

  text = full2half(text);
  var num = parseInt(text, 10);

  if (isNaN(num)) {
    num = def;
  } else if (abs) {
    num = Math.abs(num);
  }

  return num;
}

function full2half(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
}

(function () {
  Array.prototype.unique = function () {
    var copy = this.splice(0).sort(function (a, b) {
      return a - b;
    });

    for (var i = 0; i < copy.length; i++) {
      copy[i] = parseInt(copy[i], 10);

      if (isNaN(copy[i])) {
        continue;
      }

      if (!i || copy[i] != copy[i - 1]) {
        this.push(copy[i]);
      }
    }

    return this;
  };
})();

var ActionButtons = function () {
  function ActionButtons(parent, size, okText, cancelText) {
    if (size === void 0) {
      size = {
        width: 120,
        height: 24
      };
    }

    if (okText === void 0) {
      okText = 'OK';
    }

    if (cancelText === void 0) {
      cancelText = 'キャンセル';
    }

    this.parent = parent;
    this.group = parent.add('group');
    this.group.orientation = "row";

    if (/^windows/i.test($.os)) {
      this.addOK(okText);
      this.addCancel(cancelText);
    } else {
      this.addCancel(cancelText);
      this.addOK(okText);
    }

    this.ok.preferredSize = size;
    this.cancel.preferredSize = size;
    this.ok.active = true;
  }

  var _proto = ActionButtons.prototype;

  _proto.addOK = function addOK(okText) {
    this.ok = this.group.add('button', undefined, okText, {
      name: 'ok'
    });
  };

  _proto.addCancel = function addCancel(cancelText) {
    this.cancel = this.group.add('button', undefined, cancelText, {
      name: 'cancel'
    });
  };

  return ActionButtons;
}();

var DEFAULT = loadconfig(NAME, {
  initNum: 3,
  digits: 0,
  prefix: '',
  flatten: false,
  autoClose: true,
  enableAlert: true
});
DEFAULT.digits = convertInt(DEFAULT.digits, 0);

(function () {
  var docNum = documents.length;
  if (!docNum) return;
  var dialog = new Window('dialog', '連番保存');
  var innerWidth = 280;
  var inputNum = dialog.add("Group{\
		label:StaticText{text:'初期値',justify:'right'},\
		edit:EditText{text:'" + DEFAULT.initNum + "'}\
	}");
  inputNum.label.preferredSize.width = 36;
  inputNum.edit.preferredSize.width = innerWidth - inputNum.label.preferredSize.width - inputNum.spacing;
  var nameGroup = dialog.add('group');
  nameGroup.preferredSize.width = innerWidth;
  var inputDigits = nameGroup.add("Group{\
		label:StaticText{text:'桁数',justify:'right'},\
		list:DropDownList{properties:{items:['Auto',1,2,3,4]}}\
	}");
  inputDigits.label.preferredSize.width = 24;
  inputDigits.list.preferredSize.width = 60;
  inputDigits.list.selection = DEFAULT.digits;
  var inputPrefix = nameGroup.add("Group{\
		label:StaticText{text:'接頭辞',justify:'right'}\
		edit:EditText{text:'" + DEFAULT.prefix + "'}\
	}");
  inputPrefix.label.preferredSize.width = 36;
  inputPrefix.edit.preferredSize.width = innerWidth - inputDigits.label.preferredSize.width - inputDigits.list.preferredSize.width - inputPrefix.label.preferredSize.width - nameGroup.spacing * 3;
  var inputSkipPage = dialog.add("Group{\
		label:StaticText{text:'除外ページ',justify:'right'},\
		edit:EditText{text:''}\
	}");
  inputSkipPage.label.preferredSize.width = 60;
  inputSkipPage.edit.preferredSize.width = innerWidth - inputSkipPage.label.preferredSize.width - inputSkipPage.spacing;
  var flugGroup = dialog.add("Group{\
		binarization:Checkbox{text:'2値化'},\
		flatten:Checkbox{text:'統合'},\
		close:Checkbox{text:'保存後閉じる'}\
	}");

  flugGroup.binarization.onClick = function (e) {
    if (flugGroup.binarization.value) {
      flugGroup.flatten.value = true;
    }
  };

  flugGroup.flatten.onClick = function (e) {
    if (!flugGroup.flatten.value) {
      flugGroup.binarization.value = false;
    }
  };

  if (activeDocument.mode === DocumentMode.BITMAP) {
    flugGroup.binarization.value = flugGroup.flatten.value = flugGroup2.white.value = true;
  } else {
    flugGroup.flatten.value = DEFAULT.flatten;
  }

  flugGroup.close.value = DEFAULT.autoClose;
  new ActionButtons(dialog);
  var ret = dialog.show();

  if (ret != 1) {
    return;
  }

  var fObj = Folder.selectDialog('保存するディレクトリを選択');
  if (!fObj) return;
  var alertFlag = false,
      docPath;

  for (var i = 0; i < docNum; i++) {
    try {
      docPath = documents[i].path;
    } catch (e) {
      docPath = false;
    }

    if (docPath && docPath.fullName == fObj.fullName) {
      alertFlag = true;
      break;
    }
  }

  if (alertFlag) {
    var conf = Window.confirm('同一のディレクトリに保存されているファイルがあります。このまま実行してよろしいですか？', false, '警告');
    if (!conf) return;
  }

  var initNum = convertInt(inputNum.edit.text, 1),
      prefix = inputPrefix.edit.text,
      binarization = flugGroup.binarization.value,
      flatten = flugGroup.flatten.value,
      autoClose = flugGroup.close.value,
      enableAlert = DEFAULT.enableAlert;
  var digits;

  if (inputDigits.list.selection === null) {
    digits = 0;
  } else {
    digits = inputDigits.list.selection.text === 'Auto' ? 0 : parseInt(inputDigits.list.selection.text, 10);
  }

  if (!digits) {
    var lastNum = initNum + docNum - 1;
    digits = lastNum.toString().length;
    digits = digits === 1 ? 2 : digits;
  }

  var zeropad = Array(digits).join('0');
  var skipPage = inputSkipPage.edit.text.split(/,\s*|\s+/);

  if (skipPage.length) {
    skipPage.unique().reverse();
  }

  var pageNum = initNum;

  for (var _i = 0; _i < docNum; _i++) {
    activeDocument = documents[autoClose ? 0 : _i];

    if (skipPage.length) {
      for (var j = skipPage.length + 1; j >= 0; j--) {
        if (skipPage[j] == pageNum) {
          skipPage.splice(j, 1);
          pageNum++;
        } else if (skipPage[j] < pageNum) {
          skipPage.splice(j, 1);
        } else {
          break;
        }
      }
    }

    var fileName = pageNum.toString(10);

    if (fileName.length < digits) {
      fileName = (zeropad + fileName).slice(-digits);
    }

    fileName = prefix + fileName;

    if (/^windows/i.test($.os)) {
      fileName = fileName.replace(/[\\\/:*?"<>|]/g, '');
    } else {
      fileName = fileName.replace(/\//g, '');
    }

    if (binarization && activeDocument.mode !== DocumentMode.BITMAP) {
      if (activeDocument.mode !== DocumentMode.GRAYSCALE) {
        activeDocument.changeMode(ChangeMode.GRAYSCALE);
      }

      var opt = new BitmapConversionOptions();
      opt.method = BitmapConversionType.HALFTHRESHOLD;
      opt.resolution = activeDocument.resolution;
      activeDocument.changeMode(ChangeMode.BITMAP, opt);
    } else if (flatten) {
      activeDocument.flatten();
    }

    var fileobj = new File(fObj.fullName + "/" + fileName);
    activeDocument.saveAs(fileobj);

    if (autoClose) {
      activeDocument.close(SaveOptions.SAVECHANGES);
    }

    pageNum++;
  }

  if (enableAlert) alert('すべての処理が完了しました。');
})();
