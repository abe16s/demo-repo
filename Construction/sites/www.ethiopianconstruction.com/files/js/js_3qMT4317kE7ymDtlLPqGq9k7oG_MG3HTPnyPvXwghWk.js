(function ($) {

Drupal.behaviors.textarea = {
  attach: function (context, settings) {
    $('.form-textarea-wrapper.resizable', context).once('textarea', function () {
      var staticOffset = null;
      var textarea = $(this).addClass('resizable-textarea').find('textarea');
      var grippie = $('<div class="grippie"></div>').mousedown(startDrag);

      grippie.insertAfter(textarea);

      function startDrag(e) {
        staticOffset = textarea.height() - e.pageY;
        textarea.css('opacity', 0.25);
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
        return false;
      }

      function endDrag(e) {
        $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
        textarea.css('opacity', 1);
      }
    });
  }
};

})(jQuery);
;

/**
 * JavaScript behaviors for the front-end display of webforms.
 */

(function ($) {

Drupal.behaviors.webform = Drupal.behaviors.webform || {};

Drupal.behaviors.webform.attach = function(context) {
  // Calendar datepicker behavior.
  Drupal.webform.datepicker(context);
};

Drupal.webform = Drupal.webform || {};

Drupal.webform.datepicker = function(context) {
  $('div.webform-datepicker').each(function() {
    var $webformDatepicker = $(this);
    var $calendar = $webformDatepicker.find('input.webform-calendar');

    // Ensure the page we're on actually contains a datepicker.
    if ($calendar.length == 0) { 
      return;
    }

    var startDate = $calendar[0].className.replace(/.*webform-calendar-start-(\d{4}-\d{2}-\d{2}).*/, '$1').split('-');
    var endDate = $calendar[0].className.replace(/.*webform-calendar-end-(\d{4}-\d{2}-\d{2}).*/, '$1').split('-');
    var firstDay = $calendar[0].className.replace(/.*webform-calendar-day-(\d).*/, '$1');
    // Convert date strings into actual Date objects.
    startDate = new Date(startDate[0], startDate[1] - 1, startDate[2]);
    endDate = new Date(endDate[0], endDate[1] - 1, endDate[2]);

    // Ensure that start comes before end for datepicker.
    if (startDate > endDate) {
      var laterDate = startDate;
      startDate = endDate;
      endDate = laterDate;
    }

    var startYear = startDate.getFullYear();
    var endYear = endDate.getFullYear();

    // Set up the jQuery datepicker element.
    $calendar.datepicker({
      dateFormat: 'yy-mm-dd',
      yearRange: startYear + ':' + endYear,
      firstDay: parseInt(firstDay),
      minDate: startDate,
      maxDate: endDate,
      onSelect: function(dateText, inst) {
        var date = dateText.split('-');
        $webformDatepicker.find('select.year, input.year').val(+date[0]).trigger('change');
        $webformDatepicker.find('select.month').val(+date[1]).trigger('change');
        $webformDatepicker.find('select.day').val(+date[2]).trigger('change');
      },
      beforeShow: function(input, inst) {
        // Get the select list values.
        var year = $webformDatepicker.find('select.year, input.year').val();
        var month = $webformDatepicker.find('select.month').val();
        var day = $webformDatepicker.find('select.day').val();

        // If empty, default to the current year/month/day in the popup.
        var today = new Date();
        year = year ? year : today.getFullYear();
        month = month ? month : today.getMonth() + 1;
        day = day ? day : today.getDate();

        // Make sure that the default year fits in the available options.
        year = (year < startYear || year > endYear) ? startYear : year;

        // jQuery UI Datepicker will read the input field and base its date off
        // of that, even though in our case the input field is a button.
        $(input).val(year + '-' + month + '-' + day);
      }
    });

    // Prevent the calendar button from submitting the form.
    $calendar.click(function(event) {
      $(this).focus();
      event.preventDefault();
    });
  });
}

})(jQuery);
;
/*!
 * jQuery blockUI plugin
 * Version 2.66.0-2013.10.09
 * Requires jQuery v1.7 or later
 *
 * Examples at: http://malsup.com/jquery/block/
 * Copyright (c) 2007-2013 M. Alsup
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Thanks to Amir-Hossein Sobhi for some excellent contributions!
 */

