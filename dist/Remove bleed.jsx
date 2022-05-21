/*
 * Remove bleed
 * Version 1.0
 *
 * (c) 2022 uco
 *
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

/*
<javascriptresource>
<name>断ち切り削除</name>
<category>doujinhelper</category>
<enableinfo>true</enableinfo>
</javascriptresource>
*/

#target photoshop

var NAME = 'Remove bleed';

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

function convertFloat(text, def, abs) {
  if (def === void 0) {
    def = 0;
  }

  if (abs === void 0) {
    abs = true;
  }

  text = full2half(text);
  var num = parseFloat(text);

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
  bleed: 3
});

(function () {
  var dialog = new Window('dialog', '断ち切り削除');
  var inputBleed = dialog.add("Group{\
		label:StaticText{text:'断ち切り',justify:'right'},\
		edit:EditText{text:'" + DEFAULT.bleed + "',characters:15,justify:'right'},\
		unit:StaticText{text:'mm'}\
	}");
  new ActionButtons(dialog);
  var ret = dialog.show();

  if (ret != 1) {
    return;
  }

  bleed = convertFloat(inputBleed.edit.text, 0, false);
  var unitCache = preferences.rulerUnits;
  preferences.rulerUnits = Units.MM;
  var width = activeDocument.width,
      height = activeDocument.height;
  activeDocument.resizeCanvas(width - bleed * 2, height - bleed * 2, AnchorPosition.MIDDLECENTER);
  preferences.rulerUnits = unitCache;
})();
