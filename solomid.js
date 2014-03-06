/*! probuilds by SoloMid */
var baseUrl = location.protocol + "//" + location.host + "/";
(function ($) {
    jQuery.fn.dropdown = function () {
        return this.each(function () {
            var $select = $(this);
            var replacement = '<dl class="dropdown"></dl>';
            $(replacement).insertAfter(this);
            var $target = $select.next("dl");
            var $options = $("option", $select);
            $("body").append('<div id="test">');
            var $hidden = $("#test");
            $hidden.hide();
            $hidden.css("position", "absolute");
            var width = 0;
            var $selected = $("option[selected='selected']", $select);
            if ($selected.length == 0) $selected = $options.first();
            $target.append('<dt><a href="#">' + $selected.text() + '<span class="value">' + $selected.val() + "</span></a></dt>");
            $target.append("<dd><ul></ul></dd>");
            $options.each(function () {
                $hidden.html($(this).text());
                if ($hidden.outerWidth() > width) width = $hidden.outerWidth();
                $("dd ul", $target).append('<li><a href="#">' + $(this).text() + '<span class="value">' + $(this).val() + "</span></a></li>")
            });
            $target.width(width + 35);
            $hidden.remove();
            $("dd ul li:last", $target).addClass("last");
            $("dt a", $target).click(function (e) {
                e.preventDefault();
                $target.toggleClass("expanded");
                $("dd ul", $target).toggle()
            });
            $(".search").bind("click", function (e) {
                var $clicked = $(e.target);
                if (!$clicked.parents().hasClass("dropdown")) {
                    $("dd ul", $target).hide()
                }
                if (!$clicked.parents().hasClass("expanded")) {
                    $target.removeClass("expanded")
                }
            });
            $(document).mouseup(function (e) {
                if ($target.hasClass("expanded")) {
                    if ($target.has(e.target).length == 0) {
                        $target.removeClass("expanded");
                        $("dd ul", $target).toggle()
                    }
                }
            });
            $("dd ul li a", $target).click(function (e) {
                e.preventDefault();
                var text = $(this).html();
                $("dt a", $target).html(text);
                $("dd ul", $target).hide();
                $target.removeClass("expanded");
                $select.val($(this).find("span.value").html()).change()
            })
        })
    }
})(jQuery);
/*!
 * qTip2 - Pretty powerful tooltips - v2.0.1-27-
 * http://qtip2.com
 *
 * Copyright (c) 2013 Craig Michael Thompson
 * Released under the MIT, GPL licenses
 * http://jquery.org/license
 *
 * Date: Tue Feb 26 2013 11:17 GMT+0000
 * Plugins: svg ajax tips modal viewport imagemap ie6
 * Styles: basic css3
 */
