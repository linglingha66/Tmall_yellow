
//banner
function Swipe(container, options) {

  "use strict";

  // utilities
  var noop = function() {}; // 简单的无操作功能
  var offloadFn = function(fn) { setTimeout(fn || noop, 0) }; // 卸载功能的执行
  
  // 检查浏览器的功能
  var browser = {
    addEventListener: !!window.addEventListener,
    touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
    transitions: (function(temp) {
      var props = ['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
      for ( var i in props ) if (temp.style[ props[i] ] !== undefined) return true;
      return false;
    })(document.createElement('swipe'))
  };

  // 如果没有根元素退出
  if (!container) return;
  var element = container.children[0];
  var slides, slidePos, width;
  options = options || {};
  var index = parseInt(options.startSlide, 10) || 0;
  var speed = options.speed || 300;
  options.continuous = options.continuous ? options.continuous : true;

  function setup() {

    // 缓存的幻灯片
    slides = element.children;

    //创建一个数组来存储每个幻灯片的当前位置
    slidePos = new Array(slides.length);

    // 确定每个幻灯片的宽度
    width = container.getBoundingClientRect().width || container.offsetWidth;

    element.style.width = (slides.length * width) + 'px';

    // 栈元素
    var pos = slides.length;
    while(pos--) {

      var slide = slides[pos];

      slide.style.width = width + 'px';
      slide.setAttribute('data-index', pos);

      if (browser.transitions) {
        slide.style.left = (pos * -width) + 'px';
        move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
      }

    }

    if (!browser.transitions) element.style.left = (index * -width) + 'px';

    container.style.visibility = 'visible';

  }

  function prev() {

    if (index) slide(index-1);
    else if (options.continuous) slide(slides.length-1);

  }

  function next() {

    if (index < slides.length - 1) slide(index+1);
    else if (options.continuous) slide(0);

  }

  function slide(to, slideSpeed) {

    // 如果已经滑不要求
    if (index == to) return;
    
    if (browser.transitions) {

      var diff = Math.abs(index-to) - 1;
      var direction = Math.abs(index-to) / (index-to); // 1:right -1:left

      while (diff--) move((to > index ? to : index) - diff - 1, width * direction, 0);

      move(index, width * direction, slideSpeed || speed);
      move(to, 0, slideSpeed || speed);

    } else {

      animate(index * -width, to * -width, slideSpeed || speed);

    }

    index = to;

    offloadFn(options.callback && options.callback(index, slides[index]));

  }

  function move(index, dist, speed) {

    translate(index, dist, speed);
    slidePos[index] = dist;

  }

  function translate(index, dist, speed) {

    var slide = slides[index];
    var style = slide && slide.style;

    if (!style) return;

    style.webkitTransitionDuration = 
    style.MozTransitionDuration = 
    style.msTransitionDuration = 
    style.OTransitionDuration = 
    style.transitionDuration = speed + 'ms';

    style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
    style.msTransform = 
    style.MozTransform = 
    style.OTransform = 'translateX(' + dist + 'px)';

  }

  function animate(from, to, speed) {

    // 如果不是动画，只是重新定位
    if (!speed) {
      
      element.style.left = to + 'px';
      return;

    }
    
    var start = +new Date;
    
    var timer = setInterval(function() {

      var timeElap = +new Date - start;
      
      if (timeElap > speed) {

        element.style.left = to + 'px';

        if (delay) begin();

        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

        clearInterval(timer);
        return;

      }

      element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

    }, 4);

  }

  // 安装程序自动幻灯片
  var delay = options.auto || 0;
  var interval;

  function begin() {

    interval = setTimeout(next, delay);

  }

  function stop() {

    delay = 0;
    clearTimeout(interval);

  }


  // 设置初始变量
  var start = {};
  var delta = {};
  var isScrolling;      

  // 设置事件捕获
  var events = {

    handleEvent: function(event) {

      switch (event.type) {
        case 'touchstart': this.start(event); break;
        case 'touchmove': this.move(event); break;
        case 'touchend': offloadFn(this.end(event)); break;
        case 'webkitTransitionEnd':
        case 'msTransitionEnd':
        case 'oTransitionEnd':
        case 'otransitionend':
        case 'transitionend': offloadFn(this.transitionEnd(event)); break;
        case 'resize': offloadFn(setup.call()); break;
      }

      if (options.stopPropagation) event.stopPropagation();

    },
    start: function(event) {

      var touches = event.touches[0];

      // 测量的起始值
      start = {

        // 得到初始的触摸坐标
        x: touches.pageX,
        y: touches.pageY,

        // 存储时间确定接触时间
        time: +new Date

      };
      
      // 用于测试的第一移动事件
      isScrolling = undefined;

      // 复位三角洲和最后计算值
      delta = {};

      // 设置touchmove和touchend监听
      element.addEventListener('touchmove', this, false);
      element.addEventListener('touchend', this, false);

    },
    move: function(event) {

      // 确保一个触摸不捏刷
      if ( event.touches.length > 1 || event.scale && event.scale !== 1) return

      if (options.disableScroll) event.preventDefault();

      var touches = event.touches[0];

      // 计算改变后的 x 和 y
      delta = {
        x: touches.pageX - start.x,
        y: touches.pageY - start.y
      }

      // 确定测试运行——一个滚动时间测试
      if ( typeof isScrolling == 'undefined') {
        isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
      }

      // 如果用户没有试图垂直滚动
      if (!isScrolling) {

        // 防止本机滚动
        event.preventDefault();

        // 停止幻灯片显示 
        stop();

        // 如果第一个或最后一个滑动阻力增加
        delta.x = 
          delta.x / 
            ( (!index && delta.x > 0               // if first slide and sliding left
              || index == slides.length - 1        // or if last slide and sliding right
              && delta.x < 0                       // and if sliding at all
            ) ?                      
            ( Math.abs(delta.x) / width + 1 )      // determine resistance level
            : 1 );                                 // no resistance if false
        
        // 转化 1:1
        translate(index-1, delta.x + slidePos[index-1], 0);
        translate(index, delta.x + slidePos[index], 0);
        translate(index+1, delta.x + slidePos[index+1], 0);

      }

    },
    end: function(event) {

      // 计算持续时间
      var duration = +new Date - start.time;

      // 确定滑动尝试触发下一个/上一页滑动
      var isValidSlide = 
            Number(duration) < 250               // if slide duration is less than 250ms
            && Math.abs(delta.x) > 20            // and if slide amt is greater than 20px
            || Math.abs(delta.x) > width/2;      // or if slide amt is greater than half the width

      // 如果尝试确定滑过去的开始和结束
      var isPastBounds = 
            !index && delta.x > 0                            // 如果第一个幻灯片和幻灯片AMT大于0
            || index == slides.length - 1 && delta.x < 0;    // 或者如果最后一张幻灯片,幻灯片amt小于0
      
      // 确定滑动方向(true:right, false:left)
      var direction = delta.x < 0;

      // 如果不垂直滚动
      if (!isScrolling) {

        if (isValidSlide && !isPastBounds) {

          if (direction) {

            move(index-1, -width, 0);
            move(index, slidePos[index]-width, speed);
            move(index+1, slidePos[index+1]-width, speed);
            index += 1;

          } else {

            move(index+1, width, 0);
            move(index, slidePos[index]+width, speed);
            move(index-1, slidePos[index-1]+width, speed);
            index += -1;

          }

          options.callback && options.callback(index, slides[index]);

        } else {

          move(index-1, -width, speed);
          move(index, 0, speed);
          move(index+1, width, speed);

        }

      }

      // 取消touchmove和touchend事件监听器,直到touchstart再次调用
      element.removeEventListener('touchmove', events, false)
      element.removeEventListener('touchend', events, false)

    },
    transitionEnd: function(event) {

      if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
        
        if (delay) begin();

        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

      }

    }

  }

  // 触发设置 
  setup();

  // 如果适用则开始自动幻灯片
  if (delay) begin();


  // 添加事件监听器
  if (browser.addEventListener) {
    
    // 设置touchstart事件元素    
    if (browser.touch) element.addEventListener('touchstart', events, false);

    if (browser.transitions) {
      element.addEventListener('webkitTransitionEnd', events, false);
      element.addEventListener('msTransitionEnd', events, false);
      element.addEventListener('oTransitionEnd', events, false);
      element.addEventListener('otransitionend', events, false);
      element.addEventListener('transitionend', events, false);
    }

    //设置在窗口调整大小事件
    window.addEventListener('resize', events, false);

  } else {

    window.onresize = function () { setup() }; // to play nice with old IE

  }

  // 公开Swipe API
  return {
    setup: function() {

      setup();

    },
    slide: function(to, speed) {

      slide(to, speed);

    },
    prev: function() {

      // cancel slideshow
      stop();

      prev();

    },
    next: function() {

      stop();

      next();

    },
    getPos: function() {

      // return current index position
      return index;

    },
    kill: function() {

      // 取消幻灯片
      stop();

      // reset element
      element.style.width = 'auto';
      element.style.left = 0;

      // reset slides
      var pos = slides.length;
      while(pos--) {

        var slide = slides[pos];
        slide.style.width = '100%';
        slide.style.left = 0;

        if (browser.transitions) translate(pos, 0, 0);

      }

      // 删除事件侦听器
      if (browser.addEventListener) {

        // remove current event listeners
        element.removeEventListener('touchstart', events, false);
        element.removeEventListener('webkitTransitionEnd', events, false);
        element.removeEventListener('msTransitionEnd', events, false);
        element.removeEventListener('oTransitionEnd', events, false);
        element.removeEventListener('otransitionend', events, false);
        element.removeEventListener('transitionend', events, false);
        window.removeEventListener('resize', events, false);

      }
      else {

        window.onresize = null;

      }

    }
  }

}


