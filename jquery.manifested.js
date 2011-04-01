(function($, undefined) {
	
$.fn.manifested = function(options) {
    var manifested = this.data('manifested');

    if (!manifested) {
        options = $.extend({}, $.fn.manifested.defaults, options);
        this.data(new Manifested(this, options));
    }

    return this;
};

$.fn.manifested.defaults = {
	direction:  'TB',
    timer:      0,
    speed:      1000,
    manifested: false,
    height:     100,
    color:      '#fff',
    maskID:     'manifestedMask',
    wrapID:     'manifestedWrap'
};

function Manifested(element, options) {
	this.element = element;
	this.options = options;
    
    if (typeof(this.options.manifested) == 'object' &&
        this.options.manifested.jquery !== undefined) {
    	this.manifested = this.options.manifested;
    } else if (typeof(this.options.manifested) == 'object' &&
               this.options.manifested.tagName !== undefined) {
    	this.manifested = $(this.options.manifested);
    } else if (typeof(this.options.manifested) == 'string') {
    	this.manifested = $(this.options.manifested);
    } else {
    	this.alert('Set the DOM selector for manifested effect!');
    	return false;    	
    }
    
	this.manifested.css({
		overflow: "hidden",
		position: "relative",
		display: "block"
	});
    
	this.manifested.html($('<div id="' + this.options.wrapID + '">' + $(this.manifested).html() + '</div>'));
	
	this.wrap = this.manifested.find('#' + this.options.wrapID + '');
	this.wrap.css({
		position: "absolute",
		zIndex:   1001,
		overflow: "hidden"
	});
	
    var self = this;
   
    this.onclick = function(event) {
    	self.processManifested();
    	return false;
    }
    
    this.preManifested();
    this.init();
}
/**
 * определяем положение и размеры блока,
 * к которому будет применен эффект
 * создаем маску
 */
Manifested.prototype.preManifested = function() {
	this.mask = $("<div id='" + this.options.maskID + "'></div>");
	
	this.params    = [this.manifested.offset().left, 
	                  this.manifested.offset().top, 
	                  this.manifested.width(),
	                  this.manifested.height()];
	
	this.makeMask();
}
/**
 * прикручиваем обработчик на клик
 */
Manifested.prototype.init = function() {
    if (this.element.get(0).addEventListener) {
    	this.element.get(0).addEventListener('click', this.onclick, false);
    } else {
    	this.element.get(0).onclick = this.onclick;
    }
};
/**
 * собсьвенно запускаемся
 */
Manifested.prototype.processManifested = function() {
	var self = this;
	
	if (!this.manifested.lock) {
		if (this.manifested.timerManifested) {
			clearTimeout(this.manifested.timerManifested);
			this.manifested.timerManifested = null;
			this.manifested.lock = false;
			return;			
		}
		setTimeout(function() {
			self.manifested.lock = true;
			self.beginMotionMask();			
		}, this.options.timer);
	} else {
		if (!this.manifested.timerManifested && this.manifested.lock) {
			this.manifested.timerManifested = setTimeout(function() {
				self.returnMotionMask();
				self.manifested.timerManifested = null;
				self.manifested.lock = false;
			}, this.options.timer);			
		}
	}
};
/**
 * создаем маску с учетом направления движения
 */
Manifested.prototype.makeMask = function() {
	this.manifested.append(this.mask);
	this.fillGradient(this.options.direction);
}
/**
 * заливаем маску градиентом с учетом направления движения
 * @param string direction   направление движения 
 * (TB - Top to Bottom, BT - Bottom to Top, LR - Left to Right, RL - Right to Left)
 */
Manifested.prototype.fillGradient = function(direction) {
	this.gradient = [];

	if (this.options.direction == 'TB') {
		this.gradient.variables = ["bottom", this.params[2], 1, {left: 0}, 
		                           {top: -this.options.height, left: 0, 
									width: this.params[2], height: this.options.height, 
									position: "relative"}];
		this.updateWrapSize(this.params[2], 0);
	} else if (this.options.direction == 'LR'){
		this.gradient.variables = ["right", 1, this.params[3], {top: 0}, 
		                           {top: 0, left: -this.options.height, 
									width: this.options.height, height: this.params[3], 
									position: "relative"}];
		this.updateWrapSize(0, this.params[3]);
	}	
	
	//  0         1          2     3                         4
	//[pos, div.width, div.height, {}, {top:, left:, width:, height:, position:relative}]
	for (step = 0; step <= this.options.height; step++) {
		var div = $("<div></div>");
		div.css({
			backgroundColor: this.options.color,
			opacity:  1 - (step / this.options.height),
			position: "absolute",
			zIndex:   1002,
			width:    this.gradient.variables[1],
			height:   this.gradient.variables[2]
		})
		.css(this.gradient.variables[3])
		.css(this.gradient.variables[0], step);		
		this.mask.append(div);
	}		
	
	this.mask.css(this.gradient.variables[4]);
}
/**
 * начинаем анимацию маски, учитывая направление двиижения
 */
Manifested.prototype.beginMotionMask = function() {
	if (this.options.direction == 'TB') {
		this.animateTB(false);
	} else if (this.options.direction == 'LR'){
		this.animateLR(false);
	}	
}
/**
 * возвращаем маску в исходное положение
 */
Manifested.prototype.returnMotionMask = function() {
	if (this.options.direction == 'TB') {
		this.animateTB(true);
	} else if (this.options.direction == 'LR'){
		this.animateLR(true);
	}
}

/**
 * TB 
 */
Manifested.prototype.animateTB = function(invert) {
	var self = this;
	
	this.mask.diff  = (invert ? 0                    : this.params[3] + this.options.height);	
	this.mask.start = (invert ? this.params[3]       : -this.options.height);
	this.mask.stop  = (invert ? -this.options.height : this.mask.diff - Math.abs(this.mask.start));
	
	this.wrap.animate({height: this.mask.diff}, this.options.speed);
	this.mask.animate({top: this.mask.stop}, this.options.speed, function() {
		invert = false;
	});	
	
}
/**
 * LR
 */
Manifested.prototype.animateLR = function(invert) {
	var self = this;
	
	this.mask.diff  = (invert ? 0                    : this.params[2] + this.options.height);	
	this.mask.start = (invert ? this.params[2]       : -this.options.height);
	this.mask.stop  = (invert ? -this.options.height : this.mask.diff - Math.abs(this.mask.start));
	
	this.wrap.animate({width: this.mask.diff}, this.options.speed);
	this.mask.animate({left: this.mask.stop}, this.options.speed, function() {
		invert = false;
	});
}
/**
 * обновляем размеры обвертки
 * @param int width
 * @param int height
 */
Manifested.prototype.updateWrapSize = function (width, height) {
    this.wrap.css({
		width: width, 
		height: height
	});   
}

/**
 * выводим сообщение об ошибке!
 * @param string text текст сообщения
 */
Manifested.prototype.alert = function(text) {
	alert(text);
}

})(jQuery);