(function (window, document, undefined) {
    (function (factory) {
        "use strict";
        if (typeof define === "function" && define.amd) {
            define(["jquery"], factory)
        } else if (jQuery && !jQuery.fn.qtip) {
            factory(jQuery)
        }
    })(function ($) {
        var TRUE = true,
            FALSE = false,
            NULL = null,
            X = "x",
            Y = "y",
            WIDTH = "width",
            HEIGHT = "height",
            TOP = "top",
            LEFT = "left",
            BOTTOM = "bottom",
            RIGHT = "right",
            CENTER = "center",
            FLIP = "flip",
            FLIPINVERT = "flipinvert",
            SHIFT = "shift",
            BLANKIMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
            QTIP, PLUGINS, MOUSE, NAMESPACE = "qtip",
            HASATTR = "data-hasqtip",
            usedIDs = {}, widget = ["ui-widget", "ui-tooltip"],
            selector = "div.qtip." + NAMESPACE,
            defaultClass = NAMESPACE + "-default",
            focusClass = NAMESPACE + "-focus",
            hoverClass = NAMESPACE + "-hover",
            replaceSuffix = "_replacedByqTip",
            oldtitle = "oldtitle",
            trackingBound;

        function storeMouse(event) {
            MOUSE = {
                pageX: event.pageX,
                pageY: event.pageY,
                type: "mousemove",
                scrollX: window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft,
                scrollY: window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop
            }
        }

        function sanitizeOptions(opts) {
            var invalid = function (a) {
                return a === NULL || "object" !== typeof a
            }, invalidContent = function (c) {
                    return !$.isFunction(c) && (!c && !c.attr || c.length < 1 || "object" === typeof c && !c.jquery && !c.then)
                };
            if (!opts || "object" !== typeof opts) {
                return FALSE
            }
            if (invalid(opts.metadata)) {
                opts.metadata = {
                    type: opts.metadata
                }
            }
            if ("content" in opts) {
                if (invalid(opts.content) || opts.content.jquery) {
                    opts.content = {
                        text: opts.content
                    }
                }
                if (invalidContent(opts.content.text || FALSE)) {
                    opts.content.text = FALSE
                }
                if ("title" in opts.content) {
                    if (invalid(opts.content.title)) {
                        opts.content.title = {
                            text: opts.content.title
                        }
                    }
                    if (invalidContent(opts.content.title.text || FALSE)) {
                        opts.content.title.text = FALSE
                    }
                }
            }
            if ("position" in opts && invalid(opts.position)) {
                opts.position = {
                    my: opts.position,
                    at: opts.position
                }
            }
            if ("show" in opts && invalid(opts.show)) {
                opts.show = opts.show.jquery ? {
                    target: opts.show
                } : opts.show === TRUE ? {
                    ready: TRUE
                } : {
                    event: opts.show
                }
            }
            if ("hide" in opts && invalid(opts.hide)) {
                opts.hide = opts.hide.jquery ? {
                    target: opts.hide
                } : {
                    event: opts.hide
                }
            }
            if ("style" in opts && invalid(opts.style)) {
                opts.style = {
                    classes: opts.style
                }
            }
            $.each(PLUGINS, function () {
                if (this.sanitize) {
                    this.sanitize(opts)
                }
            });
            return opts
        }

        function QTip(target, options, id, attr) {
            var self = this,
                docBody = document.body,
                tooltipID = NAMESPACE + "-" + id,
                isPositioning = 0,
                isDrawing = 0,
                tooltip = $(),
                namespace = ".qtip-" + id,
                disabledClass = "qtip-disabled",
                elements, cache;
            self.id = id;
            self.rendered = FALSE;
            self.destroyed = FALSE;
            self.elements = elements = {
                target: target
            };
            self.timers = {
                img: {}
            };
            self.options = options;
            self.checks = {};
            self.plugins = {};
            self.cache = cache = {
                event: {},
                target: $(),
                disabled: FALSE,
                attr: attr,
                onTarget: FALSE,
                lastClass: ""
            };

            function convertNotation(notation) {
                var i = 0,
                    obj, option = options,
                    levels = notation.split(".");
                while (option = option[levels[i++]]) {
                    if (i < levels.length) {
                        obj = option
                    }
                }
                return [obj || options, levels.pop()]
            }

            function createWidgetClass(cls) {
                return widget.concat("").join(cls ? "-" + cls + " " : " ")
            }

            function setWidget() {
                var on = options.style.widget,
                    disabled = tooltip.hasClass(disabledClass);
                tooltip.removeClass(disabledClass);
                disabledClass = on ? "ui-state-disabled" : "qtip-disabled";
                tooltip.toggleClass(disabledClass, disabled);
                tooltip.toggleClass("ui-helper-reset " + createWidgetClass(), on).toggleClass(defaultClass, options.style.def && !on);
                if (elements.content) {
                    elements.content.toggleClass(createWidgetClass("content"), on)
                }
                if (elements.titlebar) {
                    elements.titlebar.toggleClass(createWidgetClass("header"), on)
                }
                if (elements.button) {
                    elements.button.toggleClass(NAMESPACE + "-icon", !on)
                }
            }

            function removeTitle(reposition) {
                if (elements.title) {
                    elements.titlebar.remove();
                    elements.titlebar = elements.title = elements.button = NULL;
                    if (reposition !== FALSE) {
                        self.reposition()
                    }
                }
            }

            function createButton() {
                var button = options.content.title.button,
                    isString = typeof button === "string",
                    close = isString ? button : "Close tooltip";
                if (elements.button) {
                    elements.button.remove()
                }
                if (button.jquery) {
                    elements.button = button
                } else {
                    elements.button = $("<a />", {
                        "class": "qtip-close " + (options.style.widget ? "" : NAMESPACE + "-icon"),
                        title: close,
                        "aria-label": close
                    }).prepend($("<span />", {
                        "class": "ui-icon ui-icon-close",
                        html: "&times;"
                    }))
                }
                elements.button.appendTo(elements.titlebar || tooltip).attr("role", "button").click(function (event) {
                    if (!tooltip.hasClass(disabledClass)) {
                        self.hide(event)
                    }
                    return FALSE
                })
            }

            function createTitle() {
                var id = tooltipID + "-title";
                if (elements.titlebar) {
                    removeTitle()
                }
                elements.titlebar = $("<div />", {
                    "class": NAMESPACE + "-titlebar " + (options.style.widget ? createWidgetClass("header") : "")
                }).append(elements.title = $("<div />", {
                    id: id,
                    "class": NAMESPACE + "-title",
                    "aria-atomic": TRUE
                })).insertBefore(elements.content).delegate(".qtip-close", "mousedown keydown mouseup keyup mouseout", function (event) {
                    $(this).toggleClass("ui-state-active ui-state-focus", event.type.substr(-4) === "down")
                }).delegate(".qtip-close", "mouseover mouseout", function (event) {
                    $(this).toggleClass("ui-state-hover", event.type === "mouseover")
                });
                if (options.content.title.button) {
                    createButton()
                }
            }

            function updateButton(button) {
                var elem = elements.button;
                if (!self.rendered) {
                    return FALSE
                }
                if (!button) {
                    elem.remove()
                } else {
                    createButton()
                }
            }

            function updateTitle(content, reposition) {
                var elem = elements.title;
                if (!self.rendered || !content) {
                    return FALSE
                }
                if ($.isFunction(content)) {
                    content = content.call(target, cache.event, self)
                }
                if (content === FALSE || !content && content !== "") {
                    return removeTitle(FALSE)
                } else if (content.jquery && content.length > 0) {
                    elem.empty().append(content.css({
                        display: "block"
                    }))
                } else {
                    elem.html(content)
                } if (reposition !== FALSE && self.rendered && tooltip[0].offsetWidth > 0) {
                    self.reposition(cache.event)
                }
            }

            function deferredContent(deferred) {
                if (deferred && $.isFunction(deferred.done)) {
                    deferred.done(function (c) {
                        updateContent(c, null, FALSE)
                    })
                }
            }

            function updateContent(content, reposition, checkDeferred) {
                var elem = elements.content;
                if (!self.rendered || !content) {
                    return FALSE
                }
                if ($.isFunction(content)) {
                    content = content.call(target, cache.event, self) || ""
                }
                if (checkDeferred !== FALSE) {
                    deferredContent(options.content.deferred)
                }
                if (content.jquery && content.length > 0) {
                    elem.empty().append(content.css({
                        display: "block"
                    }))
                } else {
                    elem.html(content)
                }

                function imagesLoaded(next) {
                    var elem = $(this),
                        images = elem.find("img").add(elem.filter("img")),
                        loaded = [];

                    function imgLoaded(img) {
                        if (img.src === BLANKIMG || $.inArray(img, loaded) !== -1) {
                            return
                        }
                        loaded.push(img);
                        $.data(img, "imagesLoaded", {
                            src: img.src
                        });
                        if (images.length === loaded.length) {
                            setTimeout(next);
                            images.unbind(".imagesLoaded")
                        }
                    }
                    if (!images.length) {
                        return next()
                    }
                    images.bind("load.imagesLoaded error.imagesLoaded", function (event) {
                        imgLoaded(event.target)
                    }).each(function (i, el) {
                        var src = el.src,
                            cached = $.data(el, "imagesLoaded");
                        if (cached && cached.src === src || el.complete && el.naturalWidth) {
                            imgLoaded(el)
                        } else if (el.readyState || el.complete) {
                            el.src = BLANKIMG;
                            el.src = src
                        }
                    })
                }
                if (self.rendered < 0) {
                    tooltip.queue("fx", imagesLoaded)
                } else {
                    isDrawing = 0;
                    imagesLoaded.call(tooltip[0], $.noop)
                }
                return self
            }

            function assignEvents() {
                var posOptions = options.position,
                    targets = {
                        show: options.show.target,
                        hide: options.hide.target,
                        viewport: $(posOptions.viewport),
                        document: $(document),
                        body: $(document.body),
                        window: $(window)
                    }, events = {
                        show: $.trim("" + options.show.event).split(" "),
                        hide: $.trim("" + options.hide.event).split(" ")
                    }, IE6 = PLUGINS.ie === 6;

                function showMethod(event) {
                    if (tooltip.hasClass(disabledClass)) {
                        return FALSE
                    }
                    clearTimeout(self.timers.show);
                    clearTimeout(self.timers.hide);
                    var callback = function () {
                        self.toggle(TRUE, event)
                    };
                    if (options.show.delay > 0) {
                        self.timers.show = setTimeout(callback, options.show.delay)
                    } else {
                        callback()
                    }
                }

                function hideMethod(event) {
                    if (tooltip.hasClass(disabledClass) || isPositioning || isDrawing) {
                        return FALSE
                    }
                    var relatedTarget = $(event.relatedTarget),
                        ontoTooltip = relatedTarget.closest(selector)[0] === tooltip[0],
                        ontoTarget = relatedTarget[0] === targets.show[0];
                    clearTimeout(self.timers.show);
                    clearTimeout(self.timers.hide);
                    if (this !== relatedTarget[0] && posOptions.target === "mouse" && ontoTooltip || options.hide.fixed && /mouse(out|leave|move)/.test(event.type) && (ontoTooltip || ontoTarget)) {
                        try {
                            event.preventDefault();
                            event.stopImmediatePropagation()
                        } catch (e) {}
                        return
                    }
                    if (options.hide.delay > 0) {
                        self.timers.hide = setTimeout(function () {
                            self.hide(event)
                        }, options.hide.delay)
                    } else {
                        self.hide(event)
                    }
                }

                function inactiveMethod(event) {
                    if (tooltip.hasClass(disabledClass)) {
                        return FALSE
                    }
                    clearTimeout(self.timers.inactive);
                    self.timers.inactive = setTimeout(function () {
                        self.hide(event)
                    }, options.hide.inactive)
                }

                function repositionMethod(event) {
                    if (self.rendered && tooltip[0].offsetWidth > 0) {
                        self.reposition(event)
                    }
                }
                tooltip.bind("mouseenter" + namespace + " mouseleave" + namespace, function (event) {
                    var state = event.type === "mouseenter";
                    if (state) {
                        self.focus(event)
                    }
                    tooltip.toggleClass(hoverClass, state)
                });
                if (/mouse(out|leave)/i.test(options.hide.event)) {
                    if (options.hide.leave === "window") {
                        targets.document.bind("mouseout" + namespace + " blur" + namespace, function (event) {
                            if (!/select|option/.test(event.target.nodeName) && !event.relatedTarget) {
                                self.hide(event)
                            }
                        })
                    }
                }
                if (options.hide.fixed) {
                    targets.hide = targets.hide.add(tooltip);
                    tooltip.bind("mouseover" + namespace, function () {
                        if (!tooltip.hasClass(disabledClass)) {
                            clearTimeout(self.timers.hide)
                        }
                    })
                } else if (/mouse(over|enter)/i.test(options.show.event)) {
                    targets.hide.bind("mouseleave" + namespace, function (event) {
                        clearTimeout(self.timers.show)
                    })
                }
                if (("" + options.hide.event).indexOf("unfocus") > -1) {
                    posOptions.container.closest("html").bind("mousedown" + namespace + " touchstart" + namespace, function (event) {
                        var elem = $(event.target),
                            enabled = self.rendered && !tooltip.hasClass(disabledClass) && tooltip[0].offsetWidth > 0,
                            isAncestor = elem.parents(selector).filter(tooltip[0]).length > 0;
                        if (elem[0] !== target[0] && elem[0] !== tooltip[0] && !isAncestor && !target.has(elem[0]).length && enabled) {
                            self.hide(event)
                        }
                    })
                }
                if ("number" === typeof options.hide.inactive) {
                    targets.show.bind("qtip-" + id + "-inactive", inactiveMethod);
                    $.each(QTIP.inactiveEvents, function (index, type) {
                        targets.hide.add(elements.tooltip).bind(type + namespace + "-inactive", inactiveMethod)
                    })
                }
                $.each(events.hide, function (index, type) {
                    var showIndex = $.inArray(type, events.show),
                        targetHide = $(targets.hide);
                    if (showIndex > -1 && targetHide.add(targets.show).length === targetHide.length || type === "unfocus") {
                        targets.show.bind(type + namespace, function (event) {
                            if (tooltip[0].offsetWidth > 0) {
                                hideMethod(event)
                            } else {
                                showMethod(event)
                            }
                        });
                        delete events.show[showIndex]
                    } else {
                        targets.hide.bind(type + namespace, hideMethod)
                    }
                });
                $.each(events.show, function (index, type) {
                    targets.show.bind(type + namespace, showMethod)
                });
                if ("number" === typeof options.hide.distance) {
                    targets.show.add(tooltip).bind("mousemove" + namespace, function (event) {
                        var origin = cache.origin || {}, limit = options.hide.distance,
                            abs = Math.abs;
                        if (abs(event.pageX - origin.pageX) >= limit || abs(event.pageY - origin.pageY) >= limit) {
                            self.hide(event)
                        }
                    })
                }
                if (posOptions.target === "mouse") {
                    targets.show.bind("mousemove" + namespace, storeMouse);
                    if (posOptions.adjust.mouse) {
                        if (options.hide.event) {
                            tooltip.bind("mouseleave" + namespace, function (event) {
                                if ((event.relatedTarget || event.target) !== targets.show[0]) {
                                    self.hide(event)
                                }
                            });
                            elements.target.bind("mouseenter" + namespace + " mouseleave" + namespace, function (event) {
                                cache.onTarget = event.type === "mouseenter"
                            })
                        }
                        targets.document.bind("mousemove" + namespace, function (event) {
                            if (self.rendered && cache.onTarget && !tooltip.hasClass(disabledClass) && tooltip[0].offsetWidth > 0) {
                                self.reposition(event || MOUSE)
                            }
                        })
                    }
                }
                if (posOptions.adjust.resize || targets.viewport.length) {
                    ($.event.special.resize ? targets.viewport : targets.window).bind("resize" + namespace, repositionMethod)
                }
                if (posOptions.adjust.scroll) {
                    targets.window.add(posOptions.container).bind("scroll" + namespace, repositionMethod)
                }
            }

            function unassignEvents() {
                var targets = [options.show.target[0], options.hide.target[0], self.rendered && elements.tooltip[0], options.position.container[0], options.position.viewport[0], options.position.container.closest("html")[0], window, document];
                if (self.rendered) {
                    $([]).pushStack($.grep(targets, function (i) {
                        return typeof i === "object"
                    })).unbind(namespace)
                } else {
                    options.show.target.unbind(namespace + "-create")
                }
            }
            self.checks.builtin = {
                "^id$": function (obj, o, v) {
                    var id = v === TRUE ? QTIP.nextid : v,
                        tooltipID = NAMESPACE + "-" + id;
                    if (id !== FALSE && id.length > 0 && !$("#" + tooltipID).length) {
                        tooltip[0].id = tooltipID;
                        elements.content[0].id = tooltipID + "-content";
                        elements.title[0].id = tooltipID + "-title"
                    }
                },
                "^content.text$": function (obj, o, v) {
                    updateContent(options.content.text)
                },
                "^content.deferred$": function (obj, o, v) {
                    deferredContent(options.content.deferred)
                },
                "^content.title.text$": function (obj, o, v) {
                    if (!v) {
                        return removeTitle()
                    }
                    if (!elements.title && v) {
                        createTitle()
                    }
                    updateTitle(v)
                },
                "^content.title.button$": function (obj, o, v) {
                    updateButton(v)
                },
                "^position.(my|at)$": function (obj, o, v) {
                    if ("string" === typeof v) {
                        obj[o] = new PLUGINS.Corner(v)
                    }
                },
                "^position.container$": function (obj, o, v) {
                    if (self.rendered) {
                        tooltip.appendTo(v)
                    }
                },
                "^show.ready$": function () {
                    if (!self.rendered) {
                        self.render(1)
                    } else {
                        self.toggle(TRUE)
                    }
                },
                "^style.classes$": function (obj, o, v) {
                    tooltip.attr("class", NAMESPACE + " qtip " + v)
                },
                "^style.width|height": function (obj, o, v) {
                    tooltip.css(o, v)
                },
                "^style.widget|content.title": setWidget,
                "^events.(render|show|move|hide|focus|blur)$": function (obj, o, v) {
                    tooltip[($.isFunction(v) ? "" : "un") + "bind"]("tooltip" + o, v)
                },
                "^(show|hide|position).(event|target|fixed|inactive|leave|distance|viewport|adjust)": function () {
                    var posOptions = options.position;
                    tooltip.attr("tracking", posOptions.target === "mouse" && posOptions.adjust.mouse);
                    unassignEvents();
                    assignEvents()
                }
            };
            $.extend(self, {
                _triggerEvent: function (type, args, event) {
                    var callback = $.Event("tooltip" + type);
                    callback.originalEvent = (event ? $.extend({}, event) : NULL) || cache.event || NULL;
                    tooltip.trigger(callback, [self].concat(args || []));
                    return !callback.isDefaultPrevented()
                },
                render: function (show) {
                    if (self.rendered) {
                        return self
                    }
                    var text = options.content.text,
                        title = options.content.title,
                        posOptions = options.position;
                    $.attr(target[0], "aria-describedby", tooltipID);
                    tooltip = elements.tooltip = $("<div/>", {
                        id: tooltipID,
                        "class": [NAMESPACE, defaultClass, options.style.classes, NAMESPACE + "-pos-" + options.position.my.abbrev()].join(" "),
                        width: options.style.width || "",
                        height: options.style.height || "",
                        tracking: posOptions.target === "mouse" && posOptions.adjust.mouse,
                        role: "alert",
                        "aria-live": "polite",
                        "aria-atomic": FALSE,
                        "aria-describedby": tooltipID + "-content",
                        "aria-hidden": TRUE
                    }).toggleClass(disabledClass, cache.disabled).data("qtip", self).appendTo(options.position.container).append(elements.content = $("<div />", {
                        "class": NAMESPACE + "-content",
                        id: tooltipID + "-content",
                        "aria-atomic": TRUE
                    }));
                    self.rendered = -1;
                    isPositioning = 1;
                    if (title.text) {
                        createTitle();
                        if (!$.isFunction(title.text)) {
                            updateTitle(title.text, FALSE)
                        }
                    } else if (title.button) {
                        createButton()
                    }
                    if (!$.isFunction(text) || text.then) {
                        updateContent(text, FALSE)
                    }
                    self.rendered = TRUE;
                    setWidget();
                    $.each(options.events, function (name, callback) {
                        if ($.isFunction(callback)) {
                            tooltip.bind(name === "toggle" ? "tooltipshow tooltiphide" : "tooltip" + name, callback)
                        }
                    });
                    $.each(PLUGINS, function () {
                        if (this.initialize === "render") {
                            this(self)
                        }
                    });
                    assignEvents();
                    tooltip.queue("fx", function (next) {
                        self._triggerEvent("render");
                        isPositioning = 0;
                        if (options.show.ready || show) {
                            self.toggle(TRUE, cache.event, FALSE)
                        }
                        next()
                    });
                    return self
                },
                get: function (notation) {
                    var result, o;
                    switch (notation.toLowerCase()) {
                    case "dimensions":
                        result = {
                            height: tooltip.outerHeight(FALSE),
                            width: tooltip.outerWidth(FALSE)
                        };
                        break;
                    case "offset":
                        result = PLUGINS.offset(tooltip, options.position.container);
                        break;
                    default:
                        o = convertNotation(notation.toLowerCase());
                        result = o[0][o[1]];
                        result = result.precedance ? result.string() : result;
                        break
                    }
                    return result
                },
                set: function (option, value) {
                    var rmove = /^position\.(my|at|adjust|target|container)|style|content|show\.ready/i,
                        rdraw = /^content\.(title|attr)|style/i,
                        reposition = FALSE,
                        checks = self.checks,
                        name;

                    function callback(notation, args) {
                        var category, rule, match;
                        for (category in checks) {
                            for (rule in checks[category]) {
                                if (match = new RegExp(rule, "i").exec(notation)) {
                                    args.push(match);
                                    checks[category][rule].apply(self, args)
                                }
                            }
                        }
                    }
                    if ("string" === typeof option) {
                        name = option;
                        option = {};
                        option[name] = value
                    } else {
                        option = $.extend(TRUE, {}, option)
                    }
                    $.each(option, function (notation, value) {
                        var obj = convertNotation(notation.toLowerCase()),
                            previous;
                        previous = obj[0][obj[1]];
                        obj[0][obj[1]] = "object" === typeof value && value.nodeType ? $(value) : value;
                        option[notation] = [obj[0], obj[1], value, previous];
                        reposition = rmove.test(notation) || reposition
                    });
                    sanitizeOptions(options);
                    isPositioning = 1;
                    $.each(option, callback);
                    isPositioning = 0;
                    if (self.rendered && tooltip[0].offsetWidth > 0 && reposition) {
                        self.reposition(options.position.target === "mouse" ? NULL : cache.event)
                    }
                    return self
                },
                toggle: function (state, event) {
                    if (event) {
                        if (/over|enter/.test(event.type) && /out|leave/.test(cache.event.type) && options.show.target.add(event.target).length === options.show.target.length && tooltip.has(event.relatedTarget).length) {
                            return self
                        }
                        cache.event = $.extend({}, event)
                    }
                    if (!self.rendered) {
                        return state ? self.render(1) : self
                    }
                    var type = state ? "show" : "hide",
                        opts = options[type],
                        otherOpts = options[!state ? "show" : "hide"],
                        posOptions = options.position,
                        contentOptions = options.content,
                        width = tooltip.css("width"),
                        visible = tooltip[0].offsetWidth > 0,
                        animate = state || opts.target.length === 1,
                        sameTarget = !event || opts.target.length < 2 || cache.target[0] === event.target,
                        showEvent, delay;
                    if ((typeof state).search("boolean|number")) {
                        state = !visible
                    }
                    if (!tooltip.is(":animated") && visible === state && sameTarget) {
                        return self
                    }
                    if (!self._triggerEvent(type, [90])) {
                        return self
                    }
                    $.attr(tooltip[0], "aria-hidden", !! !state);
                    if (state) {
                        cache.origin = $.extend({}, MOUSE);
                        self.focus(event);
                        if ($.isFunction(contentOptions.text)) {
                            updateContent(contentOptions.text, FALSE)
                        }
                        if ($.isFunction(contentOptions.title.text)) {
                            updateTitle(contentOptions.title.text, FALSE)
                        }
                        if (!trackingBound && posOptions.target === "mouse" && posOptions.adjust.mouse) {
                            $(document).bind("mousemove.qtip", storeMouse);
                            trackingBound = TRUE
                        }
                        if (!width) {
                            tooltip.css("width", tooltip.outerWidth())
                        }
                        self.reposition(event, arguments[2]);
                        if (!width) {
                            tooltip.css("width", "")
                        }
                        if ( !! opts.solo) {
                            (typeof opts.solo === "string" ? $(opts.solo) : $(selector, opts.solo)).not(tooltip).not(opts.target).qtip("hide", $.Event("tooltipsolo"))
                        }
                    } else {
                        clearTimeout(self.timers.show);
                        delete cache.origin;
                        if (trackingBound && !$(selector + '[tracking="true"]:visible', opts.solo).not(tooltip).length) {
                            $(document).unbind("mousemove.qtip");
                            trackingBound = FALSE
                        }
                        self.blur(event)
                    }

                    function after() {
                        if (state) {
                            if (PLUGINS.ie) {
                                tooltip[0].style.removeAttribute("filter")
                            }
                            tooltip.css("overflow", "");
                            if ("string" === typeof opts.autofocus) {
                                $(opts.autofocus, tooltip).focus()
                            }
                            opts.target.trigger("qtip-" + id + "-inactive")
                        } else {
                            tooltip.css({
                                display: "",
                                visibility: "",
                                opacity: "",
                                left: "",
                                top: ""
                            })
                        }
                        self._triggerEvent(state ? "visible" : "hidden")
                    }
                    if (opts.effect === FALSE || animate === FALSE) {
                        tooltip[type]();
                        after.call(tooltip)
                    } else if ($.isFunction(opts.effect)) {
                        tooltip.stop(1, 1);
                        opts.effect.call(tooltip, self);
                        tooltip.queue("fx", function (n) {
                            after();
                            n()
                        })
                    } else {
                        tooltip.fadeTo(90, state ? 1 : 0, after)
                    } if (state) {
                        opts.target.trigger("qtip-" + id + "-inactive")
                    }
                    return self
                },
                show: function (event) {
                    return self.toggle(TRUE, event)
                },
                hide: function (event) {
                    return self.toggle(FALSE, event)
                },
                focus: function (event) {
                    if (!self.rendered) {
                        return self
                    }
                    var qtips = $(selector),
                        curIndex = parseInt(tooltip[0].style.zIndex, 10),
                        newIndex = QTIP.zindex + qtips.length,
                        cachedEvent = $.extend({}, event),
                        focusedElem;
                    if (!tooltip.hasClass(focusClass)) {
                        if (self._triggerEvent("focus", [newIndex], cachedEvent)) {
                            if (curIndex !== newIndex) {
                                qtips.each(function () {
                                    if (this.style.zIndex > curIndex) {
                                        this.style.zIndex = this.style.zIndex - 1
                                    }
                                });
                                qtips.filter("." + focusClass).qtip("blur", cachedEvent)
                            }
                            tooltip.addClass(focusClass)[0].style.zIndex = newIndex
                        }
                    }
                    return self
                },
                blur: function (event) {
                    tooltip.removeClass(focusClass);
                    self._triggerEvent("blur", [tooltip.css("zIndex")], event);
                    return self
                },
                reposition: function (event, effect) {
                    if (!self.rendered || isPositioning) {
                        return self
                    }
                    isPositioning = 1;
                    var target = options.position.target,
                        posOptions = options.position,
                        my = posOptions.my,
                        at = posOptions.at,
                        adjust = posOptions.adjust,
                        method = adjust.method.split(" "),
                        elemWidth = tooltip.outerWidth(FALSE),
                        elemHeight = tooltip.outerHeight(FALSE),
                        targetWidth = 0,
                        targetHeight = 0,
                        type = tooltip.css("position"),
                        viewport = posOptions.viewport,
                        position = {
                            left: 0,
                            top: 0
                        }, container = posOptions.container,
                        visible = tooltip[0].offsetWidth > 0,
                        isScroll = event && event.type === "scroll",
                        win = $(window),
                        adjusted, offset;
                    if ($.isArray(target) && target.length === 2) {
                        at = {
                            x: LEFT,
                            y: TOP
                        };
                        position = {
                            left: target[0],
                            top: target[1]
                        }
                    } else if (target === "mouse" && (event && event.pageX || cache.event.pageX)) {
                        at = {
                            x: LEFT,
                            y: TOP
                        };
                        event = MOUSE && MOUSE.pageX && (adjust.mouse || !event || !event.pageX) ? {
                            pageX: MOUSE.pageX,
                            pageY: MOUSE.pageY
                        } : (event && (event.type === "resize" || event.type === "scroll") ? cache.event : event && event.pageX && event.type === "mousemove" ? event : (!adjust.mouse || options.show.distance) && cache.origin && cache.origin.pageX ? cache.origin : event) || event || cache.event || MOUSE || {};
                        if (type !== "static") {
                            position = container.offset()
                        }
                        position = {
                            left: event.pageX - position.left,
                            top: event.pageY - position.top
                        };
                        if (adjust.mouse && isScroll) {
                            position.left -= MOUSE.scrollX - win.scrollLeft();
                            position.top -= MOUSE.scrollY - win.scrollTop()
                        }
                    } else {
                        if (target === "event" && event && event.target && event.type !== "scroll" && event.type !== "resize") {
                            cache.target = $(event.target)
                        } else if (target !== "event") {
                            cache.target = $(target.jquery ? target : elements.target)
                        }
                        target = cache.target;
                        target = $(target).eq(0);
                        if (target.length === 0) {
                            return self
                        } else if (target[0] === document || target[0] === window) {
                            targetWidth = PLUGINS.iOS ? window.innerWidth : target.width();
                            targetHeight = PLUGINS.iOS ? window.innerHeight : target.height();
                            if (target[0] === window) {
                                position = {
                                    top: (viewport || target).scrollTop(),
                                    left: (viewport || target).scrollLeft()
                                }
                            }
                        } else if (PLUGINS.imagemap && target.is("area")) {
                            adjusted = PLUGINS.imagemap(self, target, at, PLUGINS.viewport ? method : FALSE)
                        } else if (PLUGINS.svg && target[0].ownerSVGElement) {
                            adjusted = PLUGINS.svg(self, target, at, PLUGINS.viewport ? method : FALSE)
                        } else {
                            targetWidth = target.outerWidth(FALSE);
                            targetHeight = target.outerHeight(FALSE);
                            position = PLUGINS.offset(target, container)
                        } if (adjusted) {
                            targetWidth = adjusted.width;
                            targetHeight = adjusted.height;
                            offset = adjusted.offset;
                            position = adjusted.position
                        }
                        if (PLUGINS.iOS > 3.1 && PLUGINS.iOS < 4.1 || PLUGINS.iOS >= 4.3 && PLUGINS.iOS < 4.33 || !PLUGINS.iOS && type === "fixed") {
                            position.left -= win.scrollLeft();
                            position.top -= win.scrollTop()
                        }
                        position.left += at.x === RIGHT ? targetWidth : at.x === CENTER ? targetWidth / 2 : 0;
                        position.top += at.y === BOTTOM ? targetHeight : at.y === CENTER ? targetHeight / 2 : 0
                    }
                    position.left += adjust.x + (my.x === RIGHT ? -elemWidth : my.x === CENTER ? -elemWidth / 2 : 0);
                    position.top += adjust.y + (my.y === BOTTOM ? -elemHeight : my.y === CENTER ? -elemHeight / 2 : 0);
                    if (PLUGINS.viewport) {
                        position.adjusted = PLUGINS.viewport(self, position, posOptions, targetWidth, targetHeight, elemWidth, elemHeight);
                        if (offset && position.adjusted.left) {
                            position.left += offset.left
                        }
                        if (offset && position.adjusted.top) {
                            position.top += offset.top
                        }
                    } else {
                        position.adjusted = {
                            left: 0,
                            top: 0
                        }
                    } if (!self._triggerEvent("move", [position, viewport.elem || viewport], event)) {
                        return self
                    }
                    delete position.adjusted;
                    if (effect === FALSE || !visible || isNaN(position.left) || isNaN(position.top) || target === "mouse" || !$.isFunction(posOptions.effect)) {
                        tooltip.css(position)
                    } else if ($.isFunction(posOptions.effect)) {
                        posOptions.effect.call(tooltip, self, $.extend({}, position));
                        tooltip.queue(function (next) {
                            $(this).css({
                                opacity: "",
                                height: ""
                            });
                            if (PLUGINS.ie) {
                                this.style.removeAttribute("filter")
                            }
                            next()
                        })
                    }
                    isPositioning = 0;
                    return self
                },
                disable: function (state) {
                    if ("boolean" !== typeof state) {
                        state = !(tooltip.hasClass(disabledClass) || cache.disabled)
                    }
                    if (self.rendered) {
                        tooltip.toggleClass(disabledClass, state);
                        $.attr(tooltip[0], "aria-disabled", state)
                    } else {
                        cache.disabled = !! state
                    }
                    return self
                },
                enable: function () {
                    return self.disable(FALSE)
                },
                destroy: function (immediate) {
                    if (self.destroyed) {
                        return
                    }
                    self.destroyed = TRUE;

                    function process() {
                        var t = target[0],
                            title = $.attr(t, oldtitle),
                            elemAPI = target.data("qtip");
                        if (self.rendered) {
                            $.each(self.plugins, function (name) {
                                if (this.destroy) {
                                    this.destroy()
                                }
                                delete self.plugins[name]
                            });
                            tooltip.stop(1, 0).find("*").remove().end().remove();
                            self.rendered = FALSE
                        }
                        clearTimeout(self.timers.show);
                        clearTimeout(self.timers.hide);
                        unassignEvents();
                        if (!elemAPI || self === elemAPI) {
                            target.removeData("qtip").removeAttr(HASATTR);
                            if (options.suppress && title) {
                                target.attr("title", title);
                                target.removeAttr(oldtitle)
                            }
                            target.removeAttr("aria-describedby")
                        }
                        target.unbind(".qtip-" + id);
                        delete usedIDs[self.id];
                        delete self.options;
                        delete self.elements;
                        delete self.cache;
                        delete self.timers;
                        delete self.checks
                    }
                    if (immediate === TRUE) {
                        process()
                    } else {
                        tooltip.bind("tooltiphidden", process);
                        self.hide()
                    }
                    return target
                }
            })
        }

        function init(elem, id, opts) {
            var obj, posOptions, attr, config, title, docBody = $(document.body),
                newTarget = elem[0] === document ? docBody : elem,
                metadata = elem.metadata ? elem.metadata(opts.metadata) : NULL,
                metadata5 = opts.metadata.type === "html5" && metadata ? metadata[opts.metadata.name] : NULL,
                html5 = elem.data(opts.metadata.name || "qtipopts");
            try {
                html5 = typeof html5 === "string" ? $.parseJSON(html5) : html5
            } catch (e) {}
            config = $.extend(TRUE, {}, QTIP.defaults, opts, typeof html5 === "object" ? sanitizeOptions(html5) : NULL, sanitizeOptions(metadata5 || metadata));
            posOptions = config.position;
            config.id = id;
            if ("boolean" === typeof config.content.text) {
                attr = elem.attr(config.content.attr);
                if (config.content.attr !== FALSE && attr) {
                    config.content.text = attr
                } else {
                    return FALSE
                }
            }
            if (!posOptions.container.length) {
                posOptions.container = docBody
            }
            if (posOptions.target === FALSE) {
                posOptions.target = newTarget
            }
            if (config.show.target === FALSE) {
                config.show.target = newTarget
            }
            if (config.show.solo === TRUE) {
                config.show.solo = posOptions.container.closest("body")
            }
            if (config.hide.target === FALSE) {
                config.hide.target = newTarget
            }
            if (config.position.viewport === TRUE) {
                config.position.viewport = posOptions.container
            }
            posOptions.container = posOptions.container.eq(0);
            posOptions.at = new PLUGINS.Corner(posOptions.at);
            posOptions.my = new PLUGINS.Corner(posOptions.my);
            if (elem.data("qtip")) {
                if (config.overwrite) {
                    elem.qtip("destroy")
                } else if (config.overwrite === FALSE) {
                    return FALSE
                }
            }
            elem.attr(HASATTR, true);
            if (config.suppress && (title = elem.attr("title"))) {
                elem.removeAttr("title").attr(oldtitle, title).attr("title", "")
            }
            obj = new QTip(elem, config, id, !! attr);
            elem.data("qtip", obj);
            elem.one("remove.qtip-" + id + " removeqtip.qtip-" + id, function () {
                var api;
                if (api = $(this).data("qtip")) {
                    api.destroy()
                }
            });
            return obj
        }
        QTIP = $.fn.qtip = function (options, notation, newValue) {
            var command = ("" + options).toLowerCase(),
                returned = NULL,
                args = $.makeArray(arguments).slice(1),
                event = args[args.length - 1],
                opts = this[0] ? $.data(this[0], "qtip") : NULL;
            if (!arguments.length && opts || command === "api") {
                return opts
            } else if ("string" === typeof options) {
                this.each(function () {
                    var api = $.data(this, "qtip");
                    if (!api) {
                        return TRUE
                    }
                    if (event && event.timeStamp) {
                        api.cache.event = event
                    }
                    if ((command === "option" || command === "options") && notation) {
                        if ($.isPlainObject(notation) || newValue !== undefined) {
                            api.set(notation, newValue)
                        } else {
                            returned = api.get(notation);
                            return FALSE
                        }
                    } else if (api[command]) {
                        api[command].apply(api[command], args)
                    }
                });
                return returned !== NULL ? returned : this
            } else if ("object" === typeof options || !arguments.length) {
                opts = sanitizeOptions($.extend(TRUE, {}, options));
                return QTIP.bind.call(this, opts, event)
            }
        };
        QTIP.bind = function (opts, event) {
            return this.each(function (i) {
                var options, targets, events, namespace, api, id;
                id = $.isArray(opts.id) ? opts.id[i] : opts.id;
                id = !id || id === FALSE || id.length < 1 || usedIDs[id] ? QTIP.nextid++ : usedIDs[id] = id;
                namespace = ".qtip-" + id + "-create";
                api = init($(this), id, opts);
                if (api === FALSE) {
                    return TRUE
                }
                options = api.options;
                $.each(PLUGINS, function () {
                    if (this.initialize === "initialize") {
                        this(api)
                    }
                });
                targets = {
                    show: options.show.target,
                    hide: options.hide.target
                };
                events = {
                    show: $.trim("" + options.show.event).replace(/ /g, namespace + " ") + namespace,
                    hide: $.trim("" + options.hide.event).replace(/ /g, namespace + " ") + namespace
                };
                if (/mouse(over|enter)/i.test(events.show) && !/mouse(out|leave)/i.test(events.hide)) {
                    events.hide += " mouseleave" + namespace
                }
                targets.show.bind("mousemove" + namespace, function (event) {
                    storeMouse(event);
                    api.cache.onTarget = TRUE
                });

                function hoverIntent(event) {
                    function render() {
                        api.render(typeof event === "object" || options.show.ready);
                        targets.show.add(targets.hide).unbind(namespace)
                    }
                    if (api.cache.disabled) {
                        return FALSE
                    }
                    api.cache.event = $.extend({}, event);
                    api.cache.target = event ? $(event.target) : [undefined];
                    if (options.show.delay > 0) {
                        clearTimeout(api.timers.show);
                        api.timers.show = setTimeout(render, options.show.delay);
                        if (events.show !== events.hide) {
                            targets.hide.bind(events.hide, function () {
                                clearTimeout(api.timers.show)
                            })
                        }
                    } else {
                        render()
                    }
                }
                targets.show.bind(events.show, hoverIntent);
                if (options.show.ready || options.prerender) {
                    hoverIntent(event)
                }
            })
        };
        PLUGINS = QTIP.plugins = {
            Corner: function (corner) {
                corner = ("" + corner).replace(/([A-Z])/, " $1").replace(/middle/gi, CENTER).toLowerCase();
                this.x = (corner.match(/left|right/i) || corner.match(/center/) || ["inherit"])[0].toLowerCase();
                this.y = (corner.match(/top|bottom|center/i) || ["inherit"])[0].toLowerCase();
                var f = corner.charAt(0);
                this.precedance = f === "t" || f === "b" ? Y : X;
                this.string = function () {
                    return this.precedance === Y ? this.y + this.x : this.x + this.y
                };
                this.abbrev = function () {
                    var x = this.x.substr(0, 1),
                        y = this.y.substr(0, 1);
                    return x === y ? x : this.precedance === Y ? y + x : x + y
                };
                this.invertx = function (center) {
                    this.x = this.x === LEFT ? RIGHT : this.x === RIGHT ? LEFT : center || this.x
                };
                this.inverty = function (center) {
                    this.y = this.y === TOP ? BOTTOM : this.y === BOTTOM ? TOP : center || this.y
                };
                this.clone = function () {
                    return {
                        x: this.x,
                        y: this.y,
                        precedance: this.precedance,
                        string: this.string,
                        abbrev: this.abbrev,
                        clone: this.clone,
                        invertx: this.invertx,
                        inverty: this.inverty
                    }
                }
            },
            offset: function (elem, container) {
                var pos = elem.offset(),
                    docBody = elem.closest("body"),
                    quirks = PLUGINS.ie && document.compatMode !== "CSS1Compat",
                    parent = container,
                    scrolled, coffset, overflow;

                function scroll(e, i) {
                    pos.left += i * e.scrollLeft();
                    pos.top += i * e.scrollTop()
                }
                if (parent) {
                    do {
                        if (parent.css("position") !== "static") {
                            coffset = parent.position();
                            pos.left -= coffset.left + (parseInt(parent.css("borderLeftWidth"), 10) || 0) + (parseInt(parent.css("marginLeft"), 10) || 0);
                            pos.top -= coffset.top + (parseInt(parent.css("borderTopWidth"), 10) || 0) + (parseInt(parent.css("marginTop"), 10) || 0);
                            if (!scrolled && (overflow = parent.css("overflow")) !== "hidden" && overflow !== "visible") {
                                scrolled = parent
                            }
                        }
                    } while ((parent = $(parent[0].offsetParent)).length);
                    if (scrolled && scrolled[0] !== docBody[0] || quirks) {
                        scroll(scrolled || docBody, 1)
                    }
                }
                return pos
            },
            ie: function () {
                var v = 3,
                    div = document.createElement("div");
                while (div.innerHTML = "<!--[if gt IE " + ++v + "]><i></i><![endif]-->") {
                    if (!div.getElementsByTagName("i")[0]) {
                        break
                    }
                }
                return v > 4 ? v : FALSE
            }(),
            iOS: parseFloat(("" + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0, ""])[1]).replace("undefined", "3_2").replace("_", ".").replace("_", "")) || FALSE,
            fn: {
                attr: function (attr, val) {
                    if (this.length) {
                        var self = this[0],
                            title = "title",
                            api = $.data(self, "qtip");
                        if (attr === title && api && "object" === typeof api && api.options.suppress) {
                            if (arguments.length < 2) {
                                return $.attr(self, oldtitle)
                            }
                            if (api && api.options.content.attr === title && api.cache.attr) {
                                api.set("content.text", val)
                            }
                            return this.attr(oldtitle, val)
                        }
                    }
                    return $.fn["attr" + replaceSuffix].apply(this, arguments)
                },
                clone: function (keepData) {
                    var titles = $([]),
                        title = "title",
                        elems = $.fn["clone" + replaceSuffix].apply(this, arguments);
                    if (!keepData) {
                        elems.filter("[" + oldtitle + "]").attr("title", function () {
                            return $.attr(this, oldtitle)
                        }).removeAttr(oldtitle)
                    }
                    return elems
                }
            }
        };
        $.each(PLUGINS.fn, function (name, func) {
            if (!func || $.fn[name + replaceSuffix]) {
                return TRUE
            }
            var old = $.fn[name + replaceSuffix] = $.fn[name];
            $.fn[name] = function () {
                return func.apply(this, arguments) || old.apply(this, arguments)
            }
        });
        if (!$.ui) {
            $["cleanData" + replaceSuffix] = $.cleanData;
            $.cleanData = function (elems) {
                for (var i = 0, elem;
                    (elem = elems[i]) !== undefined && elem.getAttribute(HASATTR); i++) {
                    try {
                        $(elem).triggerHandler("removeqtip")
                    } catch (e) {}
                }
                $["cleanData" + replaceSuffix](elems)
            }
        }
        QTIP.version = "2.0.1-27-";
        QTIP.nextid = 0;
        QTIP.inactiveEvents = "click dblclick mousedown mouseup mousemove mouseleave mouseenter".split(" ");
        QTIP.zindex = 15e3;
        QTIP.defaults = {
            prerender: FALSE,
            id: FALSE,
            overwrite: TRUE,
            suppress: TRUE,
            content: {
                text: TRUE,
                attr: "title",
                deferred: FALSE,
                title: {
                    text: FALSE,
                    button: FALSE
                }
            },
            position: {
                my: "top left",
                at: "bottom right",
                target: FALSE,
                container: FALSE,
                viewport: FALSE,
                adjust: {
                    x: 0,
                    y: 0,
                    mouse: TRUE,
                    scroll: TRUE,
                    resize: TRUE,
                    method: "flipinvert flipinvert"
                },
                effect: function (api, pos, viewport) {
                    $(this).animate(pos, {
                        duration: 200,
                        queue: FALSE
                    })
                }
            },
            show: {
                target: FALSE,
                event: "mouseenter",
                effect: TRUE,
                delay: 90,
                solo: FALSE,
                ready: FALSE,
                autofocus: FALSE
            },
            hide: {
                target: FALSE,
                event: "mouseleave",
                effect: TRUE,
                delay: 0,
                fixed: FALSE,
                inactive: FALSE,
                leave: "window",
                distance: FALSE
            },
            style: {
                classes: "",
                widget: FALSE,
                width: FALSE,
                height: FALSE,
                def: TRUE
            },
            events: {
                render: NULL,
                move: NULL,
                show: NULL,
                hide: NULL,
                toggle: NULL,
                visible: NULL,
                hidden: NULL,
                focus: NULL,
                blur: NULL
            }
        };
        PLUGINS.svg = function (api, svg, corner, adjustMethod) {
            var doc = $(document),
                elem = svg[0],
                result = {
                    width: 0,
                    height: 0,
                    position: {
                        top: 1e10,
                        left: 1e10
                    }
                }, box, mtx, root, point, tPoint;
            while (!elem.getBBox) {
                elem = elem.parentNode
            }
            if (elem.getBBox && elem.parentNode) {
                box = elem.getBBox();
                mtx = elem.getScreenCTM();
                root = elem.farthestViewportElement || elem;
                if (!root.createSVGPoint) {
                    return result
                }
                point = root.createSVGPoint();
                point.x = box.x;
                point.y = box.y;
                tPoint = point.matrixTransform(mtx);
                result.position.left = tPoint.x;
                result.position.top = tPoint.y;
                point.x += box.width;
                point.y += box.height;
                tPoint = point.matrixTransform(mtx);
                result.width = tPoint.x - result.position.left;
                result.height = tPoint.y - result.position.top;
                result.position.left += doc.scrollLeft();
                result.position.top += doc.scrollTop()
            }
            return result
        };
        var AJAX, AJAXNS = ".qtip-ajax",
            RSCRIPT = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

        function Ajax(api) {
            var self = this,
                tooltip = api.elements.tooltip,
                opts = api.options.content.ajax,
                defaults = QTIP.defaults.content.ajax,
                first = TRUE,
                stop = FALSE,
                xhr;
            api.checks.ajax = {
                "^content.ajax": function (obj, name, v) {
                    if (name === "ajax") {
                        opts = v
                    }
                    if (name === "once") {
                        self.init()
                    } else if (opts && opts.url) {
                        self.load()
                    } else {
                        tooltip.unbind(AJAXNS)
                    }
                }
            };
            $.extend(self, {
                init: function () {
                    if (opts && opts.url) {
                        tooltip.unbind(AJAXNS)[opts.once ? "one" : "bind"]("tooltipshow" + AJAXNS, self.load)
                    }
                    return self
                },
                load: function (event) {
                    if (stop) {
                        stop = FALSE;
                        return
                    }
                    var hasSelector = opts.url.lastIndexOf(" "),
                        url = opts.url,
                        selector, hideFirst = !opts.loading && first;
                    if (hideFirst) {
                        try {
                            event.preventDefault()
                        } catch (e) {}
                    } else if (event && event.isDefaultPrevented()) {
                        return self
                    }
                    if (xhr && xhr.abort) {
                        xhr.abort()
                    }
                    if (hasSelector > -1) {
                        selector = url.substr(hasSelector);
                        url = url.substr(0, hasSelector)
                    }

                    function after() {
                        var complete;
                        if (api.destroyed) {
                            return
                        }
                        first = FALSE;
                        if (hideFirst) {
                            stop = TRUE;
                            api.show(event.originalEvent)
                        }
                        if ((complete = defaults.complete || opts.complete) && $.isFunction(complete)) {
                            complete.apply(opts.context || api, arguments)
                        }
                    }

                    function successHandler(content, status, jqXHR) {
                        var success;
                        if (api.destroyed) {
                            return
                        }
                        if (selector && "string" === typeof content) {
                            content = $("<div/>").append(content.replace(RSCRIPT, "")).find(selector)
                        }
                        if ((success = defaults.success || opts.success) && $.isFunction(success)) {
                            success.call(opts.context || api, content, status, jqXHR)
                        } else {
                            api.set("content.text", content)
                        }
                    }

                    function errorHandler(xhr, status, error) {
                        if (api.destroyed || xhr.status === 0) {
                            return
                        }
                        api.set("content.text", status + ": " + error)
                    }
                    xhr = $.ajax($.extend({
                        error: defaults.error || errorHandler,
                        context: api
                    }, opts, {
                        url: url,
                        success: successHandler,
                        complete: after
                    }))
                },
                destroy: function () {
                    if (xhr && xhr.abort) {
                        xhr.abort()
                    }
                    api.destroyed = TRUE
                }
            });
            self.init()
        }
        AJAX = PLUGINS.ajax = function (api) {
            var self = api.plugins.ajax;
            return "object" === typeof self ? self : api.plugins.ajax = new Ajax(api)
        };
        AJAX.initialize = "render";
        AJAX.sanitize = function (options) {
            var content = options.content,
                opts;
            if (content && "ajax" in content) {
                opts = content.ajax;
                if (typeof opts !== "object") {
                    opts = options.content.ajax = {
                        url: opts
                    }
                }
                if ("boolean" !== typeof opts.once && opts.once) {
                    opts.once = !! opts.once
                }
            }
        };
        $.extend(TRUE, QTIP.defaults, {
            content: {
                ajax: {
                    loading: TRUE,
                    once: TRUE
                }
            }
        });
        var TIP, TIPNS = ".qtip-tip",
            HASCANVAS = !! document.createElement("canvas").getContext;

        function calculateTip(corner, width, height) {
            var width2 = Math.ceil(width / 2),
                height2 = Math.ceil(height / 2),
                tips = {
                    bottomright: [
                        [0, 0],
                        [width, height],
                        [width, 0]
                    ],
                    bottomleft: [
                        [0, 0],
                        [width, 0],
                        [0, height]
                    ],
                    topright: [
                        [0, height],
                        [width, 0],
                        [width, height]
                    ],
                    topleft: [
                        [0, 0],
                        [0, height],
                        [width, height]
                    ],
                    topcenter: [
                        [0, height],
                        [width2, 0],
                        [width, height]
                    ],
                    bottomcenter: [
                        [0, 0],
                        [width, 0],
                        [width2, height]
                    ],
                    rightcenter: [
                        [0, 0],
                        [width, height2],
                        [0, height]
                    ],
                    leftcenter: [
                        [width, 0],
                        [width, height],
                        [0, height2]
                    ]
                };
            tips.lefttop = tips.bottomright;
            tips.righttop = tips.bottomleft;
            tips.leftbottom = tips.topright;
            tips.rightbottom = tips.topleft;
            return tips[corner.string()]
        }

        function Tip(qTip, command) {
            var self = this,
                opts = qTip.options.style.tip,
                elems = qTip.elements,
                tooltip = elems.tooltip,
                cache = {
                    top: 0,
                    left: 0
                }, size = {
                    width: opts.width,
                    height: opts.height
                }, color = {}, border = opts.border || 0,
                tiphtml;
            self.corner = NULL;
            self.mimic = NULL;
            self.border = border;
            self.offset = opts.offset;
            self.size = size;
            qTip.checks.tip = {
                "^position.my|style.tip.(corner|mimic|border)$": function () {
                    if (!self.init()) {
                        self.destroy()
                    }
                    qTip.reposition()
                },
                "^style.tip.(height|width)$": function () {
                    size = {
                        width: opts.width,
                        height: opts.height
                    };
                    self.create();
                    self.update();
                    qTip.reposition()
                },
                "^content.title.text|style.(classes|widget)$": function () {
                    if (elems.tip && elems.tip.length) {
                        self.update()
                    }
                }
            };

            function whileVisible(callback) {
                var visible = tooltip.is(":visible");
                tooltip.show();
                callback();
                tooltip.toggle(visible)
            }

            function swapDimensions() {
                size.width = opts.height;
                size.height = opts.width
            }

            function resetDimensions() {
                size.width = opts.width;
                size.height = opts.height
            }

            function reposition(event, api, pos, viewport) {
                if (!elems.tip) {
                    return
                }
                var newCorner = self.corner.clone(),
                    adjust = pos.adjusted,
                    method = qTip.options.position.adjust.method.split(" "),
                    horizontal = method[0],
                    vertical = method[1] || method[0],
                    shift = {
                        left: FALSE,
                        top: FALSE,
                        x: 0,
                        y: 0
                    }, offset, css = {}, props;
                if (self.corner.fixed !== TRUE) {
                    if (horizontal === SHIFT && newCorner.precedance === X && adjust.left && newCorner.y !== CENTER) {
                        newCorner.precedance = newCorner.precedance === X ? Y : X
                    } else if (horizontal !== SHIFT && adjust.left) {
                        newCorner.x = newCorner.x === CENTER ? adjust.left > 0 ? LEFT : RIGHT : newCorner.x === LEFT ? RIGHT : LEFT
                    }
                    if (vertical === SHIFT && newCorner.precedance === Y && adjust.top && newCorner.x !== CENTER) {
                        newCorner.precedance = newCorner.precedance === Y ? X : Y
                    } else if (vertical !== SHIFT && adjust.top) {
                        newCorner.y = newCorner.y === CENTER ? adjust.top > 0 ? TOP : BOTTOM : newCorner.y === TOP ? BOTTOM : TOP
                    }
                    if (newCorner.string() !== cache.corner.string() && (cache.top !== adjust.top || cache.left !== adjust.left)) {
                        self.update(newCorner, FALSE)
                    }
                }
                offset = self.position(newCorner, adjust);
                offset[newCorner.x] += parseWidth(newCorner, newCorner.x);
                offset[newCorner.y] += parseWidth(newCorner, newCorner.y);
                if (offset.right !== undefined) {
                    offset.left = -offset.right
                }
                if (offset.bottom !== undefined) {
                    offset.top = -offset.bottom
                }
                offset.user = Math.max(0, opts.offset);
                if (shift.left = horizontal === SHIFT && !! adjust.left) {
                    if (newCorner.x === CENTER) {
                        css["margin-left"] = shift.x = offset["margin-left"] - adjust.left
                    } else {
                        props = offset.right !== undefined ? [adjust.left, -offset.left] : [-adjust.left, offset.left];
                        if ((shift.x = Math.max(props[0], props[1])) > props[0]) {
                            pos.left -= adjust.left;
                            shift.left = FALSE
                        }
                        css[offset.right !== undefined ? RIGHT : LEFT] = shift.x
                    }
                }
                if (shift.top = vertical === SHIFT && !! adjust.top) {
                    if (newCorner.y === CENTER) {
                        css["margin-top"] = shift.y = offset["margin-top"] - adjust.top
                    } else {
                        props = offset.bottom !== undefined ? [adjust.top, -offset.top] : [-adjust.top, offset.top];
                        if ((shift.y = Math.max(props[0], props[1])) > props[0]) {
                            pos.top -= adjust.top;
                            shift.top = FALSE
                        }
                        css[offset.bottom !== undefined ? BOTTOM : TOP] = shift.y
                    }
                }
                elems.tip.css(css).toggle(!(shift.x && shift.y || newCorner.x === CENTER && shift.y || newCorner.y === CENTER && shift.x));
                pos.left -= offset.left.charAt ? offset.user : horizontal !== SHIFT || shift.top || !shift.left && !shift.top ? offset.left : 0;
                pos.top -= offset.top.charAt ? offset.user : vertical !== SHIFT || shift.left || !shift.left && !shift.top ? offset.top : 0;
                cache.left = adjust.left;
                cache.top = adjust.top;
                cache.corner = newCorner.clone()
            }

            function parseCorner() {
                var corner = opts.corner,
                    posOptions = qTip.options.position,
                    at = posOptions.at,
                    my = posOptions.my.string ? posOptions.my.string() : posOptions.my;
                if (corner === FALSE || my === FALSE && at === FALSE) {
                    return FALSE
                } else {
                    if (corner === TRUE) {
                        self.corner = new PLUGINS.Corner(my)
                    } else if (!corner.string) {
                        self.corner = new PLUGINS.Corner(corner);
                        self.corner.fixed = TRUE
                    }
                }
                cache.corner = new PLUGINS.Corner(self.corner.string());
                return self.corner.string() !== "centercenter"
            }

            function parseWidth(corner, side, use) {
                side = !side ? corner[corner.precedance] : side;
                var isTitleTop = elems.titlebar && corner.y === TOP,
                    elem = isTitleTop ? elems.titlebar : tooltip,
                    borderSide = "border-" + side + "-width",
                    css = function (elem) {
                        return parseInt(elem.css(borderSide), 10)
                    }, val;
                whileVisible(function () {
                    val = (use ? css(use) : css(elems.content) || css(elem) || css(tooltip)) || 0
                });
                return val
            }

            function parseRadius(corner) {
                var isTitleTop = elems.titlebar && corner.y === TOP,
                    elem = isTitleTop ? elems.titlebar : elems.content,
                    mozPrefix = "-moz-",
                    webkitPrefix = "-webkit-",
                    nonStandard = "border-radius-" + corner.y + corner.x,
                    standard = "border-" + corner.y + "-" + corner.x + "-radius",
                    css = function (c) {
                        return parseInt(elem.css(c), 10) || parseInt(tooltip.css(c), 10)
                    }, val;
                whileVisible(function () {
                    val = css(standard) || css(nonStandard) || css(mozPrefix + standard) || css(mozPrefix + nonStandard) || css(webkitPrefix + standard) || css(webkitPrefix + nonStandard) || 0
                });
                return val
            }

            function parseColours(actual) {
                var i, fill, border, tip = elems.tip.css("cssText", ""),
                    corner = actual || self.corner,
                    invalid = /rgba?\(0, 0, 0(, 0)?\)|transparent|#123456/i,
                    borderSide = "border-" + corner[corner.precedance] + "-color",
                    bgColor = "background-color",
                    transparent = "transparent",
                    important = " !important",
                    titlebar = elems.titlebar,
                    useTitle = titlebar && (corner.y === TOP || corner.y === CENTER && tip.position().top + size.height / 2 + opts.offset < titlebar.outerHeight(TRUE)),
                    colorElem = useTitle ? titlebar : elems.content;

                function css(elem, prop, compare) {
                    var val = elem.css(prop) || transparent;
                    if (compare && val === elem.css(compare)) {
                        return FALSE
                    } else {
                        return invalid.test(val) ? FALSE : val
                    }
                }
                whileVisible(function () {
                    color.fill = css(tip, bgColor) || css(colorElem, bgColor) || css(elems.content, bgColor) || css(tooltip, bgColor) || tip.css(bgColor);
                    color.border = css(tip, borderSide, "color") || css(colorElem, borderSide, "color") || css(elems.content, borderSide, "color") || css(tooltip, borderSide, "color") || tooltip.css(borderSide);
                    $("*", tip).add(tip).css("cssText", bgColor + ":" + transparent + important + ";border:0" + important + ";")
                })
            }

            function calculateSize(corner) {
                var y = corner.precedance === Y,
                    width = size[y ? WIDTH : HEIGHT],
                    height = size[y ? HEIGHT : WIDTH],
                    isCenter = corner.string().indexOf(CENTER) > -1,
                    base = width * (isCenter ? .5 : 1),
                    pow = Math.pow,
                    round = Math.round,
                    bigHyp, ratio, result, smallHyp = Math.sqrt(pow(base, 2) + pow(height, 2)),
                    hyp = [border / base * smallHyp, border / height * smallHyp];
                hyp[2] = Math.sqrt(pow(hyp[0], 2) - pow(border, 2));
                hyp[3] = Math.sqrt(pow(hyp[1], 2) - pow(border, 2));
                bigHyp = smallHyp + hyp[2] + hyp[3] + (isCenter ? 0 : hyp[0]);
                ratio = bigHyp / smallHyp;
                result = [round(ratio * height), round(ratio * width)];
                return {
                    height: result[y ? 0 : 1],
                    width: result[y ? 1 : 0]
                }
            }

            function createVML(tag, props, style) {
                return "<qvml:" + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="qtip-vml" ' + (props || "") + ' style="behavior: url(#default#VML); ' + (style || "") + '" />'
            }
            $.extend(self, {
                init: function () {
                    var enabled = parseCorner() && (HASCANVAS || PLUGINS.ie);
                    if (enabled) {
                        self.create();
                        self.update();
                        tooltip.unbind(TIPNS).bind("tooltipmove" + TIPNS, reposition)
                    }
                    return enabled
                },
                create: function () {
                    var width = size.width,
                        height = size.height,
                        vml;
                    if (elems.tip) {
                        elems.tip.remove()
                    }
                    elems.tip = $("<div />", {
                        "class": "qtip-tip"
                    }).css({
                        width: width,
                        height: height
                    }).prependTo(tooltip);
                    if (HASCANVAS) {
                        $("<canvas />").appendTo(elems.tip)[0].getContext("2d").save()
                    } else {
                        vml = createVML("shape", 'coordorigin="0,0"', "position:absolute;");
                        elems.tip.html(vml + vml);
                        $("*", elems.tip).bind("click" + TIPNS + " mousedown" + TIPNS, function (event) {
                            event.stopPropagation()
                        })
                    }
                },
                update: function (corner, position) {
                    var tip = elems.tip,
                        inner = tip.children(),
                        width = size.width,
                        height = size.height,
                        mimic = opts.mimic,
                        round = Math.round,
                        precedance, context, coords, translate, newSize;
                    if (!corner) {
                        corner = cache.corner || self.corner
                    }
                    if (mimic === FALSE) {
                        mimic = corner
                    } else {
                        mimic = new PLUGINS.Corner(mimic);
                        mimic.precedance = corner.precedance;
                        if (mimic.x === "inherit") {
                            mimic.x = corner.x
                        } else if (mimic.y === "inherit") {
                            mimic.y = corner.y
                        } else if (mimic.x === mimic.y) {
                            mimic[corner.precedance] = corner[corner.precedance]
                        }
                    }
                    precedance = mimic.precedance;
                    if (corner.precedance === X) {
                        swapDimensions()
                    } else {
                        resetDimensions()
                    }
                    elems.tip.css({
                        width: width = size.width,
                        height: height = size.height
                    });
                    parseColours(corner);
                    if (color.border !== "transparent") {
                        border = parseWidth(corner, NULL);
                        if (opts.border === 0 && border > 0) {
                            color.fill = color.border
                        }
                        self.border = border = opts.border !== TRUE ? opts.border : border
                    } else {
                        self.border = border = 0
                    }
                    coords = calculateTip(mimic, width, height);
                    self.size = newSize = calculateSize(corner);
                    tip.css(newSize).css("line-height", newSize.height + "px");
                    if (corner.precedance === Y) {
                        translate = [round(mimic.x === LEFT ? border : mimic.x === RIGHT ? newSize.width - width - border : (newSize.width - width) / 2), round(mimic.y === TOP ? newSize.height - height : 0)]
                    } else {
                        translate = [round(mimic.x === LEFT ? newSize.width - width : 0), round(mimic.y === TOP ? border : mimic.y === BOTTOM ? newSize.height - height - border : (newSize.height - height) / 2)]
                    } if (HASCANVAS) {
                        inner.attr(newSize);
                        context = inner[0].getContext("2d");
                        context.restore();
                        context.save();
                        context.clearRect(0, 0, 3e3, 3e3);
                        context.fillStyle = color.fill;
                        context.strokeStyle = color.border;
                        context.lineWidth = border * 2;
                        context.lineJoin = "miter";
                        context.miterLimit = 100;
                        context.translate(translate[0], translate[1]);
                        context.beginPath();
                        context.moveTo(coords[0][0], coords[0][1]);
                        context.lineTo(coords[1][0], coords[1][1]);
                        context.lineTo(coords[2][0], coords[2][1]);
                        context.closePath();
                        if (border) {
                            if (tooltip.css("background-clip") === "border-box") {
                                context.strokeStyle = color.fill;
                                context.stroke()
                            }
                            context.strokeStyle = color.border;
                            context.stroke()
                        }
                        context.fill()
                    } else {
                        coords = "m" + coords[0][0] + "," + coords[0][1] + " l" + coords[1][0] + "," + coords[1][1] + " " + coords[2][0] + "," + coords[2][1] + " xe";
                        translate[2] = border && /^(r|b)/i.test(corner.string()) ? PLUGINS.ie === 8 ? 2 : 1 : 0;
                        inner.css({
                            coordsize: width + border + " " + (height + border),
                            antialias: "" + (mimic.string().indexOf(CENTER) > -1),
                            left: translate[0],
                            top: translate[1],
                            width: width + border,
                            height: height + border
                        }).each(function (i) {
                            var $this = $(this);
                            $this[$this.prop ? "prop" : "attr"]({
                                coordsize: width + border + " " + (height + border),
                                path: coords,
                                fillcolor: color.fill,
                                filled: !! i,
                                stroked: !i
                            }).toggle( !! (border || i));
                            if (!i && $this.html() === "") {
                                $this.html(createVML("stroke", 'weight="' + border * 2 + 'px" color="' + color.border + '" miterlimit="1000" joinstyle="miter"'))
                            }
                        })
                    }
                    setTimeout(function () {
                        elems.tip.css({
                            display: "inline-block",
                            visibility: "visible"
                        })
                    }, 1);
                    if (position !== FALSE) {
                        self.position(corner)
                    }
                },
                position: function (corner) {
                    var tip = elems.tip,
                        position = {}, userOffset = Math.max(0, opts.offset),
                        precedance, dimensions, corners;
                    if (opts.corner === FALSE || !tip) {
                        return FALSE
                    }
                    corner = corner || self.corner;
                    precedance = corner.precedance;
                    dimensions = calculateSize(corner);
                    corners = [corner.x, corner.y];
                    if (precedance === X) {
                        corners.reverse()
                    }
                    $.each(corners, function (i, side) {
                        var b, bc, br;
                        if (side === CENTER) {
                            b = precedance === Y ? LEFT : TOP;
                            position[b] = "50%";
                            position["margin-" + b] = -Math.round(dimensions[precedance === Y ? WIDTH : HEIGHT] / 2) + userOffset
                        } else {
                            b = parseWidth(corner, side);
                            bc = parseWidth(corner, side, elems.content);
                            br = parseRadius(corner);
                            position[side] = i ? bc : userOffset + (br > b ? br : -b)
                        }
                    });
                    position[corner[precedance]] -= dimensions[precedance === X ? WIDTH : HEIGHT];
                    tip.css({
                        top: "",
                        bottom: "",
                        left: "",
                        right: "",
                        margin: ""
                    }).css(position);
                    return position
                },
                destroy: function () {
                    tooltip.unbind(TIPNS);
                    if (elems.tip) {
                        elems.tip.find("*").remove().end().remove()
                    }
                    delete self.corner;
                    delete self.mimic;
                    delete self.size
                }
            });
            self.init()
        }
        TIP = PLUGINS.tip = function (api) {
            var self = api.plugins.tip;
            return "object" === typeof self ? self : api.plugins.tip = new Tip(api)
        };
        TIP.initialize = "render";
        TIP.sanitize = function (options) {
            var style = options.style,
                opts;
            if (style && "tip" in style) {
                opts = options.style.tip;
                if (typeof opts !== "object") {
                    options.style.tip = {
                        corner: opts
                    }
                }
                if (!/string|boolean/i.test(typeof opts.corner)) {
                    opts.corner = TRUE
                }
                if (typeof opts.width !== "number") {
                    delete opts.width
                }
                if (typeof opts.height !== "number") {
                    delete opts.height
                }
                if (typeof opts.border !== "number" && opts.border !== TRUE) {
                    delete opts.border
                }
                if (typeof opts.offset !== "number") {
                    delete opts.offset
                }
            }
        };
        $.extend(TRUE, QTIP.defaults, {
            style: {
                tip: {
                    corner: TRUE,
                    mimic: FALSE,
                    width: 6,
                    height: 6,
                    border: TRUE,
                    offset: 0
                }
            }
        });
        var MODAL, OVERLAY, MODALATTR = "is-modal-qtip",
            MODALSELECTOR = selector + "[" + MODALATTR + "]",
            MODALNS = ".qtipmodal";
        OVERLAY = function () {
            var self = this,
                focusableElems = {}, current, onLast, prevState, elem;

            function focusable(element) {
                if ($.expr[":"].focusable) {
                    return $.expr[":"].focusable
                }
                var isTabIndexNotNaN = !isNaN($.attr(element, "tabindex")),
                    nodeName = element.nodeName.toLowerCase(),
                    map, mapName, img;
                if ("area" === nodeName) {
                    map = element.parentNode;
                    mapName = map.name;
                    if (!element.href || !mapName || map.nodeName.toLowerCase() !== "map") {
                        return false
                    }
                    img = $("img[usemap=#" + mapName + "]")[0];
                    return !!img && img.is(":visible")
                }
                return /input|select|textarea|button|object/.test(nodeName) ? !element.disabled : "a" === nodeName ? element.href || isTabIndexNotNaN : isTabIndexNotNaN
            }

            function focusInputs(blurElems) {
                if (focusableElems.length < 1 && blurElems.length) {
                    blurElems.not("body").blur()
                } else {
                    focusableElems.first().focus()
                }
            }

            function stealFocus(event) {
                if (!elem.is(":visible")) {
                    return
                }
                var target = $(event.target),
                    tooltip = current.elements.tooltip,
                    container = target.closest(selector),
                    targetOnTop;
                targetOnTop = container.length < 1 ? FALSE : parseInt(container[0].style.zIndex, 10) > parseInt(tooltip[0].style.zIndex, 10);
                if (!targetOnTop && target.closest(selector)[0] !== tooltip[0]) {
                    focusInputs(target)
                }
                onLast = event.target === focusableElems[focusableElems.length - 1]
            }
            $.extend(self, {
                init: function () {
                    elem = self.elem = $("<div />", {
                        id: "qtip-overlay",
                        html: "<div></div>",
                        mousedown: function () {
                            return FALSE
                        }
                    }).hide();

                    function resize() {
                        var win = $(this);
                        elem.css({
                            height: win.height(),
                            width: win.width()
                        })
                    }
                    $(window).bind("resize" + MODALNS, resize);
                    resize();
                    $(document.body).bind("focusin" + MODALNS, stealFocus);
                    $(document).bind("keydown" + MODALNS, function (event) {
                        if (current && current.options.show.modal.escape && event.keyCode === 27) {
                            current.hide(event)
                        }
                    });
                    elem.bind("click" + MODALNS, function (event) {
                        if (current && current.options.show.modal.blur) {
                            current.hide(event)
                        }
                    });
                    return self
                },
                update: function (api) {
                    current = api;
                    if (api.options.show.modal.stealfocus !== FALSE) {
                        focusableElems = api.elements.tooltip.find("*").filter(function () {
                            return focusable(this)
                        })
                    } else {
                        focusableElems = []
                    }
                },
                toggle: function (api, state, duration) {
                    var docBody = $(document.body),
                        tooltip = api.elements.tooltip,
                        options = api.options.show.modal,
                        effect = options.effect,
                        type = state ? "show" : "hide",
                        visible = elem.is(":visible"),
                        modals = $(MODALSELECTOR).filter(":visible:not(:animated)").not(tooltip),
                        zindex;
                    self.update(api);
                    if (state && options.stealfocus !== FALSE) {
                        focusInputs($(":focus"))
                    }
                    elem.toggleClass("blurs", options.blur);
                    if (state) {
                        elem.css({
                            left: 0,
                            top: 0
                        }).appendTo(document.body)
                    }
                    if (elem.is(":animated") && visible === state && prevState !== FALSE || !state && modals.length) {
                        return self
                    }
                    elem.stop(TRUE, FALSE);
                    if ($.isFunction(effect)) {
                        effect.call(elem, state)
                    } else if (effect === FALSE) {
                        elem[type]()
                    } else {
                        elem.fadeTo(parseInt(duration, 10) || 90, state ? 1 : 0, function () {
                            if (!state) {
                                elem.hide()
                            }
                        })
                    } if (!state) {
                        elem.queue(function (next) {
                            elem.css({
                                left: "",
                                top: ""
                            });
                            if (!modals.length) {
                                elem.detach()
                            }
                            next()
                        })
                    }
                    prevState = state;
                    if (current.destroyed) {
                        current = NULL
                    }
                    return self
                }
            });
            self.init()
        };
        OVERLAY = new OVERLAY;

        function Modal(api) {
            var self = this,
                options = api.options.show.modal,
                elems = api.elements,
                tooltip = elems.tooltip,
                namespace = MODALNS + api.id,
                overlay;
            api.checks.modal = {
                "^show.modal.(on|blur)$": function () {
                    self.destroy();
                    self.init();
                    overlay.toggle(tooltip.is(":visible"))
                }
            };
            $.extend(self, {
                init: function () {
                    if (!options.on) {
                        return self
                    }
                    overlay = elems.overlay = OVERLAY.elem;
                    tooltip.attr(MODALATTR, TRUE).css("z-index", PLUGINS.modal.zindex + $(MODALSELECTOR).length).bind("tooltipshow" + namespace + " tooltiphide" + namespace, function (event, api, duration) {
                        var oEvent = event.originalEvent;
                        if (event.target === tooltip[0]) {
                            if (oEvent && event.type === "tooltiphide" && /mouse(leave|enter)/.test(oEvent.type) && $(oEvent.relatedTarget).closest(overlay[0]).length) {
                                try {
                                    event.preventDefault()
                                } catch (e) {}
                            } else if (!oEvent || oEvent && !oEvent.solo) {
                                self.toggle(event, event.type === "tooltipshow", duration)
                            }
                        }
                    }).bind("tooltipfocus" + namespace, function (event, api) {
                        if (event.isDefaultPrevented() || event.target !== tooltip[0]) {
                            return
                        }
                        var qtips = $(MODALSELECTOR),
                            newIndex = PLUGINS.modal.zindex + qtips.length,
                            curIndex = parseInt(tooltip[0].style.zIndex, 10);
                        overlay[0].style.zIndex = newIndex - 1;
                        qtips.each(function () {
                            if (this.style.zIndex > curIndex) {
                                this.style.zIndex -= 1
                            }
                        });
                        qtips.filter("." + focusClass).qtip("blur", event.originalEvent);
                        tooltip.addClass(focusClass)[0].style.zIndex = newIndex;
                        OVERLAY.update(api);
                        try {
                            event.preventDefault()
                        } catch (e) {}
                    }).bind("tooltiphide" + namespace, function (event) {
                        if (event.target === tooltip[0]) {
                            $(MODALSELECTOR).filter(":visible").not(tooltip).last().qtip("focus", event)
                        }
                    });
                    return self
                },
                toggle: function (event, state, duration) {
                    if (event && event.isDefaultPrevented()) {
                        return self
                    }
                    OVERLAY.toggle(api, !! state, duration);
                    return self
                },
                destroy: function () {
                    $([document, tooltip]).removeAttr(MODALATTR).unbind(namespace);
                    OVERLAY.toggle(api, FALSE);
                    delete elems.overlay
                }
            });
            self.init()
        }
        MODAL = PLUGINS.modal = function (api) {
            var self = api.plugins.modal;
            return "object" === typeof self ? self : api.plugins.modal = new Modal(api)
        };
        MODAL.sanitize = function (opts) {
            if (opts.show) {
                if (typeof opts.show.modal !== "object") {
                    opts.show.modal = {
                        on: !! opts.show.modal
                    }
                } else if (typeof opts.show.modal.on === "undefined") {
                    opts.show.modal.on = TRUE
                }
            }
        };
        MODAL.zindex = QTIP.zindex - 200;
        MODAL.initialize = "render";
        $.extend(TRUE, QTIP.defaults, {
            show: {
                modal: {
                    on: FALSE,
                    effect: TRUE,
                    blur: TRUE,
                    stealfocus: TRUE,
                    escape: TRUE
                }
            }
        });
        PLUGINS.viewport = function (api, position, posOptions, targetWidth, targetHeight, elemWidth, elemHeight) {
            var target = posOptions.target,
                tooltip = api.elements.tooltip,
                my = posOptions.my,
                at = posOptions.at,
                adjust = posOptions.adjust,
                method = adjust.method.split(" "),
                methodX = method[0],
                methodY = method[1] || method[0],
                viewport = posOptions.viewport,
                container = posOptions.container,
                cache = api.cache,
                tip = api.plugins.tip,
                adjusted = {
                    left: 0,
                    top: 0
                }, fixed, newMy, newClass;
            if (!viewport.jquery || target[0] === window || target[0] === document.body || adjust.method === "none") {
                return adjusted
            }
            fixed = tooltip.css("position") === "fixed";
            viewport = {
                elem: viewport,
                height: viewport[(viewport[0] === window ? "h" : "outerH") + "eight"](),
                width: viewport[(viewport[0] === window ? "w" : "outerW") + "idth"](),
                scrollleft: fixed ? 0 : viewport.scrollLeft(),
                scrolltop: fixed ? 0 : viewport.scrollTop(),
                offset: viewport.offset() || {
                    left: 0,
                    top: 0
                }
            };
            container = {
                elem: container,
                scrollLeft: container.scrollLeft(),
                scrollTop: container.scrollTop(),
                offset: container.offset() || {
                    left: 0,
                    top: 0
                }
            };

            function calculate(side, otherSide, type, adjust, side1, side2, lengthName, targetLength, elemLength) {
                var initialPos = position[side1],
                    mySide = my[side],
                    atSide = at[side],
                    isShift = type === SHIFT,
                    viewportScroll = -container.offset[side1] + viewport.offset[side1] + viewport["scroll" + side1],
                    myLength = mySide === side1 ? elemLength : mySide === side2 ? -elemLength : -elemLength / 2,
                    atLength = atSide === side1 ? targetLength : atSide === side2 ? -targetLength : -targetLength / 2,
                    tipLength = tip && tip.size ? tip.size[lengthName] || 0 : 0,
                    tipAdjust = tip && tip.corner && tip.corner.precedance === side && !isShift ? tipLength : 0,
                    overflow1 = viewportScroll - initialPos + tipAdjust,
                    overflow2 = initialPos + elemLength - viewport[lengthName] - viewportScroll + tipAdjust,
                    offset = myLength - (my.precedance === side || mySide === my[otherSide] ? atLength : 0) - (atSide === CENTER ? targetLength / 2 : 0);
                if (isShift) {
                    tipAdjust = tip && tip.corner && tip.corner.precedance === otherSide ? tipLength : 0;
                    offset = (mySide === side1 ? 1 : -1) * myLength - tipAdjust;
                    position[side1] += overflow1 > 0 ? overflow1 : overflow2 > 0 ? -overflow2 : 0;
                    position[side1] = Math.max(-container.offset[side1] + viewport.offset[side1] + (tipAdjust && tip.corner[side] === CENTER ? tip.offset : 0), initialPos - offset, Math.min(Math.max(-container.offset[side1] + viewport.offset[side1] + viewport[lengthName], initialPos + offset), position[side1]))
                } else {
                    adjust *= type === FLIPINVERT ? 2 : 0;
                    if (overflow1 > 0 && (mySide !== side1 || overflow2 > 0)) {
                        position[side1] -= offset + adjust;
                        newMy["invert" + side](side1)
                    } else if (overflow2 > 0 && (mySide !== side2 || overflow1 > 0)) {
                        position[side1] -= (mySide === CENTER ? -offset : offset) + adjust;
                        newMy["invert" + side](side2)
                    }
                    if (position[side1] < viewportScroll && -position[side1] > overflow2) {
                        position[side1] = initialPos;
                        newMy = my.clone()
                    }
                }
                return position[side1] - initialPos
            }
            if (methodX !== "shift" || methodY !== "shift") {
                newMy = my.clone()
            }
            adjusted = {
                left: methodX !== "none" ? calculate(X, Y, methodX, adjust.x, LEFT, RIGHT, WIDTH, targetWidth, elemWidth) : 0,
                top: methodY !== "none" ? calculate(Y, X, methodY, adjust.y, TOP, BOTTOM, HEIGHT, targetHeight, elemHeight) : 0
            };
            if (newMy && cache.lastClass !== (newClass = NAMESPACE + "-pos-" + newMy.abbrev())) {
                tooltip.removeClass(api.cache.lastClass).addClass(api.cache.lastClass = newClass)
            }
            return adjusted
        };
        PLUGINS.imagemap = function (api, area, corner, adjustMethod) {
            if (!area.jquery) {
                area = $(area)
            }
            var cache = api.cache.areas = {}, shape = (area[0].shape || area.attr("shape")).toLowerCase(),
                coordsString = area[0].coords || area.attr("coords"),
                baseCoords = coordsString.split(","),
                coords = [],
                image = $('img[usemap="#' + area.parent("map").attr("name") + '"]'),
                imageOffset = image.offset(),
                result = {
                    width: 0,
                    height: 0,
                    position: {
                        top: 1e10,
                        right: 0,
                        bottom: 0,
                        left: 1e10
                    }
                }, i = 0,
                next = 0,
                dimensions;

            function polyCoordinates(result, coords, corner) {
                var i = 0,
                    compareX = 1,
                    compareY = 1,
                    realX = 0,
                    realY = 0,
                    newWidth = result.width,
                    newHeight = result.height;
                while (newWidth > 0 && newHeight > 0 && compareX > 0 && compareY > 0) {
                    newWidth = Math.floor(newWidth / 2);
                    newHeight = Math.floor(newHeight / 2);
                    if (corner.x === LEFT) {
                        compareX = newWidth
                    } else if (corner.x === RIGHT) {
                        compareX = result.width - newWidth
                    } else {
                        compareX += Math.floor(newWidth / 2)
                    } if (corner.y === TOP) {
                        compareY = newHeight
                    } else if (corner.y === BOTTOM) {
                        compareY = result.height - newHeight
                    } else {
                        compareY += Math.floor(newHeight / 2)
                    }
                    i = coords.length;
                    while (i--) {
                        if (coords.length < 2) {
                            break
                        }
                        realX = coords[i][0] - result.position.left;
                        realY = coords[i][1] - result.position.top;
                        if (corner.x === LEFT && realX >= compareX || corner.x === RIGHT && realX <= compareX || corner.x === CENTER && (realX < compareX || realX > result.width - compareX) || corner.y === TOP && realY >= compareY || corner.y === BOTTOM && realY <= compareY || corner.y === CENTER && (realY < compareY || realY > result.height - compareY)) {
                            coords.splice(i, 1)
                        }
                    }
                }
                return {
                    left: coords[0][0],
                    top: coords[0][1]
                }
            }
            imageOffset.left += Math.ceil((image.outerWidth() - image.width()) / 2);
            imageOffset.top += Math.ceil((image.outerHeight() - image.height()) / 2);
            if (shape === "poly") {
                i = baseCoords.length;
                while (i--) {
                    next = [parseInt(baseCoords[--i], 10), parseInt(baseCoords[i + 1], 10)];
                    if (next[0] > result.position.right) {
                        result.position.right = next[0]
                    }
                    if (next[0] < result.position.left) {
                        result.position.left = next[0]
                    }
                    if (next[1] > result.position.bottom) {
                        result.position.bottom = next[1]
                    }
                    if (next[1] < result.position.top) {
                        result.position.top = next[1]
                    }
                    coords.push(next)
                }
            } else {
                i = -1;
                while (i++ < baseCoords.length) {
                    coords.push(parseInt(baseCoords[i], 10))
                }
            }
            switch (shape) {
            case "rect":
                result = {
                    width: Math.abs(coords[2] - coords[0]),
                    height: Math.abs(coords[3] - coords[1]),
                    position: {
                        left: Math.min(coords[0], coords[2]),
                        top: Math.min(coords[1], coords[3])
                    }
                };
                break;
            case "circle":
                result = {
                    width: coords[2] + 2,
                    height: coords[2] + 2,
                    position: {
                        left: coords[0],
                        top: coords[1]
                    }
                };
                break;
            case "poly":
                result.width = Math.abs(result.position.right - result.position.left);
                result.height = Math.abs(result.position.bottom - result.position.top);
                if (corner.abbrev() === "c") {
                    result.position = {
                        left: result.position.left + result.width / 2,
                        top: result.position.top + result.height / 2
                    }
                } else {
                    if (!cache[corner + coordsString]) {
                        result.position = polyCoordinates(result, coords.slice(), corner);
                        if (adjustMethod && (adjustMethod[0] === "flip" || adjustMethod[1] === "flip")) {
                            result.offset = polyCoordinates(result, coords.slice(), {
                                x: corner.x === LEFT ? RIGHT : corner.x === RIGHT ? LEFT : CENTER,
                                y: corner.y === TOP ? BOTTOM : corner.y === BOTTOM ? TOP : CENTER
                            });
                            result.offset.left -= result.position.left;
                            result.offset.top -= result.position.top
                        }
                        cache[corner + coordsString] = result
                    }
                    result = cache[corner + coordsString]
                }
                result.width = result.height = 0;
                break
            }
            result.position.left += imageOffset.left;
            result.position.top += imageOffset.top;
            return result
        };
        var IE6;

        function Ie6(api) {
            var self = this,
                elems = api.elements,
                options = api.options,
                tooltip = elems.tooltip,
                namespace = ".ie6-" + api.id,
                bgiframe = $("select, object").length < 1,
                isDrawing = 0,
                modalProcessed = FALSE,
                redrawContainer;
            api.checks.ie6 = {
                "^content|style$": function (obj, o, v) {
                    redraw()
                }
            };
            $.extend(self, {
                init: function () {
                    var win = $(window),
                        scroll;
                    if (bgiframe) {
                        elems.bgiframe = $('<iframe class="qtip-bgiframe" frameborder="0" tabindex="-1" src="javascript:\'\';" ' + ' style="display:block; position:absolute; z-index:-1; filter:alpha(opacity=0); ' + '-ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=0)";"></iframe>');
                        elems.bgiframe.appendTo(tooltip);
                        tooltip.bind("tooltipmove" + namespace, self.adjustBGIFrame)
                    }
                    redrawContainer = $("<div/>", {
                        id: "qtip-rcontainer"
                    }).appendTo(document.body);
                    self.redraw();
                    if (elems.overlay && !modalProcessed) {
                        scroll = function () {
                            elems.overlay[0].style.top = win.scrollTop() + "px"
                        };
                        win.bind("scroll.qtip-ie6, resize.qtip-ie6", scroll);
                        scroll();
                        elems.overlay.addClass("qtipmodal-ie6fix");
                        modalProcessed = TRUE
                    }
                },
                adjustBGIFrame: function () {
                    var dimensions = api.get("dimensions"),
                        plugin = api.plugins.tip,
                        tip = elems.tip,
                        tipAdjust, offset;
                    offset = parseInt(tooltip.css("border-left-width"), 10) || 0;
                    offset = {
                        left: -offset,
                        top: -offset
                    };
                    if (plugin && tip) {
                        tipAdjust = plugin.corner.precedance === "x" ? ["width", "left"] : ["height", "top"];
                        offset[tipAdjust[1]] -= tip[tipAdjust[0]]()
                    }
                    elems.bgiframe.css(offset).css(dimensions)
                },
                redraw: function () {
                    if (api.rendered < 1 || isDrawing) {
                        return self
                    }
                    var style = options.style,
                        container = options.position.container,
                        perc, width, max, min;
                    isDrawing = 1;
                    if (style.height) {
                        tooltip.css(HEIGHT, style.height)
                    }
                    if (style.width) {
                        tooltip.css(WIDTH, style.width)
                    } else {
                        tooltip.css(WIDTH, "").appendTo(redrawContainer);
                        width = tooltip.width();
                        if (width % 2 < 1) {
                            width += 1
                        }
                        max = tooltip.css("max-width") || "";
                        min = tooltip.css("min-width") || "";
                        perc = (max + min).indexOf("%") > -1 ? container.width() / 100 : 0;
                        max = (max.indexOf("%") > -1 ? perc : 1) * parseInt(max, 10) || width;
                        min = (min.indexOf("%") > -1 ? perc : 1) * parseInt(min, 10) || 0;
                        width = max + min ? Math.min(Math.max(width, min), max) : width;
                        tooltip.css(WIDTH, Math.round(width)).appendTo(container)
                    }
                    isDrawing = 0;
                    return self
                },
                destroy: function () {
                    if (bgiframe) {
                        elems.bgiframe.remove()
                    }
                    tooltip.unbind(namespace)
                }
            });
            self.init()
        }
        IE6 = PLUGINS.ie6 = function (api) {
            var self = api.plugins.ie6;
            if (PLUGINS.ie !== 6) {
                return FALSE
            }
            return "object" === typeof self ? self : api.plugins.ie6 = new Ie6(api)
        };
        IE6.initialize = "render"
    })
})(window, document);