;(function() {
  /*jshint eqeqeq:false curly:false latedef:false */
  "use strict";

  function setup($) {
    $.fn._fadeIn = $.fn.fadeIn;

    var noOp = $.noop || function() {};

    // this bit is to ensure we don't call setExpression when we shouldn't (with extra muscle to handle
    // confusing userAgent strings on Vista)
    var msie = /MSIE/.test(navigator.userAgent);
    var ie6  = /MSIE 6.0/.test(navigator.userAgent) && ! /MSIE 8.0/.test(navigator.userAgent);
    var mode = document.documentMode || 0;
    var setExpr = $.isFunction( document.createElement('div').style.setExpression );

    // global $ methods for blocking/unblocking the entire page
    $.blockUI   = function(opts) { install(window, opts); };
    $.unblockUI = function(opts) { remove(window, opts); };

    // convenience method for quick growl-like notifications  (http://www.google.com/search?q=growl)
    $.growlUI = function(title, message, timeout, onClose) {
      var $m = $('<div class="growlUI"></div>');
      if (title) $m.append('<h1>'+title+'</h1>');
      if (message) $m.append('<h2>'+message+'</h2>');
      if (timeout === undefined) timeout = 3000;

      // Added by konapun: Set timeout to 30 seconds if this growl is moused over, like normal toast notifications
      var callBlock = function(opts) {
        opts = opts || {};

        $.blockUI({
          message: $m,
          fadeIn : typeof opts.fadeIn  !== 'undefined' ? opts.fadeIn  : 700,
          fadeOut: typeof opts.fadeOut !== 'undefined' ? opts.fadeOut : 1000,
          timeout: typeof opts.timeout !== 'undefined' ? opts.timeout : timeout,
          centerY: false,
          showOverlay: false,
          onUnblock: onClose,
          css: $.blockUI.defaults.growlCSS
        });
      };

      callBlock();
      var nonmousedOpacity = $m.css('opacity');
      $m.mouseover(function() {
        callBlock({
          fadeIn: 0,
          timeout: 30000
        });

        var displayBlock = $('.blockMsg');
        displayBlock.stop(); // cancel fadeout if it has started
        displayBlock.fadeTo(300, 1); // make it easier to read the message by removing transparency
      }).mouseout(function() {
          $('.blockMsg').fadeOut(1000);
        });
      // End konapun additions
    };

    // plugin method for blocking element content
    $.fn.block = function(opts) {
      if ( this[0] === window ) {
        $.blockUI( opts );
        return this;
      }
      var fullOpts = $.extend({}, $.blockUI.defaults, opts || {});
      this.each(function() {
        var $el = $(this);
        if (fullOpts.ignoreIfBlocked && $el.data('blockUI.isBlocked'))
          return;
        $el.unblock({ fadeOut: 0 });
      });

      return this.each(function() {
        if ($.css(this,'position') == 'static') {
          this.style.position = 'relative';
          $(this).data('blockUI.static', true);
        }
        this.style.zoom = 1; // force 'hasLayout' in ie
        install(this, opts);
      });
    };

    // plugin method for unblocking element content
    $.fn.unblock = function(opts) {
      if ( this[0] === window ) {
        $.unblockUI( opts );
        return this;
      }
      return this.each(function() {
        remove(this, opts);
      });
    };

    $.blockUI.version = 2.66; // 2nd generation blocking at no extra cost!

    // override these in your code to change the default behavior and style
    $.blockUI.defaults = {
      // message displayed when blocking (use null for no message)
      message:  '<h1>Please wait...</h1>',

      title: null,		// title string; only used when theme == true
      draggable: true,	// only used when theme == true (requires jquery-ui.js to be loaded)

      theme: false, // set to true to use with jQuery UI themes

      // styles for the message when blocking; if you wish to disable
      // these and use an external stylesheet then do this in your code:
      // $.blockUI.defaults.css = {};
      css: {
        padding:	0,
        margin:		0,
        width:		'30%',
        top:		'40%',
        left:		'35%',
        textAlign:	'center',
        color:		'#000',
        border:		'3px solid #aaa',
        backgroundColor:'#fff',
        cursor:		'wait'
      },

      // minimal style set used when themes are used
      themedCSS: {
        width:	'30%',
        top:	'40%',
        left:	'35%'
      },

      // styles for the overlay
      overlayCSS:  {
        backgroundColor:	'#000',
        opacity:			0.6,
        cursor:				'wait'
      },

      // style to replace wait cursor before unblocking to correct issue
      // of lingering wait cursor
      cursorReset: 'default',

      // styles applied when using $.growlUI
      growlCSS: {
        width:		'350px',
        top:		'10px',
        left:		'',
        right:		'10px',
        border:		'none',
        padding:	'5px',
        opacity:	0.6,
        cursor:		'default',
        color:		'#fff',
        backgroundColor: '#000',
        '-webkit-border-radius':'10px',
        '-moz-border-radius':	'10px',
        'border-radius':		'10px'
      },

      // IE issues: 'about:blank' fails on HTTPS and javascript:false is s-l-o-w
      // (hat tip to Jorge H. N. de Vasconcelos)
      /*jshint scripturl:true */
      iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank',

      // force usage of iframe in non-IE browsers (handy for blocking applets)
      forceIframe: false,

      // z-index for the blocking overlay
      baseZ: 1000,

      // set these to true to have the message automatically centered
      centerX: true, // <-- only effects element blocking (page block controlled via css above)
      centerY: true,

      // allow body element to be stetched in ie6; this makes blocking look better
      // on "short" pages.  disable if you wish to prevent changes to the body height
      allowBodyStretch: true,

      // enable if you want key and mouse events to be disabled for content that is blocked
      bindEvents: true,

      // be default blockUI will supress tab navigation from leaving blocking content
      // (if bindEvents is true)
      constrainTabKey: true,

      // fadeIn time in millis; set to 0 to disable fadeIn on block
      fadeIn:  200,

      // fadeOut time in millis; set to 0 to disable fadeOut on unblock
      fadeOut:  400,

      // time in millis to wait before auto-unblocking; set to 0 to disable auto-unblock
      timeout: 0,

      // disable if you don't want to show the overlay
      showOverlay: true,

      // if true, focus will be placed in the first available input field when
      // page blocking
      focusInput: true,

      // elements that can receive focus
      focusableElements: ':input:enabled:visible',

      // suppresses the use of overlay styles on FF/Linux (due to performance issues with opacity)
      // no longer needed in 2012
      // applyPlatformOpacityRules: true,

      // callback method invoked when fadeIn has completed and blocking message is visible
      onBlock: null,

      // callback method invoked when unblocking has completed; the callback is
      // passed the element that has been unblocked (which is the window object for page
      // blocks) and the options that were passed to the unblock call:
      //	onUnblock(element, options)
      onUnblock: null,

      // callback method invoked when the overlay area is clicked.
      // setting this will turn the cursor to a pointer, otherwise cursor defined in overlayCss will be used.
      onOverlayClick: null,

      // don't ask; if you really must know: http://groups.google.com/group/jquery-en/browse_thread/thread/36640a8730503595/2f6a79a77a78e493#2f6a79a77a78e493
      quirksmodeOffsetHack: 4,

      // class name of the message block
      blockMsgClass: 'blockMsg',

      // if it is already blocked, then ignore it (don't unblock and reblock)
      ignoreIfBlocked: false
    };

    // private data and functions follow...

    var pageBlock = null;
    var pageBlockEls = [];

    function install(el, opts) {
      var css, themedCSS;
      var full = (el == window);
      var msg = (opts && opts.message !== undefined ? opts.message : undefined);
      opts = $.extend({}, $.blockUI.defaults, opts || {});

      if (opts.ignoreIfBlocked && $(el).data('blockUI.isBlocked'))
        return;

      opts.overlayCSS = $.extend({}, $.blockUI.defaults.overlayCSS, opts.overlayCSS || {});
      css = $.extend({}, $.blockUI.defaults.css, opts.css || {});
      if (opts.onOverlayClick)
        opts.overlayCSS.cursor = 'pointer';

      themedCSS = $.extend({}, $.blockUI.defaults.themedCSS, opts.themedCSS || {});
      msg = msg === undefined ? opts.message : msg;

      // remove the current block (if there is one)
      if (full && pageBlock)
        remove(window, {fadeOut:0});

      // if an existing element is being used as the blocking content then we capture
      // its current place in the DOM (and current display style) so we can restore
      // it when we unblock
      if (msg && typeof msg != 'string' && (msg.parentNode || msg.jquery)) {
        var node = msg.jquery ? msg[0] : msg;
        var data = {};
        $(el).data('blockUI.history', data);
        data.el = node;
        data.parent = node.parentNode;
        data.display = node.style.display;
        data.position = node.style.position;
        if (data.parent)
          data.parent.removeChild(node);
      }

      $(el).data('blockUI.onUnblock', opts.onUnblock);
      var z = opts.baseZ;

      // blockUI uses 3 layers for blocking, for simplicity they are all used on every platform;
      // layer1 is the iframe layer which is used to supress bleed through of underlying content
      // layer2 is the overlay layer which has opacity and a wait cursor (by default)
      // layer3 is the message content that is displayed while blocking
      var lyr1, lyr2, lyr3, s;
      if (msie || opts.forceIframe)
        lyr1 = $('<iframe class="blockUI" style="z-index:'+ (z++) +';display:none;border:none;margin:0;padding:0;position:absolute;width:100%;height:100%;top:0;left:0" src="'+opts.iframeSrc+'"></iframe>');
      else
        lyr1 = $('<div class="blockUI" style="display:none"></div>');

      if (opts.theme)
        lyr2 = $('<div class="blockUI blockOverlay ui-widget-overlay" style="z-index:'+ (z++) +';display:none"></div>');
      else
        lyr2 = $('<div class="blockUI blockOverlay" style="z-index:'+ (z++) +';display:none;border:none;margin:0;padding:0;width:100%;height:100%;top:0;left:0"></div>');

      if (opts.theme && full) {
        s = '<div class="blockUI ' + opts.blockMsgClass + ' blockPage ui-dialog ui-widget ui-corner-all" style="z-index:'+(z+10)+';display:none;position:fixed">';
        if ( opts.title ) {
          s += '<div class="ui-widget-header ui-dialog-titlebar ui-corner-all blockTitle">'+(opts.title || '&nbsp;')+'</div>';
        }
        s += '<div class="ui-widget-content ui-dialog-content"></div>';
        s += '</div>';
      }
      else if (opts.theme) {
        s = '<div class="blockUI ' + opts.blockMsgClass + ' blockElement ui-dialog ui-widget ui-corner-all" style="z-index:'+(z+10)+';display:none;position:absolute">';
        if ( opts.title ) {
          s += '<div class="ui-widget-header ui-dialog-titlebar ui-corner-all blockTitle">'+(opts.title || '&nbsp;')+'</div>';
        }
        s += '<div class="ui-widget-content ui-dialog-content"></div>';
        s += '</div>';
      }
      else if (full) {
          s = '<div class="blockUI ' + opts.blockMsgClass + ' blockPage" style="z-index:'+(z+10)+';display:none;position:fixed"></div>';
        }
        else {
          s = '<div class="blockUI ' + opts.blockMsgClass + ' blockElement" style="z-index:'+(z+10)+';display:none;position:absolute"></div>';
        }
      lyr3 = $(s);

      // if we have a message, style it
      if (msg) {
        if (opts.theme) {
          lyr3.css(themedCSS);
          lyr3.addClass('ui-widget-content');
        }
        else
          lyr3.css(css);
      }

      // style the overlay
      if (!opts.theme /*&& (!opts.applyPlatformOpacityRules)*/)
        lyr2.css(opts.overlayCSS);
      lyr2.css('position', full ? 'fixed' : 'absolute');

      // make iframe layer transparent in IE
      if (msie || opts.forceIframe)
        lyr1.css('opacity',0.0);

      //$([lyr1[0],lyr2[0],lyr3[0]]).appendTo(full ? 'body' : el);
      var layers = [lyr1,lyr2,lyr3], $par = full ? $('body') : $(el);
      $.each(layers, function() {
        this.appendTo($par);
      });

      if (opts.theme && opts.draggable && $.fn.draggable) {
        lyr3.draggable({
          handle: '.ui-dialog-titlebar',
          cancel: 'li'
        });
      }

      // ie7 must use absolute positioning in quirks mode and to account for activex issues (when scrolling)
      var expr = setExpr && (!$.support.boxModel || $('object,embed', full ? null : el).length > 0);
      if (ie6 || expr) {
        // give body 100% height
        if (full && opts.allowBodyStretch && $.support.boxModel)
          $('html,body').css('height','100%');

        // fix ie6 issue when blocked element has a border width
        if ((ie6 || !$.support.boxModel) && !full) {
          var t = sz(el,'borderTopWidth'), l = sz(el,'borderLeftWidth');
          var fixT = t ? '(0 - '+t+')' : 0;
          var fixL = l ? '(0 - '+l+')' : 0;
        }

        // simulate fixed position
        $.each(layers, function(i,o) {
          var s = o[0].style;
          s.position = 'absolute';
          if (i < 2) {
            if (full)
              s.setExpression('height','Math.max(document.body.scrollHeight, document.body.offsetHeight) - (jQuery.support.boxModel?0:'+opts.quirksmodeOffsetHack+') + "px"');
            else
              s.setExpression('height','this.parentNode.offsetHeight + "px"');
            if (full)
              s.setExpression('width','jQuery.support.boxModel && document.documentElement.clientWidth || document.body.clientWidth + "px"');
            else
              s.setExpression('width','this.parentNode.offsetWidth + "px"');
            if (fixL) s.setExpression('left', fixL);
            if (fixT) s.setExpression('top', fixT);
          }
          else if (opts.centerY) {
            if (full) s.setExpression('top','(document.documentElement.clientHeight || document.body.clientHeight) / 2 - (this.offsetHeight / 2) + (blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"');
            s.marginTop = 0;
          }
          else if (!opts.centerY && full) {
              var top = (opts.css && opts.css.top) ? parseInt(opts.css.top, 10) : 0;
              var expression = '((document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + '+top+') + "px"';
              s.setExpression('top',expression);
            }
        });
      }

      // show the message
      if (msg) {
        if (opts.theme)
          lyr3.find('.ui-widget-content').append(msg);
        else
          lyr3.append(msg);
        if (msg.jquery || msg.nodeType)
          $(msg).show();
      }

      if ((msie || opts.forceIframe) && opts.showOverlay)
        lyr1.show(); // opacity is zero
      if (opts.fadeIn) {
        var cb = opts.onBlock ? opts.onBlock : noOp;
        var cb1 = (opts.showOverlay && !msg) ? cb : noOp;
        var cb2 = msg ? cb : noOp;
        if (opts.showOverlay)
          lyr2._fadeIn(opts.fadeIn, cb1);
        if (msg)
          lyr3._fadeIn(opts.fadeIn, cb2);
      }
      else {
        if (opts.showOverlay)
          lyr2.show();
        if (msg)
          lyr3.show();
        if (opts.onBlock)
          opts.onBlock();
      }

      // bind key and mouse events
      bind(1, el, opts);

      if (full) {
        pageBlock = lyr3[0];
        pageBlockEls = $(opts.focusableElements,pageBlock);
        if (opts.focusInput)
          setTimeout(focus, 20);
      }
      else
        center(lyr3[0], opts.centerX, opts.centerY);

      if (opts.timeout) {
        // auto-unblock
        var to = setTimeout(function() {
          if (full)
            $.unblockUI(opts);
          else
            $(el).unblock(opts);
        }, opts.timeout);
        $(el).data('blockUI.timeout', to);
      }
    }

    // remove the block
    function remove(el, opts) {
      var count;
      var full = (el == window);
      var $el = $(el);
      var data = $el.data('blockUI.history');
      var to = $el.data('blockUI.timeout');
      if (to) {
        clearTimeout(to);
        $el.removeData('blockUI.timeout');
      }
      opts = $.extend({}, $.blockUI.defaults, opts || {});
      bind(0, el, opts); // unbind events

      if (opts.onUnblock === null) {
        opts.onUnblock = $el.data('blockUI.onUnblock');
        $el.removeData('blockUI.onUnblock');
      }

      var els;
      if (full) // crazy selector to handle odd field errors in ie6/7
        els = $('body').children().filter('.blockUI').add('body > .blockUI');
      else
        els = $el.find('>.blockUI');

      // fix cursor issue
      if ( opts.cursorReset ) {
        if ( els.length > 1 )
          els[1].style.cursor = opts.cursorReset;
        if ( els.length > 2 )
          els[2].style.cursor = opts.cursorReset;
      }

      if (full)
        pageBlock = pageBlockEls = null;

      if (opts.fadeOut) {
        count = els.length;
        els.stop().fadeOut(opts.fadeOut, function() {
          if ( --count === 0)
            reset(els,data,opts,el);
        });
      }
      else
        reset(els, data, opts, el);
    }

    // move blocking element back into the DOM where it started
    function reset(els,data,opts,el) {
      var $el = $(el);
      if ( $el.data('blockUI.isBlocked') )
        return;

      els.each(function(i,o) {
        // remove via DOM calls so we don't lose event handlers
        if (this.parentNode)
          this.parentNode.removeChild(this);
      });

      if (data && data.el) {
        data.el.style.display = data.display;
        data.el.style.position = data.position;
        if (data.parent)
          data.parent.appendChild(data.el);
        $el.removeData('blockUI.history');
      }

      if ($el.data('blockUI.static')) {
        $el.css('position', 'static'); // #22
      }

      if (typeof opts.onUnblock == 'function')
        opts.onUnblock(el,opts);

      // fix issue in Safari 6 where block artifacts remain until reflow
      var body = $(document.body), w = body.width(), cssW = body[0].style.width;
      body.width(w-1).width(w);
      body[0].style.width = cssW;
    }

    // bind/unbind the handler
    function bind(b, el, opts) {
      var full = el == window, $el = $(el);

      // don't bother unbinding if there is nothing to unbind
      if (!b && (full && !pageBlock || !full && !$el.data('blockUI.isBlocked')))
        return;

      $el.data('blockUI.isBlocked', b);

      // don't bind events when overlay is not in use or if bindEvents is false
      if (!full || !opts.bindEvents || (b && !opts.showOverlay))
        return;

      // bind anchors and inputs for mouse and key events
      var events = 'mousedown mouseup keydown keypress keyup touchstart touchend touchmove';
      if (b)
        $(document).bind(events, opts, handler);
      else
        $(document).unbind(events, handler);

      // former impl...
      //		var $e = $('a,:input');
      //		b ? $e.bind(events, opts, handler) : $e.unbind(events, handler);
    }

    // event handler to suppress keyboard/mouse events when blocking
    function handler(e) {
      // allow tab navigation (conditionally)
      if (e.type === 'keydown' && e.keyCode && e.keyCode == 9) {
        if (pageBlock && e.data.constrainTabKey) {
          var els = pageBlockEls;
          var fwd = !e.shiftKey && e.target === els[els.length-1];
          var back = e.shiftKey && e.target === els[0];
          if (fwd || back) {
            setTimeout(function(){focus(back);},10);
            return false;
          }
        }
      }
      var opts = e.data;
      var target = $(e.target);
      if (target.hasClass('blockOverlay') && opts.onOverlayClick)
        opts.onOverlayClick(e);

      // allow events within the message content
      if (target.parents('div.' + opts.blockMsgClass).length > 0)
        return true;

      // allow events for content that is not being blocked
      return target.parents().children().filter('div.blockUI').length === 0;
    }

    function focus(back) {
      if (!pageBlockEls)
        return;
      var e = pageBlockEls[back===true ? pageBlockEls.length-1 : 0];
      if (e)
        e.focus();
    }

    function center(el, x, y) {
      var p = el.parentNode, s = el.style;
      var l = ((p.offsetWidth - el.offsetWidth)/2) - sz(p,'borderLeftWidth');
      var t = ((p.offsetHeight - el.offsetHeight)/2) - sz(p,'borderTopWidth');
      if (x) s.left = l > 0 ? (l+'px') : '0';
      if (y) s.top  = t > 0 ? (t+'px') : '0';
    }

    function sz(el, p) {
      return parseInt($.css(el,p),10)||0;
    }

  }


  /*global define:true */
  if (typeof define === 'function' && define.amd && define.amd.jQuery) {
    define(['jquery'], setup);
  } else {
    setup(jQuery);
  }

})();;
(function ($) {
	var unblock;
	$(document).ajaxSend(function (event, jqxhr, settings) {
		if (!unblock) {
			var target = ajaxScreenLock.getUrlPath(settings.url);
			var pages = Drupal.settings.ajaxScreenLock.pages;
			var visibility = Drupal.settings.ajaxScreenLock.visibility;
			var disabled = Drupal.settings.ajaxScreenLock.disabled;

			// If is not disabled.
			if (!disabled) {
				if (!$.isEmptyObject(pages)) {
					// Handle pages.
					$.each(pages, function (num, page) {
						page = ajaxScreenLock.getUrlPath(page);
						if (target.length >= page.trim().length) {
							if (target.substr(0, page.trim().length) == page.trim() && visibility == 1) {
								ajaxScreenLock.blockUI();
							}
							else if (visibility == 0 && target.substr(0, page.trim().length) != page.trim()) {
								ajaxScreenLock.blockUI();
							}
						}
					});
				}
				else {
					ajaxScreenLock.blockUI();
				}
			}
		}
	});

	$(document).ajaxStop(function (r, s) {
		if (unblock) {
			$.unblockUI();
			unblock = false;
		}
	});


	var ajaxScreenLock = {
		// Grab path from AJAX url.
		getUrlPath: function (ajaxUrl) {
			var url = document.createElement("a");
			url.href = ajaxUrl;
			return url.pathname;
		},

		blockUI: function () {
			unblock = true;
			if (Drupal.settings.ajaxScreenLock.throbber_hide) {
				$('.ajax-progress-throbber').hide();
			}

			$.blockUI({
				message: Drupal.settings.ajaxScreenLock.message,
				css: {
					top: ($(window).height() - 400) / 2 + 'px',
					left: ($(window).width() - 400) / 2 + 'px',
					width: '400px'
				},
				timeout: Drupal.settings.ajaxScreenLock.timeout
			});
		}
	}
}(jQuery));;
(function (Drupal, $) {
  "use strict";

  // Private variables
  var ajaxCount = 0;
  var timeStart = new Date().getTime();
  var cacheRenderTime = null;
  var status = {
    'Cache Status': 'Debug info pending',
  };
  var info = {};

  //
  // Private helper functions
  //
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  /**
   * Inject authcache debug widget into the page
   */
  function widget() {
    $("body").prepend("<div id='authcachedbg' style='max-width: 80em;'><div id='authcache_status_indicator'></div><strong><a href='#' id='authcachehide'>Authcache Debug</a></strong><div id='authcachedebug' style='display:none;'><div id='authcachedebuginfo'></div></div></div>");
    $("#authcachehide").click(function() {
      $("#authcachedebug").toggle();
      return false;
    });

    // Determine the render time if cache_render cookie is set.
    if ($.cookie("cache_render") && $.cookie("cache_render") !== "get") {
      cacheRenderTime = $.cookie("cache_render");
    }

    updateInfoFieldset();

    debugTimer();
  }

  /**
   * Update the info fieldset.
   */
  function updateInfoFieldset() {
    var alertColor = null;

    if (info.cacheStatus) {
      status['Cache Status'] = info.cacheStatus;

      if (info.cacheStatus === 'HIT') {
        alertColor = 'green';
      }
      else if (info.cacheStatus === 'MISS') {
        alertColor = 'orange';
      }
      else {
        alertColor = 'red';
      }
    }

    if (info.messages) {
      $.each(info.messages, function(idx, msg) {
        status['Message ' + (idx + 1)] = msg.label + ': ' + msg.message;
      });
    }

    // Determine page render time
    if (info.pageRender) {
      status["Page Render Time"] = info.pageRender + " ms";
    }

    if (info.cacheStatus === 'HIT' && cacheRenderTime !== null) {
      status["Cache Render Time"] = cacheRenderTime;

      if (isNumeric(cacheRenderTime)) {
        status["Cache Render Time"] += " ms";

        if (cacheRenderTime > 30) {
          alertColor = 'orange';
        }
        else if (cacheRenderTime > 100) {
          alertColor = 'red';
        }
      }
    }

    if (isNumeric(cacheRenderTime)) {
      status.Speedup = Math.round((info.pageRender - cacheRenderTime) / cacheRenderTime * 100).toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2') + "% increase";
    }

    // Add some more settings and status information
    if (info.cacheTime) {
      status["Page Age"] = Math.round(timeStart / 1000 - info.cacheTime) + " seconds";
    }

    if (alertColor !== null) {
      $("#authcache_status_indicator").css({"background": alertColor});
    }

    $("#authcachedebuginfo").first().html(debugFieldset("Status", status));
    $("#authcachedebuginfo").first().append(debugFieldset("Settings", info));
  }

  /**
   * Display total JavaScript execution time for this file (including Ajax)
   */
  function debugTimer() {
    var timeMs = new Date().getTime() - timeStart;
    $("#authcachedebug").append("HTML/JavaScript time: " + timeMs + " ms <hr size=1>");
  }

  /**
   * Helper function (renders HTML fieldset)
   */
  function debugFieldset(title, jsonData) {
    var fieldset = '<div style="clear:both;"></div><fieldset style="float:left;min-width:240px;"><legend>' + title + '</legend>';
    $.each(jsonData, function(key, value) {
      if (key[0] !== key[0].toLowerCase()){
        fieldset += "<strong>" + key + "</strong>: " + JSON.stringify(value) + '<br>';
      }
    });
    fieldset += '</fieldset><div style="clear:both;">';
    return fieldset;
  }

  function isEnabled(settings) {
    return (settings.authcacheDebug && ($.cookie('aucdbg') !== null || settings.authcacheDebug.all) && typeof JSON === 'object');
  }

  // Add debug info to widget
  Drupal.behaviors.authcacheDebug = {
    attach: function (context, settings) {
      $('body').once('authcache-debug', function() {
        if (!isEnabled(settings)) {
          return;
        }

        widget();

        $.get(settings.authcacheDebug.url, function(data) {
          info = $.extend(info, data);

          updateInfoFieldset();

          $.authcache_cookie("aucdbg", Math.floor(Math.random()*65535).toString(16));
        });
      });
    }
  };

  $(window).load(function() {
    if (isEnabled(Drupal.settings)) {
      // Reset debug cookies only after all subrequests (images, JS, CSS) are completed.
      $.authcache_cookie("cache_render", "get");
    }
  });
}(Drupal, jQuery));
;
/*!
 * jQuery meanMenu v2.0.6 (Drupal Responsive Menus version)
 * @Copyright (C) 2012-2013 Chris Wharton (https://github.com/weare2ndfloor/meanMenu)
 *
 */
