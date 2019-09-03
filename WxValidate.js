/**
 * 表单验证
 * @author 半路凉亭
 * @param {Object} rules 验证字段的规则
 * @param {Object} messages 验证字段的提示信息 * 
 */
const util = require('./util.js')
class WxValidate {
  constructor() {
    this.__initDefaults();
    this.__init()
    this.__getRules();    
  }

  __getRules() {
    const that = this
    const rules = {};
    const messages = {};
    const query = wx.createSelectorQuery();
    query.selectAll(".wxValidate").fields({
      id: true,
      size:true,
      dataset: true,
      rect:true,
      properties: ['name','validate', 'fieldname'],
      context: true
    }, function(res) {
      res.dataset      
      res.context
    }).exec(function(res) {
      console.log(res)
      const arr = res[0];
      for (const i in arr) {
        //console.log(arr[i])
        arr[i].id = util.defaultIfEmpty(arr[i].id, arr[i].name);
        var id = arr[i].id;
        var fieldname = arr[i].dataset.fieldname;
        var validate = util.trim(arr[i].dataset.validate);
        rules[id] = util.defaultIfEmpty(rules[id], {});        
        messages[id] = util.defaultIfEmpty(messages[id], {})
        messages[id].top = arr[i].top;
        messages[id].left = arr[i].left;
        messages[id].width = arr[i].width;       
        that.__getFormatValidate(rules[id], messages[id], id,  validate);
      }
    });

    Object.assign(this, {
      data: {},
      rules,
      messages
    })
  }

  __getFormatValidate(rule = {}, message = {}, id, validate) {    
    const str = util.formatString('[{0}]设置的验证有错误，请修改 ：{1}', new Array(id, validate));
    if (util.isEmpty(id) || util.isEmpty(validate)) {
      util.alert('提示1', str)
      return false;
    }
    const arr = validate.split("|");
    for (var i in arr) {
      let validateKey = util.trim(arr[i]);
      let s = validateKey;
      let value = true;
      let m = validateKey.indexOf("[");
      m = m < 0 ? validateKey.indexOf("(") : m;
      if (m > 0) {
        value = validateKey.substring(m + 1, validateKey.length - 1);
        validateKey = util.trim(validateKey.substring(0, m));
      }
      
      //[1,5] 
      var reg = /\[\-?\d+(\.\d+)?,\-?\d+(\.\d+)?\]$/;
      switch (validateKey) {
        case "size":
          var regMin = /\[\d+\]$/; //[4]
          let regMax = /\[,\d+\]$/; //[,10]            
          if (reg.test(s)) {
            rule[validateKey] = value.split(",");
            message[validateKey] = util.formatString( "请输入长度在 {0} 到 {1} 之间的字符！", rule[validateKey]);
          } else if (regMin.test(s)) {
            rule.minSize = value;
            message.minSize = util.formatString("最少要输入{0}个字符！", rule.minSize);
          } else if (regMax.test(s)) {
            rule.maxSize = value.replace(",", "");
            message.maxSize = util.formatString("最多能输入{0}个字符！", rule.maxSize);
          } else {
            util.alert('提示3', str);
          }
          break;
        case "range":
          var reg1 = /[\[|\(](\-?\d+(\.\d+)?)?(,\-?\d+(\.\d+)?)?[\]|\)]$/;
          if (!reg1.test(s) || util.isEmpty(value)) {
            util.alert('提示3', str);
          } else {
            if (reg.test(s)) {
              rule[validateKey] = value.split(",");
              message[validateKey] = util.formatString("必须在{0}-{1}之间！", rule[validateKey]);
            } else {
              let arrRangeValue = value.split(",");
              if (s.indexOf("[") > -1) {
                //[5]                
                if (!util.isEmpty(arrRangeValue[0])) {
                  rule.min = arrRangeValue[0];
                  message.min = util.formatString("请输入不小于 {0} 的数值！", rule.min);
                }
              } else if (s.indexOf("(") > -1) {
                if (!util.isEmpty(arrRangeValue[0])) {
                  rule.minLt = arrRangeValue[0];
                  message.minLt = util.formatString("请输入大于 {0} 的数值！", rule.minLt);
                }
              }
              if (s.indexOf("]") > -1) {
                //[5]                
                if (arrRangeValue.length == 2 && !util.isEmpty(arrRangeValue[1])) {
                  rule.max = arrRangeValue[1];
                  message.max = util.formatString("请输入不大于 {0} 的数值！", rule.max);
                }
              } else if (s.indexOf(")") > -1) {
                if (arrRangeValue.length == 2 && !util.isEmpty(arrRangeValue[1])) {
                  rule.maxGt = arrRangeValue[1];
                  message.maxGt = util.formatString("请输入小于 {0} 的数值！", rule.maxGt);
                }
              }
            }
          }
          break;
        case "equals":
          let arrEqualValue = value.split(",");
          rule[validateKey] = arrEqualValue[0];
          let msg = "请输入与上面相同的密码!"
          if (arrEqualValue.length == 2 && !util.isEmpty(arrEqualValue[1])) {
            msg = util.formatString("输入值必须和【{0}】相同！", arrEqualValue[1]);
          }
          message[validateKey] = msg;
          break;
        case "notEmpty":
        case "int":
        case "email":
        case "url":
        case "tel":
        case "phone":
        case "idcard":
        case "number":
        case "date":
        case "dateISO":
          rule[validateKey] = value;
          message[validateKey] = this.defaults.messages[validateKey];
          break;
        default:
          util.alert('提示2', str);
          break;
      }
    }
    
  }
  /**
   * __init
   */
  __init() {
    this.__initMethods()
    this.__initData()
  }