function getBaseURL() {
    return location.protocol + "//" + location.host + "/"
}

function createAJAXLoader($btn) {
    var loader;
    $btn.data("loading", true);
    if (!$btn.hasClass("pos-rel")) $btn.addClass("pos-rel");
    loader = "<div class='loading pos-abs text-center'><img class='pos-abs' src='" + getBaseURL() + "resources/img/loading.gif' /></div>";
    $btn.append(loader)
}

function removeAJAXLoader($btn) {
    $(".loading", $btn).fadeOut(1e3, function () {
        $(this).remove()
    })
}(function ($) {
    jQuery.fn.viewMore = function (cfg) {
        var defaults = {
            errorText: "There was an error. Please try again in a few moments.",
            fadeOut: 1e3,
            callback: function () {}
        };
        var options = $.extend({}, defaults, options);
        return this.each(function () {
            var $btn = null;

            function ajaxPage() {
                return getBaseURL() + "ajax/" + $btn.data("type")
            }

            function createErrorMsg(errorText) {
                var ele = $(".loading", $btn.data("target"));
                msg = "<p class='pos-abs'>" + errorText + "</p>";
                $("img", ele).remove();
                ele.append(msg)
            }
            var removedloader = false;

            function removeLoader() {
                removedloader = true;
                removeAJAXLoader($($btn.attr("data-name")));
                $btn.data("loading", false)
            }
            if ($(this) == undefined || $(this).attr("data-type") == undefined || $(this).attr("data-name") == undefined) {
                return
            }
            $btn = $(this);
            $($btn.data("name")).bind("DOMNodeInserted DOMNodeRemoved", function () {
                if (!$btn.is(":visible") && !removedloader) {
                    $btn.show()
                }
                removedloader = false
            });
            $btn.click(function (e) {
                e.preventDefault();
                if ($btn.data("loading")) return false;
                $btn.data("loading", true);
                createAJAXLoader($($btn.data("name")));
                $.post(ajaxPage(), {
                    id: $btn.data("id"),
                    count: $($btn.data("name")).children().length
                }, function (data) {
                    removeLoader();
                    $($btn.data("name")).append(data.obj);
                    if (data.id) $btn.data("id", data.id);
                    if (options.callback != null) options.callback();
                    tooltip();
                    updateDates()
                }, "json").error(function (event, jqXHR, ajaxSettings, thrownError) {
                    var obj = jQuery.parseJSON(event.responseText);
                    createErrorMsg(obj.error);
                    $btn.hide();
                    setTimeout(removeLoader, 2500);
                    tooltip()
                })
            })
        })
    }
})(jQuery);
(function ($) {
    $.fn.quicksand = function (collection, customOptions) {
        var options = {
            duration: 750,
            easing: "swing",
            attribute: "data-id",
            adjustHeight: "auto",
            adjustWidth: "auto",
            useScaling: false,
            enhancement: function (c) {},
            selector: "> *",
            atomic: false,
            dx: 0,
            dy: 0,
            maxWidth: 0,
            retainExisting: true
        };
        $.extend(options, customOptions);
        if (navigator.userAgent.match(/msie/i) || typeof $.fn.scale == "undefined") {
            options.useScaling = false
        }
        var callbackFunction;
        if (typeof arguments[1] == "function") {
            callbackFunction = arguments[1]
        } else if (typeof (arguments[2] == "function")) {
            callbackFunction = arguments[2]
        }
        return this.each(function (i) {
            var val;
            var animationQueue = [];
            var $collection;
            if (typeof options.attribute == "function") {
                $collection = $(collection)
            } else {
                $collection = $(collection).filter("[" + options.attribute + "]").clone()
            }
            var $sourceParent = $(this);
            var sourceHeight = $(this).css("height");
            var sourceWidth = $(this).css("width");
            var destHeight, destWidth;
            var adjustHeightOnCallback = false;
            var adjustWidthOnCallback = false;
            var offset = $($sourceParent).offset();
            var offsets = [];
            var $source = $(this).find(options.selector);
            var width = $($source).innerWidth();
            if (navigator.userAgent.match(/msie/i) && navigator.userAgent.match(/6/)) {
                $sourceParent.html("").append($collection);
                return
            }
            var postCallbackPerformed = 0;
            var postCallback = function () {
                $(this).css("margin", "").css("position", "").css("top", "").css("left", "").css("opacity", "");
                if (!postCallbackPerformed) {
                    postCallbackPerformed = 1;
                    if (!options.atomic) {
                        var $toDelete = $sourceParent.find(options.selector);
                        if (!options.retainExisting) {
                            $sourceParent.prepend($dest.find(options.selector));
                            $toDelete.remove()
                        } else {
                            var $keepElements = $([]);
                            $dest.find(options.selector).each(function (i) {
                                var $matchedElement = $([]);
                                if (typeof options.attribute == "function") {
                                    var val = options.attribute($(this));
                                    $toDelete.each(function () {
                                        if (options.attribute(this) == val) {
                                            $matchedElement = $(this);
                                            return false
                                        }
                                    })
                                } else {
                                    $matchedElement = $toDelete.filter("[" + options.attribute + '="' + $(this).attr(options.attribute) + '"]')
                                } if ($matchedElement.length > 0) {
                                    $keepElements = $keepElements.add($matchedElement);
                                    if (i === 0) {
                                        $sourceParent.prepend($matchedElement)
                                    } else {
                                        $matchedElement.insertAfter($sourceParent.find(options.selector).get(i - 1))
                                    }
                                }
                            });
                            $toDelete.not($keepElements).remove()
                        } if (adjustHeightOnCallback) {
                            $sourceParent.css("height", destHeight)
                        }
                        if (adjustWidthOnCallback) {
                            $sourceParent.css("width", sourceWidth)
                        }
                    }
                    options.enhancement($sourceParent);
                    if (typeof callbackFunction == "function") {
                        callbackFunction.call(this)
                    }
                }
                if (false === options.adjustHeight) {
                    $sourceParent.css("height", "auto")
                }
                if (false === options.adjustWidth) {
                    $sourceParent.css("width", "auto")
                }
            };
            var $correctionParent = $sourceParent.offsetParent();
            var correctionOffset = $correctionParent.offset();
            if ($correctionParent.css("position") == "relative") {
                if ($correctionParent.get(0).nodeName.toLowerCase() != "body") {
                    correctionOffset.top += parseFloat($correctionParent.css("border-top-width")) || 0;
                    correctionOffset.left += parseFloat($correctionParent.css("border-left-width")) || 0
                }
            } else {
                correctionOffset.top -= parseFloat($correctionParent.css("border-top-width")) || 0;
                correctionOffset.left -= parseFloat($correctionParent.css("border-left-width")) || 0;
                correctionOffset.top -= parseFloat($correctionParent.css("margin-top")) || 0;
                correctionOffset.left -= parseFloat($correctionParent.css("margin-left")) || 0
            } if (isNaN(correctionOffset.left)) {
                correctionOffset.left = 0
            }
            if (isNaN(correctionOffset.top)) {
                correctionOffset.top = 0
            }
            correctionOffset.left -= options.dx;
            correctionOffset.top -= options.dy;
            $sourceParent.css("height", $(this).height());
            $sourceParent.css("width", $(this).width());
            $source.each(function (i) {
                offsets[i] = $(this).offset()
            });
            $(this).stop();
            var dx = 0;
            var dy = 0;
            $source.each(function (i) {
                $(this).stop();
                var rawObj = $(this).get(0);
                if (rawObj.style.position == "absolute") {
                    dx = -options.dx;
                    dy = -options.dy
                } else {
                    dx = options.dx;
                    dy = options.dy
                }
                rawObj.style.position = "absolute";
                rawObj.style.margin = "0";
                if (!options.adjustWidth) {
                    rawObj.style.width = width + "px"
                }
                rawObj.style.top = offsets[i].top - parseFloat(rawObj.style.marginTop) - correctionOffset.top + dy + "px";
                rawObj.style.left = offsets[i].left - parseFloat(rawObj.style.marginLeft) - correctionOffset.left + dx + "px";
                if (options.maxWidth > 0 && offsets[i].left > options.maxWidth) {
                    rawObj.style.display = "none"
                }
            });
            var $dest = $($sourceParent).clone();
            var rawDest = $dest.get(0);
            rawDest.innerHTML = "";
            rawDest.setAttribute("id", "");
            rawDest.style.height = "auto";
            rawDest.style.width = $sourceParent.width() + "px";
            $dest.append($collection);
            $dest.insertBefore($sourceParent);
            $dest.css("opacity", 0);
            rawDest.style.zIndex = -1;
            rawDest.style.margin = "0";
            rawDest.style.position = "absolute";
            rawDest.style.top = offset.top - correctionOffset.top + "px";
            rawDest.style.left = offset.left - correctionOffset.left + "px";
            if (options.adjustHeight === "dynamic") {
                $sourceParent.animate({
                    height: $dest.height()
                }, options.duration, options.easing)
            } else if (options.adjustHeight === "auto") {
                destHeight = $dest.height();
                if (parseFloat(sourceHeight) < parseFloat(destHeight)) {
                    $sourceParent.css("height", destHeight)
                } else {
                    adjustHeightOnCallback = true
                }
            }
            if (options.adjustWidth === "dynamic") {
                $sourceParent.animate({
                    width: $dest.width()
                }, options.duration, options.easing)
            } else if (options.adjustWidth === "auto") {
                destWidth = $dest.width();
                if (parseFloat(sourceWidth) < parseFloat(destWidth)) {
                    $sourceParent.css("width", destWidth)
                } else {
                    adjustWidthOnCallback = true
                }
            }
            $source.each(function (i) {
                var destElement = [];
                if (typeof options.attribute == "function") {
                    val = options.attribute($(this));
                    $collection.each(function () {
                        if (options.attribute(this) == val) {
                            destElement = $(this);
                            return false
                        }
                    })
                } else {
                    destElement = $collection.filter("[" + options.attribute + '="' + $(this).attr(options.attribute) + '"]')
                } if (destElement.length) {
                    if (!options.useScaling) {
                        animationQueue.push({
                            element: $(this),
                            dest: destElement,
                            style: {
                                top: $(this).offset().top,
                                left: $(this).offset().left,
                                opacity: ""
                            },
                            animation: {
                                top: destElement.offset().top - correctionOffset.top,
                                left: destElement.offset().left - correctionOffset.left,
                                opacity: 1
                            }
                        })
                    } else {
                        animationQueue.push({
                            element: $(this),
                            dest: destElement,
                            style: {
                                top: $(this).offset().top,
                                left: $(this).offset().left,
                                opacity: ""
                            },
                            animation: {
                                top: destElement.offset().top - correctionOffset.top,
                                left: destElement.offset().left - correctionOffset.left,
                                opacity: 1,
                                scale: "1.0"
                            }
                        })
                    }
                } else {
                    if (!options.useScaling) {
                        animationQueue.push({
                            element: $(this),
                            style: {
                                top: $(this).offset().top,
                                left: $(this).offset().left,
                                opacity: ""
                            },
                            animation: {
                                opacity: "0.0"
                            }
                        })
                    } else {
                        animationQueue.push({
                            element: $(this),
                            animation: {
                                opacity: "0.0",
                                style: {
                                    top: $(this).offset().top,
                                    left: $(this).offset().left,
                                    opacity: ""
                                },
                                scale: "0.0"
                            }
                        })
                    }
                }
            });
            $collection.each(function (i) {
                var sourceElement = [];
                var destElement = [];
                if (typeof options.attribute == "function") {
                    val = options.attribute($(this));
                    $source.each(function () {
                        if (options.attribute(this) == val) {
                            sourceElement = $(this);
                            return false
                        }
                    });
                    $collection.each(function () {
                        if (options.attribute(this) == val) {
                            destElement = $(this);
                            return false
                        }
                    })
                } else {
                    sourceElement = $source.filter("[" + options.attribute + '="' + $(this).attr(options.attribute) + '"]');
                    destElement = $collection.filter("[" + options.attribute + '="' + $(this).attr(options.attribute) + '"]')
                }
                var animationOptions;
                if (sourceElement.length === 0 && destElement.length > 0) {
                    if (!options.useScaling) {
                        animationOptions = {
                            opacity: "1.0"
                        }
                    } else {
                        animationOptions = {
                            opacity: "1.0",
                            scale: "1.0"
                        }
                    }
                    var d = destElement.clone();
                    var rawDestElement = d.get(0);
                    rawDestElement.style.position = "absolute";
                    rawDestElement.style.margin = "0";
                    if (!options.adjustWidth) {
                        rawDestElement.style.width = width + "px"
                    }
                    rawDestElement.style.top = destElement.offset().top - correctionOffset.top + "px";
                    rawDestElement.style.left = destElement.offset().left - correctionOffset.left + "px";
                    d.css("opacity", 0);
                    if (options.useScaling) {
                        d.css("transform", "scale(0.0)")
                    }
                    d.appendTo($sourceParent);
                    if (options.maxWidth === 0 || destElement.offset().left < options.maxWidth) {
                        animationQueue.push({
                            element: $(d),
                            dest: destElement,
                            animation: animationOptions
                        })
                    }
                }
            });
            $dest.remove();
            if (!options.atomic) {
                options.enhancement($sourceParent);
                for (i = 0; i < animationQueue.length; i++) {
                    animationQueue[i].element.animate(animationQueue[i].animation, options.duration, options.easing, postCallback)
                }
            } else {
                $toDelete = $sourceParent.find(options.selector);
                $sourceParent.prepend($dest.find(options.selector));
                for (i = 0; i < animationQueue.length; i++) {
                    if (animationQueue[i].dest && animationQueue[i].style) {
                        var destElement = animationQueue[i].dest;
                        var destOffset = destElement.offset();
                        destElement.css({
                            position: "relative",
                            top: animationQueue[i].style.top - destOffset.top,
                            left: animationQueue[i].style.left - destOffset.left
                        });
                        destElement.animate({
                            top: "0",
                            left: "0"
                        }, options.duration, options.easing, postCallback)
                    } else {
                        animationQueue[i].element.animate(animationQueue[i].animation, options.duration, options.easing, postCallback)
                    }
                }
                $toDelete.remove()
            }
        })
    }
})(jQuery);
/*!
 * jQuery doTimeout: Like setTimeout, but better! - v1.0 - 3/3/2010
 * http://benalman.com/projects/jquery-dotimeout-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function ($) {
    "$:nomunge";
    var cache = {}, doTimeout = "doTimeout",
        aps = Array.prototype.slice;
    $[doTimeout] = function () {
        return p_doTimeout.apply(window, [0].concat(aps.call(arguments)))
    };
    $.fn[doTimeout] = function () {
        var args = aps.call(arguments),
            result = p_doTimeout.apply(this, [doTimeout + args[0]].concat(args));
        return typeof args[0] === "number" || typeof args[1] === "number" ? this : result
    };

    function p_doTimeout(jquery_data_key) {
        var that = this,
            elem, data = {}, method_base = jquery_data_key ? $.fn : $,
            args = arguments,
            slice_args = 4,
            id = args[1],
            delay = args[2],
            callback = args[3];
        if (typeof id !== "string") {
            slice_args--;
            id = jquery_data_key = 0;
            delay = args[1];
            callback = args[2]
        }
        if (jquery_data_key) {
            elem = that.eq(0);
            elem.data(jquery_data_key, data = elem.data(jquery_data_key) || {})
        } else if (id) {
            data = cache[id] || (cache[id] = {})
        }
        data.id && clearTimeout(data.id);
        delete data.id;

        function cleanup() {
            if (jquery_data_key) {
                elem.removeData(jquery_data_key)
            } else if (id) {
                delete cache[id]
            }
        }

        function actually_setTimeout() {
            data.id = setTimeout(function () {
                data.fn()
            }, delay)
        }
        if (callback) {
            data.fn = function (no_polling_loop) {
                if (typeof callback === "string") {
                    callback = method_base[callback]
                }
                callback.apply(that, aps.call(args, slice_args)) === true && !no_polling_loop ? actually_setTimeout() : cleanup()
            };
            actually_setTimeout()
        } else if (data.fn) {
            delay === undefined ? cleanup() : data.fn(delay === false);
            return true
        } else {
            cleanup()
        }
    }
})(jQuery);
/*!
 * typeahead.js 0.9.0
 * https://github.com/twitter/typeahead
 * Copyright 2013 Twitter, Inc. and other contributors; Licensed MIT
 */
