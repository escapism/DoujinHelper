/*
 * Auto folio
 * Version 1.1
 *
 * (c) 2022 uco
 *
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

/*
<javascriptresource>
<name>自動ノンブル</name>
<category>doujinhelper</category>
<enableinfo>true</enableinfo>
</javascriptresource>
*/

#target photoshop

var NAME = 'Auto folio';

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

function selectionByTransparent() {
  var idc = stringIDToTypeID('channel');
  var ref1 = new ActionReference();
  ref1.putProperty(idc, stringIDToTypeID('selection'));
  var desc = new ActionDescriptor();
  desc.putReference(stringIDToTypeID('null'), ref1);
  var ref2 = new ActionReference();
  ref2.putEnumerated(idc, idc, stringIDToTypeID('transparencyEnum'));
  desc.putReference(stringIDToTypeID('to'), ref2);
  executeAction(stringIDToTypeID('set'), desc);
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

var FontSelector = function () {
  function FontSelector(dialog, size, defaultFont, defaultStyle) {
    var _this = this;

    if (size === void 0) {
      size = {};
    }

    if (defaultFont === void 0) {
      defaultFont = '';
    }

    if (defaultStyle === void 0) {
      defaultStyle = '';
    }

    this.dialog = dialog;
    this.group = dialog.add('group');
    size.width = size.width || 280;
    size.height = size.height || 24;
    this.group.alignChildren = 'fill';
    this.group.preferredSize = size;
    var styleWidth = Math.round((size.width - 10) * .32);
    if (styleWidth > 80) styleWidth = 80;
    var familyWidth = size.width - styleWidth - this.group.spacing;
    this.currentFont = null;
    this.fontList = this.group.add("dropdownlist", undefined, FontSelector.items);
    this.styleList = this.group.add("dropdownlist", undefined, []);
    this.fontList.preferredSize.width = familyWidth;
    this.styleList.preferredSize.width = styleWidth;

    this.fontList.onChange = function () {
      _this.setStyleList();
    };

    this.styleList.onChange = function () {
      _this.setCurrentFont();
    };

    var def = -1,
        def2 = -1;

    if (defaultFont) {
      for (var _i = 0; _i < FontSelector.items.length; _i++) {
        if (FontSelector.items[_i] === defaultFont) {
          def = _i;
          break;
        }
      }

      if (def >= 0 && defaultStyle) {
        var style = FontSelector.fontSet[def].style;

        for (i = 0; i < style.length; i++) {
          if (style[i] === defaultStyle) {
            def2 = i;
            break;
          }
        }
      }
    }

    this.fontList.selection = def < 0 ? 0 : def;

    if (def2 >= 0) {
      this.styleList.selection = def2;
    }
  }

  var _proto = FontSelector.prototype;

  _proto.setStyleList = function setStyleList() {
    var index = this.fontList.selection.index;

    if (FontSelector.fontSet[index]) {
      var currentFontStyle = FontSelector.fontSet[index].style;
      var def = currentFontStyle.length > 1 ? -1 : 0;
      this.styleList.removeAll();

      for (var _i2 = 0; _i2 < currentFontStyle.length; _i2++) {
        this.styleList.add('item', currentFontStyle[_i2]);

        if (def < 0) {
          var style = currentFontStyle[_i2].toLowerCase();

          if (style === 'regular' || style === 'r' || style === 'r-kl' || style === 'w3' || style === 'medium' || style === 'm' || style === 'm-kl') {
            def = _i2;
          }
        }
      }

      this.styleList.selection = def < 0 ? 0 : def;
    }
  };

  _proto.setCurrentFont = function setCurrentFont() {
    var selected = this.fontList.selection.index;
    var fontIndex = FontSelector.fontSet[selected].index + this.styleList.selection.index;
    this.currentFont = app.fonts[fontIndex];
  };

  _proto.getPostScriptName = function getPostScriptName() {
    return this.currentFont.postScriptName;
  };

  _proto.getFamily = function getFamily() {
    return this.currentFont.family;
  };

  _proto.getStyle = function getStyle() {
    return this.currentFont.style;
  };

  return FontSelector;
}();

FontSelector.fontSet = [];

FontSelector.items = function () {
  var items = [];
  var fontFamily = '',
      counter = -1;

  for (var _i3 = 0; _i3 < app.fonts.length; _i3++) {
    if (app.fonts[_i3].family !== fontFamily) {
      counter++;
      fontFamily = app.fonts[_i3].family;
      items.push(fontFamily);
      FontSelector.fontSet.push({
        index: _i3,
        family: fontFamily,
        style: [app.fonts[_i3].style]
      });
    } else {
      FontSelector.fontSet[counter].style.push(app.fonts[_i3].style);
    }
  }

  return items;
}();

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

var ColorPickerButton = function () {
  function ColorPickerButton(parent, size, defaultColor) {
    if (size === void 0) {
      size = [36, 24];
    }

    this.parent = parent;
    this.button = this.parent.add('button', undefined, '');
    this.button.preferredSize = size;
    this.color = new SolidColor();

    if (!defaultColor || defaultColor.length < 3) {
      if (app.activeDocument.mode === DocumentMode.RGB) {
        defaultColor = [0, 0, 0];
      } else {
        defaultColor = [0, 0, 0, 100];
      }
    }

    if (defaultColor.length === 4) {
      this.color.cmyk.cyan = Math.min(Math.max(defaultColor[0], 0), 100);
      this.color.cmyk.magenta = Math.min(Math.max(defaultColor[1], 0), 100);
      this.color.cmyk.yellow = Math.min(Math.max(defaultColor[2], 0), 100);
      this.color.cmyk.black = Math.min(Math.max(defaultColor[3], 0), 100);
    } else {
      this.color.rgb.red = Math.min(Math.max(defaultColor[0], 0), 255);
      this.color.rgb.green = Math.min(Math.max(defaultColor[1], 0), 255);
      this.color.rgb.blue = Math.min(Math.max(defaultColor[2], 0), 255);
    }

    this.cacheColor = app.foregroundColor;
    app.foregroundColor = this.color;
    this.fillButton();
    this.button.strokePen = this.button.graphics.newPen(this.parent.graphics.PenType.SOLID_COLOR, [0, 0, 0], 1);

    this.button.onDraw = function () {
      this.graphics.drawOSControl();
      this.graphics.rectPath(0, 0, this.size[0], this.size[1]);
      this.graphics.fillPath(this.fillBrush);
      this.graphics.strokePath(this.strokePen);
    };

    this.button.onClick = function (_this) {
      return function () {
        _this.selectColor();
      };
    }(this);
  }

  var _proto = ColorPickerButton.prototype;

  _proto.selectColor = function selectColor() {
    var res = app.showColorPicker();

    if (res) {
      this.color = app.foregroundColor;
      this.fillButton();
      app.foregroundColor = this.cacheColor;
    }
  };

  _proto.fillButton = function fillButton() {
    this.button.fillBrush = this.button.graphics.newBrush(this.parent.graphics.BrushType.SOLID_COLOR, [this.color.rgb.red / 255, this.color.rgb.green / 255, this.color.rgb.blue / 255]);
  };

  _proto.getColor = function getColor() {
    return this.color;
  };

  _proto.getRGB = function getRGB() {
    return [this.color.rgb.red, this.color.rgb.green, this.color.rgb.blue];
  };

  _proto.getCMYK = function getCMYK() {
    return [this.color.cmyk.cyan, this.color.cmyk.magenta, this.color.cmyk.yellow, this.color.cmyk.black];
  };

  return ColorPickerButton;
}();

var FolioCoords = function () {
  function FolioCoords(parent, type, mode, value) {
    if (type === void 0) {
      type = 'vertical';
    }

    if (mode === void 0) {
      mode = 1;
    }

    if (value === void 0) {
      value = 5;
    }

    this.parent = parent;
    this.group = this.parent.add("Group{\
			rb0:RadioButton{text:''},\
			rb1:RadioButton{text:''},\
			rb2:RadioButton{text:'中央'},\
			edit:EditText{justify:'right'},\
			unit:StaticText{text:'mm',justify:'left'}\
		}");
    this.mode = Math.min(Math.abs(mode), 2);
    this.rb0 = this.group.rb0;
    this.rb1 = this.group.rb1;
    this.rb2 = this.group.rb2;
    this.edit = this.group.edit;

    if (type === 'horizontal') {
      this.rb0.text = 'ノド';
      this.rb1.text = '小口';
    } else {
      this.rb0.text = '天';
      this.rb1.text = '地';
    }

    this.rb0.preferredSize.width = 52;
    this.rb1.preferredSize.width = 52;
    this.edit.preferredSize.width = 64;
    this['rb' + this.mode].value = true;
    this.edit.text = value;

    var _this = this;

    this.rb0.onClick = function () {
      _this.change(this);
    };

    this.rb1.onClick = function () {
      _this.change(this);
    };

    this.rb2.onClick = function () {
      _this.change(this);
    };

    if (this.mode === FolioCoords.CENTER) {
      this.edit.enabled = false;
    }
  }

  var _proto = FolioCoords.prototype;

  _proto.change = function change(btn) {
    this.mode = FolioCoords.modeList[btn.text];

    if (btn.text === '中央') {
      this.edit.enabled = false;
    } else {
      this.edit.enabled = true;
    }
  };

  _proto.getValue = function getValue() {
    return this.edit.enabled ? convertFloat(this.edit.text, 0) : null;
  };

  return FolioCoords;
}();

FolioCoords.HEAD = 0;
FolioCoords.FOOT = 1;
FolioCoords.GUTTER = 0;
FolioCoords.FORE = 1;
FolioCoords.CENTER = 2;
FolioCoords.modeList = {
  '天': FolioCoords.HEAD,
  '地': FolioCoords.FOOT,
  'ノド': FolioCoords.GUTTER,
  '小口': FolioCoords.FORE,
  '中央': FolioCoords.CENTER
};

if (typeof JSON !== 'object') {
  JSON = {};
}

((function () {

  var rx_one = /^[\],:{}\s]*$/,
      rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
      rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
      rx_four = /(?:^|:|,)(?:\s*\[)+/g,
      rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  function f(n) {
    return n < 10 ? '0' + n : n;
  }

  function this_value() {
    return this.valueOf();
  }

  if (typeof Date.prototype.toJSON !== 'function') {
    Date.prototype.toJSON = function () {
      return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z' : null;
    };

    Boolean.prototype.toJSON = this_value;
    Number.prototype.toJSON = this_value;
    String.prototype.toJSON = this_value;
  }

  var gap, indent, meta, rep;

  function quote(string) {
    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string) ? '"' + string.replace(rx_escapable, function (a) {
      var c = meta[a];
      return typeof c === 'string' ? c : "\\u" + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
  }

  function str(key, holder) {
    var i,
        k,
        v,
        length,
        mind = gap,
        partial,
        value = holder[key];

    if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
      value = value.toJSON(key);
    }

    if (typeof rep === 'function') {
      value = rep.call(holder, key, value);
    }

    switch (typeof value) {
      case 'string':
        return quote(value);

      case 'number':
        return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':
        return String(value);

      case 'object':
        if (!value) {
          return 'null';
        }

        gap += indent;
        partial = [];

        if (Object.prototype.toString.apply(value) === '[object Array]') {
          length = value.length;

          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || 'null';
          }

          v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
          gap = mind;
          return v;
        }

        if (rep && typeof rep === 'object') {
          length = rep.length;

          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === 'string') {
              k = rep[i];
              v = str(k, value);

              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        } else {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);

              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        }

        v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
  }

  if (typeof JSON.stringify !== 'function') {
    meta = {
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '"': '\\"',
      '\\': '\\\\'
    };

    JSON.stringify = function (value, replacer, space) {
      var i;
      gap = '';
      indent = '';

      if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
          indent += ' ';
        }
      } else if (typeof space === 'string') {
        indent = space;
      }

      rep = replacer;

      if (replacer && typeof replacer !== 'function' && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
      }

      return str('', {
        '': value
      });
    };
  }

  if (typeof JSON.parse !== 'function') {
    JSON.parse = function (text, reviver) {
      var j;

      function walk(holder, key) {
        var k,
            v,
            value = holder[key];

        if (value && typeof value === 'object') {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = walk(value, k);

              if (v !== undefined) {
                value[k] = v;
              } else {
                delete value[k];
              }
            }
          }
        }

        return reviver.call(holder, key, value);
      }

      text = String(text);
      rx_dangerous.lastIndex = 0;

      if (rx_dangerous.test(text)) {
        text = text.replace(rx_dangerous, function (a) {
          return "\\u" + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        });
      }

      if (rx_one.test(text.replace(rx_two, '@').replace(rx_three, ']').replace(rx_four, ''))) {
        j = eval('(' + text + ')');
        return typeof reviver === 'function' ? walk({
          '': j
        }, '') : j;
      }

      throw new SyntaxError('JSON.parse');
    };
  }
}))();