(function(e){"use strict";e.fn.meanmenu=function(t){var n={meanMenuTarget:jQuery(this),meanMenuContainer:"body",meanMenuClose:"X",meanMenuCloseSize:"18px",meanMenuOpen:"<span /><span /><span />",meanRevealPosition:"right",meanRevealPositionDistance:"0",meanRevealColour:"",meanRevealHoverColour:"",meanScreenWidth:"480",meanNavPush:"",meanShowChildren:true,meanExpandableChildren:true,meanExpand:"+",meanContract:"-",meanRemoveAttrs:false,onePage:false,removeElements:""};var t=e.extend(n,t);var r=document.documentElement.clientWidth||document.body.clientWidth;return this.each(function(){function x(){if(a=="center"){var e=document.documentElement.clientWidth||document.body.clientWidth;var t=e/2-22+"px";C="left:"+t+";right:auto;";if(!S){jQuery(".meanmenu-reveal").css("left",t)}else{jQuery(".meanmenu-reveal").animate({left:t})}}}function A(){if(jQuery(L).is(".meanmenu-reveal.meanclose")){L.html(s)}else{L.html(u)}}function O(){jQuery(".mean-bar,.mean-push").remove();jQuery(i).removeClass("mean-container");jQuery(e).show();T=false;N=false;jQuery(E).removeClass("mean-remove")}function M(){if(r<=h){jQuery(E).addClass("mean-remove");N=true;jQuery(i).addClass("mean-container");jQuery(".mean-container").prepend('<div class="mean-bar"><a href="#nav" class="meanmenu-reveal" style="'+k+'">Show Navigation</a><nav class="mean-nav"></nav></div>');var t=jQuery(n).html();jQuery(".mean-nav").html(t);if(b){jQuery("nav.mean-nav ul, nav.mean-nav ul *").each(function(){jQuery(this).removeAttr("class");jQuery(this).removeAttr("id")})}jQuery(e).before('<div class="mean-push" />');jQuery(".mean-push").css("margin-top",p);jQuery(e).hide();jQuery(".meanmenu-reveal").show();jQuery(d).html(u);L=jQuery(d);jQuery(".mean-nav ul").hide();if(v){if(m){jQuery(".mean-nav ul ul").each(function(){if(jQuery(this).children().length){jQuery(this,"li:first").parent().append('<a class="mean-expand" href="#" style="font-size: '+o+'">'+g+"</a>")}});jQuery(".mean-expand").on("click",function(e){e.preventDefault();if(jQuery(this).hasClass("mean-clicked")){jQuery(this).text(g);jQuery(this).prev("ul").slideUp(300,function(){})}else{jQuery(this).text(y);jQuery(this).prev("ul").slideDown(300,function(){})}jQuery(this).toggleClass("mean-clicked")})}else{jQuery(".mean-nav ul ul").show()}}else{jQuery(".mean-nav ul ul").hide()}jQuery(".mean-nav ul li").last().addClass("mean-last");L.removeClass("meanclose");jQuery(L).click(function(e){e.preventDefault();if(T==false){L.css("text-align","center");L.css("text-indent","0");L.css("font-size",o);jQuery(".mean-nav ul:first").slideDown();T=true}else{jQuery(".mean-nav ul:first").slideUp();T=false}L.toggleClass("meanclose");A();jQuery(E).addClass("mean-remove")});if(w){jQuery(".mean-nav ul > li > a:first-child").on("click",function(){jQuery(".mean-nav ul:first").slideUp();T=false;jQuery(L).toggleClass("meanclose").html(u)})}}else{O()}}var e=t.meanMenuTarget;var n=t.meanMenuTarget.clone();n.find(".contextual-links-wrapper").remove().find("ul.contextual-links").remove();var i=t.meanMenuContainer;var s=t.meanMenuClose;var o=t.meanMenuCloseSize;var u=t.meanMenuOpen;var a=t.meanRevealPosition;var f=t.meanRevealPositionDistance;var l=t.meanRevealColour;var c=t.meanRevealHoverColour;var h=t.meanScreenWidth;var p=t.meanNavPush;var d=".meanmenu-reveal";var v=t.meanShowChildren;var m=t.meanExpandableChildren;var g=t.meanExpand;var y=t.meanContract;var b=t.meanRemoveAttrs;var w=t.onePage;var E=t.removeElements;if(navigator.userAgent.match(/iPhone/i)||navigator.userAgent.match(/iPod/i)||navigator.userAgent.match(/iPad/i)||navigator.userAgent.match(/Android/i)||navigator.userAgent.match(/Blackberry/i)||navigator.userAgent.match(/Windows Phone/i)){var S=true}if(navigator.userAgent.match(/MSIE 8/i)||navigator.userAgent.match(/MSIE 7/i)){jQuery("html").css("overflow-y","scroll")}var T=false;var N=false;if(a=="right"){C="right:"+f+";left:auto;"}if(a=="left"){var C="left:"+f+";right:auto;"}x();var k="background:"+l+";color:"+l+";"+C;var L="";if(!S){jQuery(window).resize(function(){r=document.documentElement.clientWidth||document.body.clientWidth;if(r>h){O()}else{O()}if(r<=h){M();x()}else{O()}})}window.onorientationchange=function(){x();r=document.documentElement.clientWidth||document.body.clientWidth;if(r>=h){O()}if(r<=h){if(N==false){M()}}};M()})}})(jQuery)
;
/**
 * @file
 * Integrate Mean Menu library with Responsive Menus module.
 */
