!function(a){"object"==typeof module&&"object"==typeof module.exports?a(require("jquery")):"function"==typeof define&&define.amd?define([],a(window.jQuery)):a(window.jQuery)}(function(a){return a?(a.Unslider=function(b,c){var d=this;return d._="wprs_unslider",d.defaults={autoplay:!1,delay:3e3,speed:750,easing:"swing",keys:{prev:37,next:39},nav:!0,arrows:{prev:'<span class="'+d._+'-arrow prev">Prev</span>',next:'<span class="'+d._+'-arrow next">Next</span>'},animation:"horizontal",selectors:{container:"ul:first",slides:"li"},animateHeight:!1,activeClass:d._+"-active",swipe:!0,swipeThreshold:.2},d.$context=b,d.options={},d.$parent=null,d.$container=null,d.$slides=null,d.$nav=null,d.$arrows=[],d.total=0,d.current=0,d.prefix=d._+"-",d.eventSuffix="."+d.prefix+~~(2e3*Math.random()),d.interval=null,d.init=function(b){return d.options=a.extend({},d.defaults,b),d.$container=d.$context.find(d.options.selectors.container).addClass(d.prefix+"wrap"),d.$slides=d.$container.children(d.options.selectors.slides),d.setup(),a.each(["nav","arrows","keys","infinite"],function(b,c){d.options[c]&&d["init"+a._ucfirst(c)]()}),jQuery.event.special.swipe&&d.options.swipe&&d.initSwipe(),d.options.autoplay&&d.start(),d.calculateSlides(),d.$context.trigger(d._+".ready"),d.animate(d.options.index||d.current,"init")},d.setup=function(){d.$context.addClass(d.prefix+d.options.animation).wrap('<div class="'+d._+'" />'),d.$parent=d.$context.parent("."+d._);var a=d.$context.css("position");"static"===a&&d.$context.css("position","relative"),d.$context.css("overflow","hidden")},d.calculateSlides=function(){if(d.$slides=d.$container.children(d.options.selectors.slides),d.total=d.$slides.length,"fade"!==d.options.animation){var a="width";"vertical"===d.options.animation&&(a="height"),d.$container.css(a,100*d.total+"%").addClass(d.prefix+"carousel"),d.$slides.css(a,100/d.total+"%")}},d.start=function(){return d.interval=setTimeout(function(){d.next()},d.options.delay),d},d.stop=function(){return clearTimeout(d.interval),d},d.initNav=function(){var b=a('<nav class="'+d.prefix+'nav"><ol /></nav>');d.$slides.each(function(c){var e=this.getAttribute("data-nav")||c+1;a.isFunction(d.options.nav)&&(e=d.options.nav.call(d.$slides.eq(c),c,e)),b.children("ol").append('<li data-slide="'+c+'">'+e+"</li>")}),d.$nav=b.insertAfter(d.$context),d.$nav.find("li").on("click"+d.eventSuffix,function(){var b=a(this).addClass(d.options.activeClass);b.siblings().removeClass(d.options.activeClass),d.animate(b.attr("data-slide"))})},d.initArrows=function(){d.options.arrows===!0&&(d.options.arrows=d.defaults.arrows),a.each(d.options.arrows,function(b,c){d.$arrows.push(a(c).insertAfter(d.$context).on("click"+d.eventSuffix,d[b]))})},d.initKeys=function(){d.options.keys===!0&&(d.options.keys=d.defaults.keys),a(document).on("keyup"+d.eventSuffix,function(b){a.each(d.options.keys,function(c,e){b.which===e&&a.isFunction(d[c])&&d[c].call(d)})})},d.initSwipe=function(){var a=d.$slides.width();"fade"!==d.options.animation&&d.$container.on({movestart:function(a){return a.distX>a.distY&&a.distX<-a.distY||a.distX<a.distY&&a.distX>-a.distY?!!a.preventDefault():void d.$container.css("position","relative")},move:function(b){d.$container.css("left",-(100*d.current)+100*b.distX/a+"%")},moveend:function(b){Math.abs(b.distX)/a>d.options.swipeThreshold?d[b.distX<0?"next":"prev"]():d.$container.animate({left:-(100*d.current)+"%"},d.options.speed/2)}})},d.initInfinite=function(){var b=["first","last"];a.each(b,function(a,c){d.$slides.push.apply(d.$slides,d.$slides.filter(':not(".'+d._+'-clone")')[c]().clone().addClass(d._+"-clone")["insert"+(0===a?"After":"Before")](d.$slides[b[~~!a]]()))})},d.destroyArrows=function(){a.each(d.$arrows,function(a,b){b.remove()})},d.destroySwipe=function(){d.$container.off("movestart move moveend")},d.destroyKeys=function(){a(document).off("keyup"+d.eventSuffix)},d.setIndex=function(a){return a<0&&(a=d.total-1),d.current=Math.min(Math.max(0,a),d.total-1),d.options.nav&&d.$nav.find('[data-slide="'+d.current+'"]')._active(d.options.activeClass),d.$slides.eq(d.current)._active(d.options.activeClass),d},d.animate=function(b,c){if("first"===b&&(b=0),"last"===b&&(b=d.total),isNaN(b))return d;d.options.autoplay&&d.stop().start(),d.setIndex(b),d.$context.trigger(d._+".change",[b,d.$slides.eq(b)]);var e="animate"+a._ucfirst(d.options.animation);return a.isFunction(d[e])&&d[e](d.current,c),d},d.next=function(){var a=d.current+1;return a>=d.total&&(a=0),d.animate(a,"next")},d.prev=function(){return d.animate(d.current-1,"prev")},d.animateHorizontal=function(a){var b="left";return"rtl"===d.$context.attr("dir")&&(b="right"),d.options.infinite&&d.$container.css("margin-"+b,"-100%"),d.slide(b,a)},d.animateVertical=function(a){return d.options.animateHeight=!0,d.options.infinite&&d.$container.css("margin-top",-d.$slides.outerHeight()),d.slide("top",a)},d.slide=function(a,b){if(d.animateHeight(b),d.options.infinite){var c;b===d.total-1&&(c=d.total-3,b=-1),b===d.total-2&&(c=0,b=d.total-2),"number"==typeof c&&(d.setIndex(c),d.$context.on(d._+".moved",function(){d.current===c&&d.$container.css(a,-(100*c)+"%").off(d._+".moved")}))}var e={};return e[a]=-(100*b)+"%",d._move(d.$container,e)},d.animateFade=function(a){d.animateHeight(a);var b=d.$slides.eq(a).addClass(d.options.activeClass);d._move(b.siblings().removeClass(d.options.activeClass),{opacity:0}),d._move(b,{opacity:1},!1)},d.animateHeight=function(a){d.options.animateHeight&&d._move(d.$context,{height:d.$slides.eq(a).outerHeight()},!1)},d._move=function(a,b,c,e){return c!==!1&&(c=function(){d.$context.trigger(d._+".moved")}),a._move(b,e||d.options.speed,d.options.easing,c)},d.init(c)},a.fn._active=function(a){return this.addClass(a).siblings().removeClass(a)},a._ucfirst=function(a){return(a+"").toLowerCase().replace(/^./,function(a){return a.toUpperCase()})},a.fn._move=function(){return this.stop(!0,!0),a.fn[a.fn.velocity?"velocity":"animate"].apply(this,arguments)},void(a.fn.wprs_unslider=function(b){return this.each(function(c,d){var e=a(d),f=a(d).data("wprs_unslider");if(!(f instanceof a.Unslider)){if("string"==typeof b&&e.data("wprs_unslider")){b=b.split(":");var g=e.data("wprs_unslider")[b[0]];if(a.isFunction(g))return g.apply(e,b[1]?b[1].split(","):null)}return e.data("wprs_unslider",new a.Unslider(e,b))}})})):console.warn("Unslider needs jQuery")});