var DEFAULT = loadconfig(NAME, {
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
  whiteBorder: false,
  enableAlert: true,
  keepParameter: true
});

if (typeof DEFAULT.verticalMode === 'string') {
  DEFAULT.verticalMode = FolioCoords[DEFAULT.verticalMode.toUpperCase()] || 1;
}

if (typeof DEFAULT.horizontalMode === 'string') {
  DEFAULT.horizontalMode = FolioCoords[DEFAULT.horizontalMode.toUpperCase()] || 1;
}

(function () {
  var docNum = documents.length;
  if (!docNum) return;

  var settings = function () {
    if (DEFAULT.keepParameter) {
      var env = $.getenv('doujinhelper/autoFolio');
      return env ? JSON.parse(env) : DEFAULT;
    }

    return DEFAULT;
  }();

  if ('skipPage' in settings === false) {
    settings.skipPage = '';
  }

  var dialog = new Window('dialog', '自動ノンブル');
  var innerWidth = 320;
  var fs = new FontSelector(dialog, {
    width: innerWidth
  }, settings.fontfamily, settings.fontstyle);
  var fontSetting = dialog.add("Group{\
		fontsize:Group{\
			label:StaticText{text:'フォントサイズ'},\
			edit:EditText{text:'" + settings.fontsize + "',justify:'right',characters:4},\
			unit:StaticText{text:'pt'}\
		},\
		color:Group{\
			label:StaticText{text:'カラー'}\
		}\
	}");
  var defaultColor = activeDocument.mode === DocumentMode.RGB ? settings.colorRGB : settings.colorCMYK;
  var fontColor = new ColorPickerButton(fontSetting.color, undefined, defaultColor);
  var numGroup = dialog.add('group');
  numGroup.preferredSize.width = innerWidth;
  var inputNum = numGroup.add("Group{\
		label:StaticText{text:'初期値',justify:'right'},\
		edit:EditText{text:'" + settings.initNum + "'}\
	}");
  inputNum.preferredSize.width = 220;
  inputNum.label.preferredSize.width = 48;
  inputNum.edit.preferredSize.width = inputNum.preferredSize.width - inputNum.label.preferredSize.width - inputNum.spacing;
  var inputDigits = numGroup.add("Group{\
		label:StaticText{text:'桁数',justify:'right'},\
		list:DropDownList{properties:{items:[1,2,3,4]}}\
	}");
  inputDigits.preferredSize.width = innerWidth - inputNum.preferredSize.width - numGroup.spacing;
  inputDigits.label.preferredSize.width = 24;
  inputDigits.list.preferredSize.width = inputDigits.preferredSize.width - inputDigits.label.preferredSize.width - inputDigits.spacing;
  inputDigits.list.selection = settings.digits - 1;
  var inputBleed = dialog.add("Group{\
		label:StaticText{text:'断ち切り',justify:'right'},\
		edit:EditText{text:'" + settings.bleed + "',justify:'right'}\
		unit:StaticText{text:'mm',justify:'left'}\
	}");
  inputBleed.preferredSize.width = innerWidth;
  inputBleed.label.preferredSize.width = 48;
  inputBleed.edit.preferredSize.width = 225;
  var inputVertical = new FolioCoords(dialog, 'vertical', settings.verticalMode, settings.verticalSpace);
  var inputHorizontal = new FolioCoords(dialog, 'horizontal', settings.horizontalMode, settings.horizontalSpace);
  var inputSkipPage = dialog.add("Group{\
		label:StaticText{text:'除外ページ',justify:'right'},\
		edit:EditText{text:''}\
	}");
  inputSkipPage.preferredSize.width = innerWidth;
  inputSkipPage.label.preferredSize.width = 60;
  inputSkipPage.edit.preferredSize.width = innerWidth - inputSkipPage.label.preferredSize.width - inputSkipPage.spacing * 2;
  var flugGroup = dialog.add("Group{\
		binarization:Checkbox{text:'2値化'},\
		flatten:Checkbox{text:'統合'},\
		bindR:RadioButton{text:'右綴じ'},\
		bindL:RadioButton{text:'左綴じ'}\
	}");

  if (settings.bind.toLowerCase() === 'left') {
    flugGroup.bindL.value = true;
  } else {
    flugGroup.bindR.value = true;
  }

  flugGroup.binarization.onClick = function () {
    if (flugGroup.binarization.value) {
      flugGroup.flatten.value = true;
    }
  };

  flugGroup.flatten.onClick = function () {
    if (!flugGroup.flatten.value) {
      flugGroup.binarization.value = false;
    }
  };

  var flugGroup2 = dialog.add("Group{\
		white:Checkbox{text:'白フチ'},\
		save:Checkbox{text:'保存して閉じる'}\
	}");
  var inputSave = flugGroup2.save;
  inputSave.value = settings.autoSave;
  flugGroup.flatten.value = settings.flatten;
  flugGroup2.white.value = settings.whiteBorder;

  if ('binarization' in settings) {
    flugGroup.binarization.value = settings.binarization;
  } else if (activeDocument.mode === DocumentMode.BITMAP) {
    flugGroup.binarization.value = flugGroup.flatten.value = flugGroup2.white.value = true;
  }

  new ActionButtons(dialog);
  var ret = dialog.show();

  if (ret != 1) {
    return;
  }

  var selectedFont = fs.getPostScriptName(),
      fontsize = convertFloat(fontSetting.fontsize.edit.text, DEFAULT.fontsize),
      color = fontColor.getColor();
  var initNum = convertInt(inputNum.edit.text, 3),
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
      enableAlert = DEFAULT.enableAlert,
      autoSave = inputSave.value;
  var skipPage = inputSkipPage.edit.text.split(/,\s*|\s+/);

  if (skipPage.length) {
    skipPage.unique();
  }

  if (DEFAULT.keepParameter) {
    var _ref, _inputVertical$getVal, _ref2, _inputHorizontal$getV;

    $.setenv('doujinhelper/autoFolio', JSON.stringify({
      fontfamily: fs.getFamily(),
      fontstyle: fs.getStyle(),
      fontsize: fontsize,
      colorCMYK: fontColor.getCMYK(),
      colorRGB: fontColor.getRGB(),
      initNum: initNum,
      digits: digits,
      bleed: bleed,
      verticalMode: verticalMode,
      verticalSpace: (_ref = (_inputVertical$getVal = inputVertical.getValue()) != null ? _inputVertical$getVal : settings.verticalSpace) != null ? _ref : DEFAULT.verticalSpace,
      horizontalMode: horizontalMode,
      horizontalSpace: (_ref2 = (_inputHorizontal$getV = inputHorizontal.getValue()) != null ? _inputHorizontal$getV : settings.horizontalSpace) != null ? _ref2 : DEFAULT.horizontalSpace,
      binarization: binarization,
      flatten: flatten,
      bind: bindRight ? 'right' : 'left',
      whiteBorder: whiteBorder,
      autoSave: autoSave,
      skipPage: skipPage.join(',')
    }));
  }

  skipPage.reverse();
  var fObj;

  if (autoSave) {
    fObj = Folder.selectDialog('保存するディレクトリを選択');
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
  }

  var zeropad = Array(digits).join('0');
  var unitCache = {
    ruler: preferences.rulerUnits,
    type: preferences.typeUnits
  };
  preferences.rulerUnits = Units.MM;
  preferences.typeUnits = TypeUnits.POINTS;
  var pageNum = initNum;

  for (var _i = 0; _i < docNum; _i++) {
    activeDocument = documents[autoSave ? 0 : _i];

    if (activeDocument.mode === DocumentMode.BITMAP) {
      activeDocument.changeMode(ChangeMode.GRAYSCALE);
    }

    var doc = activeDocument;
    var docWidth = parseFloat(doc.width),
        docHeight = parseFloat(doc.height);

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

    var layer = doc.artLayers.add();
    layer.kind = LayerKind.TEXT;
    layer.textItem.contents = '0';
    layer.textItem.size = fontsize;
    layer.textItem.font = selectedFont;
    layer.textItem.color = color;
    layer.textItem.useAutoLeading = false;
    layer.textItem.leading = fontsize;
    layer.textItem.justification = Justification.CENTER;

    if (binarization || activeDocument.mode === DocumentMode.GRAYSCALE || activeDocument.mode === DocumentMode.BITMAP) {
      layer.textItem.antiAliasMethod = AntiAlias.NONE;
    } else {
      layer.textItem.antiAliasMethod = AntiAlias.SHARP;
    }

    var folio = pageNum.toString(10);

    if (folio.length < digits) {
      folio = (zeropad + folio).slice(-digits);
    }

    layer.textItem.contents = folio;
    var lb = layer.bounds,
        lwidth = parseFloat(lb[2] - lb[0]),
        lheight = parseFloat(lb[3] - lb[1]);
    var odd = pageNum % 2;
    var x = void 0,
        y = void 0;

    if (horizontalMode === FolioCoords.FORE) {
      if (bindRight == odd) {
        x = horizontalSpace;
      } else {
        x = docWidth - horizontalSpace - lwidth;
      }
    } else if (horizontalMode === FolioCoords.GUTTER) {
      if (bindRight == odd) {
        x = docWidth - horizontalSpace - lwidth;
      } else {
        x = horizontalSpace;
      }
    } else {
      x = (docWidth - lwidth) / 2;
    }

    if (verticalMode === FolioCoords.HEAD) {
      y = verticalSpace;
    } else if (verticalMode === FolioCoords.FOOT) {
      y = docHeight - verticalSpace - lheight;
    } else {
      y = (docHeight - lheight) / 2;
    }

    layer.translate(x - parseFloat(lb[0]), y - parseFloat(lb[1]));
    activeDocument.activeLayer = layer;

    if (whiteBorder) {
      var uv = UnitValue(0.3, 'mm');
      uv.baseUnit = UnitValue(1 / activeDocument.resolution, 'in');
      selectionByTransparent();
      activeDocument.selection.expand(uv.as('px'));
      var backLayer = activeDocument.artLayers.add();
      backLayer.move(layer, ElementPlacement.PLACEAFTER);
      var white = new SolidColor();
      white.rgb.red = 255;
      white.rgb, green = 255;
      white.rgb, blue = 255;
      activeDocument.selection.fill(white);
      activeDocument.selection.deselect();
    }

    if (binarization) {
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

    if (autoSave) {
      var fileobj = new File(fObj.fullName + '/' + activeDocument.name);
      activeDocument.saveAs(fileobj);
      activeDocument.close(SaveOptions.PROMPTTOSAVECHANGES);
    }

    pageNum++;
  }

  preferences.rulerUnits = unitCache.ruler;
  preferences.typeUnits = unitCache.type;
  if (enableAlert) alert('すべての処理が完了しました。');
})();