(function ($) {
  Drupal.behaviors.responsive_menus_mean_menu = {
    attach: function (context, settings) {
      settings.responsive_menus = settings.responsive_menus || {};
      $.each(settings.responsive_menus, function(ind, iteration) {
        if (iteration.responsive_menus_style != 'mean_menu') {
          return true;
        }
        if (!iteration.selectors.length) {
          return;
        }
        // Set 1/0 to true/false respectively.
        $.each(iteration, function(key, value) {
          if (value == 0) {
            iteration[key] = false;
          }
          if (value == 1) {
            iteration[key] = true;
          }
        });
        // Call meanmenu() with our custom settings.
        $(iteration.selectors).once('responsive-menus-mean-menu', function() {
          $(this).meanmenu({
            meanMenuClose: iteration.close_txt || "X",
            meanMenuCloseSize: iteration.close_size || "18px",
            meanMenuOpen: iteration.trigger_txt || "<span /><span /><span />",
            meanRevealPosition: iteration.position || "right",
            meanScreenWidth: iteration.media_size || "480",
            meanExpand: iteration.expand_txt || "+",
            meanContract: iteration.contract_txt || "-",
            meanShowChildren: iteration.show_children,
            meanExpandableChildren: iteration.expand_children,
            meanRemoveAttrs: iteration.remove_attrs
          });
        });
      });

    }
  };
}(jQuery));
;
// Extends the Google Analytics Tokenizer module by capturing referrer and landing pages
// at three different levels:
// 1. First Visit - 5-year expiration.
// 2. Current Visit - 30 minute session expiration.
// 3. Most Recent Page Load