  /**
   * 初始化数据
   */
  __initData() {
    //手机屏幕宽度
    const screenWidth = wx.getSystemInfoSync().screenWidth;
    this.site = { screenWidth: screenWidth, errorTextWidth:200}
    //错误提示框转换为像素单位的宽度，400rpx=>px
    //this.site.errorTextWidth = Math.ceil((400*screenWidth)/750);    
    this.form = {}
    this.errorList = []
  }

  /**
   * 初始化默认提示信息
   */
  __initDefaults() {
    this.defaults = {
      messages: {
        notEmpty: '此项不能为空！',
        email: '请输入有效的电子邮件地址！',
        phone: '请输入11位的手机号码！',
        tel: '请输入有效的电话号码',
        url: '请输入有效的网址！',
        date: '请输入有效的日期！',
        dateISO: '请输入有效的日期（ISO），例如：2009-06-23，1998/01/22！',
        number: '请输入有效的数字！',
        int: '只能输入正整数！',
        idcard: '请输入有效身份证！',
        contains: this.formatTpl('输入值必须包含 {0}！')
      }
    }
  }

  /**
   * 初始化默认验证方法
   */
  __initMethods() {
    const that = this
    that.methods = {
      /**
       * 验证必填元素
       */
      notEmpty(value, param) {
        if (!that.depend(param)) {
          return 'dependency-mismatch'
        } else if (typeof value === 'number') {
          value = value.toString()
        } else if (typeof value === 'boolean') {
          return !0
        }
        return value.length > 0 && !util.isEmpty(value)
      },
      /**
       * 验证电子邮箱格式
       */
      email(value) {
        return that.optional(value) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)
      },
      /**
       * 验证手机格式
       */
      phone(value) {
        return that.optional(value) || /^1[3-9]\d{9}$/.test(value)
      },
      /**
       * 验证座机格式
       */
      tel(value) {
        return that.optional(value) || /^[0-9]{3,4}(\-)?[0-9]{6,8}(\-)?([0-9]{1,4})$/.test(value)
      },
      /**
       * 验证URL格式
       */
      url(value) {
        return that.optional(value) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value)
      },
      /**
       * 验证日期格式
       */
      date(value) {
        return that.optional(value) || !/Invalid|NaN/.test(new Date(value).toString())
      },
      /**
       * 验证ISO类型的日期格式
       */
      dateISO(value) {
        return that.optional(value) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value)
      },
      /**
       * 验证十进制数字
       */
      number(value) {
        return that.optional(value) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value)
      },
      /**
       * 验证整数
       */
      int(value) {
        return that.optional(value) || /^\d+$/.test(value)
      },
      /**
       * 验证身份证号码
       */
      idcard(value) {
        return that.optional(value) || util.isEmpty(util.idCard(value))
      },
      /**
       * 验证两个输入框的内容是否相同
       */
      equals(value, param) {
        return that.optional(value) || value === that.data[param]
      },
      /**
       * 验证是否包含某个值
       */
      contains(value, param) {
        return that.optional(value) || value.indexOf(param) >= 0
      },
      /**
       * 验证最小长度
       */
      minSize(value, param) {
        return that.optional(value) || util.len(value) >= param
      },
      /**
       * 验证最大长度
       */
      maxSize(value, param) {
        return that.optional(value) || util.len(value) <= param
      },
      /**
       * 验证一个长度范围[min, max]
       */
      size(value, param) {
        const len = util.len(value);
        return that.optional(value) || (len >= param[0] && len <= param[1])
      },
      /**
       * 验证最小值，包含最小的值
       */
      min(value, param) {
        return that.optional(value) || value >= param
      },
      /**
       * 验证最小值，不包含最小的值
       */
      minLt(value, param) {
        return that.optional(value) || value > param
      },
      /**
       * 验证最大值，包含最大的值
       */
      max(value, param) {
        return that.optional(value) || value <= param
      },
      /**
       * 验证最大值，不包含最大的值
       */
      maxGt(value, param) {
        return that.optional(value) || value < param
      },
      /**
       * 验证一个值范围[min, max]
       */
      range(value, param) {
        const v = value * 1;
        return that.optional(value) || (v >= param[0] * 1 && v <= param[1] * 1)
      },
    }
  }

  /**
   * 添加自定义验证方法
   * @param {String} name 方法名
   * @param {Function} method 函数体，接收两个参数(value, param)，value表示元素的值，param表示参数
   * @param {String} message 提示信息
   */
  addMethod(name, method, message) {
    this.methods[name] = method
    this.defaults.messages[name] = message !== undefined ? message : this.defaults.messages[name]
  }

  /**
   * 判断验证方法是否存在
   */
  isValidMethod(value) {
    let methods = []
    for (let method in this.methods) {
      if (method && typeof this.methods[method] === 'function') {
        methods.push(method)
      }
    }
    return methods.indexOf(value) !== -1
  }

  /**
   * 格式化提示信息模板
   */
  formatTpl(source, params) {
    const that = this
    if (arguments.length === 1) {
      return function() {
        let args = Array.from(arguments)
        args.unshift(source)
        return that.formatTpl.apply(this, args)
      }
    }
    if (params === undefined) {
      return source
    }
    if (arguments.length > 2 && params.constructor !== Array) {
      params = Array.from(arguments).slice(1)
    }
    if (params.constructor !== Array) {
      params = [params]
    }
    params.forEach(function(n, i) {
      source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function() {
        return n
      })
    })
    return source
  }

  /**
   * 判断规则依赖是否存在
   */
  depend(param) {
    switch (typeof param) {
      case 'boolean':
        param = param
        break
      case 'string':
        param = !!param.length
        break
      case 'function':
        param = param()
      default:
        param = !0
    }
    return param
  }

  /**
   * 判断输入值是否为空
   */
  optional(value) {
    return !this.methods.notEmpty(value) && 'dependency-mismatch'
  }

  /**
   * 获取自定义字段的提示信息
   * @param {String} param 字段名
   * @param {Object} rule 规则
   */
  customMessage(param, rule) {
    const params = this.messages[param]
    const isObject = typeof params === 'object'
    if (params && isObject) return params[rule.method]
  }

  /**
   * 获取某个指定字段的提示信息
   * @param {String} param 字段名
   * @param {Object} rule 规则
   */
  defaultMessage(param, rule) {
    let message = this.customMessage(param, rule) || this.defaults.messages[rule.method]
    let type = typeof message

    if (type === 'undefined') {
      message = `Warning: No message defined for ${rule.method}.`
    } else if (type === 'function') {
      message = message.call(this, rule.parameters)
    }

    return message
  }

  /**
   * 缓存错误信息
   * @param {String} param 字段名
   * @param {Object} rule 规则
   * @param {String} value 元素的值
   */
  formatTplAndAdd(param, rule, value) {
    const site = this.messages[param];  
    //错误提示框转换为像素单位的宽度
    const errorTextWidth=this.site.errorTextWidth;    
    //最大距离左边位置的px值
    const maxLeft = this.site.screenWidth-errorTextWidth-15;
    //错误提示框与表单右对齐时的距离左边的距离
    const alignRightLeft = site.left+site.width-errorTextWidth+10;
    let left = maxLeft;    
    if(errorTextWidth<site.width){
      if(alignRightLeft<maxLeft){
        left = alignRightLeft;
      }
    }else{
      const a = site.left+site.width/2;
      if(a<maxLeft){
        left=a;
      }  
    }

    let msg = this.defaultMessage(param, rule)

    this.errorList.push({
      param: param,
      msg: msg,
      value: value,
      top: site.top - 10,
      left:left
    })
  }

  /**
   * 验证某个指定字段的规则
   * @param {String} param 字段名
   * @param {Object} rules 规则
   * @param {Object} data 需要验证的数据对象
   */
  checkParam(param, rules, data) {
    // 缓存数据对象
    this.data = data

    // 缓存字段对应的值
    const value = data[param] !== null && data[param] !== undefined ? data[param] : ''

    // 遍历某个指定字段的所有规则，依次验证规则，否则缓存错误信息
    for (let method in rules) {

      // 判断验证方法是否存在
      if (this.isValidMethod(method)) {

        // 缓存规则的属性及值
        const rule = {
          method: method,
          parameters: rules[method]
        }

        // 调用验证方法
        const result = this.methods[method](value, rule.parameters)

        // 若result返回值为dependency-mismatch，则说明该字段的值为空或非必填字段
        if (result === 'dependency-mismatch') {
          continue
        }

        this.setValue(param, method, result, value)

        // 判断是否通过验证，否则缓存错误信息，跳出循环
        if (!result) {
          this.formatTplAndAdd(param, rule, value)
          break
        }
      }
    }
  }

  /**
   * 设置字段的默认验证值
   * @param {String} param 字段名
   */
  setView(param) {
    this.form[param] = {
      $name: param,
      $valid: true,
      $invalid: false,
      $error: {},
      $success: {},
      $viewValue: ``,
    }
  }

  /**
   * 设置字段的验证值
   * @param {String} param 字段名
   * @param {String} method 字段的方法
   * @param {Boolean} result 是否通过验证
   * @param {String} value 字段的值
   */
  setValue(param, method, result, value) {
    const params = this.form[param]
    params.$valid = result
    params.$invalid = !result
    params.$error[method] = !result
    params.$success[method] = result
    params.$viewValue = value
  }

  /**
   * 验证所有字段的规则，返回验证是否通过
   * @param {Object} data 需要验证数据对象
   */
  checkForm(data) {
    this.__initData()

    for (let param in this.rules) {
      this.setView(param)
      this.checkParam(param, this.rules[param], data)
    }

    return this.valid()
  }

  /**
   * 返回验证是否通过
   */
  valid() {
    return this.size() === 0
  }

  /**
   * 返回错误信息的个数
   */
  size() {
    return this.errorList.length
  }

  /**
   * 返回所有错误信息
   */
  validationErrors() {
    return this.errorList
  }
}

export default WxValidate