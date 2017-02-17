$(function(){
	$("#head-hd a").click(function(){
		if(event.target.nodeName == $("#head-hd a")[$(this).index()].nodeName){
			$(".tab-con").eq($(this).index()).show().siblings().hide();
			$("#head-hd a").eq($(this).index()).addClass("selected").siblings().removeClass("selected");
			if($(this).index()==0){
				$(".part1").show();
				$(".part2").hide();
			}
		}

	});

});