(function ($) {
    var VERSION = "0.9.0";
    var utils = {
        isMsie: function () {
            var match = /(msie) ([\w.]+)/i.exec(navigator.userAgent);
            return match ? parseInt(match[2], 10) : false
        },
        isBlankString: function (str) {
            return !str || /^\s*$/.test(str)
        },
        escapeRegExChars: function (str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
        },
        isString: function (obj) {
            return typeof obj === "string"
        },
        isNumber: function (obj) {
            return typeof obj === "number"
        },
        isArray: $.isArray,
        isFunction: $.isFunction,
        isObject: $.isPlainObject,
        isUndefined: function (obj) {
            return typeof obj === "undefined"
        },
        bind: $.proxy,
        bindAll: function (obj) {
            var val;
            for (var key in obj) {
                $.isFunction(val = obj[key]) && (obj[key] = $.proxy(val, obj))
            }
        },
        indexOf: function (haystack, needle) {
            for (var i = 0; i < haystack.length; i++) {
                if (haystack[i] === needle) {
                    return i
                }
            }
            return -1
        },
        each: $.each,
        map: $.map,
        filter: $.grep,
        every: function (obj, test) {
            var result = true;
            if (!obj) {
                return result
            }
            $.each(obj, function (key, val) {
                if (!(result = test.call(null, val, key, obj))) {
                    return false
                }
            });
            return !!result
        },
        some: function (obj, test) {
            var result = false;
            if (!obj) {
                return result
            }
            $.each(obj, function (key, val) {
                if (result = test.call(null, val, key, obj)) {
                    return false
                }
            });
            return !!result
        },
        mixin: $.extend,
        getUniqueId: function () {
            var counter = 0;
            return function () {
                return counter++
            }
        }(),
        defer: function (fn) {
            setTimeout(fn, 0)
        },
        debounce: function (func, wait, immediate) {
            var timeout, result;
            return function () {
                var context = this,
                    args = arguments,
                    later, callNow;
                later = function () {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args)
                    }
                };
                callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(context, args)
                }
                return result
            }
        },
        throttle: function (func, wait) {
            var context, args, timeout, result, previous, later;
            previous = 0;
            later = function () {
                previous = new Date;
                timeout = null;
                result = func.apply(context, args)
            };
            return function () {
                var now = new Date,
                    remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args)
                } else if (!timeout) {
                    timeout = setTimeout(later, remaining)
                }
                return result
            }
        },
        tokenizeQuery: function (str) {
            return $.trim(str).toLowerCase().split(/[\s]+/)
        },
        tokenizeText: function (str) {
            return $.trim(str).toLowerCase().split(/[\s\-_]+/)
        },
        getProtocol: function () {
            return location.protocol
        },
        noop: function () {}
    };
    var EventTarget = function () {
        var eventSplitter = /\s+/;
        return {
            on: function (events, callback) {
                var event;
                if (!callback) {
                    return this
                }
                this._callbacks = this._callbacks || {};
                events = events.split(eventSplitter);
                while (event = events.shift()) {
                    this._callbacks[event] = this._callbacks[event] || [];
                    this._callbacks[event].push(callback)
                }
                return this
            },
            trigger: function (events, data) {
                var event, callbacks;
                if (!this._callbacks) {
                    return this
                }
                events = events.split(eventSplitter);
                while (event = events.shift()) {
                    if (callbacks = this._callbacks[event]) {
                        for (var i = 0; i < callbacks.length; i += 1) {
                            callbacks[i].call(this, {
                                type: event,
                                data: data
                            })
                        }
                    }
                }
                return this
            }
        }
    }();
    var EventBus = function () {
        var namespace = "typeahead:";

        function EventBus(o) {
            if (!o || !o.el) {
                $.error("EventBus initialized without el")
            }
            this.$el = $(o.el)
        }
        utils.mixin(EventBus.prototype, {
            trigger: function (type) {
                var args = [].slice.call(arguments, 1);
                this.$el.trigger(namespace + type, args)
            }
        });
        return EventBus
    }();
    var PersistentStorage = function () {
        var ls = window.localStorage,
            methods;

        function PersistentStorage(namespace) {
            this.prefix = ["__", namespace, "__"].join("");
            this.ttlKey = "__ttl__";
            this.keyMatcher = new RegExp("^" + this.prefix)
        }
        if (window.localStorage && window.JSON) {
            methods = {
                _prefix: function (key) {
                    return this.prefix + key
                },
                _ttlKey: function (key) {
                    return this._prefix(key) + this.ttlKey
                },
                get: function (key) {
                    if (this.isExpired(key)) {
                        this.remove(key)
                    }
                    return decode(ls.getItem(this._prefix(key)))
                },
                set: function (key, val, ttl) {
                    if (utils.isNumber(ttl)) {
                        ls.setItem(this._ttlKey(key), encode(now() + ttl))
                    } else {
                        ls.removeItem(this._ttlKey(key))
                    }
                    return ls.setItem(this._prefix(key), encode(val))
                },
                remove: function (key) {
                    ls.removeItem(this._ttlKey(key));
                    ls.removeItem(this._prefix(key));
                    return this
                },
                clear: function () {
                    var i, key, keys = [],
                        len = ls.length;
                    for (i = 0; i < len; i++) {
                        if ((key = ls.key(i)).match(this.keyMatcher)) {
                            keys.push(key.replace(this.keyMatcher, ""))
                        }
                    }
                    for (i = keys.length; i--;) {
                        this.remove(keys[i])
                    }
                    return this
                },
                isExpired: function (key) {
                    var ttl = decode(ls.getItem(this._ttlKey(key)));
                    return utils.isNumber(ttl) && now() > ttl ? true : false
                }
            }
        } else {
            methods = {
                get: utils.noop,
                set: utils.noop,
                remove: utils.noop,
                clear: utils.noop,
                isExpired: utils.noop
            }
        }
        utils.mixin(PersistentStorage.prototype, methods);
        return PersistentStorage;

        function now() {
            return (new Date).getTime()
        }

        function encode(val) {
            return JSON.stringify(utils.isUndefined(val) ? null : val)
        }

        function decode(val) {
            return JSON.parse(val)
        }
    }();
    var RequestCache = function () {
        function RequestCache(o) {
            utils.bindAll(this);
            o = o || {};
            this.sizeLimit = o.sizeLimit || 10;
            this.cache = {};
            this.cachedKeysByAge = []
        }
        utils.mixin(RequestCache.prototype, {
            get: function (url) {
                return this.cache[url]
            },
            set: function (url, resp) {
                var requestToEvict;
                if (this.cachedKeysByAge.length === this.sizeLimit) {
                    requestToEvict = this.cachedKeysByAge.shift();
                    delete this.cache[requestToEvict]
                }
                this.cache[url] = resp;
                this.cachedKeysByAge.push(url)
            }
        });
        return RequestCache
    }();
    var Transport = function () {
        var pendingRequests = 0,
            maxParallelRequests, requestCache;

        function Transport(o) {
            utils.bindAll(this);
            o = utils.isString(o) ? {
                url: o
            } : o;
            requestCache = requestCache || new RequestCache;
            maxParallelRequests = utils.isNumber(o.maxParallelRequests) ? o.maxParallelRequests : maxParallelRequests || 6;
            this.url = o.url;
            this.wildcard = o.wildcard || "%QUERY";
            this.filter = o.filter;
            this.replace = o.replace;
            this.ajaxSettings = {
                type: "get",
                cache: o.cache,
                timeout: o.timeout,
                dataType: o.dataType || "json",
                beforeSend: o.beforeSend
            };
            this.get = (/^throttle$/i.test(o.rateLimitFn) ? utils.throttle : utils.debounce)(this.get, o.rateLimitWait || 300)
        }
        utils.mixin(Transport.prototype, {
            get: function (query, cb) {
                var that = this,
                    encodedQuery = encodeURIComponent(query || ""),
                    url, resp;
                url = this.replace ? this.replace(this.url, encodedQuery) : this.url.replace(this.wildcard, encodedQuery);
                if (resp = requestCache.get(url)) {
                    cb && cb(resp)
                } else if (belowPendingRequestsThreshold()) {
                    incrementPendingRequests();
                    $.ajax(url, this.ajaxSettings).done(done).always(always)
                } else {
                    this.onDeckRequestArgs = [].slice.call(arguments, 0)
                }

                function done(resp) {
                    resp = that.filter ? that.filter(resp) : resp;
                    cb && cb(resp);
                    requestCache.set(url, resp)
                }

                function always() {
                    decrementPendingRequests();
                    if (that.onDeckRequestArgs) {
                        that.get.apply(that, that.onDeckRequestArgs);
                        that.onDeckRequestArgs = null
                    }
                }
            }
        });
        return Transport;

        function incrementPendingRequests() {
            pendingRequests++
        }

        function decrementPendingRequests() {
            pendingRequests--
        }

        function belowPendingRequestsThreshold() {
            return pendingRequests < maxParallelRequests
        }
    }();
    var Dataset = function () {
        function Dataset(o) {
            utils.bindAll(this);
            if (o.template && !o.engine) {
                $.error("no template engine specified")
            }
            if (!o.local && !o.prefetch && !o.remote) {
                $.error("one of local, prefetch, or remote is requried")
            }
            this.name = o.name || utils.getUniqueId();
            this.limit = o.limit || 5;
            this.header = o.header;
            this.footer = o.footer;
            this.valueKey = o.valueKey || "value";
            this.template = compileTemplate(o.template, o.engine, this.valueKey);
            this.local = o.local;
            this.prefetch = o.prefetch;
            this.remote = o.remote;
            this.keys = {
                version: "version",
                protocol: "protocol",
                itemHash: "itemHash",
                adjacencyList: "adjacencyList"
            };
            this.itemHash = {};
            this.adjacencyList = {};
            this.storage = o.name ? new PersistentStorage(o.name) : null
        }
        utils.mixin(Dataset.prototype, {
            _processLocalData: function (data) {
                this._mergeProcessedData(this._processData(data))
            },
            _loadPrefetchData: function (o) {
                var that = this,
                    deferred, version, protocol, itemHash, adjacencyList, isExpired;
                if (this.storage) {
                    version = this.storage.get(this.keys.version);
                    protocol = this.storage.get(this.keys.protocol);
                    itemHash = this.storage.get(this.keys.itemHash);
                    adjacencyList = this.storage.get(this.keys.adjacencyList);
                    isExpired = version !== VERSION || protocol !== utils.getProtocol()
                }
                o = utils.isString(o) ? {
                    url: o
                } : o;
                o.ttl = utils.isNumber(o.ttl) ? o.ttl : 24 * 60 * 60 * 1e3;
                if (itemHash && adjacencyList && !isExpired) {
                    this._mergeProcessedData({
                        itemHash: itemHash,
                        adjacencyList: adjacencyList
                    });
                    deferred = $.Deferred().resolve()
                } else {
                    deferred = $.getJSON(o.url).done(processPrefetchData)
                }
                return deferred;

                function processPrefetchData(data) {
                    var filteredData = o.filter ? o.filter(data) : data,
                        processedData = that._processData(filteredData),
                        itemHash = processedData.itemHash,
                        adjacencyList = processedData.adjacencyList;
                    if (that.storage) {
                        that.storage.set(that.keys.itemHash, itemHash, o.ttl);
                        that.storage.set(that.keys.adjacencyList, adjacencyList, o.ttl);
                        that.storage.set(that.keys.version, VERSION, o.ttl);
                        that.storage.set(that.keys.protocol, utils.getProtocol(), o.ttl)
                    }
                    that._mergeProcessedData(processedData)
                }
            },
            _transformDatum: function (datum) {
                var value = utils.isString(datum) ? datum : datum[this.valueKey],
                    tokens = datum.tokens || utils.tokenizeText(value),
                    item = {
                        value: value,
                        tokens: tokens
                    };
                if (utils.isString(datum)) {
                    item.datum = {};
                    item.datum[this.valueKey] = datum
                } else {
                    item.datum = datum
                }
                item.tokens = utils.filter(item.tokens, function (token) {
                    return !utils.isBlankString(token)
                });
                item.tokens = utils.map(item.tokens, function (token) {
                    return token.toLowerCase()
                });
                return item
            },
            _processData: function (data) {
                var that = this,
                    itemHash = {}, adjacencyList = {};
                utils.each(data, function (i, datum) {
                    var item = that._transformDatum(datum),
                        id = utils.getUniqueId(item.value);
                    itemHash[id] = item;
                    utils.each(item.tokens, function (i, token) {
                        var character = token.charAt(0),
                            adjacency = adjacencyList[character] || (adjacencyList[character] = [id]);
                        !~utils.indexOf(adjacency, id) && adjacency.push(id)
                    })
                });
                return {
                    itemHash: itemHash,
                    adjacencyList: adjacencyList
                }
            },
            _mergeProcessedData: function (processedData) {
                var that = this;
                utils.mixin(this.itemHash, processedData.itemHash);
                utils.each(processedData.adjacencyList, function (character, adjacency) {
                    var masterAdjacency = that.adjacencyList[character];
                    that.adjacencyList[character] = masterAdjacency ? masterAdjacency.concat(adjacency) : adjacency
                })
            },
            _getLocalSuggestions: function (terms) {
                var that = this,
                    firstChars = [],
                    lists = [],
                    shortestList, suggestions = [];
                utils.each(terms, function (i, term) {
                    var firstChar = term.charAt(0);
                    !~utils.indexOf(firstChars, firstChar) && firstChars.push(firstChar)
                });
                utils.each(firstChars, function (i, firstChar) {
                    var list = that.adjacencyList[firstChar];
                    if (!list) {
                        return false
                    }
                    lists.push(list);
                    if (!shortestList || list.length < shortestList.length) {
                        shortestList = list
                    }
                });
                if (lists.length < firstChars.length) {
                    return []
                }
                utils.each(shortestList, function (i, id) {
                    var item = that.itemHash[id],
                        isCandidate, isMatch;
                    isCandidate = utils.every(lists, function (list) {
                        return~ utils.indexOf(list, id)
                    });
                    isMatch = isCandidate && utils.every(terms, function (term) {
                        return utils.some(item.tokens, function (token) {
                            return token.indexOf(term) === 0
                        })
                    });
                    isMatch && suggestions.push(item)
                });
                return suggestions
            },
            initialize: function () {
                var deferred;
                this.local && this._processLocalData(this.local);
                this.transport = this.remote ? new Transport(this.remote) : null;
                deferred = this.prefetch ? this._loadPrefetchData(this.prefetch) : $.Deferred().resolve();
                this.local = this.prefetch = this.remote = null;
                this.initialize = function () {
                    return deferred
                };
                return deferred
            },
            getSuggestions: function (query, cb) {
                var that = this,
                    terms = utils.tokenizeQuery(query),
                    suggestions = this._getLocalSuggestions(terms).slice(0, this.limit);
                cb && cb(suggestions);
                if (suggestions.length < this.limit && this.transport) {
                    this.transport.get(query, processRemoteData)
                }

                function processRemoteData(data) {
                    suggestions = suggestions.slice(0);
                    utils.each(data, function (i, datum) {
                        var item = that._transformDatum(datum),
                            isDuplicate;
                        isDuplicate = utils.some(suggestions, function (suggestion) {
                            return item.value === suggestion.value
                        });
                        !isDuplicate && suggestions.push(item);
                        return suggestions.length < that.limit
                    });
                    cb && cb(suggestions)
                }
            }
        });
        return Dataset;

        function compileTemplate(template, engine, valueKey) {
            var wrapper = '<div class="tt-suggestion">%body</div>',
                compiledTemplate;
            if (template) {
                compiledTemplate = engine.compile(wrapper.replace("%body", template))
            } else {
                compiledTemplate = {
                    render: function (context) {
                        return wrapper.replace("%body", "<p>" + context[valueKey] + "</p>")
                    }
                }
            }
            return compiledTemplate
        }
    }();
    var InputView = function () {
        function InputView(o) {
            var that = this;
            utils.bindAll(this);
            this.specialKeyCodeMap = {
                9: "tab",
                27: "esc",
                37: "left",
                39: "right",
                13: "enter",
                38: "up",
                40: "down"
            };
            this.$hint = $(o.hint);
            this.$input = $(o.input).on("blur.tt", this._handleBlur).on("focus.tt", this._handleFocus).on("keydown.tt", this._handleSpecialKeyEvent);
            if (!utils.isMsie()) {
                this.$input.on("input.tt", this._compareQueryToInputValue)
            } else {
                this.$input.on("keydown.tt keypress.tt cut.tt paste.tt", function ($e) {
                    if (that.specialKeyCodeMap[$e.which || $e.keyCode]) {
                        return
                    }
                    utils.defer(that._compareQueryToInputValue)
                })
            }
            this.query = this.$input.val();
            this.$overflowHelper = buildOverflowHelper(this.$input)
        }
        utils.mixin(InputView.prototype, EventTarget, {
            _handleFocus: function () {
                this.trigger("focused")
            },
            _handleBlur: function () {
                this.trigger("blured")
            },
            _handleSpecialKeyEvent: function ($e) {
                var keyName = this.specialKeyCodeMap[$e.which || $e.keyCode];
                keyName && this.trigger(keyName + "Keyed", $e)
            },
            _compareQueryToInputValue: function () {
                var inputValue = this.getInputValue(),
                    isSameQuery = compareQueries(this.query, inputValue),
                    isSameQueryExceptWhitespace = isSameQuery ? this.query.length !== inputValue.length : false;
                if (isSameQueryExceptWhitespace) {
                    this.trigger("whitespaceChanged", {
                        value: this.query
                    })
                } else if (!isSameQuery) {
                    this.trigger("queryChanged", {
                        value: this.query = inputValue
                    })
                }
            },
            destroy: function () {
                this.$hint.off(".tt");
                this.$input.off(".tt");
                this.$hint = this.$input = this.$overflowHelper = null
            },
            focus: function () {
                this.$input.focus()
            },
            blur: function () {
                this.$input.blur()
            },
            getQuery: function () {
                return this.query
            },
            getInputValue: function () {
                return this.$input.val()
            },
            setInputValue: function (value, silent) {
                this.$input.val(value);
                if (silent !== true) {
                    this._compareQueryToInputValue()
                }
            },
            getHintValue: function () {
                return this.$hint.val()
            },
            setHintValue: function (value) {
                this.$hint.val(value)
            },
            getLanguageDirection: function () {
                return (this.$input.css("direction") || "ltr").toLowerCase()
            },
            isOverflow: function () {
                this.$overflowHelper.text(this.getInputValue());
                return this.$overflowHelper.width() > this.$input.width()
            },
            isCursorAtEnd: function () {
                var valueLength = this.$input.val().length,
                    selectionStart = this.$input[0].selectionStart,
                    range;
                if (utils.isNumber(selectionStart)) {
                    return selectionStart === valueLength
                } else if (document.selection) {
                    range = document.selection.createRange();
                    range.moveStart("character", -valueLength);
                    return valueLength === range.text.length
                }
                return true
            }
        });
        return InputView;

        function buildOverflowHelper($input) {
            return $("<span></span>").css({
                position: "absolute",
                left: "-9999px",
                visibility: "hidden",
                whiteSpace: "nowrap",
                fontFamily: $input.css("font-family"),
                fontSize: $input.css("font-size"),
                fontStyle: $input.css("font-style"),
                fontVariant: $input.css("font-variant"),
                fontWeight: $input.css("font-weight"),
                wordSpacing: $input.css("word-spacing"),
                letterSpacing: $input.css("letter-spacing"),
                textIndent: $input.css("text-indent"),
                textRendering: $input.css("text-rendering"),
                textTransform: $input.css("text-transform")
            }).insertAfter($input)
        }

        function compareQueries(a, b) {
            a = (a || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
            b = (b || "").replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
            return a === b
        }
    }();
    var DropdownView = function () {
        var html = {
            suggestionsList: '<span class="tt-suggestions"></span>'
        }, css = {
                suggestionsList: {
                    display: "block"
                },
                suggestion: {
                    whiteSpace: "nowrap",
                    cursor: "pointer"
                },
                suggestionChild: {
                    whiteSpace: "normal"
                }
            };

        function DropdownView(o) {
            utils.bindAll(this);
            this.isOpen = false;
            this.isEmpty = true;
            this.isMouseOverDropdown = false;
            this.$menu = $(o.menu).on("mouseenter.tt", this._handleMouseenter).on("mouseleave.tt", this._handleMouseleave).on("click.tt", ".tt-suggestion", this._handleSelection).on("mouseover.tt", ".tt-suggestion", this._handleMouseover)
        }
        utils.mixin(DropdownView.prototype, EventTarget, {
            _handleMouseenter: function () {
                this.isMouseOverDropdown = true
            },
            _handleMouseleave: function () {
                this.isMouseOverDropdown = false
            },
            _handleMouseover: function ($e) {
                var $suggestion = $($e.currentTarget);
                this._getSuggestions().removeClass("tt-is-under-cursor");
                $suggestion.addClass("tt-is-under-cursor")
            },
            _handleSelection: function ($e) {
                var $suggestion = $($e.currentTarget);
                this.trigger("suggestionSelected", extractSuggestion($suggestion))
            },
            _show: function () {
                this.$menu.css("display", "block")
            },
            _hide: function () {
                this.$menu.hide()
            },
            _moveCursor: function (increment) {
                var $suggestions, $cur, nextIndex, $underCursor;
                if (!this.isVisible()) {
                    return
                }
                $suggestions = this._getSuggestions();
                $cur = $suggestions.filter(".tt-is-under-cursor");
                $cur.removeClass("tt-is-under-cursor");
                nextIndex = $suggestions.index($cur) + increment;
                nextIndex = (nextIndex + 1) % ($suggestions.length + 1) - 1;
                if (nextIndex === -1) {
                    this.trigger("cursorRemoved");
                    return
                } else if (nextIndex < -1) {
                    nextIndex = $suggestions.length - 1
                }
                $underCursor = $suggestions.eq(nextIndex).addClass("tt-is-under-cursor");
                this.trigger("cursorMoved", extractSuggestion($underCursor))
            },
            _getSuggestions: function () {
                return this.$menu.find(".tt-suggestions > .tt-suggestion")
            },
            destroy: function () {
                this.$menu.off(".tt");
                this.$menu = null
            },
            isVisible: function () {
                return this.isOpen && !this.isEmpty
            },
            closeUnlessMouseIsOverDropdown: function () {
                if (!this.isMouseOverDropdown) {
                    this.close()
                }
            },
            close: function () {
                if (this.isOpen) {
                    this.isOpen = false;
                    this._hide();
                    this.$menu.find(".tt-suggestions > .tt-suggestion").removeClass("tt-is-under-cursor");
                    this.trigger("closed")
                }
            },
            open: function () {
                if (!this.isOpen) {
                    this.isOpen = true;
                    !this.isEmpty && this._show();
                    this.trigger("opened")
                }
            },
            setLanguageDirection: function (dir) {
                var ltrCss = {
                    left: "0",
                    right: "auto"
                }, rtlCss = {
                        left: "auto",
                        right: " 0"
                    };
                dir === "ltr" ? this.$menu.css(ltrCss) : this.$menu.css(rtlCss)
            },
            moveCursorUp: function () {
                this._moveCursor(-1)
            },
            moveCursorDown: function () {
                this._moveCursor(+1)
            },
            getSuggestionUnderCursor: function () {
                var $suggestion = this._getSuggestions().filter(".tt-is-under-cursor").first();
                return $suggestion.length > 0 ? extractSuggestion($suggestion) : null
            },
            getFirstSuggestion: function () {
                var $suggestion = this._getSuggestions().first();
                return $suggestion.length > 0 ? extractSuggestion($suggestion) : null
            },
            renderSuggestions: function (dataset, suggestions) {
                var datasetClassName = "tt-dataset-" + dataset.name,
                    $suggestionsList, $dataset = this.$menu.find("." + datasetClassName),
                    elBuilder, fragment, $el;
                if ($dataset.length === 0) {
                    $suggestionsList = $(html.suggestionsList).css(css.suggestionsList);
                    $dataset = $("<div></div>").addClass(datasetClassName).append(dataset.header).append($suggestionsList).append(dataset.footer).appendTo(this.$menu)
                }
                if (suggestions.length > 0) {
                    this.isEmpty = false;
                    this.isOpen && this._show();
                    elBuilder = document.createElement("div");
                    fragment = document.createDocumentFragment();
                    utils.each(suggestions, function (i, suggestion) {
                        elBuilder.innerHTML = dataset.template.render(suggestion.datum);
                        $el = $(elBuilder.firstChild).css(css.suggestion).data("suggestion", suggestion);
                        $el.children().each(function () {
                            $(this).css(css.suggestionChild)
                        });
                        fragment.appendChild($el[0])
                    });
                    $dataset.show().find(".tt-suggestions").html(fragment)
                } else {
                    this.clearSuggestions(dataset.name)
                }
                this.trigger("suggestionsRendered")
            },
            clearSuggestions: function (datasetName) {
                var $datasets = datasetName ? this.$menu.find(".tt-dataset-" + datasetName) : this.$menu.find('[class^="tt-dataset-"]'),
                    $suggestions = $datasets.find(".tt-suggestions");
                $datasets.hide();
                $suggestions.empty();
                if (this._getSuggestions().length === 0) {
                    this.isEmpty = true;
                    this._hide()
                }
            }
        });
        return DropdownView;

        function extractSuggestion($el) {
            return $el.data("suggestion")
        }
    }();
    var TypeaheadView = function () {
        var html = {
            wrapper: '<span class="twitter-typeahead"></span>',
            hint: '<input class="tt-hint" type="text" autocomplete="off" spellcheck="off" disabled>',
            dropdown: '<span class="tt-dropdown-menu"></span>'
        }, css = {
                wrapper: {
                    position: "relative",
                    display: "inline-block"
                },
                hint: {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    borderColor: "transparent",
                    boxShadow: "none"
                },
                query: {
                    position: "relative",
                    verticalAlign: "top",
                    backgroundColor: "transparent"
                },
                dropdown: {
                    position: "absolute",
                    top: "100%",
                    left: "0",
                    zIndex: "100",
                    display: "none"
                }
            };
        if (utils.isMsie()) {
            utils.mixin(css.query, {
                backgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"
            })
        }
        if (utils.isMsie() && utils.isMsie() <= 7) {
            utils.mixin(css.wrapper, {
                display: "inline",
                zoom: "1"
            });
            utils.mixin(css.query, {
                marginTop: "-1px"
            })
        }

        function TypeaheadView(o) {
            var $menu, $input, $hint;
            utils.bindAll(this);
            this.$node = buildDomStructure(o.input);
            this.datasets = o.datasets;
            this.dir = null;
            this.eventBus = o.eventBus;
            $menu = this.$node.find(".tt-dropdown-menu");
            $input = this.$node.find(".tt-query");
            $hint = this.$node.find(".tt-hint");
            this.dropdownView = new DropdownView({
                menu: $menu
            }).on("suggestionSelected", this._handleSelection).on("cursorMoved", this._clearHint).on("cursorMoved", this._setInputValueToSuggestionUnderCursor).on("cursorRemoved", this._setInputValueToQuery).on("cursorRemoved", this._updateHint).on("suggestionsRendered", this._updateHint).on("opened", this._updateHint).on("closed", this._clearHint).on("opened closed", this._propagateEvent);
            this.inputView = new InputView({
                input: $input,
                hint: $hint
            }).on("focused", this._openDropdown).on("blured", this._closeDropdown).on("blured", this._setInputValueToQuery).on("enterKeyed", this._handleSelection).on("queryChanged", this._clearHint).on("queryChanged", this._clearSuggestions).on("queryChanged", this._getSuggestions).on("whitespaceChanged", this._updateHint).on("queryChanged whitespaceChanged", this._openDropdown).on("queryChanged whitespaceChanged", this._setLanguageDirection).on("escKeyed", this._closeDropdown).on("escKeyed", this._setInputValueToQuery).on("tabKeyed upKeyed downKeyed", this._managePreventDefault).on("upKeyed downKeyed", this._moveDropdownCursor).on("upKeyed downKeyed", this._openDropdown).on("tabKeyed leftKeyed rightKeyed", this._autocomplete)
        }
        utils.mixin(TypeaheadView.prototype, EventTarget, {
            _managePreventDefault: function (e) {
                var $e = e.data,
                    hint, inputValue, preventDefault = false;
                switch (e.type) {
                case "tabKeyed":
                    hint = this.inputView.getHintValue();
                    inputValue = this.inputView.getInputValue();
                    preventDefault = hint && hint !== inputValue;
                    break;
                case "upKeyed":
                case "downKeyed":
                    preventDefault = !$e.shiftKey && !$e.ctrlKey && !$e.metaKey;
                    break
                }
                preventDefault && $e.preventDefault()
            },
            _setLanguageDirection: function () {
                var dir = this.inputView.getLanguageDirection();
                if (dir !== this.dir) {
                    this.dir = dir;
                    this.$node.css("direction", dir);
                    this.dropdownView.setLanguageDirection(dir)
                }
            },
            _updateHint: function () {
                var suggestion = this.dropdownView.getFirstSuggestion(),
                    hint = suggestion ? suggestion.value : null,
                    dropdownIsVisible = this.dropdownView.isVisible(),
                    inputHasOverflow = this.inputView.isOverflow(),
                    inputValue, query, escapedQuery, beginsWithQuery, match;
                if (hint && dropdownIsVisible && !inputHasOverflow) {
                    inputValue = this.inputView.getInputValue();
                    query = inputValue.replace(/\s{2,}/g, " ").replace(/^\s+/g, "");
                    escapedQuery = utils.escapeRegExChars(query);
                    beginsWithQuery = new RegExp("^(?:" + escapedQuery + ")(.*$)", "i");
                    match = beginsWithQuery.exec(hint);
                    this.inputView.setHintValue(inputValue + (match ? match[1] : ""))
                }
            },
            _clearHint: function () {
                this.inputView.setHintValue("")
            },
            _clearSuggestions: function () {
                this.dropdownView.clearSuggestions()
            },
            _setInputValueToQuery: function () {
                this.inputView.setInputValue(this.inputView.getQuery())
            },
            _setInputValueToSuggestionUnderCursor: function (e) {
                var suggestion = e.data;
                this.inputView.setInputValue(suggestion.value, true)
            },
            _openDropdown: function () {
                this.dropdownView.open()
            },
            _closeDropdown: function (e) {
                this.dropdownView[e.type === "blured" ? "closeUnlessMouseIsOverDropdown" : "close"]()
            },
            _moveDropdownCursor: function (e) {
                var $e = e.data;
                if (!$e.shiftKey && !$e.ctrlKey && !$e.metaKey) {
                    this.dropdownView[e.type === "upKeyed" ? "moveCursorUp" : "moveCursorDown"]()
                }
            },
            _handleSelection: function (e) {
                var byClick = e.type === "suggestionSelected",
                    suggestion = byClick ? e.data : this.dropdownView.getSuggestionUnderCursor();
                if (suggestion) {
                    this.inputView.setInputValue(suggestion.value);
                    byClick ? this.inputView.focus() : e.data.preventDefault();
                    byClick && utils.isMsie() ? utils.defer(this.dropdownView.close) : this.dropdownView.close();
                    this.eventBus.trigger("selected", suggestion.datum)
                }
            },
            _getSuggestions: function () {
                var that = this,
                    query = this.inputView.getQuery();
                if (utils.isBlankString(query)) {
                    return
                }
                utils.each(this.datasets, function (i, dataset) {
                    dataset.getSuggestions(query, function (suggestions) {
                        if (query === that.inputView.getQuery()) {
                            that.dropdownView.renderSuggestions(dataset, suggestions)
                        }
                    })
                })
            },
            _autocomplete: function (e) {
                var isCursorAtEnd, ignoreEvent, query, hint, suggestion;
                if (e.type === "rightKeyed" || e.type === "leftKeyed") {
                    isCursorAtEnd = this.inputView.isCursorAtEnd();
                    ignoreEvent = this.inputView.getLanguageDirection() === "ltr" ? e.type === "leftKeyed" : e.type === "rightKeyed";
                    if (!isCursorAtEnd || ignoreEvent) {
                        return
                    }
                }
                query = this.inputView.getQuery();
                hint = this.inputView.getHintValue();
                if (hint !== "" && query !== hint) {
                    suggestion = this.dropdownView.getFirstSuggestion();
                    this.inputView.setInputValue(suggestion.value)
                }
            },
            _propagateEvent: function (e) {
                this.eventBus.trigger(e.type)
            },
            destroy: function () {
                this.inputView.destroy();
                this.dropdownView.destroy();
                destroyDomStructure(this.$node);
                this.$node = null
            }
        });
        return TypeaheadView;

        function buildDomStructure(input) {
            var $wrapper = $(html.wrapper),
                $dropdown = $(html.dropdown),
                $input = $(input),
                $hint = $(html.hint);
            $wrapper = $wrapper.css(css.wrapper);
            $dropdown = $dropdown.css(css.dropdown);
            $hint.css(css.hint).css({
                backgroundAttachment: $input.css("background-attachment"),
                backgroundClip: $input.css("background-clip"),
                backgroundColor: $input.css("background-color"),
                backgroundImage: $input.css("background-image"),
                backgroundOrigin: $input.css("background-origin"),
                backgroundPosition: $input.css("background-position"),
                backgroundRepeat: $input.css("background-repeat"),
                backgroundSize: $input.css("background-size")
            });
            $input.data("ttAttrs", {
                dir: $input.attr("dir"),
                autocomplete: $input.attr("autocomplete"),
                spellcheck: $input.attr("spellcheck"),
                style: $input.attr("style")
            });
            $input.addClass("tt-query").attr({
                autocomplete: "off",
                spellcheck: false
            }).css(css.query);
            try {
                !$input.attr("dir") && $input.attr("dir", "auto")
            } catch (e) {}
            return $input.wrap($wrapper).parent().prepend($hint).append($dropdown)
        }

        function destroyDomStructure($node) {
            var $input = $node.find(".tt-query");
            utils.each($input.data("ttAttrs"), function (key, val) {
                utils.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val)
            });
            $input.detach().removeData("ttAttrs").removeClass("tt-query").insertAfter($node);
            $node.remove()
        }
    }();
    (function () {
        var cache = {}, viewKey = "ttView",
            methods;
        methods = {
            initialize: function (datasetDefs) {
                var datasets;
                datasetDefs = utils.isArray(datasetDefs) ? datasetDefs : [datasetDefs];
                if (this.length === 0) {
                    $.error("typeahead initialized without DOM element")
                }
                if (datasetDefs.length === 0) {
                    $.error("no datasets provided")
                }
                datasets = utils.map(datasetDefs, function (o) {
                    var dataset = cache[o.name] ? cache[o.name] : new Dataset(o);
                    if (o.name) {
                        cache[o.name] = dataset
                    }
                    return dataset
                });
                return this.each(initialize);

                function initialize() {
                    var $input = $(this),
                        deferreds, eventBus = new EventBus({
                            el: $input
                        });
                    deferreds = utils.map(datasets, function (dataset) {
                        return dataset.initialize()
                    });
                    $input.data(viewKey, new TypeaheadView({
                        input: $input,
                        eventBus: eventBus = new EventBus({
                            el: $input
                        }),
                        datasets: datasets
                    }));
                    $.when.apply($, deferreds).always(function () {
                        utils.defer(function () {
                            eventBus.trigger("initialized")
                        })
                    })
                }
            },
            destroy: function () {
                this.each(function () {
                    var $this = $(this),
                        view = $this.data(viewKey);
                    if (view) {
                        view.destroy();
                        $this.removeData(viewKey)
                    }
                })
            }
        };
        jQuery.fn.typeahead = function (method) {
            if (methods[method]) {
                return methods[method].apply(this, [].slice.call(arguments, 1))
            } else {
                return methods.initialize.apply(this, arguments)
            }
        }
    })()
})(window.jQuery);
var Hogan = {};
(function (Hogan, useArrayBuffer) {
    Hogan.Template = function (renderFunc, text, compiler, options) {
        this.r = renderFunc || this.r;
        this.c = compiler;
        this.options = options;
        this.text = text || "";
        this.buf = useArrayBuffer ? [] : ""
    };
    Hogan.Template.prototype = {
        r: function (context, partials, indent) {
            return ""
        },
        v: hoganEscape,
        t: coerceToString,
        render: function render(context, partials, indent) {
            return this.ri([context], partials || {}, indent)
        },
        ri: function (context, partials, indent) {
            return this.r(context, partials, indent)
        },
        rp: function (name, context, partials, indent) {
            var partial = partials[name];
            if (!partial) {
                return ""
            }
            if (this.c && typeof partial == "string") {
                partial = this.c.compile(partial, this.options)
            }
            return partial.ri(context, partials, indent)
        },
        rs: function (context, partials, section) {
            var tail = context[context.length - 1];
            if (!isArray(tail)) {
                section(context, partials, this);
                return
            }
            for (var i = 0; i < tail.length; i++) {
                context.push(tail[i]);
                section(context, partials, this);
                context.pop()
            }
        },
        s: function (val, ctx, partials, inverted, start, end, tags) {
            var pass;
            if (isArray(val) && val.length === 0) {
                return false
            }
            if (typeof val == "function") {
                val = this.ls(val, ctx, partials, inverted, start, end, tags)
            }
            pass = val === "" || !! val;
            if (!inverted && pass && ctx) {
                ctx.push(typeof val == "object" ? val : ctx[ctx.length - 1])
            }
            return pass
        },
        d: function (key, ctx, partials, returnFound) {
            var names = key.split("."),
                val = this.f(names[0], ctx, partials, returnFound),
                cx = null;
            if (key === "." && isArray(ctx[ctx.length - 2])) {
                return ctx[ctx.length - 1]
            }
            for (var i = 1; i < names.length; i++) {
                if (val && typeof val == "object" && names[i] in val) {
                    cx = val;
                    val = val[names[i]]
                } else {
                    val = ""
                }
            }
            if (returnFound && !val) {
                return false
            }
            if (!returnFound && typeof val == "function") {
                ctx.push(cx);
                val = this.lv(val, ctx, partials);
                ctx.pop()
            }
            return val
        },
        f: function (key, ctx, partials, returnFound) {
            var val = false,
                v = null,
                found = false;
            for (var i = ctx.length - 1; i >= 0; i--) {
                v = ctx[i];
                if (v && typeof v == "object" && key in v) {
                    val = v[key];
                    found = true;
                    break
                }
            }
            if (!found) {
                return returnFound ? false : ""
            }
            if (!returnFound && typeof val == "function") {
                val = this.lv(val, ctx, partials)
            }
            return val
        },
        ho: function (val, cx, partials, text, tags) {
            var compiler = this.c;
            var options = this.options;
            options.delimiters = tags;
            var text = val.call(cx, text);
            text = text == null ? String(text) : text.toString();
            this.b(compiler.compile(text, options).render(cx, partials));
            return false
        },
        b: useArrayBuffer ? function (s) {
            this.buf.push(s)
        } : function (s) {
            this.buf += s
        },
        fl: useArrayBuffer ? function () {
            var r = this.buf.join("");
            this.buf = [];
            return r
        } : function () {
            var r = this.buf;
            this.buf = "";
            return r
        },
        ls: function (val, ctx, partials, inverted, start, end, tags) {
            var cx = ctx[ctx.length - 1],
                t = null;
            if (!inverted && this.c && val.length > 0) {
                return this.ho(val, cx, partials, this.text.substring(start, end), tags)
            }
            t = val.call(cx);
            if (typeof t == "function") {
                if (inverted) {
                    return true
                } else if (this.c) {
                    return this.ho(t, cx, partials, this.text.substring(start, end), tags)
                }
            }
            return t
        },
        lv: function (val, ctx, partials) {
            var cx = ctx[ctx.length - 1];
            var result = val.call(cx);
            if (typeof result == "function") {
                result = coerceToString(result.call(cx));
                if (this.c && ~result.indexOf("{{")) {
                    return this.c.compile(result, this.options).render(cx, partials)
                }
            }
            return coerceToString(result)
        }
    };
    var rAmp = /&/g,
        rLt = /</g,
        rGt = />/g,
        rApos = /\'/g,
        rQuot = /\"/g,
        hChars = /[&<>\"\']/;

    function coerceToString(val) {
        return String(val === null || val === undefined ? "" : val)
    }

    function hoganEscape(str) {
        str = coerceToString(str);
        return hChars.test(str) ? str.replace(rAmp, "&amp;").replace(rLt, "&lt;").replace(rGt, "&gt;").replace(rApos, "&#39;").replace(rQuot, "&quot;") : str
    }
    var isArray = Array.isArray || function (a) {
            return Object.prototype.toString.call(a) === "[object Array]"
        }
})(typeof exports !== "undefined" ? exports : Hogan);
(function (Hogan) {
    var rIsWhitespace = /\S/,
        rQuot = /\"/g,
        rNewline = /\n/g,
        rCr = /\r/g,
        rSlash = /\\/g,
        tagTypes = {
            "#": 1,
            "^": 2,
            "/": 3,
            "!": 4,
            ">": 5,
            "<": 6,
            "=": 7,
            _v: 8,
            "{": 9,
            "&": 10
        };
    Hogan.scan = function scan(text, delimiters) {
        var len = text.length,
            IN_TEXT = 0,
            IN_TAG_TYPE = 1,
            IN_TAG = 2,
            state = IN_TEXT,
            tagType = null,
            tag = null,
            buf = "",
            tokens = [],
            seenTag = false,
            i = 0,
            lineStart = 0,
            otag = "{{",
            ctag = "}}";

        function addBuf() {
            if (buf.length > 0) {
                tokens.push(new String(buf));
                buf = ""
            }
        }

        function lineIsWhitespace() {
            var isAllWhitespace = true;
            for (var j = lineStart; j < tokens.length; j++) {
                isAllWhitespace = tokens[j].tag && tagTypes[tokens[j].tag] < tagTypes["_v"] || !tokens[j].tag && tokens[j].match(rIsWhitespace) === null;
                if (!isAllWhitespace) {
                    return false
                }
            }
            return isAllWhitespace
        }

        function filterLine(haveSeenTag, noNewLine) {
            addBuf();
            if (haveSeenTag && lineIsWhitespace()) {
                for (var j = lineStart, next; j < tokens.length; j++) {
                    if (!tokens[j].tag) {
                        if ((next = tokens[j + 1]) && next.tag == ">") {
                            next.indent = tokens[j].toString()
                        }
                        tokens.splice(j, 1)
                    }
                }
            } else if (!noNewLine) {
                tokens.push({
                    tag: "\n"
                })
            }
            seenTag = false;
            lineStart = tokens.length
        }

        function changeDelimiters(text, index) {
            var close = "=" + ctag,
                closeIndex = text.indexOf(close, index),
                delimiters = trim(text.substring(text.indexOf("=", index) + 1, closeIndex)).split(" ");
            otag = delimiters[0];
            ctag = delimiters[1];
            return closeIndex + close.length - 1
        }
        if (delimiters) {
            delimiters = delimiters.split(" ");
            otag = delimiters[0];
            ctag = delimiters[1]
        }
        for (i = 0; i < len; i++) {
            if (state == IN_TEXT) {
                if (tagChange(otag, text, i)) {
                    --i;
                    addBuf();
                    state = IN_TAG_TYPE
                } else {
                    if (text.charAt(i) == "\n") {
                        filterLine(seenTag)
                    } else {
                        buf += text.charAt(i)
                    }
                }
            } else if (state == IN_TAG_TYPE) {
                i += otag.length - 1;
                tag = tagTypes[text.charAt(i + 1)];
                tagType = tag ? text.charAt(i + 1) : "_v";
                if (tagType == "=") {
                    i = changeDelimiters(text, i);
                    state = IN_TEXT
                } else {
                    if (tag) {
                        i++
                    }
                    state = IN_TAG
                }
                seenTag = i
            } else {
                if (tagChange(ctag, text, i)) {
                    tokens.push({
                        tag: tagType,
                        n: trim(buf),
                        otag: otag,
                        ctag: ctag,
                        i: tagType == "/" ? seenTag - ctag.length : i + otag.length
                    });
                    buf = "";
                    i += ctag.length - 1;
                    state = IN_TEXT;
                    if (tagType == "{") {
                        if (ctag == "}}") {
                            i++
                        } else {
                            cleanTripleStache(tokens[tokens.length - 1])
                        }
                    }
                } else {
                    buf += text.charAt(i)
                }
            }
        }
        filterLine(seenTag, true);
        return tokens
    };

    function cleanTripleStache(token) {
        if (token.n.substr(token.n.length - 1) === "}") {
            token.n = token.n.substring(0, token.n.length - 1)
        }
    }

    function trim(s) {
        if (s.trim) {
            return s.trim()
        }
        return s.replace(/^\s*|\s*$/g, "")
    }

    function tagChange(tag, text, index) {
        if (text.charAt(index) != tag.charAt(0)) {
            return false
        }
        for (var i = 1, l = tag.length; i < l; i++) {
            if (text.charAt(index + i) != tag.charAt(i)) {
                return false
            }
        }
        return true
    }

    function buildTree(tokens, kind, stack, customTags) {
        var instructions = [],
            opener = null,
            token = null;
        while (tokens.length > 0) {
            token = tokens.shift();
            if (token.tag == "#" || token.tag == "^" || isOpener(token, customTags)) {
                stack.push(token);
                token.nodes = buildTree(tokens, token.tag, stack, customTags);
                instructions.push(token)
            } else if (token.tag == "/") {
                if (stack.length === 0) {
                    throw new Error("Closing tag without opener: /" + token.n)
                }
                opener = stack.pop();
                if (token.n != opener.n && !isCloser(token.n, opener.n, customTags)) {
                    throw new Error("Nesting error: " + opener.n + " vs. " + token.n)
                }
                opener.end = token.i;
                return instructions
            } else {
                instructions.push(token)
            }
        }
        if (stack.length > 0) {
            throw new Error("missing closing tag: " + stack.pop().n)
        }
        return instructions
    }

    function isOpener(token, tags) {
        for (var i = 0, l = tags.length; i < l; i++) {
            if (tags[i].o == token.n) {
                token.tag = "#";
                return true
            }
        }
    }

    function isCloser(close, open, tags) {
        for (var i = 0, l = tags.length; i < l; i++) {
            if (tags[i].c == close && tags[i].o == open) {
                return true
            }
        }
    }
    Hogan.generate = function (tree, text, options) {
        var code = 'var _=this;_.b(i=i||"");' + walk(tree) + "return _.fl();";
        if (options.asString) {
            return "function(c,p,i){" + code + ";}"
        }
        return new Hogan.Template(new Function("c", "p", "i", code), text, Hogan, options)
    };

    function esc(s) {
        return s.replace(rSlash, "\\\\").replace(rQuot, '\\"').replace(rNewline, "\\n").replace(rCr, "\\r")
    }

    function chooseMethod(s) {
        return~ s.indexOf(".") ? "d" : "f"
    }

    function walk(tree) {
        var code = "";
        for (var i = 0, l = tree.length; i < l; i++) {
            var tag = tree[i].tag;
            if (tag == "#") {
                code += section(tree[i].nodes, tree[i].n, chooseMethod(tree[i].n), tree[i].i, tree[i].end, tree[i].otag + " " + tree[i].ctag)
            } else if (tag == "^") {
                code += invertedSection(tree[i].nodes, tree[i].n, chooseMethod(tree[i].n))
            } else if (tag == "<" || tag == ">") {
                code += partial(tree[i])
            } else if (tag == "{" || tag == "&") {
                code += tripleStache(tree[i].n, chooseMethod(tree[i].n))
            } else if (tag == "\n") {
                code += text('"\\n"' + (tree.length - 1 == i ? "" : " + i"))
            } else if (tag == "_v") {
                code += variable(tree[i].n, chooseMethod(tree[i].n))
            } else if (tag === undefined) {
                code += text('"' + esc(tree[i]) + '"')
            }
        }
        return code
    }

    function section(nodes, id, method, start, end, tags) {
        return "if(_.s(_." + method + '("' + esc(id) + '",c,p,1),' + "c,p,0," + start + "," + end + ',"' + tags + '")){' + "_.rs(c,p," + "function(c,p,_){" + walk(nodes) + "});c.pop();}"
    }

    function invertedSection(nodes, id, method) {
        return "if(!_.s(_." + method + '("' + esc(id) + '",c,p,1),c,p,1,0,0,"")){' + walk(nodes) + "};"
    }

    function partial(tok) {
        return '_.b(_.rp("' + esc(tok.n) + '",c,p,"' + (tok.indent || "") + '"));'
    }

    function tripleStache(id, method) {
        return "_.b(_.t(_." + method + '("' + esc(id) + '",c,p,0)));'
    }

    function variable(id, method) {
        return "_.b(_.v(_." + method + '("' + esc(id) + '",c,p,0)));'
    }

    function text(id) {
        return "_.b(" + id + ");"
    }
    Hogan.parse = function (tokens, text, options) {
        options = options || {};
        return buildTree(tokens, "", [], options.sectionTags || [])
    }, Hogan.cache = {};
    Hogan.compile = function (text, options) {
        options = options || {};
        var key = text + "||" + !! options.asString;
        var t = this.cache[key];
        if (t) {
            return t
        }
        t = this.generate(this.parse(this.scan(text, options.delimiters), text, options), text, options);
        return this.cache[key] = t
    }
})(typeof exports !== "undefined" ? exports : Hogan);

function pagination_toggle($parent, $target) {
    var $pagination = $(".pagination", $parent);
    $("a", $pagination).click(function (e) {
        var $list_item = $(this).parent();
        var $visible = $("[class^='" + $target + "']:visible", $parent);
        var $new_visible = $("." + $target + $list_item.index(), $parent);
        var $title = $("h2 .h2-addenum span", $parent);
        $list_item.siblings().andSelf().removeClass("active");
        $list_item.addClass("active");
        $visible.toggleClass("hidden");
        $new_visible.toggleClass("hidden");
        $title.html($(this).data("name"))
    })
}
var trans = {
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    de: ["Jan", "Feb", "MÃ¤r", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    fr: ["janv.", "fÃ©vr.", "mars", "avr.", "mai", "juin", "juil.", "aoÃ»t", "sept.", "oct.", "nov.", "dÃ©c."],
    zh: ["1æœˆ", "2æœˆ", "3æœˆ", "4æœˆ", "5æœˆ", "6æœˆ", "7æœˆ", "8æœˆ", "9æœˆ", "10æœˆ", "11æœˆ", "12æœˆ"],
    ko: ["1ì›”", "2ì›”", "3ì›”", "4ì›”", "5ì›”", "6ì›”", "7ì›”", "8ì›”", "9ì›”", "10ì›”", "11ì›”", "12ì›”"]
};
var sort = function ($sr, $x) {
    $sr.quicksand($x, {
        adjustWidth: false
    })
};
var poll = function (data, emptyHtml, find, $sr, $loader, pushUrl) {
    createAJAXLoader($loader);
    $.get(baseUrl + data.url, data.data, function (data) {
        sort($sr, $(data).find(find));
        $(".search-results h2").html($(data).find(".search-results h2").html())
    }).fail(function () {
        sort($sr, $.parseHTML())
    }).always(function () {
        removeAJAXLoader($loader);
        tooltip()
    });
    if (pushUrl) history.pushState(data, "Search - Probuilds.net", "/" + data.url + "?" + $.param(data.data))
};
(function ($) {
    var parseTime = function (value) {
        var retValue = value;
        var millis = "";
        if (retValue.indexOf(".") !== -1) {
            var delimited = retValue.split(".");
            retValue = delimited[0];
            millis = delimited[1]
        }
        var values3 = retValue.split(":");
        if (values3.length === 3) {
            hour = values3[0];
            minute = values3[1];
            second = values3[2];
            return {
                time: retValue,
                hour: hour,
                minute: minute,
                second: second,
                millis: millis
            }
        } else {
            return {
                time: "",
                hour: "",
                minute: "",
                second: "",
                millis: ""
            }
        }
    };
    var format = function (value, format) {
        try {
            var date = null;
            var year = null;
            var month = null;
            var dayOfMonth = null;
            var dayOfWeek = null;
            var time = null;
            if (typeof value == "number") {
                return this.date(new Date(value), format)
            } else if (typeof value.getFullYear == "function") {
                year = value.getFullYear();
                month = value.getMonth() + 1;
                dayOfMonth = value.getDate();
                dayOfWeek = value.getDay();
                time = parseTime(value.toTimeString())
            } else if (value.search(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d{0,3}[Z\-+]?(\d{2}:?\d{2})?/) != -1) {
                var values = value.split(/[T\+-]/);
                year = values[0];
                month = values[1];
                dayOfMonth = values[2];
                time = parseTime(values[3].split(".")[0]);
                date = new Date(year, month - 1, dayOfMonth);
                dayOfWeek = date.getDay()
            } else {
                var values = value.split(" ");
                switch (values.length) {
                case 6:
                    year = values[5];
                    month = parseMonth(values[1]);
                    dayOfMonth = values[2];
                    time = parseTime(values[3]);
                    date = new Date(year, month - 1, dayOfMonth);
                    dayOfWeek = date.getDay();
                    break;
                case 2:
                    var values2 = values[0].split("-");
                    year = values2[0];
                    month = values2[1];
                    dayOfMonth = values2[2];
                    time = parseTime(values[1]);
                    date = new Date(year, month - 1, dayOfMonth);
                    dayOfWeek = date.getDay();
                    break;
                case 7:
                case 9:
                case 10:
                    year = values[3];
                    month = parseMonth(values[1]);
                    dayOfMonth = values[2];
                    time = parseTime(values[4]);
                    date = new Date(year, month - 1, dayOfMonth);
                    dayOfWeek = date.getDay();
                    break;
                case 1:
                    var values2 = values[0].split("");
                    year = values2[0] + values2[1] + values2[2] + values2[3];
                    month = values2[5] + values2[6];
                    dayOfMonth = values2[8] + values2[9];
                    time = parseTime(values2[13] + values2[14] + values2[15] + values2[16] + values2[17] + values2[18] + values2[19] + values2[20]);
                    date = new Date(year, month - 1, dayOfMonth);
                    dayOfWeek = date.getDay();
                    break;
                default:
                    return value
                }
            }
            var pattern = "";
            var retValue = "";
            var unparsedRest = "";
            for (var i = 0; i < format.length; i++) {
                var currentPattern = format.charAt(i);
                pattern += currentPattern;
                unparsedRest = "";
                switch (pattern) {
                case "ddd":
                    retValue += strDay(dayOfWeek);
                    pattern = "";
                    break;
                case "dd":
                    if (format.charAt(i + 1) == "d") {
                        break
                    }
                    if (String(dayOfMonth).length === 1) {
                        dayOfMonth = "0" + dayOfMonth
                    }
                    retValue += dayOfMonth;
                    pattern = "";
                    break;
                case "d":
                    if (format.charAt(i + 1) == "d") {
                        break
                    }
                    retValue += parseInt(dayOfMonth, 10);
                    pattern = "";
                    break;
                case "D":
                    if (dayOfMonth == 1 || dayOfMonth == 21 || dayOfMonth == 31) {
                        dayOfMonth = dayOfMonth + "st"
                    } else if (dayOfMonth == 2 || dayOfMonth == 22) {
                        dayOfMonth = dayOfMonth + "nd"
                    } else if (dayOfMonth == 3 || dayOfMonth == 23) {
                        dayOfMonth = dayOfMonth + "rd"
                    } else {
                        dayOfMonth = dayOfMonth + "th"
                    }
                    retValue += dayOfMonth;
                    pattern = "";
                    break;
                case "MMMM":
                    retValue += trans[lang][month - 1];
                    pattern = "";
                    break;
                case "MMM":
                    if (format.charAt(i + 1) === "M") {
                        break
                    }
                    retValue += trans[lang][month - 1];
                    pattern = "";
                    break;
                case "MM":
                    if (format.charAt(i + 1) == "M") {
                        break
                    }
                    if (String(month).length === 1) {
                        month = "0" + month
                    }
                    retValue += month;
                    pattern = "";
                    break;
                case "M":
                    if (format.charAt(i + 1) == "M") {
                        break
                    }
                    retValue += parseInt(month, 10);
                    pattern = "";
                    break;
                case "y":
                case "yyy":
                    if (format.charAt(i + 1) == "y") {
                        break
                    }
                    retValue += pattern;
                    pattern = "";
                    break;
                case "yy":
                    if (format.charAt(i + 1) == "y" && format.charAt(i + 2) == "y") {
                        break
                    }
                    retValue += String(year).slice(-2);
                    pattern = "";
                    break;
                case "yyyy":
                    retValue += year;
                    pattern = "";
                    break;
                case "H":
                    if (format.charAt(i + 1) == "H") {
                        break
                    }
                    retValue += pattern;
                    pattern = "";
                    break;
                case "HH":
                    retValue += time.hour;
                    pattern = "";
                    break;
                case "hh":
                    var hour = time.hour == 0 ? 12 : time.hour < 13 ? time.hour : time.hour - 12;
                    hour = String(hour).length == 1 ? "0" + hour : hour;
                    retValue += hour;
                    pattern = "";
                    break;
                case "h":
                    if (format.charAt(i + 1) == "h") {
                        break
                    }
                    var hour = time.hour == 0 ? 12 : time.hour < 13 ? time.hour : time.hour - 12;
                    retValue += parseInt(hour, 10);
                    pattern = "";
                    break;
                case "m":
                    if (format.charAt(i + 1) == "m") {
                        break
                    }
                    retValue += pattern;
                    pattern = "";
                    break;
                case "mm":
                    retValue += time.minute;
                    pattern = "";
                    break;
                case "s":
                    if (format.charAt(i + 1) == "s") {
                        break
                    }
                    retValue += pattern;
                    pattern = "";
                    break;
                case "ss":
                    retValue += time.second.substring(0, 2);
                    pattern = "";
                    break;
                case "S":
                case "SS":
                    if (format.charAt(i + 1) == "S") {
                        break
                    }
                    retValue += pattern;
                    pattern = "";
                    break;
                case "SSS":
                    retValue += time.millis.substring(0, 3);
                    pattern = "";
                    break;
                case "a":
                    retValue += time.hour >= 12 ? "PM" : "AM";
                    pattern = "";
                    break;
                case "p":
                    retValue += time.hour >= 12 ? "p.m." : "a.m.";
                    pattern = "";
                    break;
                default:
                    retValue += currentPattern;
                    pattern = "";
                    break
                }
            }
            retValue += unparsedRest;
            return retValue
        } catch (e) {
            console.log(e);
            return value
        }
    };
    $.fn.Dateafy = function (stamp, dateFormat) {
        var date = new Date(stamp * 1e3);
        $(this).text(format(date, dateFormat))
    }
})(jQuery);
var updateDates = function () {
    var dates = $(".date");
    $.each(dates, function (k, v) {
        if ($(v).text().indexOf(":") > 0) {
            $(v).Dateafy($(v).data("date"), $(v).data("format"));
            $(v).data("date", "");
            $(v).data("format", "")
        }
    });
    dates.removeClass("date")
};
var Tipdata = {};
var types = {
    champions: {
        loaded: false,
        pre: true
    },
    pros: {
        loaded: false,
        pre: true
    },
    teams: {
        loaded: false,
        pre: true
    },
    summoners: {
        loaded: false,
        pre: true
    },
    runes: {
        loaded: false,
        pre: true
    },
    masteries: {
        loaded: false,
        pre: true
    },
    abilities: {
        loaded: false,
        pre: false
    },
    items: {
        loaded: false,
        pre: true
    }
};
var tooltipLoader = function () {
    var attr = $(this).data("tipdata");
    if (typeof attr !== "undefined" && attr !== false) return $(this).data("tipdata");
    var tip = $(this).data("tooltip").split("/");
    var target = tip.shift();
    if (tip.length == 0) return "malformed tooltip structure, length:" + tip.length;
    if (target in types && types[target] && typeof Tipdata[target][tip.join("-")] !== "undefined") {
        return Tipdata[target][tip.join("-")]
    }
    load(target, false);
    if (target in types && types[target] && typeof Tipdata[target][tip.join("-")] !== "undefined") {
        return Tipdata[target][tip.join("-")]
    }
    return "failed to load tip data"
};
var load = function (target, async) {
    if (typeof async == "undefined") async = true;
    $.ajax({
        async: async,
        url: getBaseURL() + "ajax/" + target,
        type: "POST",
        cache: true,
        dataType: "json",
        success: function (json) {
            Tipdata[target] = $.extend(Tipdata[target], json);
            localStorage[target] = JSON.stringify(Tipdata[target]);
            types[target].loaded = true
        },
        error: function () {
            result = "failed to load data"
        }
    })
};
if (typeof Storage !== "undefined") {
    $.each(types, function (k, v) {
        Tipdata[k] = {};
        if (typeof localStorage[k] !== "undefined") {
            var temp = JSON.parse(localStorage[k]);
            if ((!("locale" in temp) || temp["locale"] == locale) && "version" in temp && temp["version"] == ttversion[k]) {
                Tipdata[k] = temp;
                types[k].loaded = true
            }
        }
        if (types[k].pre && !types[k].loaded) {
            load(k)
        }
    })
}
var tooltip = function () {
    $("[data-tooltip]").each(function () {
        if (!$(this).data("hasqtip")) {
            $(this).qtip({
                content: tooltipLoader,
                position: {
                    my: "left center",
                    at: "right center",
                    target: false,
                    viewport: $(window),
                    adjust: {
                        mouse: true
                    }
                },
                style: {
                    tip: {
                        height: 24,
                        width: 10
                    }
                }
            })
        }
    })
};
var loaded = navigator.userAgent.indexOf("Firefox") > -1;
var $searchable = $("#searchable");
var oldreplace = 0;
var newreplace = 1;
var $data = $(".search-from");
var $sr = $(".search-results-results");
var $default = "NO RESULTS";
var update = function () {
    var name = $searchable.find("input[type=text]").val().toLowerCase();
    var $x = [];
    if (name != "") $x = $data.find("li[data-name*='" + name + "']");
    else $x = $data.find("li");
    var data = {
        search: name,
        sub: {}
    };
    var xurl = {
        search: name
    };
    $.each($searchable.find("select"), function (index, v) {
        var dataname = $(v).attr("name");
        data.sub[dataname] = {};
        data.sub[dataname].special = $(v).data("special");
        data.sub[dataname].value = $(v).val();
        data.sub[dataname].
        default = $(v).data("default");
        xurl[dataname] = data.sub[dataname].value
    });
    $x = prep($x, data["sub"]);
    if ($x == undefined || $x.length == 0) sort($sr, $default);
    else sort($sr, $x); if (oldreplace != newreplace) {
        history.pushState(data, "Search - Probuilds.net", window.location.pathname + "?" + $.param(xurl));
        oldreplace = newreplace
    } else {
        history.replaceState(data, "Search - Probuilds.net", window.location.pathname + "?" + $.param(xurl))
    }
    $(".search-results h2 .h2-addenum .gold").text($searchable.find("select option:selected").map(function () {
        return $(this).text()
    }).toArray().join(", "));
    loaded = true
};
var prep = function ($results, object) {
    $results = $.grep($results, function (n, i) {
        e = false;
        $.each(object, function (key, data) {
            if (data.value != data.
                default) {
                if (typeof data.special !== "undefined" && data.special) e = $(n).data(key).indexOf(data.value) != -1;
                else e = $(n).data(key) == data.value
            } else {
                e = true
            }
            return e
        });
        return e
    });
    return $results
};

function Searchable(defaultresults) {
    $default = defaultresults;
    $searchable.find("input[type=text]").keyup(function (e) {
        update();
        $(this).doTimeout("text-type", 2e3, function () {
            newreplace++
        })
    });
    $searchable.find("select").change(function () {
        update()
    })
}
window.onpopstate = function (event) {
    if ((event == null || event.state == null || event == undefined || event.state == undefined) && loaded) {
        sort($sr, $data.find("li"))
    } else if (loaded) {
        console.log("searching results");
        var name = event.state.search;
        var $x = [];
        if (name != "") $x = $data.find("li[data-name*='" + name + "']");
        else $x = $data.find("li");
        console.log("x", $x);
        $x = prep($x, event.state.sub);
        if ($x.length == 0) sort($sr, $default);
        else sort($sr, $x);
        console.log("Done")
    } else {
        loaded = true
    }
};