// Cookie Names
var gatFirst = 'gat_first'; 
var gatCur = 'gat_cur';
var gatRecent = 'gat_recent'; 

// Capture referring and landing pages.
function gatCapture() {
  if (gatReadCookie(gatFirst) == null) {
    // capture the referrer
    var gatFirstData = { referrer: document.referrer, landing: document.location.href };
    gatCreateCookie(gatFirst, JSON.stringify(gatFirstData), 5*365*24*60*60) //5-year expiration
  }
  if (gatReadCookie(gatCur) == null) {
    // capture the referrer
    var gatCurData = { referrer: document.referrer, landing: document.location.href };
    gatCreateCookie(gatCur, JSON.stringify(gatCurData), 1800) //30 minute expiration
  }

  // Refresh expiration date of last session.
  gatRefreshCookie(gatCur, 1800); //Rolling 30 Minute expiration.

  // With each page request, keep track of the most recent referrer and landing page.
  var gatRecentData = { referrer: document.referrer, landing: document.location.href };
  gatCreateCookie(gatRecent, JSON.stringify(gatRecentData), 1800) //30 minute expiration

  var gatRecentVisit = JSON.parse(gatReadCookie(gatRecent));
  //alert('document.referrer: ' + document.referrer + ' document.location.href: ' + document.location.href);
}