!function(e){"function"==typeof define&&define.amd?define([],e):"undefined"!=typeof module&&null!==module&&module.exports?module.exports=e:e()}(function(){var i=Object.assign||window.jQuery&&jQuery.extend,r=8,a=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(e,t){return window.setTimeout(function(){e()},25)},n={textarea:!0,input:!0,select:!0,button:!0},o={move:"mousemove",cancel:"mouseup dragstart",end:"mouseup"},c={move:"touchmove",cancel:"touchend",end:"touchend"},d=/\s+/;window.Symbol||function(e){"use strict";var t=Object.defineProperty,n="__symbol-"+Math.ceil(1e9*Math.random())+"-",i=0;function o(e){if(!(this instanceof o))return new o(e);e=n+i++;this._symbol=e}t(o.prototype,"toString",{enumerable:!1,configurable:!1,writable:!1,value:function(){return this._symbol}}),e.Symbol=o}(this);var u,m={bubbles:!0,cancelable:!0},t=Symbol("events");function s(e){return e[t]||(e[t]={})}function f(e,t,n,i){if(void 0!==e.addEventListener){t=t.split(d);var o,a=s(e),c=t.length;function u(e){n(e,i)}for(;c--;)(a[o=t[c]]||(a[o]=[])).push([n,u]),e.addEventListener(o,u)}}function v(e,t,n){t=t.split(d);var i,o,a,c=s(e),u=t.length;if(c)for(;u--;)if(o=c[i=t[u]])for(a=o.length;a--;)o[a][0]===n&&(e.removeEventListener(i,o[a][1]),o.splice(a,1))}function l(e,t,n){t=new CustomEvent(t,m);n&&i(t,n),e.dispatchEvent(t)}function g(e){var n=e,i=!1,o=!1;function t(e){i?(n(),a(t),i=!(o=!0)):o=!1}this.kick=function(e){i=!0,o||t()},this.end=function(e){var t=n;e&&(o?(n=i?function(){t(),e()}:e,i=!0):e())}}function p(){}function h(e){e.preventDefault()}function X(e,t){var n,i;if(e.identifiedTouch)return e.identifiedTouch(t);for(n=-1,i=e.length;++n<i;)if(e[n].identifier===t)return e[n]}function Y(e,t){e=X(e.changedTouches,t.identifier);if(e&&(e.pageX!==t.pageX||e.pageY!==t.pageY))return e}function y(e,t){S(e,t,e,b)}function w(e,t){b()}function b(){v(document,o.move,y),v(document,o.cancel,w)}function T(e){v(document,c.move,e.touchmove),v(document,c.cancel,e.touchend)}function S(e,t,n,i){var o,a,c=n.pageX-t.pageX,u=n.pageY-t.pageY;c*c+u*u<r*r||(a=t,t=n,n=c,c=u,u=i,i=(o=e).targetTouches,e=o.timeStamp-a.timeStamp,i={altKey:o.altKey,ctrlKey:o.ctrlKey,shiftKey:o.shiftKey,startX:a.pageX,startY:a.pageY,distX:n,distY:c,deltaX:n,deltaY:c,pageX:t.pageX,pageY:t.pageY,velocityX:n/e,velocityY:c/e,identifier:a.identifier,targetTouches:i,finger:i?i.length:1,enableMove:function(){this.moveEnabled=!0,this.enableMove=p,o.preventDefault()}},l(a.target,"movestart",i),u(a))}function k(e,t){var n=t.timer;t.touch=e,t.timeStamp=e.timeStamp,n.kick()}function j(e,t){var n=t.target,i=t.event,t=t.timer;v(document,o.move,k),v(document,o.end,j),K(n,i,t,function(){setTimeout(function(){v(n,"click",h)},0)})}function E(e,t){var n=t.target,i=t.event,o=t.timer;X(e.changedTouches,i.identifier)&&(t=t,v(document,c.move,t.activeTouchmove),v(document,c.end,t.activeTouchend),K(n,i,o))}function K(e,t,n,i){n.end(function(){return l(e,"moveend",t),i&&i()})}function e(e){e.enableMove()}function M(e){e.enableMove()}function Q(e){e.enableMove()}function q(e){var i=e.handler;e.handler=function(e){for(var t,n=u.length;n--;)e[t=u[n]]=e.originalEvent[t];i.apply(this,arguments)}}f(document,"mousedown",function(e){var t;1!==(t=e).which||t.ctrlKey||t.altKey||n[e.target.tagName.toLowerCase()]||(f(document,o.move,y,e),f(document,o.cancel,w,e))}),f(document,"touchstart",function(e){n[e.target.tagName.toLowerCase()]||(e={target:(e=e.changedTouches[0]).target,pageX:e.pageX,pageY:e.pageY,identifier:e.identifier,touchmove:function(e,t){var n;(t=Y(n=e,e=t))&&S(n,e,t,T)},touchend:function(e,t){t=t,X(e.changedTouches,t.identifier)&&T(t)}},f(document,c.move,e.touchmove,e),f(document,c.cancel,e.touchend,e))}),f(document,"movestart",function(e){var t,n;e.defaultPrevented||e.moveEnabled&&(t={startX:e.startX,startY:e.startY,pageX:e.pageX,pageY:e.pageY,distX:e.distX,distY:e.distY,deltaX:e.deltaX,deltaY:e.deltaY,velocityX:e.velocityX,velocityY:e.velocityY,identifier:e.identifier,targetTouches:e.targetTouches,finger:e.finger},n={target:e.target,event:t,timer:new g(function(e){(function(e,t,n){n-=e.timeStamp,e.distX=t.pageX-e.startX,e.distY=t.pageY-e.startY,e.deltaX=t.pageX-e.pageX,e.deltaY=t.pageY-e.pageY,e.velocityX=.3*e.velocityX+.7*e.deltaX/n,e.velocityY=.3*e.velocityY+.7*e.deltaY/n,e.pageX=t.pageX,e.pageY=t.pageY})(t,n.touch,n.timeStamp),l(n.target,"move",t)}),touch:void 0,timeStamp:e.timeStamp},void 0===e.identifier?(f(e.target,"click",h),f(document,o.move,k,n),f(document,o.end,j,n)):(n.activeTouchmove=function(e,t){var n,i,o;n=e,o=(i=t).event,e=i.timer,(t=Y(n,o))&&(n.preventDefault(),o.targetTouches=n.targetTouches,i.touch=t,i.timeStamp=n.timeStamp,e.kick())},n.activeTouchend=function(e,t){E(e,t)},f(document,c.move,n.activeTouchmove,n),f(document,c.end,n.activeTouchend,n)))}),window.jQuery&&(u="startX startY pageX pageY distX distY deltaX deltaY velocityX velocityY".split(" "),jQuery.event.special.movestart={setup:function(){return f(this,"movestart",e),!1},teardown:function(){return v(this,"movestart",e),!1},add:q},jQuery.event.special.move={setup:function(){return f(this,"movestart",M),!1},teardown:function(){return v(this,"movestart",M),!1},add:q},jQuery.event.special.moveend={setup:function(){return f(this,"movestart",Q),!1},teardown:function(){return v(this,"movestart",Q),!1},add:q})});

