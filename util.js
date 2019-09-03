module.exports = {
  formatTime: formatTime, 
  msg: msg,
  alert:alert,
  isEmpty: isEmpty,
  formatString: formatString,
  trim: trim,
  defaultIfEmpty: defaultIfEmpty,  
  idCard:idCard
}


function isEmpty(obj) {
  return obj == "" || obj == undefined || obj == null || obj == "null";
}
function isNotEmpty(obj) {
  return !isEmpty(obj);
}
function trim(str, delString) {
  if (isEmpty(str)) {
    str = "";
  } else {
    delString = defaultIfEmpty(delString, "\\s");
    str += "";
    var trimLeft = new RegExp("^" + delString + "+", "gim");
    var trimRight = new RegExp(delString + "+$", "gim");
    str = str.replace(trimLeft, "").replace(trimRight, "");
  }
  return str;
}
function defaultIfEmpty(obj, defaultObj) {
  return isEmpty(obj) ? defaultObj : obj;
}
function msg(title, icon, duration) {
  icon = defaultIfEmpty(icon, "success");
  duration = defaultIfEmpty(duration, 1000);
  wx.showToast({
    title: title,
    icon: icon,
    duration: duration
  })
}
function alert(title, content){
  title = defaultIfEmpty(title, '提示')
  wx.showModal({
    title: title,
    content: content,
    showCancel:false
  })
}

function loadingMsg(title, mask) {
  wx.showLoading({
    title: title,
    mask: defaultIfEmpty(mask, true)
  })
}

function formatString(source, params) {
  if (isEmpty(params) || params.length==0) {
    return source
  }  
  if (params.constructor !== Array) {
    params = [params]
  }
  params.forEach(function (n, i) {
    source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
      return n
    })
  })
  return source
}


function idCard(idNum) {
  var errors = new Array(
    "验证通过",
    "身份证号码位数不对",
    "身份证含有非法字符",
    "身份证号码校验错误",
    "身份证地区非法"
  );
  //身份号码位数及格式检验
  var re;
  var len = idNum.length;
  //身份证位数检验
  if (len != 15 && len != 18) {
    return errors[1];
  }
  else if (len == 15) {
    re = new RegExp(/^(\d{6})()?(\d{2})(\d{2})(\d{2})(\d{3})$/);
  }
  else {
    re = new RegExp(/^(\d{6})()?(\d{4})(\d{2})(\d{2})(\d{3})([0-9xX])$/);
  }

  var area = {
    11: "北京", 12: "天津", 13: "河北", 14: "山西",
    15: "内蒙古", 21: "辽宁", 22: "吉林", 23: "黑龙江", 31: "上海",
    32: "江苏", 33: "浙江", 34: "安徽", 35: "福建", 36: "江西",
    37: "山东", 41: "河南", 42: "湖北", 43: "湖南", 44: "广东",
    45: "广西", 46: "海南", 50: "重庆", 51: "四川", 52: "贵州",
    53: "云南", 54: "西藏", 61: "陕西", 62: "甘肃", 63: "青海",
    64: "宁夏", 65: "新疆", 71: "台湾", 81: "香港", 82: "澳门",
    91: "国外"
  }

  var idcard_array = new Array();
  idcard_array = idNum.split("");

  //地区检验
  if (area[parseInt(idNum.substr(0, 2))] == null) {
    return errors[4];
  }
  //出生日期正确性检验
  var a = idNum.match(re);

  if (a != null) {
    if (len == 15) {
      var DD = new Date("19" + a[3] + "/" + a[4] + "/" + a[5]);
      var flag = DD.getYear() == a[3] && (DD.getMonth() + 1) == a[4] && DD.getDate() == a[5];
    }
    else if (len == 18) {
      var DD = new Date(a[3] + "/" + a[4] + "/" + a[5]);
      var flag = DD.getFullYear() == a[3] && (DD.getMonth() + 1) == a[4] && DD.getDate() == a[5];
    }

    if (!flag) {
      return "身份证出生日期不对！";
    }

    //检验校验位
    if (len == 18) {
      var S = (parseInt(idcard_array[0]) + parseInt(idcard_array[10])) * 7
        + (parseInt(idcard_array[1]) + parseInt(idcard_array[11])) * 9
        + (parseInt(idcard_array[2]) + parseInt(idcard_array[12])) * 10
        + (parseInt(idcard_array[3]) + parseInt(idcard_array[13])) * 5
        + (parseInt(idcard_array[4]) + parseInt(idcard_array[14])) * 8
        + (parseInt(idcard_array[5]) + parseInt(idcard_array[15])) * 4
        + (parseInt(idcard_array[6]) + parseInt(idcard_array[16])) * 2
        + parseInt(idcard_array[7]) * 1
        + parseInt(idcard_array[8]) * 6
        + parseInt(idcard_array[9]) * 3;

      var Y = S % 11;
      var M = "F";
      var JYM = "10X98765432";
      var M = JYM.substr(Y, 1);//判断校验位

      //检测ID的校验位
      if (M == idcard_array[17]) {
        return "";
      }
      else {
        return errors[3];
      }
    }

  }
  else {
    return errors[2];
  }
  return "";
}