// For debugging purposes.
function printCapture() {
  var gatFirstVisit = JSON.parse(gatReadCookie(gatFirst));
  alert('First Refer: ' + gatFirstVisit.referrer + '  First Landing: ' + gatFirstVisit.landing);

  var gatCurVisit = JSON.parse(gatReadCookie(gatCur));
  alert('Current Refer: ' + gatCurVisit.referrer + ' Current Landing: ' + gatCurVisit.landing);

  var gatRecentVisit = JSON.parse(gatReadCookie(gatRecent));
  alert('Most Recent Refer: ' + gatRecentVisit.referrer + ' Most Recent Landing: ' + gatRecentVisit.landing);
}


// Helper functions to handle cookies.
// Create cookie
function gatCreateCookie(name,value,seconds) {
	if (seconds) {
		var date = new Date();
		date.setTime(date.getTime()+(seconds*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

// Extend expiration date of cookie
function gatRefreshCookie(name, seconds) {
	if (seconds) {
		var date = new Date();
		date.setTime(date.getTime()+(seconds*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+gatReadCookie(name)+expires+"; path=/";
}

// Read value of cookie
function gatReadCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

// Erase cookie
function gatEraseCookie(name) {
	gatCreateCookie(name,"",-1);
};
(function ($) {

$(document).ready(function() {

  // Expression to check for absolute internal links.
  var isInternal = new RegExp("^(https?):\/\/" + window.location.host, "i");

  // Attach onclick event to document only and catch clicks on all elements.
  $(document.body).click(function(event) {
    // Catch the closest surrounding link of a clicked element.
    $(event.target).closest("a,area").each(function() {

      var ga = Drupal.settings.googleanalytics;
      // Expression to check for special links like gotwo.module /go/* links.
      var isInternalSpecial = new RegExp("(\/go\/.*)$", "i");
      // Expression to check for download links.
      var isDownload = new RegExp("\\.(" + ga.trackDownloadExtensions + ")$", "i");

      // Is the clicked URL internal?
      if (isInternal.test(this.href)) {
        // Skip 'click' tracking, if custom tracking events are bound.
        if ($(this).is('.colorbox')) {
          // Do nothing here. The custom event will handle all tracking.
        }
        // Is download tracking activated and the file extension configured for download tracking?
        else if (ga.trackDownload && isDownload.test(this.href)) {
          // Download link clicked.
          var extension = isDownload.exec(this.href);
          _gaq.push(["_trackEvent", "Downloads", extension[1].toUpperCase(), this.href.replace(isInternal, '')]);
        }
        else if (isInternalSpecial.test(this.href)) {
          // Keep the internal URL for Google Analytics website overlay intact.
          _gaq.push(["_trackPageview", this.href.replace(isInternal, '')]);
        }
      }
      else {
        if (ga.trackMailto && $(this).is("a[href^='mailto:'],area[href^='mailto:']")) {
          // Mailto link clicked.
          _gaq.push(["_trackEvent", "Mails", "Click", this.href.substring(7)]);
        }
        else if (ga.trackOutbound && this.href.match(/^\w+:\/\//i)) {
          if (ga.trackDomainMode == 2 && isCrossDomain(this.hostname, ga.trackCrossDomains)) {
            // Top-level cross domain clicked. document.location is handled by _link internally.
            event.preventDefault();
            _gaq.push(["_link", this.href]);
          }
          else {
            // External link clicked.
            _gaq.push(["_trackEvent", "Outbound links", "Click", this.href]);
          }
        }
      }
    });
  });

  // Colorbox: This event triggers when the transition has completed and the
  // newly loaded content has been revealed.
  $(document).bind("cbox_complete", function() {
    var href = $.colorbox.element().attr("href");
    if (href) {
      _gaq.push(["_trackPageview", href.replace(isInternal, '')]);
    }
  });

});

/**
 * Check whether the hostname is part of the cross domains or not.
 *
 * @param string hostname
 *   The hostname of the clicked URL.
 * @param array crossDomains
 *   All cross domain hostnames as JS array.
 *
 * @return boolean
 */
function isCrossDomain(hostname, crossDomains) {
  /**
   * jQuery < 1.6.3 bug: $.inArray crushes IE6 and Chrome if second argument is
   * `null` or `undefined`, http://bugs.jquery.com/ticket/10076,
   * https://github.com/jquery/jquery/commit/a839af034db2bd934e4d4fa6758a3fed8de74174
   *
   * @todo: Remove/Refactor in D8
   */
  if (!crossDomains) {
    return false;
  }
  else {
    return $.inArray(hostname, crossDomains) > -1 ? true : false;
  }
}

})(jQuery);
;