void 0!==jQuery.event.swipe||function(e){"function"==typeof define&&define.amd?define(["jquery",void 0,"jquery.event.move"],e):"undefined"!=typeof module&&null!==module&&module.exports?module.exports=e:e(jQuery)}(function(e,t){var i=e.event.add,s=e.event.remove,n=function(t,i,s){e.event.trigger(i,s,t)},r={threshold:.4,sensitivity:6};function d(e){var t,i,s;t=e.currentTarget.offsetWidth,i=e.currentTarget.offsetHeight,s={distX:e.distX,distY:e.distY,velocityX:e.velocityX,velocityY:e.velocityY,finger:e.finger},e.distX>e.distY?e.distX>-e.distY?(e.distX/t>r.threshold||e.velocityX*e.distX/t*r.sensitivity>1)&&(s.type="swiperight",n(e.currentTarget,s)):(-e.distY/i>r.threshold||e.velocityY*e.distY/t*r.sensitivity>1)&&(s.type="swipeup",n(e.currentTarget,s)):e.distX>-e.distY?(e.distY/i>r.threshold||e.velocityY*e.distY/t*r.sensitivity>1)&&(s.type="swipedown",n(e.currentTarget,s)):(-e.distX/t>r.threshold||e.velocityX*e.distX/t*r.sensitivity>1)&&(s.type="swipeleft",n(e.currentTarget,s))}function o(t){var i=e.data(t,"event_swipe");return i||(i={count:0},e.data(t,"event_swipe",i)),i}e.event.special.swipe=e.event.special.swipeleft=e.event.special.swiperight=e.event.special.swipeup=e.event.special.swipedown={setup:function(e,t,s){if(!(o(this).count++>0))return i(this,"moveend",d),!0},teardown:function(){if(!(--o(this).count>0))return s(this,"moveend",d),!0},settings:r}});


