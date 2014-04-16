/*
 * jQuery UI Panel @VERSION
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Panel
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 */
(function($, undefined) {

	$.widget(
			'ui.panel',
			{
				options : {
					event : 'click',
					collapsible : true,
					expanded : true,
					expandType : 'down', // down, left, right
					expandSpeed : 'fast',
					draggable : false,
					resizable : false,
					stackable : true,	// automatically create special
										// stack area (navigation window
										// emulation)
					controls : false,
					accordionGroupName : false,
					cookie : null, 	// accepts jQuery cookie Plugin
									// options, e.g. { name: 'myPanel',
									// expires: 7, path: '/', domain:
									// 'jquery.com', secure: true }
					icons : {
						header : 'ui-icon-triangle-1-e',
						headerSelected : 'ui-icon-triangle-1-s',
						headerRight : 'ui-icon-arrowthickstop-1-n',
						headerRightSelected : 'ui-icon-arrowthickstop-1-e',
						headerLeft : 'ui-icon-arrowthickstop-1-s',
						headerLeftSelected : 'ui-icon-arrowthickstop-1-w'
					}
				},

				_create : function() {
					var self = this, 
					options = self.options;
	
					// common classes
					self.classWidget = 'ui-panel ui-widget ui-helper-reset';
					self.classWidgetVertical = 'ui-widget-vertical';
	
					self.container = self.element;
					self.id = self.container.attr('id');
					self.container.addClass(self.classWidget);
	
					// header
					self.header = self.container
						.children(':first')
						.addClass('ui-panel-header ui-panel-header-active ui-helper-reset ui-state-default ui-state-active ui-corner-top')
						.bind('mouseenter.panel', function() {
							if (options.disabled) {
								return;
							}
							$(this).addClass('ui-state-hover');
						}).bind('mouseleave.panel', function() {
							if (options.disabled) {
								return;
							}
							$(this).removeClass('ui-state-hover');
						}).bind('focus.panel', function() {
							$(this).addClass('ui-state-focus');
						}).bind('blur.panel', function() {
							$(this).removeClass('ui-state-focus');
						});
	
					// content
					self.contents = self.header.next();
					self.contents.addClass('ui-panel-content ui-panel-content-active ui-helper-reset ui-widget-content ui-corner-bottom');
	
					// ist-ui-panel backward compatibility
					if (options.collapseType == 'default') {
						options.expandType = 'down';
					} else if (options.collapseType == 'slide-left') {
						options.expandType = 'right';
					} else if (options.collapseType == 'slide-right') {
						options.expandType = 'left';
					}
	
					self.container.attr('role', 'panel');
	
					if (options.collapsible) {
						self._eventHandler(true);
	
	                    // collapse panel if 'accordion' option is set, switch off vertical text
	                    if (options.accordionGroupName){
	                    	options.expanded = false;
	                    	self.container.addClass(options.accordionGroupName)
	                    }
						
						// restore state from cookie
						if (options.cookie) {
							if (self._cookie()==0) {
								options.expanded = true;
							} else {
								options.expanded = false;
							}
						}
						
						if (!options.expanded) {
							options.expanded = true;
							self.toggle(0, true);
						}
	
					} else {
						// force options change if not collapsible
						options.expanded = true;
						options.icons = false;
					}
	
					self._createIcons();
					// store original width to restore later
					self.originalWidth = self.container.css('width');
	
					// swap title's display property to calculate title width
					self.titleWidth = 0;
					title = self.header.find('a:first');
					if (title.css('width')) {
						display_orig = title.css('display');
						title.css('display', 'inline-block');
						self.titleWidth = parseInt(title.css('width').replace('px', '')) + 50;
						title.css('display', display_orig);
					}
					
					// making panel draggable if not accordion-like
					if ($.fn.draggable && options.draggable && !options.accordionGroupName) {
						self.container.draggable({
							containment: 'parent',
							handle: '.ui-panel-header',
							cancel: '.ui-panel-content',
							cursor: 'move',
							zIndex: 100
						});
					}
					self._syncState();
				},
				
				_eventHandler: function(bind_event) {
					var self = this, 
						options = self.options;
					
					if (options.event) {
						if (bind_event) {
							self.header
								.bind(options.event + '.panel', function(event) {
									return self._clickHandler.call(self, event, this);
								});
						} else {
							self.header.unbind(options.event + '.panel');							
						}
					}
					
				},
				
				_cookie: function() {
					var cookie = this.cookie || 
						(this.cookie = this.options.cookie.name || 'ui-panel-'+this.id);
					return $.cookie.apply(null, [cookie].concat($.makeArray(arguments)));
				},
	
				_createIcons : function() {
					var self = this, 
						options = self.options;
	
					self.iconHeader = false;
					self.iconHeaderSelected = false;
	
					if (options.icons) {
						self.iconHeader = options.icons.header,
						self.iconHeaderSelected = options.icons.headerSelected;
	
						// calculate icons for left and right sliding panels
						switch (options.expandType) {
						case 'right':
							self.iconHeader = options.icons.headerLeft;
							self.iconHeaderSelected = options.icons.headerLeftSelected;
							break;
						case 'left':
							self.iconHeader = options.icons.headerRight;
							self.iconHeaderSelected = options.icons.headerRightSelected;
							break;
						};
	
						$('<span></span>')
							.addClass('ui-icon ' + self.iconHeader)
							.prependTo(self.header);
	
						self.header
							.filter('.ui-state-active')
							.find('.ui-icon')
							.removeClass(self.iconHeader)
							.addClass(self.iconHeaderSelected);
	
						self.element.addClass('ui-panel-icons');
					}
				},
	
				_destroyIcons : function() {
					var self = this;
					self.header.children('.ui-icon').remove();
					self.element.removeClass('ui-panel-icons');
					self.iconHeader = false;
					self.iconHeaderSelected = false;
				},
	
				_setOption : function(key, value) {
					var self = this;
					$.Widget.prototype._setOption.apply(this, arguments);
	
					switch (key) {
					case 'icons':
						self._destroyIcons();
						if (value) {
							self._createIcons();
						}
						break;
					}
	
				},
	
				_keydown : function(event) {
					if (this.options.disabled || event.altKey || event.ctrlKey) {
						return;
					}
					return true;
				},
	
				_clickHandler : function(event, target) {
					var options = this.options;
					if (options.disabled) {
						return;
					}
	
					this.toggle(options.expandSpeed);
	
					return;
				},
	
				_destroy : function() {
					var self = this;
	
					self.element
						.removeClass(self.classWidget)
						.removeAttr('role')
						.removeAttr('aria-expanded');
	
					self.header
						.unbind('.panel')
						.removeClass('ui-panel-header ui-panel-header-active ui-panel-disabled ui-helper-reset ui-corner-top ui-corner-all ui-state-default ui-state-active ui-state-disabled');
	
					self.header
						.next()
						.css('display', '')
						.removeClass('ui-panel-content ui-panel-content-active ui-panel-disabled ui-helper-reset ui-corner-bottom ui-state-disabled ui-widget-content');
	
					self._destroyIcons();
	
					if (self.options.cookie ) {
						this._cookie( null, self.options.cookie );
					}
				},
				
				_syncState: function() {
					var self = this, 
						options = self.options;
					
					// aria state
					if (options.expanded) {
						self.container.attr('aria-expanded', 'true');
					} else {
						self.container.attr('aria-expanded', 'false');
					}
					
					// resizible state
					if ($.fn.resizable && options.resizable && !options.accordionGroupName) {
						if (options.expanded) {
							self.container.resizable({
								alsoResize: self.contents,
								minHeight: '85',
								minWidth: self.titleWidth,
								containment: 'parent',
								cancel: '.ui-panel-header'
							});
						} else {
							self.container.resizable('destroy');
						}
					}
					
				},
	
				toggle : function(expandSpeed, innerCall) {
					var self = this, 
					options = self.options;
					
					options.expanded = !options.expanded
					this._syncState();
					
					self.header
						.toggleClass('ui-state-active ui-corner-top ui-corner-all ui-panel-header-active')
						.find('.ui-icon')
						.toggleClass(self.iconHeader)
						.toggleClass(self.iconHeaderSelected)
						.end()
						.next()
						.toggleClass('ui-panel-content-active');
	
					if (options.expandType != 'down') {
						if (self.element.hasClass(self.classWidgetVertical)) {
							css = {
								'width' : self.originalWidth,
								'margin-top' : 'auto'
							};
						} else {
							css = {
								'width' : self.titleWidth,
								'margin-top' : self.titleWidth
							};
						}
						self.element.css(css).toggleClass(self.classWidgetVertical);
					}
	
					if (!innerCall) {
						if (options.cookie) {
							self._cookie(Number(!options.expanded), options.cookie);
						}
						// inner toggle call to show only one unfolded panel if 'accordion' option is set
						if (options.accordionGroupName) {
							$("."+options.accordionGroupName+"[role='panel'][aria-expanded='true'][id!='"+self.id+"']").panel('toggle', expandSpeed, true);
						}
					}
	
				}

			});

	$.extend($.ui.panel, {
		version : '@VERSION'
	});

})(jQuery);
