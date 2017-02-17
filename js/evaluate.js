$(function(){
//评价页tab卡
	  $(".evaluate-lables li").click(function(){
	  	if($(this).hasClass("evaluate-bad")){
	  		$(this).addClass("evaluate-bad-on").siblings().removeClass("lables-on");
	  	}else{
	  		 $(this).addClass("lables-on").siblings().removeClass("lables-on").removeClass("evaluate-bad-on");
	  	}	 

	  	if(event.target.nodeName == $(".evaluate-lables li")[$(this).index()].nodeName){
			$(".evt-con ul").eq($(this).index()).show().siblings().hide();
		}

	});

	//判断何时返回顶部
	 window.onscroll=function(){
	    if($(document.body).scrollTop()>30){
	    	//判断除首页外的另两页滚动超过范围时，则出现“返回顶部”按钮（即首页永远不显示“返回顶部”按钮）
	    	if(($(".tab-con").eq(0).attr("style").indexOf("block"))!=(-1)){
	         	$('#return-top').hide();
	    	}else{
	    		$('#return-top').show();
	    	}

	    }else{
	         $('#return-top').hide();
	    }
	} 
//点击返回顶部按钮，返回顶部
	$('#return-top').click(function(){
		if(($(".tab-con").eq(1).attr("style").indexOf("block"))!=(-1)){
	   	 	scroll('50px', 300);
	    }else{
	    	scroll('0px',300);
	    }
	});
	function scroll(scrollTo, time) {
	    var scrollFrom = parseInt(document.body.scrollTop),
	        i = 0,
	        runEvery = 5; // run every 5ms

	    scrollTo = parseInt(scrollTo);
	    time /= runEvery;

	    var interval = setInterval(function () {
	        i++;

	        document.body.scrollTop = (scrollTo - scrollFrom) / time * i + scrollFrom;

	        if (i >= time) {
	            clearInterval(interval);
	        }
	    }, runEvery);
	}

//为评价区的图片加“bigger”类
	var pic = $(".evt-con ul li img");
	for(var i=0;i<pic.length;i++){
		$(".evt-con img").eq(i).addClass("bigger");
	}
	 $(".bigger").bind("click", function () {
      $(this).ImgZoomIn();
    });
 


});