(function( $ ) {
	'use strict';

	//document ready
	$(function(){
		
		//only show one review per a slide on mobile
		//get the attribute if it is set and this is in fact a slider
		$(".wprev-slider").each(function(){
			var oneonmobile = $(this).attr( "data-onemobil" );
			if(oneonmobile=='yes'){
				if (/Mobi|Android/i.test(navigator.userAgent) || $(window).width()<600) {
					/* this is a mobile device, continue */
					//get all the slider li elements, each li is a slide
					var li_elements_old = $(this).children('ul');
					console.log(li_elements_old);
					if(li_elements_old.length>0){
						//get array of all the divs containing the individual slide
						var divrevs = li_elements_old.find('.w3_wprs-col');
						var divrevarray = divrevs.get();
						//get the classes of the 2 divs under the li
						var div1class = divrevs.parent().attr('class');
						var div2class = divrevs.attr('class');
						console.log("div2class: "+div2class);
						//only continue if finding the divs
						if(typeof div2class !== "undefined"){
							//remove the l2, l3, l4, l5 , l6
							div2class = div2class.replace(/[a-z]\d\b/g, 'l12');
							//use the divrevarray to make new li elements with one review in each
							var newulhtml = '';
							var i;
							for (i = 0; i < divrevarray.length; i++) { 
								if(i==0){
									newulhtml += '<li class="wprs_unslider-active"><div class="'+div1class+'"><div class="'+div2class+'">'+divrevarray[i].innerHTML + '</div></div></li>';
								} else {
									newulhtml += '<li><div class="'+div1class+'"><div class="'+div2class+'">'+divrevarray[i].innerHTML + '</div></div></li>';
								}
							}
							//add the load more button if found
							if($(this).find('.wprevpro_load_more_div')[0]!== undefined){
								newulhtml += '<li>'+$(this).find('.wprevpro_load_more_div')[0].outerHTML+'</li>';
							}
							newulhtml +='';
							//replace the old li with the new
							li_elements_old.html(newulhtml);
							//re-initialize the slider if we need to
						}
					}
				}
			}
		});
		//}
		//----------------------
	 
			
			$( ".wprs_rd_more" ).click(function() {
				$(this ).hide();
				$(this ).next("span").show(0, function() {
					// Animation complete.
					$(this ).css('opacity', '1.0');
				  });
				//$(this ).next("span").css('opacity', '1.0');
				
				//change height of wprev-slider-widget
				$(this ).closest( ".wprev-slider-widget" ).css( "height", "auto" );
				
				//change height of wprev-slider
				$(this ).closest( ".wprev-slider" ).css( "height", "auto" );

			});
			
			//check to see if we need to create slider;
			$( ".wprev-slider" ).each(function( index ) {
				createaslider(this,'shortcode');
			});
			$( ".wprev-slider-widget" ).each(function( index ) {
				createaslider(this,'widget');
			});
			
			function createaslider(thissliderdiv,type){
				
				var sliderhideprevnext = $(thissliderdiv).attr( "data-sliderhideprevnext" );
				var sliderhidedots = $(thissliderdiv).attr( "data-sliderhidedots" );
				var sliderautoplay = $(thissliderdiv).attr( "data-sliderautoplay" );
				var slidespeed = $(thissliderdiv).attr( "data-slidespeed" );
				var slideautodelay = $(thissliderdiv).attr( "data-slideautodelay" );
				var sliderfixedheight = $(thissliderdiv).attr( "data-sliderfixedheight" );
				var revsameheight = $(thissliderdiv).attr( "data-revsameheight" );
				
				var showarrows = true;
				if(sliderhideprevnext=="yes"){
					var showarrows = false;
				}
				var shownav = true;
				if(sliderhidedots=="yes"){
					var shownav = false;
				}
				var sautoplay = false;
				if(sliderautoplay=="yes"){
					var sautoplay = true;
				}
				var sspeed = parseFloat(slidespeed) * 1000;
				var sdelay = parseFloat(slideautodelay) * 1000;
				if(sdelay<sspeed){
					sdelay = sspeed;
				}
				var sanimate = true;
				if(sliderfixedheight=="yes"){
					sanimate = false;
				}

				//unhide other rows.
				$( thissliderdiv ).find('li').show();
				var slider = $( thissliderdiv ).wprs_unslider(
						{
						autoplay:sautoplay,
						infinite:false,
						delay: sdelay,
						speed: sspeed,
						animation: 'horizontal',
						arrows: showarrows,
						nav:shownav,
						animateHeight: sanimate,
						activeClass: 'wprs_unslider-active',
						}
					);
				
				//close read more on advance
				slider.on('wprs_unslider.change', function(event, index, slide) {
					$(thissliderdiv).find('.wprs_rd_more').show();
					$(thissliderdiv).find('.wprs_rd_more').next("span").css('opacity', '0');
					setTimeout(function () {
					  $(thissliderdiv).find('.wprs_rd_more').next("span").hide(500);
					}, 400);
				});
				
				if(sanimate==true){
				setTimeout(function(){ 
					//height of active slide
					var firstheight = $(thissliderdiv).find('.wprs_unslider-active').height();
					$(thissliderdiv).css( 'height', firstheight );
					$(thissliderdiv).find("li.wprevnextslide").removeClass('wprevnextslide');
				}, 500);
				}
				

				
				if(sautoplay==true){
					slider.on('mouseover', function() {slider.data('wprs_unslider').stop();}).on('mouseout', function() {slider.data('wprs_unslider').start();});
				}
				
				//force height if set
				if(revsameheight=='yes'){
					var maxheights = $(thissliderdiv).find(".indrevdiv").map(function (){return $(this).outerHeight();}).get();
					var maxHeightofslide = Math.max.apply(null, maxheights);if(maxHeightofslide>0){$(thissliderdiv).find(".indrevdiv").css( "min-height", maxHeightofslide );}
				}
				
								
			};
			
			
		//simple tooltip for added elements and mobile devices
		$(".wprevpro_t1_outer_div").on('mouseenter touchstart', '.wprevtooltip', function(e) {
			var titleText = $(this).attr('data-wprevtooltip');
			$(this).data('tiptext', titleText).removeAttr('data-wprevtooltip');
			$('<p class="wprevpro_tooltip"></p>').text(titleText).appendTo('body').css('top', (e.pageY - 15) + 'px').css('left', (e.pageX + 10) + 'px').fadeIn('slow');
		});
		$(".wprevpro_t1_outer_div").on('mouseleave touchend', '.wprevtooltip', function(e) {
			$(this).attr('data-wprevtooltip', $(this).data('tiptext'));
			$('.wprevpro_tooltip').remove();
		});
		$(".wprevpro_t1_outer_div").on('mousemove', '.wprevtooltip', function(e) {
			$('.wprevpro_tooltip').css('top', (e.pageY - 15) + 'px').css('left', (e.pageX + 10) + 'px');
		});
		
		//going to search for media added to reviews and load lity if we find them.
		setTimeout(function(){ mediareviewpopup(); }, 1000);
		function mediareviewpopup(){
			var mediadiv = $(".wprev_media_div");
			//var mediadiv = $(document.getElementsByClassName("wprev_media_div"));
			if(mediadiv.length){
				//load js and css files.
				//console.log(wprevpublicjs_script_vars);
				/*
				$('<link/>', {
				   rel: 'stylesheet',
				   type: 'text/css',
				   href: wprevpublicjs_script_vars.wprevpluginsurl+"/public/css/lity.min.css"
				}).appendTo('head');
				*/
				//$.getScript(wprevpublicjs_script_vars.wprevpluginsurl+"/public/js/lity.min.js", function() {
					//script is loaded and ran on document root.
				//});
				$.getScript(wprevpublicjs_script_vars.wprevpluginsurl+"/public/js/fslightbox.js", function() {
					//script is loaded and ran on document root.
				});
				//setTimeout(function(){ refreshFsLightbox(); }, 1000);
			}

		}
		missingimgcheck();
		function missingimgcheck(){
			//remove images from the dom
		  $('img.wprev_media_img').each(function () {
			var $img = $(this);

			// Remove immediately if already broken
			if (!this.complete || this.naturalWidth === 0) {
			  $img.remove();
			  return; // skip binding error event
			}

			// Remove if load fails after DOM ready
			$img.on('error', function () {
			  $img.remove();
			});
		  });
		}

		
			


		
	});

})( jQuery );