if ( window.jQuery || window.Zepto ) {
  (function($) {
    $.fn.Swipe = function(params) {
      return this.each(function() {
        $(this).data('Swipe', new Swipe($(this)[0], params));
      });
    }

  })( window.jQuery || window.Zepto )
}




$(function(){
    
      //点击“领取”出现天猫购物券弹框
    $(".goods2-f3").click(function(){
      $(".goods2-fbox").show();
    });
    $(".goods2-fbox-bottom").click(function(){
      $(".goods2-fbox").hide();
    });
    $(".goods2-fbg").click(function(){
      $(".goods2-fbox").hide();
    });

    //点击“促销”部分出现弹框
    $(".goods2-s3").click(function(){
      $(".goods2-sbox").show();
    });
    $(".goods2-sbox-bottom").click(function(){
      $(".goods2-sbox").hide();
    });
    $(".goods2-sbg").click(function(){
      $(".goods2-sbox").hide();
    });

    //点击“正品”部分出现弹框
    $(".goods2-t2").click(function(){
      $(".goods2-tbox").show();
    });
    $(".goods2-tbox-bottom").click(function(){
      $(".goods2-tbox").hide();
    });
    $(".goods2-tbg").click(function(){
      $(".goods2-tbox").hide();
    });
     

    //点击产品参数，出现弹框，
    $(".goods3-icon1").on("click",function(){
      $(".goods3-fbox").show();
     document.getElementsByTagName('body')[0].style.height = window.innerHeight+'px'; 
     document.body.style.overflow = "hidden";

      // $('html,body').animate({scrollTop: '0px'}, 100);   
    })
    $(".goods3-fbox-bottom").click(function(){
      $(".goods3-fbox").hide();
      // document.getElementsByTagName('body')[0].style.height = 100%;
      document.body.style.overflow = "auto";
    });
    $(".goods3-fbg").click(function(){
      $(".goods3-fbox").hide();
      // document.getElementsByTagName('body')[0].style.height = 100%;
      document.body.style.overflow = "auto";
    });

    // $(".goods3-fbox").bind("touchmove",function(e){
    //         e.preventDefault();
    //   });

    $(".goods3-icon2").click(function(){
      $(".goods3-sbox").show();
      document.getElementsByTagName('body')[0].style.height = window.innerHeight+'px'; 
     document.body.style.overflow = "hidden";
    });
    $(".goods3-box-close").click(function(){
      $(".goods3-sbox").hide();
      document.body.style.overflow = "auto";
    });

    //选择尺码颜色代码
     var data=[{"item_code":"10","item_name":"樱粉色","item_size":"XS","item_num":"0"},
    {"item_code":"11","item_name":"樱粉色","item_size":"S","item_num":"1"},
    {"item_code":"12","item_name":"樱粉色","item_size":"M","item_num":"22"},
    {"item_code":"13","item_name":"樱粉色","item_size":"L","item_num":"10"},

    {"item_code":"20","item_name":"烟灰色","item_size":"XS","item_num":"0"},
    {"item_code":"21","item_name":"烟灰色","item_size":"S","item_num":"4"},
    {"item_code":"22","item_name":"烟灰色","item_size":"M","item_num":"5"},
    {"item_code":"23","item_name":"烟灰色","item_size":"L","item_num":"4"}];

      // //把库存为0的元素放在一个数组里
      // function getEmpty(dom){
      //   var arr = [];
      //   for(var i=0;i<dom.length;i++){
      //     if(dom[i].item_num == 0){
      //       arr.push(dom[i]);
      //     }
      //   }
      //   return arr;
      // }

      //查找含有“XS”的span标签，并加上“empty”这个类，因为XS的库存为0
      $("#size span").each(function() {
        if ($(this).text() == "XS") {
          $(this).addClass("empty");
        }
      });
      
     
      $(".goods3-sbox-wrap li span[class!='empty']").click(function(){
      $('#buy-name').val(1);
      //为选中的块加样式
      if(!$(this).hasClass("select-on")){
         $(this).addClass("select-on").siblings().removeClass("select-on");
      }else{
        $(this).removeClass("select-on");
      }

      //联动
      if($("#color span").hasClass("select-on") && !$("#size span").hasClass("select-on")){
        $("#goods3-selected,.goods3-2 span").html("请选择 尺码");
        $(".goods3-kucun span").html("46");
      }else if(!$("#color span").hasClass("select-on") && $("#size span").hasClass("select-on")){
        $("#goods3-selected,.goods3-2 span").html("请选择 颜色分类");
        $(".goods3-kucun span").html("46");
      }else if($("#color span").hasClass("select-on") && $("#size span").hasClass("select-on")){
        $("#goods3-selected,.goods3-2 span").html("已选:“"+$("#size span[class='select-on']").html()+"” “"+$("#color span[class='select-on']").html()+"”");
        for(var i=0;i<8;i++){
          if($("#size span[class='select-on']").html()== data[i].item_size && $("#color span[class='select-on']").html()==data[i].item_name){
            var num = i;
          }
        }
        $(".goods3-kucun span").html(data[num].item_num);
      }else if(!$("#color span").hasClass("select-on") && !$("#size span").hasClass("select-on")){
        $("#goods3-selected,.goods3-2 span").html("请选择 尺码 颜色分类");
        $(".goods3-kucun span").html("46");
      }

      //根据所选衣服颜色切换图片
      if($("#color span").eq(1).hasClass("select-on")){
        $(".goods3-sbox-wrap img").attr("src","img/goods/烟灰色.JPG");
      }else{
        $(".goods3-sbox-wrap img").attr("src","img/goods/樱粉色.JPG");
      }
    });

    //购买数量加减控制
    var amount = 1;

    $("#bt-minus").click(function(){
      amount=$("#buy-name").val();
      if($("#buy-name").val()<1){
         $(".warning").show();
          return 1;
      }else{
        amount--;
      }
      $("#buy-name").val(amount);  
       $(".warning").hide();
       //如果数量大于1，则左侧减号背景样式改变
       if($("#buy-name").val()>1){
          $("#bt-minus").removeClass("empty");
        }else if($("#buy-name").val()==1){
          $("#bt-minus").addClass("empty");
        }
        if($("#buy-name").val()<1){
          $("#buy-name").val(1);
          $(".warning").show();
        }

    });
    $("#bt-plus").click(function(){
      amount=$("#buy-name").val();
      if(parseInt(amount)>=parseInt($(".goods3-kucun span").html())){
        $(".warning").show();
        $("#buy-name").val($(".goods3-kucun span").html()); 
          return;
        }else{
            amount++;
        }
      $("#buy-name").val(amount);    
      $(".warning").hide();
      if($("#buy-name").val()>1){
        $("#bt-minus").removeClass("empty");
      }else if($("#buy-name").val()==1){
        $("#bt-minus").addClass("empty");
      }
    });

    $('#buy-name').bind('keyup', function(){
       amount=$("#buy-name").val();
      $("#bt-minus").removeClass("empty");
      if(parseInt(amount)>parseInt($(".goods3-kucun span").html())){
         $(".warning").show();
         $("#buy-name").val($(".goods3-kucun span").html()); 
         // return;
      }
    });
    //点击"加入购物车",出现添加成功的提示框
   
    $(".goods3-sbox-bottom1").click(function(){
      $(".added-car").show();
      setTimeout("$('.added-car').hide()",1500);
    });

    $(".shopCar,.buy").click(function(){
      $(".goods3-sbox").show();
      document.getElementsByTagName('body')[0].style.height = window.innerHeight+'px'; 
      document.body.style.overflow = "hidden";
    });
    

    //点击"查看评价"跳转到评价页
    $(".goods4-bottom,.goods4-tit").click(function(){
      $(".tab-con").eq(2).show().siblings().hide();
      $("#head-hd a").eq(2).addClass("selected").siblings().removeClass("selected");
      //置页面顶端
      scroll('0px', 100);
      //显示“全部”
      $(".evaluate-lables li").eq(0).addClass("lables-on").siblings().removeClass("lables-on").removeClass("evaluate-bad-on"); 
       $(".evt-con ul").eq(0).show().siblings().hide();
    });
    //点击具体评价跳转到具体评价
    $(".goods4-lables li").click(function(){
      $(".tab-con").eq(2).show().siblings().hide();
      $("#head-hd a").eq(2).addClass("selected").siblings().removeClass("selected");
      //返回顶部，此函数见“evaluate.js”
       scroll('0px', 100);
      if($(this).hasClass("goods4-bad")){
        $(".evaluate-lables li").eq(8).addClass("evaluate-bad-on").siblings().removeClass("lables-on");
      }else{
          $(".evaluate-lables li").eq($(this).index()+3).addClass("lables-on").siblings().removeClass("lables-on").removeClass("evaluate-bad-on");  
      }
      $(".evt-con ul").eq($(this).index()+3).show().siblings().hide();
    
    });

    //点击收藏变成黄色星星
    $(".collect").click(function(){
      if($(".collect i").hasClass("collected")){
         $(".collect").html("<i></i>收藏");
         $(".collect i").removeClass("collected");
      }else{
         $(".collect").html("<i></i>已收藏");
         $(".collect i").addClass("collected");

      }
    });


  //首页“继续拖动查看商品详情”
  function getScrollTop() {
      //滚动条在Y轴上的滚动距离
      var scrollTop = 0, bodyScrollTop = 0, documentScrollTop = 0;
      if (document.body) {
          bodyScrollTop = document.body.scrollTop;
      }
      if (document.documentElement) {
          documentScrollTop = document.documentElement.scrollTop;
      }
      scrollTop = (bodyScrollTop - documentScrollTop > 0) ? bodyScrollTop : documentScrollTop;
      return scrollTop;
  }

  //浏览器视口的高度
  function getWindowHeight() {
      var windowHeight = 0;
      if (document.compatMode == "CSS1Compat") {
          windowHeight = document.documentElement.clientHeight;
      } else {
          windowHeight = document.body.clientHeight;
      }
      return windowHeight;
  }

  //文档的总高度
  function getScrollHeight() {
      var scrollHeight = 0, bodyScrollHeight = 0, documentScrollHeight = 0;
      if (document.body) {
          bodyScrollHeight = document.body.scrollHeight;
      }
      if (document.documentElement) {
          documentScrollHeight = document.documentElement.scrollHeight;
      }
      scrollHeight = (bodyScrollHeight - documentScrollHeight > 0) ? bodyScrollHeight : documentScrollHeight;
      return scrollHeight;
  }
  //详情页
  function page1(){
    $(".tab-con").eq(1).show().siblings().hide();
    $("#head-hd a").eq(1).addClass("selected").siblings().removeClass("selected");
    scroll('0px', 100);
  }
  //首页
  function page0(){
     $(".tab-con").eq(0).show().siblings().hide();
    $("#head-hd a").eq(0).addClass("selected").siblings().removeClass("selected");
  }

    $(window).on("scroll", function(){
        if (getScrollTop() + getWindowHeight() >= getScrollHeight()) {
         $(".blank-bottom").show();
        }
   
        if($("#head-hd a").eq(0).hasClass("selected")){
            if (getScrollTop() + getWindowHeight() >= getScrollHeight()) {
              $(".goods6").show();
              $(".goods6").click(function(){
                setTimeout($(".part2").show(),1000);
                setTimeout($(".part1").hide(),0);
              })
              // var oy=0,cy=0;
              // document.documentElement.addEventListener('mousedown',function(e){
              //   oy = e.touches[0].clientY;
              // });
              // document.documentElement.addEventListener('mousemove',function(e){
              //  cy = e.touches[0].clientY;
              //  if(cy-oy<-150){
              //       document.documentElement.addEventListener('mouseup',function(){
              //         setTimeout($('.part2').show(),1000);
              //         setTimeout($('.part1').hide(),0);

              //       });
              //     }
              // });
            }
            if (getScrollTop() == 0) {
                $(".det-hide").show();
                $(".det-hide").click(function(){
                  $(".part1").show();
                  setTimeout($(".part2").hide(),1000);
                })
             //  var oy=0,cy=0;
             //  document.documentElement.addEventListener('touchstart',function(e){
             //    oy = e.touches[0].clientY;
             //  });
             //  document.documentElement.addEventListener('touchmove',function(e){
             //  cy = e.touches[0].clientY;
             //  if(cy-oy>400){
             //      document.documentElement.addEventListener('touchend',function(){
             //        setTimeout($('.part2').hide(),1000);
             //        setTimeout($('.part1').show(),0);
             //      });
             //  }
             // });
          }
        }
   });

  //点击图片使其放大

    $.fn.ImgZoomIn = function () {
   
    bgstr = '<div id="ImgZoomInBG" style=" background:#000000; position:fixed; left:0; top:0; z-index:10000; width:100%; height:100%; display:none;"><iframe src="about:blank" frameborder="5px" scrolling="yes" style="width:100%; height:100%;"></iframe></div>';
    //alert($(this).attr('src'));
    imgstr = '<img id="ImgZoomInImage" src="' + $(this).attr('src')+'" onclick=$(\'#ImgZoomInImage\').hide();$(\'#ImgZoomInBG\').hide(); style="cursor:pointer; display:none; position:absolute; z-index:10001;" />';
    if ($('#ImgZoomInBG').length < 1) {
      $('body').append(bgstr);
    }
    if ($('#ImgZoomInImage').length < 1) {
     $('body').append(imgstr);
    }
    else {
      $('#ImgZoomInImage').attr('src', $(this).attr('src'));
    }
    $('#ImgZoomInImage').css('width',"100%");
    // $('#ImgZoomInImage').css('height',"56.221889%");
    // $('#ImgZoomInImage').css('left', $(window).scrollLeft() + ($(window).width() - $('#ImgZoomInImage').width()) / 2);
    $('#ImgZoomInImage').css('left',0); 
    $('#ImgZoomInImage').css('top', $(window).scrollTop() + ($(window).height() - $('#ImgZoomInImage').height()) / 2);
    $('#ImgZoomInBG').show();
    $('#ImgZoomInImage').show();
  };
     
    $(".bigger").bind("click", function () {
      $(this).ImgZoomIn();
    });
 

});