window.DocsApp = window.DocsApp || {};

/**
 * ***********************************
 * TREE
 * ***********************************
 */

/**
 * @constructor
 * Tree class to create the nav tree for guides and docs
 * @param {Object[]} data The array of tree nodes to process
 * @param {String} renderTo The ID of the element to render the tree to
 */
function Tree (data, renderTo) {
    var me = this,
        // get the element we'll render the tree to
        target   = document.getElementById(renderTo);

    // the class to apply to a node when it and its children are collapsed
    me.collapseCls = 'tree-node-collapsed';

    // cache the parent node ids - used by the collapseAll / expandAll methods and filter
    me._parentNodes = [];

    // cache the leaf node ids - used by filtering
    me._leafNodes = [];

    me.target = target;

    //this.decoratePrivateNodes(data);

    // first we'll loop over all of the tree nodes and create the tree node elements to
    // render to the page.  This will create the parent node, child node, and the
    // wrapping element around the child nodes used to collapse / hide child nodes
    var nodeCfgs = me.createNodeCfgs(data),
        i        = 0,
        len      = nodeCfgs.length;

    // now that we have the configs used to create each tree node (and its children)
    // using ExtL.createElement we'll append each node (and its children) to the target
    // element one after the other
    for (; i < len; i++) {
        var cfg = nodeCfgs[i];

        target.appendChild(
            ExtL.createElement(cfg)
        );
    }

    // sets up the event listener that expands / collapses parent tree nodes
    target.addEventListener('click', function (e) {
        e = DocsApp.getEvent(e);
        var el = DocsApp.getEventTarget(e);
        // walk up the tree until we find a LI item
        //while (el && el.tagName !== 'A') {
        while (el && !ExtL.hasCls(el, 'tree-parent-node')) {
           el = el.parentNode;
        }
        // if a node was clicked (-vs- clicking on the tree body)
        if (el) {
            me.toggleCollapse(el);
        }
    });

    setTimeout(function () {
        DocsApp.treeAfterRender();
    }, 1);
}

/**
 *
 */
/*Tree.prototype.decoratePrivateNodes = function (nodes, parent) {
    var len         = nodes.length,
        startingLen = len,
        //privateCt   = 0,
        node, children;

    if (parent) {
        parent.access = 'private';
    }

    while (len--) {
        node     = nodes[len];
        children = node.children;
        if (children) {
            this.decoratePrivateNodes(children, node);
        } else {
            if (node.access !== 'private') {
                if (parent) {
                    delete parent.access;
                }
            }
        }
    }
};*/

/**
 * @method createNodeCfgs
 * Return a config object used by ExtL.createElement to create each tree node (and its
 * child nodes if it has any)
 * @param {Object/Object[]} data The tree node or array of nodes to turn be rendered to
 * the tree on the page
 * @param {String} parentId The id of the parent node (used when finding the ancestor
 * chain to expand / collapse)
 * @param {Number} depth The depth of the current node.  Used to decorate a class on
 * child nodes so that they can be styled as indented in the final output
 * @return {Object[]} The array of configs to pass to ExtL.createElement to create the
 * actual tree nodes on the page
 */
Tree.prototype.createNodeCfgs = function (data, parentId, depth) {
    data = ExtL.from(data);

    var i          = 0,
        len        = data.length,
        cfgs       = [],
        isIndexed  =  this.isIndexed(),
        indexedCls = isIndexed ? ' tree-node-indexed' : '',
        node, accessCls, cfg, href, textTag, leafIcon;

    // the node depth is used to style the tree with extra padding per tree level
    depth = depth || 0;

    // loop over all passed nodes
    for (; i < len; i++) {
        node      = data[i]; // the current node
        accessCls = node.access + '-tree-node';
        // the default config to use for this node when processed to the DOM by
        // ExtL.createElement
        cfg = {
            //id             : node.id,
            parentTreeNode : parentId || null,
            "class"        : (accessCls || '') + ' tree-node tree-depth-' + depth + indexedCls
        };

        href = null;

        if (node.href || node.link) {
            href = DocsApp.buildTreeNodeHref(node);
        }
        textTag = href ? 'a' : 'span';

        // if the node is not a leaf node and has its own child nodes then process
        // decorate the node accordingly and pass the children back into this method
        // recursively for their own processing
        if (node.children) {
            // since this node is a parent node add it to the _parentNodes property
            cfg["class"] += ' tree-parent-node pointer ' + this.collapseCls;
            cfg.id = this.target.id + '-' + node.id + (node.idSuffix || '');
            this._parentNodes.push(cfg.id);
            // add the expand / collapse icons, any passed iconCls for the node, the node
            // text, and finally a wrapping container for all child nodes (used to
            // collapse children in the UI)
            cfg.cn = [{
                tag     : 'span',
                html    : '▸',
                "class" : 'tree-expando tree-expando-collapsed '
            }, {
                tag     : 'span',
                html    : '▿',
                "class" : 'tree-expando tree-expando-expanded '
            }, {
                tag        : 'i',
                "class"    : (node.iconCls || '') + ' tree-node-icon',
                "data-idx" : node.idx
            }, {
                tag  : textTag,
                html : node.text,
                href : href
            }];
            cfgs.push(cfg);

            // the child node wrap (for expand / collapse control)
            var ctCfg = {
                tag     : 'div',
                "class" : 'child-nodes-ct',
                cn      : this.createNodeCfgs(node.children, cfg.id, depth + 1)
            };
            /*var j = 0,
                children = ctCfg.cn,
                cnLen = children.length,
                privateCt = 0;

            for (; j < cnLen; j++) {
                var child = children[j],
                    private = child.class.indexOf('private-tree-node') > -1;

                if (private) {
                    privateCt++;
                }
            }
            if (privateCt > 0 && privateCt === cnLen) {
                cfg.class += ' private-child-nodes-parent';
            }*/
            cfgs.push(ctCfg);
        } else {
            // decorate this node as a leaf node
            cfg.leaf = true;
            cfg.id   = node.id + (node.idSuffix || '');
            cfg.tag  = textTag;
            cfg.href = href;
            cfg["class"] += ' tree-leaf';

            this._leafNodes.push(cfg.id);

            leafIcon = isIndexed ? '' : (node.iconCls || '');

            // add the leaf node's icon, text, and a star if it's indicated as "new"
            cfg.cn = [{
                tag        : 'i',
                "class"    : leafIcon + ' tree-node-icon',
                "data-idx" : node.idx
            }, {
                tag  : 'span',
                html : node.text
            }, {
                tag     : 'i',
                "class" : node.displayNew ? 'fa fa-star new ' : ''
            }];
            cfgs.push(cfg);
        }
    }

    return cfgs;
};

/**
 * Returns `true` if the nav tree is to display index numbers
 * @return {Boolean} `true` if the tree nodes are to display as indexed
 */
Tree.prototype.isIndexed = function () {
    return DocsApp.meta.navTreeName === 'Quick Start';
};

/**
 * Filters the tree leaf nodes by their text value (normalized to all lower case) and
 * shows the matching nodes along with their ancestor parent nodes
 * @param {String} value The value to filter the leaf nodes by
 * @return {Object} An object with the following keys / values
 *
 *  - total: An array of all leaf nodes
 *  - totalCount: The count of all leaf nodes
 *  - filtered: An array of all leaf nodes matching against the passed value
 *  - filteredCount: The count of all leaf nodes matched by the filter
 */
Tree.prototype.filter = function (value) {
    var hasValue       = value.length,
        leaves         = this.getLeafNodes(),
        leavesLen      = leaves.length,
        i              = 0,
        parentNodes    = this.getParentNodes(),
        parentsLen     = parentNodes.length,
        filteredCls    = 'tree-node-filtered',
        re             = new RegExp(('(' + value + ')').replace('$', '\\$'), 'ig'),
        visibleParents = [],
        filtered       = [],
        parentNode, leaf, text, textNode, parent, visiblesLen;

    // loop over all parent nodes and hide them if there is a value passed in; else show
    // the node
    for (; i < parentsLen; i++) {
        parentNode         = ExtL.get(parentNodes[i]);
        ExtL[hasValue ? 'addCls' : 'removeCls'](parentNode, filteredCls);
    }

    i = 0;

    // loop over all leaves.  If the leaf text matches the value then show it, highlight
    // the matching text, expand the tree to that node, and add the node's parent (if it
    // has one) to the array of parent nodes to show in the following loop
    for (; i < leavesLen; i++) {
        leaf     = ExtL.get(leaves[i]);
        text     = leaf.innerText.toLowerCase();
        textNode = leaf.querySelector('span');

        // if there is no value or the value matches the leaf text then show it
        if (!hasValue || (hasValue && text.indexOf(value.toLowerCase()) > -1)) {
            ExtL.removeCls(leaf, filteredCls);
            this.expandTo(leaf.id);
            filtered.push(leaf);
            textNode.innerHTML = (textNode.textContent || textNode.innerText).replace(re, '<strong>$1</strong>');
            parent             = ExtL.get(leaf.getAttribute('parenttreenode'));
            if (parent) {
                visibleParents.push(parent);
            }
        } else {
            // else hide it and un-highlight it
            textNode.innerHTML = textNode.textContent || textNode.innerText;
            ExtL.addCls(leaf, filteredCls);
        }
    }

    // if there was a value passed in loop over the visible parent nodes as discovered in
    // the preceding loop and show them and their ancestor nodes
    if (hasValue) {
        visiblesLen = visibleParents.length;
        i           = 0;

        for (; i < visiblesLen; i++) {
            parent = visibleParents[i];

            while (parent) {
                ExtL.removeCls(parent, filteredCls);
                parent = ExtL.get(parent.getAttribute('parenttreenode'));
            }
        }
    }

    // return an object showing the total nodes, their count, the filtered nodes, and
    // their count
    return {
        total         : leaves,
        totalCount    : leaves.length,
        filtered      : filtered,
        filteredCount : filtered.length
    };
};

/**
 *
 */
Tree.prototype.getChildNodes = function (parentNodeId) {
    var parentNode = ExtL.get(parentNodeId),
        children   = [],
        childNodes = ExtL.fromNodeList(parentNode.nextSibling.childNodes),
        childLen   = childNodes.length,
        i          = 0,
        child;

    for (; i < childLen; i++) {
        child = childNodes[i];

        if (ExtL.hasCls(child, 'tree-leaf')) {
            children.push(child);
        }
    }

    return children;
};

/**
 * @method toggleCollapse
 * Toggles the collapse state of the tree node
 * @param {String/Element} el The HTML element or ID of the tree node to toggle
 * @param {Boolean} collapse Pass `true` or `false` to force the toggle to collapse or
 * expand.  Passing `true` will force collapse while `false` will force expand.
 * @return {Object} The tree instance
 */
Tree.prototype.toggleCollapse = function (el, collapse) {
    el = ExtL.isString(el) ? ExtL.get(el) : el;

    ExtL.toggleCls(el, this.collapseCls, collapse);
    return this;
};

/**
 * @method expand
 * Expands the passed parent tree node
 * @param {String/Element} node The HTML element or ID of the tree node to expand
 * @return {Object} The tree instance
 */
Tree.prototype.expand = function (node) {
    return this.toggleCollapse(node, false);
};

/**
 * @method collapse
 * Collapses the passed parent tree node
 * @param {String/Element} node The HTML element or ID of the tree node to collapse
 * @return {Object} The tree instance
 */
Tree.prototype.collapse = function (node) {
    return this.toggleCollapse(node, true);
};

/**
 * @method expandTo
 * Expand all ancestor nodes up to the passed node
 * @param {String/Element} node The HTML element or ID of the tree node to expand to
 * @return {Object} The tree instance
 */
Tree.prototype.expandTo = function (node) {
    var el = ExtL.get(node);

    while (el) {
        el = ExtL.get(el.getAttribute('parentTreeNode'));
        if (el) {
            this.expand(el);
        }
    }

    return this;
};

/**
 * @method toggleCollapseAll
 * Toggles the collapse state of all parent tree nodes
 * @param {Boolean} collapse Pass `true` or `false` to force the toggle to collapse or
 * expand.  Passing `true` will force collapse while `false` will force expand.
 * @return {Object} The tree instance
 */
Tree.prototype.toggleCollapseAll = function (collapse) {
    var parentNodes = this.getParentNodes(),
        i           = 0,
        len         = parentNodes.length;

    for (; i < len; i++) {
        this.toggleCollapse(parentNodes[i], collapse);
    }

    return this;
};

/**
 * @method expandAll
 * Expands all tree nodes
 * @return {Object} The tree instance
 */
Tree.prototype.expandAll = function () {
    return this.toggleCollapseAll(false);
};

/**
 * @method collapseAll
 * Collapses all tree nodes
 * @return {Object} The tree instance
 */
Tree.prototype.collapseAll = function () {
    return this.toggleCollapseAll(true);
};

/**
 * @method getParentNodes
 * Returns all parent node IDs in the tree.  Used by {@link #collapseAll} and
 * {@link #expandAll} and {@link #filter}
 * @return {String[]} Array of the IDs of all parent nodes in the tree
 */
Tree.prototype.getParentNodes = function () {
    return this._parentNodes;
};

/**
 * Returns all leaf node IDs in the tree.  Used by {@link #filter}
 * @return {String[]} Array of the IDs of all leaf nodes in the tree
 */
Tree.prototype.getLeafNodes = function () {
    return this._leafNodes;
};

/**
 * @method select
 * Decorates the passed tree node as selected
 * @param {String/HTMLElement} node The HTML element or ID of the tree node to select
 * @return {Object} The tree instance
 */
Tree.prototype.select = function (node) {
    var el = ExtL.get(node);

    ExtL.addCls(el, 'selected-tree-node');
    return this;
};

/**
 * ***********************************
 * GLOBALS
 * ***********************************
 */

DocsApp.appMeta = {
    menuCanClose       : true,
    allowSave          : false,
    isStateful         : true,
    currentApiPage     : 0,
    currentGuidePage   : 0,
    internalId         : 0,
    pageSize           : 10,
    masterSearchList   : '',
    searchHistory      : [],
    pos                : {},
    isFirefox          : (navigator.userAgent.indexOf("firefox") !== -1),
    isMacWebkit        : (navigator.userAgent.indexOf("Macintosh") !== -1 &&
                         navigator.userAgent.indexOf("WebKit") !== -1),
    //ios              : (navigator.userAgent.indexOf("Macintosh") !== -1 && navigator.userAgent.indexOf("WebKit") !== -1),
    apiSearchRecords   : null,
    addHighlight       : null,
    removeHighlight    : null,
    clicked            : null,
    guideSearchRecords : []
};



/**
 * @method buildNavTree
 * Builds the navigation tree using the passed tree object (determined in
 * {@link #initNavTree}).  The navigation tree instance is cached on DocsApp.navTree.
 */
DocsApp.buildNavTree = function (navTree, ct) {
    return new Tree(navTree, ct || 'tree');
};

/**
 * @method initNavTree
 * Once the dom is ready the navigation tree for the current page (and the navigation
 * panel's tabs) are created.  The apiTree object and the guidesTree object are both used
 * (as applicable as some products are guides-only) to create the navigation tree and its
 * tabs.
 */
DocsApp.initNavTree = function () {
    // The name of the navigation tree for the current page
    var navTreeName = DocsApp.meta.navTreeName,
        apiTree     = DocsApp.apiTree || {},
        guidesTree  = DocsApp.guidesTree || {},
        navTrees, navTree, guideKeys;

    // collect all trees into a single object
    //navTrees = ExtL.assign({}, apiTarget, guidesTree);
    navTrees = ExtL.assign({}, apiTree, guidesTree);

    // the product home page likely will not have passed a navTreeName to determine which
    // nav tree to display so we'll grab the first guides or the first api name we find
    if (DocsApp.meta.pageType === 'home' && !navTreeName) {
        guideKeys = ExtL.keys(guidesTree);
        apiKeys   = ExtL.keys(apiTree);

        if (guideKeys.length) {
            navTreeName = DocsApp.meta.navTreeName = guideKeys[0];
        } else if (apiKeys.length) {
            navTreeName = DocsApp.meta.navTreeName = apiKeys[0];
        } else {
            // TODO thrown an error
        }
    }

    // the tree object for the current page
    //navTree = navTrees[navTreeName];
    navTree = ExtL.valueFromPath(navTrees, navTreeName);

    // if a navigation tree is found for the current page
    if (navTree) {
        var id   = DocsApp.meta.myId,
            tabs = [], tree;

        // create the tree
        tree = DocsApp.navTree = DocsApp.buildNavTree(navTree);
        DocsApp.addTreeToggleButton(tree);

        // select the node for the current page
        if (id) {
            var target     = tree.target,
                targetId   = target.id + '-';
                targetNode = target.querySelector('[id="' + id + '"]') || target.querySelector('[id="' + targetId + id + '"]');

            tree.select(targetNode.id)
            // and expand the tree to the selected node
            .expandTo(targetNode.id);
            //console.log(document.getElementById(targetNode.id));
            document.getElementById(targetNode.id).scrollIntoView(true);
        }

        DocsApp.initNavTreeTabs();
    }
};

/**
 *
 */
DocsApp.addTreeToggleButton = function (tree) {
    var target = tree.target;

    if (target.querySelector('.tree-parent-node')) {
        var btn = target.appendChild(ExtL.createElement({
            "class"       : 'icon-btn toggle-all-tree-nodes-btn tooltip tooltip-tr-br',
            "data-toggle" : 'Expand All Classes',
            cn            : [{
                "class"   : 'callout callout-b'
            }, {
                tag       : 'i',
                "class"   : 'fa fa-plus'
            }]
        }));

        ExtL.on(btn, 'click', function (e) {
            DocsApp.toggleTreeNodes(e, tree);
        });
    }
};

/**
 * @method initNavTreeTabs
 * Creates the navigation tabs for the navigation panel using the passed tab names
 */
DocsApp.initNavTreeTabs = function () {
    var navTreeName      = DocsApp.meta.navTreeName,
        // the tree header container for all tabs
        treeHeader       = ExtL.get('tree-header'),
        treeSubHeader    = ExtL.get('tree-sub-header'),
        apiTree          = DocsApp.apiTree    || {},
        guidesTree       = DocsApp.guidesTree || {},
        navTrees         = ExtL.assign({}, guidesTree, apiTree),
        navTreeTabs      = ExtL.keys(navTrees),
        navTreeNameSplit = navTreeName.split('.'),
        navTreeNameRoot  = navTreeNameSplit[0],
        navTreeNameChild = navTreeNameSplit[1],
        i                = 0,
        len              = navTreeTabs.length,
        tab, tabId, tabCls, isActive, activeCls, cfg, navTree, hasChildren,
        childTabs, j, childLen, childTab, childTabId, childTabCls, childCfg, childNavTree;

    // loop through the keys from the guides and api trees (the top tab names)
    for (; i < len; i++) {
        tab       = navTreeTabs[i];
        tabId     = tabCls = tab.replace(/\s+/g, '-').toLowerCase() + '-tab';
        // the active tab is the one that matches tha tree name of the current page
        isActive  = tab === navTreeNameRoot;
        activeCls = isActive ? ' active-tab' : '';

        // the default config for all tabs
        cfg = {
            tag     : isActive ? 'div' : 'a',
            "class" : 'nav-tab toolbarHeaderButton ' + tabCls,
            html    : tab,
            id      : tabId
        };

        navTree     = navTrees[tab];
        hasChildren = ExtL.isObject(navTree);

        // if there are child trees fetch the first available child
        if (hasChildren) {
            navTree = navTree[ExtL.keys(navTree)[0]];
        }

        // if this tab is not the currently active tab set the href for its anchor tag
        if (!isActive) {
            cfg.href = DocsApp.getNodeHref(navTree[0]);
        } else {
            // else this is the active main tab so add the active tab class
            cfg["class"] += activeCls;

            // if this active tab's tree has children then there are sub tabs to process
            if (hasChildren) {
                childTabs = ExtL.keys(navTrees[tab]);
                j         = 0;
                childLen  = childTabs.length;

                // loop over the sub-tab names
                for (; j < childLen; j++) {
                    childTab     = childTabs[j];
                    childTabId   = childTabCls = childTab.replace(/\s+/g, '-').toLowerCase() + '-tab';
                    isActive     = navTreeNameChild === childTab;

                    // the default config for all child tabs
                    childCfg = {
                        tag     : isActive ? 'div' : 'a',
                        "class" : 'sub-tab ' + childTabCls,
                        html    : childTab,
                        id      : childTabId
                    };

                    // decorate the active sub-tab
                    if (isActive) {
                        childCfg["class"] += activeCls;
                    // and otherwise make the tab a link
                    } else {
                        childNavTree = ExtL.valueFromPath(navTrees, tab + '.' + childTab);
                        childCfg.href = DocsApp.getNodeHref(childNavTree[0]);
                    }

                    // append the tab to the tree sub-header element
                    treeSubHeader.appendChild(ExtL.createElement(childCfg));
                }
            }
        }

        // append the tab to the tree header element
        treeHeader.appendChild(ExtL.createElement(cfg));
    }
};

/**
 * @method buildTreeNodeHref
 * @private
 * Returns the link or constructed href (using the page's relative path to the docs
 * output root).  Returns `undefined` if the node passed in has neither a link or href.
 * @param {Object} node The tree node to evaluate for link / href
 * @return {String} The href for this node or `undefined` if none are found
 */
DocsApp.buildTreeNodeHref = function (node) {
    var href;

    if (node.href || node.link) {
        href = node.link || (DocsApp.meta.rootPath  + node.href);
    }

    return href;
};

/**
 * @method getNodeHref
 * @private
 * Returns the first nav tree link / href.  Used by {@link #initNavTreeTabs} when
 * building the tabs in the nav tree header.  Tabs that are not for the active nav tree
 * are links to another page relating to that tab.
 * @param {Object} node The node to evaluate for href / link
 * @return {String} The href to set on the tab's anchor element
 */
DocsApp.getNodeHref = function (node) {
    var href;

    while (!href) {
        if (node.href || node.link) {
            href = DocsApp.buildTreeNodeHref(node);
        } else {
            node = node.children[0];
        }
    }

    return href;
};

/**
 * Applies any post-processing to the nav tree after it's created and rendered
 */
DocsApp.treeAfterRender = function () {
    DocsApp.filterClassTreeByAccess();
};

/**
 * Creates the product / version selection hover menu
 */
DocsApp.initProductMenu = function () {
    var menuCt = ExtL.get('product-tree-ct'),
        menuData = DocsApp.productMenu,
        menuLen = menuData.length,
        i = 0,
        parent, node;

    for (; i < menuLen; i++) {
        parent = menuData[i];

        node = ExtL.createElement({
            html : parent.text,
            "class" : 'product-name-item',
            id : 'product-menu-' + parent.product,
            "data-name" : parent.product,
            cn : [{
                tag : 'i',
                "class" : 'fa fa-caret-right'
            }]
        });
        node.myParentNode = parent;

        menuCt.appendChild(node);
    }
};


/**
 * @method getEvent
 * @param e
 * @returns {*|Event}
 */
DocsApp.getEvent = function (e) {
    return e || window.event;
};

/**
 * @method getEventTarget
 * @param e
 * @returns {EventTarget|Object}
 */
DocsApp.getEventTarget = function (e) {
    e = DocsApp.getEvent(e);
    return e ? (e.target || e.srcElement) : false;
};





(function() {
    // TODO should the click event injection be removed?  I can't see it used anywhere
    if (document.addEventListener) {
        document.addEventListener('click', function(event) {
            if(!event.synthetic) {
                DocsApp.appMeta.pos.x = event.clientX;
                DocsApp.appMeta.pos.y = event.clientY;
                DocsApp.appMeta.clicked = true;
            }
        }, false);
    } else {
        document.attachEvent('onclick', function(event) {
            if(!event.synthetic) {
                DocsApp.appMeta.pos.x = event.clientX;
                DocsApp.appMeta.pos.y = event.clientY;
                DocsApp.appMeta.clicked = true;
            }
        });
    }

    setTimeout(function(){
        if(DocsApp.appMeta.clicked) {
            DocsApp.dispatchClick(DocsApp.appMeta.pos);
            DocsApp.appMeta.clicked = false;
        }
    },500);

    DocsApp.dispatchClick = function (coords){
        var event = document.createEvent("MouseEvent"),
            elem  = document.elementFromPoint(coords.x, coords.y);

        event.initMouseEvent(
            "click",
            true /* bubble */, true /* cancelable */,
            window, null,
            coords.x, coords.y, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );
        event.synthetic = true;

        elem.dispatchEvent(event);
    };

    DocsApp.addEventsAndSetMenuClose = function (item, event, menuClose, fn) {
        ExtL.on(item, event, function() {
            // menuCanClose is a closure variable
            if (menuClose !== null) {
                DocsApp.appMeta.menuCanClose = menuClose;
            }

            if (fn) {
                fn();
            }
        });
    };

    /**
     * Progressive ID generator
     * @param {String} prefix String to prepend to the ID.  Default to 'e-'.
     */
    DocsApp.id = function (prefix) {
        prefix = prefix || 'e-';
        return prefix + DocsApp.appMeta.internalId++;
    };

    /**
     * Show / hide members based on whether public, protected, private, or some
     * combination is checked.
     */
    DocsApp.filterByAccess = function () {
        /*var publicCheckbox    = ExtL.get('publicCheckbox'),
            protectedCheckbox = ExtL.get('protectedCheckbox'),
            privateCheckbox   = ExtL.get('privateCheckbox'),
            inheritedCheckbox = ExtL.get('inheritedCheckbox'),
            publicCls         = 'show-public',
            protectedCls      = 'show-protected',
            privateCls        = 'show-private',
            inheritedCls      = 'show-inherited',
            membersCt         = ExtL.get('rightMembers');

        DocsApp.resetTempShownMembers();

        ExtL.toggleCls(membersCt, publicCls, publicCheckbox.checked === true);
        ExtL.toggleCls(membersCt, protectedCls, protectedCheckbox.checked === true);
        ExtL.toggleCls(membersCt, privateCls, privateCheckbox.checked === true);
        ExtL.toggleCls(membersCt, inheritedCls, inheritedCheckbox.checked === true);

        DocsApp.setTypeNavAndHeaderVisibility();
        DocsApp.highlightTypeMenuItem();*/
        var publicCheckbox    = ExtL.get('publicCheckbox'),
            publicChecked     = publicCheckbox && publicCheckbox.checked,
            protectedCheckbox = ExtL.get('protectedCheckbox'),
            protectedChecked  = protectedCheckbox && protectedCheckbox.checked,
            privateCheckbox   = ExtL.get('privateCheckbox'),
            privateChecked    = privateCheckbox && privateCheckbox.checked,
            inheritedCheckbox = ExtL.get('inheritedCheckbox'),
            inheritedChecked  = inheritedCheckbox && inheritedCheckbox.checked,
            readonlyCheckbox  = ExtL.get('readonlyCheckbox'),
            readonlyChecked   = readonlyCheckbox && readonlyCheckbox.checked,
            membersCt         = ExtL.get('rightMembers'),
            rows              = ExtL.fromNodeList(membersCt.querySelectorAll('.classmembers')),
            rowsLen           = rows.length,
            row, isAutoAccessor, isPublic, isPrivate, isProtected,
            isInherited, hasReadOnly, isReadOnly;

        DocsApp.resetTempShownMembers();

        while (rowsLen--) {
            row            = rows[rowsLen];
            isAutoAccessor = ExtL.hasCls(row, 'auto-accessor-method');
            isPublic       = publicChecked    && ExtL.hasCls(row, 'member-public');
            isProtected    = protectedChecked && ExtL.hasCls(row, 'member-protected');
            isPrivate      = privateChecked   && ExtL.hasCls(row, 'member-private');
            isInherited    = ExtL.hasCls(row, 'is-not-inherited') || inheritedChecked === ExtL.hasCls(row, 'isInherited');
            hasReadOnly    = !!row.querySelector('.readonly')
            isReadOnly     = !hasReadOnly || readonlyChecked  === hasReadOnly;

            if (isAutoAccessor || ((isPublic || isProtected || isPrivate) && isInherited && isReadOnly)) {
                ExtL.removeCls(row, 'hide');
            } else {
                ExtL.addCls(row, 'hide');
            }
        }

        DocsApp.setTypeNavAndHeaderVisibility();
        DocsApp.highlightTypeMenuItem();
    };

    /**
     *
     */
    DocsApp.onFilterClassCheckboxToggle = function () {
        DocsApp.filterClassTreeByAccess();

        if (DocsApp.appMeta.isStateful) {
            DocsApp.saveState();
        }
    };

    /**
     *
     */
    DocsApp.filterClassTreeByAccess = function () {
        var privateCheckbox = ExtL.get('private-class-toggle'),
            checked         = privateCheckbox && privateCheckbox.checked === true,
            privateCls      = 'show-private',
            treeMembersCt   = ExtL.get('tree');

        ExtL.toggleCls(treeMembersCt, privateCls, checked);
    };

    /**
     * Reset any temporarily shown class members
     */
    DocsApp.resetTempShownMembers = function () {
        var temps = document.querySelectorAll('.temp-show');

        temps = ExtL.fromNodeList(temps);

        if (temps.length) {
            ExtL.each(temps, function (item) {
                ExtL.removeCls(item, 'temp-show');
            });
        }
    };

    /**
     *
     */
    DocsApp.toggleContextTab = function () {
        var filterTab         = ExtL.get('filterTab'),
            relatedClassesTab = ExtL.get('relatedClassesTab');

        ExtL.toggleCls(ExtL.get('filters-ct'), 'hide');
        ExtL.toggleCls(ExtL.get('related-classes-context-ct'), 'hide');
        ExtL.toggleCls(filterTab, 'active-tab');
        ExtL.toggleCls(relatedClassesTab, 'active-tab');
    };

    /**
     * Hide type section headers where there are no members shown by the filters
     *
     * Disable the top nav buttons when no members for that type are shown by the filters
     */
    DocsApp.setTypeNavAndHeaderVisibility = function () {
        var headers    = [],
            types      = ['child-items', 'configs', 'properties', 'methods', 'events', 'vars', 'sass-mixins'],
            typeLen    = types.length,
            i          = 0,
            totalCount = 0,
            typeCt, headersLen, els, len, j, hasVisible, count, btn, memberEl;

        for (; i < typeLen; i++) {
            typeCt = ExtL.get(types[i] + '-ct');
            if (typeCt) {
                headers.push(typeCt);
            }

            // account for the required / optional configs/properties/methods sub-headings
            if (typeCt && (types[i] === 'configs' || types[i] === 'properties' || types[i] === 'methods')) {
                typeCt = ExtL.get((types[i] === 'configs' ? 'optional' : 'instance') + '-' + types[i] +'-ct');
                if (typeCt) {
                    headers.push(typeCt);
                }
                typeCt = ExtL.get((types[i] === 'configs' ? 'required' : 'static') + '-'+ types[i] +'-ct');
                if (typeCt) {
                    headers.push(typeCt);
                }
            }
        }

        headersLen = headers.length;

        for (i = 0; i < headersLen; i++) {
            ExtL.removeCls(headers[i], 'hide-type-header');
        }

        for (i = 0; i < headersLen; i++) {
            els = headers[i].querySelectorAll('div.classmembers');
            len = els.length;
            hasVisible = false;
            count = 0;
            for (j = 0; j < len; j++) {
                memberEl = els.item(j);
                if (memberEl.offsetHeight && !ExtL.hasCls(memberEl, 'accessor-method')) {
                    count++;
                    hasVisible = true;
                }
            }
            totalCount += count;
            btn = ExtL.get(headers[i].id.substring(0, headers[i].id.length - 3) + '-nav-btn');
            if (btn) {
                btn.querySelector('.nav-btn-count').innerHTML = count;
            }
            if (hasVisible) {
                ExtL.removeCls(headers[i], 'hide-type-header');
                if (btn) {
                    ExtL.removeCls(btn, 'disabled');
                }
            } else {
                ExtL.addCls(headers[i], 'hide-type-header');
                if (btn) {
                    ExtL.addCls(btn, 'disabled');
                }
            }
        }

        ExtL.toggleCls(document.body, 'no-visible-members', totalCount === 0);
    };

    DocsApp.highlightMemberMatch = function (member, value) {
        value = value.replace(/"/g, '');

        var re   = new RegExp(('(' + value + ')').replace('$', '\\$'), 'ig'),
            name = member.querySelector('.member-name') || member.querySelector('.params-list');

        name.innerHTML = (name.textContent || name.innerText).replace(re, '<strong>$1</strong>');
    };

    DocsApp.unhighlightMemberMatch = function (member) {
        var name = member.querySelector('.member-name') || member.querySelector('.params-list');

        name.innerHTML = name.textContent || name.innerText;
    };

    /**
     * Returns an object with:
     *  - width: the viewport width
     *  - height: the viewport height
     */
    DocsApp.getViewportSize = function (){
        var e = window,
            a = 'inner';

        if (!('innerWidth' in window)){
            a = 'client';
            e = document.documentElement || document.body;
        }
        return {
            width: e[ a + 'Width' ],
            height: e[ a + 'Height' ]
        };
    };

    /**
     * Set class tree visibility
     * @param {Boolean} visible false to hide - defaults to true
     */
    DocsApp.setTreeVisibility = function (visible) {
        visible = (visible !== false);
        ExtL.toggleCls(document.body, 'tree-hidden', !visible);
        ExtL.toggleCls(document.body, 'tree-shown', visible);

        DocsApp.saveState();
    };

    /**
     * Toggle class tree visibility
     */
    DocsApp.toggleTreeVisibility = function () {
        var body         = document.body,
            rightMembers = ExtL.get('rightMembers'),
            contextShown = ExtL.hasCls(rightMembers, 'show-context-menu');

        if (!contextShown) {
            DocsApp.setTreeVisibility(ExtL.hasCls(body, 'tree-hidden'));
        }
    };

    /**
     * Filter the members using the filter input field value
     */
    DocsApp.filter = ExtL.createBuffered(function (e, target) {
        var value        = ExtL.trim(target.value),
            matcher      = new RegExp(value.replace('$', '\\$'), 'gi'),
            classmembers = ExtL.fromNodeList(document.getElementsByClassName('classmembers')),
            classText    = document.getElementsByClassName('classText')[0],
            matches      = [],
            matchesLen, owner;

        DocsApp.resetTempShownMembers();

        ExtL.each(classmembers, function (member) {
            var parent = member.parentNode,
                header = ExtL.hasCls(parent, 'accessor-method') ? parent : false,
                params = ExtL.fromNodeList(member.querySelectorAll('.param-list-item'));

            // if the filter field is cleared remove all of the filtering and temp-expanding on all of the members
            if (!value.length) {
                ExtL.removeCls(classText, 'be-hidden');
                ExtL.removeCls(member, 'member-filter-expanded');
                DocsApp.unhighlightMemberMatch(member);
                if (params.length) {
                    ExtL.each(params, function (paramEl) {
                        DocsApp.unhighlightMemberMatch(paramEl.parentNode);
                    });
                }
            } else {
                if (member.getAttribute('data-member-name').match(matcher)) {
                    matches.push(member);
                    ExtL.removeCls(member, 'be-hidden');
                    DocsApp.highlightMemberMatch(member, value);

                    // show the accessor header
                    if (header) {
                        ExtL.removeCls(header, 'be-hidden');
                    }
                } else {
                    ExtL.addCls(member, 'be-hidden');
                    DocsApp.unhighlightMemberMatch(member);

                    // hide the accessor header
                    if (header) {
                        ExtL.addCls(header, 'be-hidden');
                    }
                }

                // if the member is a sass mixin check its params for matches against the filter value
                // for matches, hide all non-matching params, highlight the matches, and temp-expand the parent mixin member
                if (parent.id === 'sass-mixins-ct') {
                    var paramMatch = false;

                    if (params.length) {
                        ExtL.each(params, function (paramEl) {
                            var name = paramEl.id.substr(paramEl.id.indexOf('--') + 2),
                                paramParent = ExtL.up(paramEl, '.param-row');

                            if (name.match(matcher)) {
                                paramMatch = true;
                                ExtL.removeCls(member, 'be-hidden');
                                ExtL.removeCls(paramParent, 'be-hidden');
                                matches.push(member);
                                DocsApp.highlightMemberMatch(paramParent, value);
                            } else {
                                ExtL.addCls(paramParent, 'be-hidden');
                                DocsApp.unhighlightMemberMatch(paramParent);
                            }
                        });
                    }

                    ExtL[paramMatch ? 'addCls' : 'removeCls'](member, 'member-filter-expanded');
                }
            }
        });

        // for all the matches found look to see if the match is an accessor method and
        // if so then show its parent config
        matchesLen = matches.length;
        for (i = 0; i < matchesLen; i++) {
            header = ExtL.hasCls(matches[i], 'accessor-method') ? matches[i].parentNode : false;
            if (header) {
                owner = ExtL.up(matches[i], '.classmembers');
                if (owner) {
                    ExtL.removeCls(owner, 'be-hidden');
                    ExtL.addCls(owner, 'member-filter-expanded');
                }
            }
        }

        // decorate the body (and subsequently all be-hidden els) as filtered
        ExtL.toggleCls(document.body, 'filtered', value.length);

        DocsApp.setTypeNavAndHeaderVisibility();
    }, 200);

    DocsApp.getSearchList = function () {
        var list    = DocsApp.appMeta.masterSearchList,
            itemTpl = '{0}-{1}`';

        if (!list) {
            list = '';
            //ExtL.each(searchIndex, function (i, cls) {  // iterate over each class object
            ExtL.each(DocsApp.apiSearch, function (i, cls) {  // iterate over each class object
                var missingAccessors = [],              // collect up any missing auto-generated accessors to be added to the class object
                    composite;

                ExtL.each(cls, function (key, obj) {    // inspect each member - could be the class name, alias, or a class member object
                    var memberName, cap;

                    if (key === 'n') {                  // this is the class name
                        list += ExtL.format(itemTpl, i, obj);
                    } else if (key === 'd') {           // this is any displayed class name
                        // skip for now unless some future product requires this somehow
                        /*ExtL.each(obj, function (x) {
                            list += ExtL.format(itemTpl, i, obj);
                        });*/
                    } else if (key === 'g') {           // this is any alternate class names
                        ExtL.each(obj, function (x) {
                            list += ExtL.format(itemTpl, i, obj);
                        });
                    } else if (key === 't') {           // this is the toolkit
                        // and we want to skip doing anything with it
                    } else if (key === 'x') {           // this is any aliases found for the class
                        ExtL.each(obj, function (obj) {
                            list += ExtL.format(itemTpl, i, obj);
                        });
                    } else if (key !== 'a') {                            // else this is a member object
                        list += ExtL.format(itemTpl, i, key);

                        composite = key.substr(0, key.indexOf('.')) + '.' + cls.n + '.' + key.substr(key.indexOf('.') + 1);
                        list += ExtL.format(itemTpl, i, composite);

                        memberName = key.substr(key.indexOf('.') + 1);
                        cap = ExtL.capitalize(memberName);

                        if (obj.g) {                    // if this is an accessor
                            if (!cls['m.get' + cap]) { // if the getter doesn't exist already
                                missingAccessors.push('get' + cap);
                                list += ExtL.format(itemTpl, i, 'm.get' + cap);
                            }
                            if (!cls['m.set' + cap]) { // if the setter doesn't exist already
                                missingAccessors.push('set' + cap);
                                list += ExtL.format(itemTpl, i, 'm.set' + cap);
                            }
                        }
                    }
                });

                // add each missing accessor method to the class object
                // as a public setter / getter
                ExtL.each(missingAccessors, function (accessor) {
                    cls['m.' + accessor] = {
                        a: 'p'
                    };
                });
            });
            DocsApp.appMeta.masterSearchList = list;
        }
        return list;
    };

    DocsApp.doLogSearchValue = function (value) {
        var field = ExtL.get('searchtext');

        value = value || field.value;

        var temp  = [],
            limit = 10;

        ExtL.each(DocsApp.appMeta.searchHistory, function (item) {
            if (item.toLowerCase() !== value.toLowerCase()) {
                temp.push(item);
            }
        });
        temp.push(value);

        if (temp.length > limit) {
            temp.reverse().length = limit;
            temp.reverse();
        }

        DocsApp.appMeta.searchHistory = temp;
        DocsApp.saveState();
    };

    /**
     *
     */
    DocsApp.logSearchValue = ExtL.createBuffered(DocsApp.doLogSearchValue, 750);

    DocsApp.searchFilter = ExtL.createBuffered(function (e){
        var results     = [],
            hits        = [],
            //hasApi    = ExtL.get('apiTab').offsetHeight,
            //hasGuide  = ExtL.get('guideTab').offsetHeight,
            hasApi      = DocsApp.meta.hasApi,
            hasGuides   = DocsApp.meta.hasGuides,
            searchField = ExtL.get('searchtext'),
            value       = searchField.value,
            forceExact  = /^".+"$/.test(value),
            unique      = [],
            catalog     = {},
            mButton     = ExtL.get('modern-search-filter'),
            cButton     = ExtL.get('classic-search-filter'),
            searchList, keyCode, result, rx, re, item, match,
            filterClassic, filterModern, classObj, matchStr;

        if (DocsApp.meta.toolkit) {
            filterClassic = ExtL.hasCls(cButton, 'active');
            filterModern  = ExtL.hasCls(mButton, 'active');
        }

        e = DocsApp.getEvent(e);

        if (e && e.type === 'keydown' && value.length) {
            keyCode = e.keyCode || e.which;

            if (keyCode !== 13 && keyCode !== 9) {
                return;
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            if (keyCode === 13) {
                DocsApp.onSearchEnter();
            }
            if (keyCode === 9) {
                DocsApp.onSearchTab();
            }
            return;
        }

        value = ExtL.trim((searchField).value).toLowerCase();
        value = value.replace('$', '\\$');

        if (!value.length || value.length < 2 || value.slice(-1) === '.') {
            DocsApp.hideSearchResults();
            DocsApp.showSearchHistory();
            return;
        } else {
            DocsApp.logSearchValue(value);
            DocsApp.hideSearchHistory();
        }

        // START WITH THE API SEARCH BITS
        if (hasApi) {
            searchList = DocsApp.getSearchList();
            rx = new RegExp('(\\d+\\D?)(?:-)([$a-zA-Z0-9\\.\-]*' + value.replace(/"/g, '') + '[a-zA-Z0-9\\.\-]*)(?:`)', 'gi');

            while ((result = rx.exec(searchList))) {
                classObj = DocsApp.apiSearch[result[1]];
                matchStr = result[2];
                item = {
                    searchValue : value,
                    searchMatch : matchStr,
                    classObj    : classObj
                };

                if (forceExact) {
                    if (matchStr.indexOf('.') === 1) {
                        matchStr = matchStr.substring(2);
                    }
                }

                if (!forceExact || (forceExact && value.replace(/"/g, '').toLowerCase() === matchStr.toLowerCase())) {
                    // if the product has toolkits check against the toolkit filter before
                    // returning the result
                    if (DocsApp.meta.hasToolkits && DocsApp.meta.toolkit) {
                        if ((classObj.t === 'modern' && filterModern) || (classObj.t === 'classic' && filterClassic)) {
                            results.push(item);
                        }
                    } else {
                        results.push(item);
                    }
                }
            }

            DocsApp.appMeta.apiSearchRecords = DocsApp.prepareApiSearchRecords(results);    // save this up so it can be used ad hoc

            // Strip out any duplicate entries from the search results
            ExtL.each(DocsApp.appMeta.apiSearchRecords, function (rec) {
                var name   = rec.classObj.n,
                    type   = rec.memberType,
                    member = rec.sortValue,
                    toolkit;

                if (rec.byClassMember !== true) {
                    toolkit = rec.classObj.t || 'u';
                    if (!catalog['cls-' + toolkit + '-' + name]) {
                        catalog['cls-' + toolkit + '-' + name] = true;
                        unique.push(rec);
                    }
                } else if (!catalog[name]) {
                    unique.push(rec);
                    catalog[name] = {};
                    catalog[name][member] = {};
                    catalog[name][member][type] = true;
                } else if (!catalog[name][member]) {
                    unique.push(rec);
                    catalog[name][member] = {};
                    catalog[name][member][type] = true;
                } else if (!catalog[name][member][type]) {
                    unique.push(rec);
                    catalog[name][member][type] = true;
                }
            });

            DocsApp.appMeta.apiSearchRecords = unique;
        }

        // NEXT WE'LL FOCUS ON THE GUIDE SEARCH STUFF
        if (hasGuides) {
            re = new RegExp(value.replace('$', '\\$').replace(/"/g, ''), 'i');

            ExtL.each(DocsApp.guideSearch, function (results) {
                ExtL.each(results.searchWords, function (key, val) {
                    match = key.match(re);
                    if (match) {
                        ExtL.each(val, function (item) {
                            item.guide = results.searchRef[item.r];
                            if (value === item.m) {
                                item.priority = 1;
                            } else if (item.m.toLowerCase().indexOf(value.toLowerCase()) === 0) {
                                item.priority = 0;
                            } else {
                                item.priority = -1;
                            }
                            item.searchUrls = results.searchUrls;
                            item.prod = results.prod;
                            item.version = results.version;
                            hits.push(item);
                        });
                    }
                });
            });

            DocsApp.appMeta.guideSearchRecords = DocsApp.prepareGuideSearchRecords(hits);  // save this up so it can be used ad hoc
        }
        DocsApp.showSearchResults(1);
    }, 120);

    /**
     *
     */
    DocsApp.showSearchHistory = function (e) {
        var target = DocsApp.getEventTarget(e),
            value  = target && target.value,
            panel, field, fieldBox;

        if (target && target !== document && !value.length && DocsApp.appMeta.searchHistory && DocsApp.appMeta.searchHistory.length) {
            panel = ExtL.get('search-history-panel');
            ExtL.removeChildNodes(panel);

            ExtL.each(DocsApp.appMeta.searchHistory.reverse(), function (item) {
                panel.appendChild(ExtL.createElement({
                    "class": 'search-history-item',
                    html: item,
                    "data-value": item
                }));
            });
            DocsApp.appMeta.searchHistory.reverse();

            field = target;
            fieldBox = field.getBoundingClientRect();

            ExtL.addCls(document.body, 'show-search-history');

            ExtL.applyStyles(panel, {
                top   : fieldBox.bottom + 'px',
                width : (fieldBox.right - fieldBox.left) + 'px',
                left  : fieldBox.left + 'px'
            });
        }
    };

    /**
     *
     */
    DocsApp.hideSearchHistory = function () {
        ExtL.removeCls(document.body, 'show-search-history');
    };

    /**
     *
     */
    DocsApp.onSearchHistoryClick = function (e) {
        e = DocsApp.getEvent(e);

        var target = DocsApp.getEventTarget(e),
            field  = ExtL.get('searchtext');

        if (target) {
            field.value = target.getAttribute('data-value');
            DocsApp.stopEvent(e);
            DocsApp.hideSearchHistory();
            DocsApp.searchFilter();
            field.focus();
        }
    };

    /**
     *
     */
    DocsApp.filterSearchByToolkit = function (e) {
        var mButton     = ExtL.get('modern-search-filter'),
            cButton     = ExtL.get('classic-search-filter'),
            searchField = ExtL.get('searchtext'),
            target      = [];

        if (ExtL.isString(e)) {
            if (e === 'both') {
                target.push(mButton, cButton);
            } else {
                target.push(e === 'modern' ? mButton : cButton);
            }
            ExtL.removeCls(mButton, 'active');
            ExtL.removeCls(cButton, 'active');
            ExtL.each(target, function (btn) {
                ExtL.addCls(btn, 'active');
            });
        } else {
            target = DocsApp.getEventTarget(e);
            if (ExtL.hasCls(mButton, 'active') && ExtL.hasCls(cButton, 'active')) {
                ExtL.removeCls(target, 'active');
            } else {
                ExtL.addCls(target, 'active');
            }
        }

        DocsApp.saveState();
        if (searchField && searchField.value.length) {
            DocsApp.searchFilter();
        }

        // save state
        // re-run filter (if the search field is populated)
    };

    DocsApp.prepareGuideSearchRecords = function (hits) {
        if (hits.length) {
            hits.sort(function (a, b) {
                var aType      = a.t,
                    bType      = b.t,
                    aFrequency = a.p,
                    bFrequency = b.p,
                    aPriority  = a.priority,
                    bPriority  = b.priority;

                if (aType === 'b' && bType === 't') {
                    return 1;
                } else if (aType === 't' && bType === 'b') {
                    return -1;
                } else {
                    if (aPriority < bPriority) {
                        return 1;
                    } else if (aPriority > bPriority) {
                        return -1;
                    } else {
                        if (aFrequency < bFrequency) {
                            return 1;
                        } else if (aFrequency > bFrequency) {
                            return -1;
                        } else {
                            return 0;
                        }
                    }
                }
            });
        }

        return hits;
    };

    DocsApp.typesDisplay = {
        c  : 'config',
        p  : 'property',
        sp : 'property',
        m  : 'method',
        sm : 'method',
        e  : 'event',
        v  : 'css var',
        x  : 'css mixin',
        z  : 'mixin param'
    };

    DocsApp.prepareApiSearchRecords = function (results) {
        // BELOW IS THE SORTING ORDER

        //exact xtype                           5 -
        //exact classname (public)              10 -
        //exact configs (public)                15 -
        //exact configs (protected)             20 -
        //exact properties (public)             25 -
        //exact properties (protected)          30 -
        //exact methods (public)                35 -
        //exact methods (protected)             40 -
        //exact events (public)                 45 -
        //exact events (protected)              50 -
        //exact css vars (public)               55 -
        //exact css vars (protected)            60 -
        //exact css mixins (public)             65 -
        //exact css mixins (protected)          70 -

        //begins with xtype: alias              100 -
        //begins with classname (public)        200 -
        //begins with configs (public)          300 -
        //begins with configs (protected)       400 -
        //begins with properties (public)       500 -
        //begins with properties (protected)    600 -
        //begins with methods (public)          700 -
        //begins with methods (protected)       800 -
        //begins with events (public)           900 -
        //begins with events (protected)        1000 -
        //begins with css vars (public)         1100 -
        //begins with css vars (protected)      1200 -
        //begins with css mixins (public)       1300 -
        //begins with css mixins (protected)    1400 -

        //has xtype: alias                      1500 -
        //has classname (public)                1600 -
        //has configs (public)                  1700 -
        //has configs (protected)               1800 -
        //has properties (public)               1900 -
        //has properties (protected)            2000 -
        //has methods (public)                  2100 -
        //has methods (protected)               2200 -
        //has events (public)                   2300 -
        //has events (protected)                2400 -
        //has css vars (public)                 2500 -
        //has css vars (protected)              2600 -
        //has css mixins (public)               2700 -
        //has css mixins (protected)            2800 -

        //exact classname (private)             2805 -
        //exact configs (private)               2810 -
        //exact properties (private)            2815 -
        //exact methods (private)               2820 -
        //exact events (private)                2825 -
        //exact css vars (private)              2830 -
        //exact css mixins (private)            2835 -

        //begins with classname (private)       2900 -
        //begins with configs (private)         3000 -
        //begins with properties (private)      3100 -
        //begins with methods (private)         3200 -
        //begins with events (private)          3300 -
        //begins with css vars (private)        3400 -
        //begins with css mixins (private)      3500 -

        //has classname (private)               3600 -
        //has configs (private)                 3700 -
        //has properties (private)              3800 -
        //has methods (private)                 3900 -
        //has events (private)                  4000 -
        //has css vars (private)                4100 -
        //has css mixins (private)              4200 -

        var len = results.length;

        //ExtL.each(results, function (item) {
        while (len--) {
            var item = results[len],
                searchMatch = item.searchMatch,
                searchValue = item.searchValue,
                valueRegex  = new RegExp(searchValue, 'i'),
                classObj    = item.classObj,
                aliases     = item.classObj.x,
                typesDisp   = DocsApp.typesDisplay,
                i, aliasPre, aliasPost, member, memberType, memberName, access,
                targetClassName, classSuffix, types, meta;

            types = {
                c  : 'cfg',
                p  : 'property',
                sp : 'property',
                m  : 'method',
                sm : 'static-method',
                e  : 'event',
                v  : 'css_var-S',
                x  : 'css_mixin',
                z  : 'css_mixin'
            };

            /*typesDisp = {
                c  : 'config',
                p  : 'property',
                sp : 'property',
                m  : 'method',
                sm : 'method',
                e  : 'event',
                v  : 'css var',
                x  : 'css mixin',
                z  : 'mixin param'
            };*/

            meta = {
                r  : 'removed',
                d  : 'deprecated',
                s  : 'static',
                ro : 'readonly'
            };

            // prioritize alias/xtype
            if (aliases && aliases.indexOf(searchMatch) > -1) {
                var aliasesLen = aliases.length;

                while (aliasesLen--) {
                //ExtL.each(aliases, function (alias) {
                    var alias = aliases[aliasesLen];
                    i         = alias.indexOf('.');
                    aliasPre  = alias.substring(0, i);
                    aliasPost = alias.substr(i + 1);

                    if (searchMatch === alias) {
                        item.byAlias   = true;
                        item.alias     = alias;
                        item.aliasPre  = aliasPre;
                        item.aliasPost = item.sortValue = aliasPost;
                        item.access    = classObj.a === 'i' ? 'private' : 'public';

                        if (searchValue.toLowerCase() === aliasPost.toLowerCase()) {
                            item.priority = 5;
                        } else {
                            item.priority = (aliasPost.search(valueRegex) === 0) ? 100 : 1500;
                        }
                    }
                };
            }

            // prioritize class / alternate class
            else if (searchMatch === classObj.n || (classObj.g && classObj.g.indexOf(searchMatch) > -1)) {
                item.byClass    = true;
                targetClassName = (searchMatch === classObj.n) ? classObj.n : searchMatch;
                classSuffix     = targetClassName.substr(targetClassName.lastIndexOf('.') + 1);
                item.sortValue  = classSuffix;
                item.access     = classObj.a === 'i' ? 'private' : 'public';
                if (classSuffix.toLowerCase() === searchValue.toLowerCase()) {
                    item.priority = (classObj.a) ? 2805 : 10;
                }
                else if (classSuffix.search(valueRegex) === 0) {
                    item.priority = (classObj.a) ? 2900 : 200;
                } else {
                    item.priority = (classObj.a) ? 3600 : 1600;
                }
            }

            // prioritize members
            else {
                item.byClassMember = true;
                // regarding the below replace()..
                // The search list has entries for class + member searches, but really the member
                // is the member only, not the concatenation of class name and member name
                member     = searchMatch.replace(classObj.n + '.', '');
                i          = member.indexOf('.');
                memberType = member.substring(0, i);
                memberName = item.sortValue = member.substr(i + 1);

                memberObj           = classObj[member];
                access              = memberObj.a;
                item.access         = access === 'p' ? 'public' : (access === 'i' ? 'private' : 'protected');
                item.memberType     = types[memberType];
                item.memberTypeDisp = typesDisp[memberType];

                if (memberObj.x) {
                    item.meta = meta[memberObj.x];
                }

                // note regarding member type, the member's prefix maps as follows:
                //  - c  : configs
                //  - p  : properties
                //  - sp : static properties
                //  - m  : methods
                //  - sm : static methods
                //  - e  : events
                //  - v  : css vars
                //  - x  : css mixins
                //  - z  : css mixin param
                // note regarding access, the member's 'a' value maps as follows:
                //  - p : public
                //  - o : protected
                //  - i : private

                // prioritize "begins with"
                if (memberName.toLowerCase() === searchValue.toLowerCase()) {
                    // configs
                    if (memberType === 'c') {
                        item.priority = (access === 'p') ? 15 : ((access === 'o') ? 20 : 2810 );
                    }
                    // properties
                    if (memberType === 'p' || memberType === 'sp') {
                        item.priority = (access === 'p') ? 25 : ((access === 'o') ? 30 : 2815 );
                    }
                    // methods
                    if (memberType === 'm' || memberType === 'sm') {
                        item.priority = (access === 'p') ? 35 : ((access === 'o') ? 40 : 2820 );
                    }
                    // events
                    if (memberType === 'e') {
                        item.priority = (access === 'p') ? 45 : ((access === 'o') ? 50 : 2825 );
                    }
                    // css vars
                    if (memberType === 'v') {
                        item.priority = (access === 'p') ? 55 : ((access === 'o') ? 60 : 2830 );
                    }
                    // css mixins
                    if (memberType === 'x') {
                        item.priority = (access === 'p') ? 65 : ((access === 'o') ? 70 : 2835 );
                    }
                }
                else if (memberName.search(valueRegex) === 0) {
                    // configs
                    if (memberType === 'c') {
                        item.priority = (access === 'p') ? 300 : ((access === 'o') ? 400 : 3000 );
                    }
                    // properties
                    if (memberType === 'p' || memberType === 'sp') {
                        item.priority = (access === 'p') ? 500 : ((access === 'o') ? 600 : 3100 );
                    }
                    // methods
                    if (memberType === 'm' || memberType === 'sm') {
                        item.priority = (access === 'p') ? 700 : ((access === 'o') ? 800 : 3200 );
                    }
                    // events
                    if (memberType === 'e') {
                        item.priority = (access === 'p') ? 900 : ((access === 'o') ? 1000 : 3300 );
                    }
                    // css vars
                    if (memberType === 'v') {
                        item.priority = (access === 'p') ? 1100 : ((access === 'o') ? 1200 : 3400 );
                    }
                    // css mixins
                    if (memberType === 'x') {
                        item.priority = (access === 'p') ? 1300 : ((access === 'o') ? 1400 : 3500 );
                    }
                } else { // then has
                    // configs
                    if (memberType === 'c') {
                        item.priority = (access === 'p') ? 1700 : ((access === 'o') ? 1800 : 3700 );
                    }
                    // properties
                    if (memberType === 'p' || memberType === 'sp') {
                        item.priority = (access === 'p') ? 1900 : ((access === 'o') ? 2000 : 3800 );
                    }
                    // methods
                    if (memberType === 'm' || memberType === 'sm') {
                        item.priority = (access === 'p') ? 2100 : ((access === 'o') ? 2200 : 3900 );
                    }
                    // events
                    if (memberType === 'e') {
                        item.priority = (access === 'p') ? 2300 : ((access === 'o') ? 2400 : 4000 );
                    }
                    // css vars
                    if (memberType === 'v') {
                        item.priority = (access === 'p') ? 2500 : ((access === 'o') ? 2600 : 4100 );
                    }
                    // css mixins
                    if (memberType === 'x') {
                        item.priority = (access === 'p') ? 2700 : ((access === 'o') ? 2800 : 4200 );
                    }
                }
            }
        };

        return DocsApp.sortSearchItems(results);
    };

    DocsApp.sortSearchItems = function (items) {
        return items.sort(function (a, b) {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            } else {
                if (a.sortValue < b.sortValue) {
                    return -1;
                } else if (a.sortValue > b.sortValue) {
                    return 1;
                } else {
                    if (a.classObj.n < b.classObj.n) {
                        return -1;
                    } else if (a.classObj.n > b.classObj.n) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            }
        });
    };

    DocsApp.getSearchResultsCt = function () {
        var ct        = ExtL.get('search-results-ct'),
            hasApi    = DocsApp.meta.hasApi,
            hasGuides = DocsApp.meta.hasGuides,
            cn;

        if (!ct) {
            if (hasApi || hasGuides) {
                cn = [];
            }
            if (hasGuides) {
                cn.push({
                    id: 'guide-search-results',
                    "class": 'isHidden'
                });
            }
            if (hasApi) {
                cn.push({
                    id: 'api-search-results'
                });
            }
            ct = ExtL.createElement({
                tag: 'span',
                id: 'search-results-ct',
                cn: cn
            });
            document.body.appendChild(ct);
        }

        return ct;
    };

    DocsApp.showSearchResults = function (page) {
        var ct         = DocsApp.getSearchResultsCt(),
            size       = DocsApp.getViewportSize(),
            compressed = size.width <= 950,
            posRef, boundingBox, top, right;

        posRef      = compressed ? document.querySelector('.context-menu-ct') : ExtL.get('searchtext');
        boundingBox = posRef.getBoundingClientRect();
        top         = compressed ? (boundingBox.top + 32) : (boundingBox.top + posRef.clientHeight);
        right       = compressed ? 0 : (document.body.clientWidth - boundingBox.right);

        ct.style.right = right.toString() + 'px';
        ct.style.top   = top.toString() + 'px';

        DocsApp.sizeSearchResultsCt();

        ExtL.addCls(ct, 'show-search-results');

        if (page && DocsApp.meta.hasApi) {
            DocsApp.loadApiSearchPage(page);
        }

        if (page && DocsApp.meta.hasGuides) {
            DocsApp.loadGuideSearchPage(page);
        }
    };

    DocsApp.sizeSearchResultsCt = function () {
        var searchCt = DocsApp.getSearchResultsCt(),
            size     = DocsApp.getViewportSize(),
            vpHeight = size.height,
            h        = (vpHeight < 509) ? (vpHeight - 58) : 451;

            searchCt.style.height = h.toString() + 'px';
    };

    DocsApp.loadGuideSearchPage = function (page) {
        var i                  = 0,
            start              = page * DocsApp.appMeta.pageSize - DocsApp.appMeta.pageSize,
            value              = ExtL.get('searchtext').value,
            guideCt            = ExtL.get('guide-search-results'),
            homePath           = DocsApp.meta.rootPath,
            guideSearchRecords = DocsApp.appMeta.guideSearchRecords,
            len                = DocsApp.appMeta.pageSize < guideSearchRecords.length ? DocsApp.appMeta.pageSize : guideSearchRecords.length,
            matchEl, item, cn, href, badge;

        page  = page || 1;
        value = ExtL.trim(value).toLowerCase();
        value = value.replace('$', '\\$');

        ExtL.removeChildNodes(guideCt);

        guideCt.appendChild(ExtL.createElement({
            "class" : 'search-results-nav-header',
            cn      : [{
                html : 'API Docs'
            }, {
                "class" : 'active-tab',
                html    : 'Guides'
            }]
        }));

        guideCt.appendChild(ExtL.createElement({
            "class" : 'search-results-header',
            html    : 'Guides'
        }));

        for (;i < len; i++) {
            item = guideSearchRecords[start + i];
            if (item) {
                badge = ExtL.isIE8() ? '' : ' ' + item.prod + '-badge badge';
                cn = [{
                    "class" : 'guide-search-title',
                    html    : item.guide
                }];

                if (item.t === 'b') {
                    cn.push({
                        "class" : 'search-match',
                        html    : item.m
                    });
                }

                if (DocsApp.meta.product !== 'cmd' && item.prod === 'cmd') {
                    href = DocsApp.meta.rootPath  + '../../' + item.prod + '/' + item.searchUrls[item.r];
                } else {
                    href = DocsApp.meta.rootPath + item.searchUrls[item.r];
                }

                guideCt.appendChild(ExtL.createElement({
                    tag     : 'a',
                    href    : href,
                    "class" : 'guide-search-item' + (item.t === 'b' ? ' body-result-item' : '') + badge,
                    cn      : cn
                }));
            }
        }

        DocsApp.addSearchPagingToolbar(guideCt, guideSearchRecords, page);

        re  = new RegExp('(' + value.replace('$', '\\$').replace(/"/g, '') + ')', 'ig');
        len = guideCt.childNodes.length;
        for (i = 0; i < len; i++) {
            var isBody = ExtL.hasCls(guideCt.childNodes.item(i), 'body-result-item');
            matchEl    = guideCt.childNodes.item(i).querySelector(isBody ? '.search-match' : '.guide-search-title');

            if (matchEl) {
                matchEl.innerHTML = (matchEl.textContent || matchEl.innerText).replace(re, '<strong>$1</strong>');
            }
        }
    };

    DocsApp.getRelativePath = function (curl) {
        var regex      = new RegExp('.*guides\/(.*?)\.html'),
            guideMatch = regex.exec(curl)[1],
            slashCount = guideMatch.split("/"),
            rel        = '',
            i;

        if (slashCount.length > 0) {
            for (i = 0; i < slashCount.length; i++) {
                rel = '../' + rel;
            }
        }

        return rel;
    };

    /**
     *
     */
    DocsApp.getSearchClassName = function (rec) {
        return rec.classObj.n;
    };

    DocsApp.loadApiSearchPage = function(page) {
        var i                = 0,
            pageSize         = DocsApp.appMeta.pageSize,
            start            = page * pageSize - pageSize,
            apiSearchRecords = DocsApp.appMeta.apiSearchRecords,
            ct               = DocsApp.getSearchResultsCt(),
            apiCt            = ExtL.get('api-search-results'),
            value            = ExtL.get('searchtext').value,
            rec, access, el, cn, re, matchEl, href, meta;

        page = page || 1;

        value = ExtL.trim(value).toLowerCase();
        value = value.replace('$', '\\$');

        ExtL.removeChildNodes(apiCt);

        apiCt.appendChild(ExtL.createElement({
            "class" : 'search-results-nav-header',
            cn      : [{
                "class" : 'active-tab',
                html    : 'API Docs'
            }, {
                html : 'Guides'
            }]
        }));

        apiCt.appendChild(ExtL.createElement({
            "class" : 'search-results-header',
            html    : 'API Docs'
        }));

        for (;i < pageSize; i++) {
            rec = apiSearchRecords[start + i];

            if (rec) {
                cn = [{
                    "class" : 'search-match',
                    html    : rec.sortValue
                }, {
                    "class" : 'search-source',
                    //html    : rec.classObj.n + (rec.byClassMember ? ('.' + rec.sortValue) : '')
                    //html    : DocsApp.getSearchClassName(rec) + (rec.byClassMember ? ('.' + rec.sortValue) : '')
                    html    : rec.classObj.d + (rec.byClassMember ? ('.' + rec.sortValue) : '')
                }];

                access = rec.access;

                meta = [{
                    "class" : 'meta-access',
                    html    : access === 'private' ? 'private' : (access === 'protected' ? 'protected' : 'public')
                }, {
                    "class" : 'meta-type',
                    html    : rec.byAlias ? 'alias' : (rec.byClass ? 'class' : rec.memberTypeDisp)
                }];

                if (rec.byClassMember && rec.meta) {
                    meta.push({
                        "class" : 'meta-meta ' + rec.meta,
                        html    : rec.meta
                    });
                }

                cn.push({
                    "class" : (access === 'private' ? 'private' : (access === 'protected' ? 'protected' : 'public')) + ' search-item-meta-ct',
                    cn      : meta
                });

                href = rec.classObj.n + '.html';
                //href = rec.classObj.on + '.html';
                href = DocsApp.meta.rootPath + (rec.classObj.t || 'api') + '/' + href;

                if (rec.byClassMember) {
                    if (rec.searchMatch[0] === 'z') {
                        // regarding the below replace()..
                        // The search list has entries for class + member searches, but really the member
                        // is the member only, not the concatenation of class name and member name
                        href += '#' + rec.memberType + '-' + rec.classObj[rec.searchMatch.replace(rec.classObj.n + '.', '')].t + '--' + rec.sortValue;
                    } else {
                        href += '#' + rec.memberType + '-' + rec.sortValue;
                    }
                }

                el = ExtL.createElement({
                    tag     : 'a',
                    href    : href,
                    "class" : 'search-item' + (rec.classObj.t ? ' ' + rec.classObj.t : ''),
                    cn      : cn
                });

                apiCt.appendChild(el);
            }
        }

        DocsApp.addSearchPagingToolbar(apiCt, apiSearchRecords, page);

        re = new RegExp('(' + value.replace('$', '\\$').replace(/"/g, '') + ')', 'ig');

        for (i = 0; i < apiCt.childNodes.length; i++) {
            matchEl  = apiCt.childNodes.item(i).querySelector('.search-match');
            matchSrc = apiCt.childNodes.item(i).querySelector('.search-source');

            if (matchEl) {
                matchEl.innerHTML = (matchEl.textContent || matchEl.innerText).replace(re, '<strong>$1</strong>');
            }
            if (matchSrc) {
                matchSrc.innerHTML = (matchSrc.textContent || matchSrc.innerText).replace(re, '<strong>$1</strong>');
            }
        }
    };

    DocsApp.addSearchPagingToolbar = function(ct, records, page) {
        var isApi       = ct.id === 'api-search-results',
            rowCount    = ct.querySelectorAll(isApi ? '.search-item' : '.guide-search-item').length,
            pageSize    = DocsApp.appMeta.pageSize,
            recordCount = records.length,
            pageEnd     = (pageSize * page),
            useCount    = pageEnd > recordCount,
            endCount    = useCount ? recordCount : pageEnd;

        if (rowCount) {
            // check to see if we have more results than we can display with the results
            // page size and if so add a nav footer with the current page / count
            if (records.length > pageSize) {
                ct.appendChild(ExtL.createElement({
                    "class" : 'search-results-nav',
                    html    : (pageEnd - pageSize + 1) + ' - ' + endCount + ' of ' + recordCount,
                    cn      : [{
                        "class" : 'search-nav-first' + ((page === 1) ? ' disabled' : ''),
                        html    : '«'
                    }, {
                        "class" : 'search-nav-back' + ((page === 1) ? ' disabled' : ''),
                        html    : '◄'
                    }, {
                        "class" : 'search-nav-forward' + ((recordCount <= pageEnd) ? ' disabled' : ''),
                        html    : '►'
                    }, {
                        "class" : 'search-nav-last' + ((recordCount <= pageEnd) ? ' disabled' : ''),
                        html    : '»'
                    }]
                }));
            }
            if (isApi) {
                DocsApp.appMeta.currentApiPage = page;
            } else {
                DocsApp.appMeta.currentGuidePage = page;
            }
        } else {
            ct.appendChild(ExtL.createElement({
                "class" : 'search-results-nav-header',
                cn      : [{
                    "class" : isApi ? 'active-tab no-results' : null,
                    html    : 'API Docs'
                }, {
                    "class" : !isApi ? 'active-tab no-results' : null,
                    html    : 'Guides'
                }]
            }));

            ct.appendChild(ExtL.createElement({
                "class" : 'search-results-not-found',
                html    : 'No results found'
            }));

            DocsApp.currentApiPage   = null;
            DocsApp.currentGuidePage = null;
        }
    };

    DocsApp.hideSearchResults = function () {
        if (ExtL.hasCls(DocsApp.getSearchResultsCt(), 'show-search-results')) {
            DocsApp.hideMobileSearch();
        }
        ExtL.removeCls(DocsApp.getSearchResultsCt(), 'show-search-results');
    };

    DocsApp.hideMobileSearch = function () {
        var input = ExtL.get('peekaboo-input');
        input.style.visibility = 'hidden';
    };

    DocsApp.onBodyClick = function (e) {
        var target               = DocsApp.getEventTarget(e),
            searchText           = ExtL.get('searchtext'),
            isSearchInput        = target.id === 'searchtext',
            isSearchNav          = ExtL.up(target, '.search-results-nav-header'),
            isPagingNav          = ExtL.up(target, '.search-results-nav'),
            isProductMenu        = ExtL.up(target, '#product-tree-ct'),
            isHistoryConfigPanel = ExtL.up(target, '#historyConfigPanel'),
            isMultiSrcBtn        = ExtL.hasCls(target, 'multi-src-btn'),
            productMenu          = ExtL.get('product-tree-ct'),
            rightMembers         = ExtL.get('rightMembers'),
            treeVis              = ExtL.hasCls(document.body, 'tree-hidden'),
            width                = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

        if (target.id !== 'classic-search-filter' && target.id !== 'modern-search-filter' && target.id != 'searchtext' && !isSearchNav && !isPagingNav) {
            DocsApp.hideSearchResults();
        } else {
            if (DocsApp.getSearchResultsCt().childNodes.length && searchText.value.length > 0) {
                DocsApp.showSearchResults();
            }
        }

        if (ExtL.hasCls(target, 'member-name') || ExtL.hasCls(target, 'collapse-toggle') || ExtL.hasCls(target.parentNode, 'collapse-toggle')) {
            if (!ExtL.hasCls(target, 'collapse-toggle') && ExtL.hasCls(target.parentNode, 'collapse-toggle')) {
                target = target.parentNode;
            }
            if (ExtL.hasCls(target, 'member-name')) {
                target = ExtL.up(target, '.classmembers').querySelector('.collapse-toggle');
            }
            DocsApp.onMemberCollapseToggleClick(target);
        }

        if (ExtL.hasCls(rightMembers, 'show-context-menu')) {
            if (!ExtL.hasCls(target, 'fa-cog') && !ExtL.hasCls(target, 'context-menu-ct') && !ExtL.up(target, '.context-menu-ct')) {
                ExtL.toggleCls(rightMembers, 'show-context-menu');
            }
        }

        if (!treeVis && width < 950 && !isProductMenu) {
            if (!ExtL.hasCls(target, 'fa-bars') && !ExtL.hasCls(target, 'class-tree') && !ExtL.up(target, '.class-tree')) {
                DocsApp.setTreeVisibility(false);
            }
        }

        if (!isProductMenu && !ExtL.hasCls(productMenu, 'hide')) {
            DocsApp.hideProductMenu();
        }

        if (!isHistoryConfigPanel && ExtL.hasCls(document.body, 'show-history-panel')) {
            DocsApp.hideHistoryConfigPanel();
        }

        if (!isSearchInput && ExtL.hasCls(document.body, 'show-search-history')) {
            DocsApp.hideSearchHistory();
        }

        if (!isMultiSrcBtn) {
            DocsApp.hideMultiSrcPanel();
        }
    };

    DocsApp.onMobileInputBlur = function (e) {
        var target   = e.relatedTarget,
            node     = target,
            search   = 'search-results-ct',
            isResult = false;

        while (node) {
            if (node.id===search) {
                isResult = true;
                break;
            }
            else {
                isResult = false;
            }

            node = node.parentNode;
        }

        if (!isResult) {
            DocsApp.hideMobileSearch();
        }
    };

    DocsApp.onSearchEnter = function () {
        var ct    = DocsApp.getSearchResultsCt(),
            first = ct.querySelector('.search-item');

        if (first) {
            DocsApp.doLogSearchValue();
            window.location.href = first.href;
            return false;
        }
    };

    DocsApp.onSearchTab = function () {
        var ct    = DocsApp.getSearchResultsCt(),
            first = ct.querySelector('.search-item');

        if (first) {
            first.focus();
        }
    };

    /**
     *
     */
    DocsApp.onResultsCtClick = function (e) {
        var apiSearchRecords = DocsApp.appMeta.apiSearchRecords,
            pageSize         = DocsApp.appMeta.pageSize,
            target, counter, item;

        e       = DocsApp.getEvent(e);
        target  = DocsApp.getEventTarget(e);
        counter = ExtL.up(target, '#api-search-results') ? DocsApp.appMeta.currentApiPage : DocsApp.appMeta.currentGuidePage;
        item    = ExtL.up(target, '.search-item');

        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (ExtL.hasCls(target, 'search-nav-first') && !ExtL.hasCls(target, 'disabled')) {
            if (ExtL.up(target, '#api-search-results')) {
                DocsApp.loadApiSearchPage(1);
            }
            if (ExtL.up(target, '#guide-search-results')) {
                DocsApp.loadGuideSearchPage(1);
            }
        } else if (ExtL.hasCls(target, 'search-nav-back') && !ExtL.hasCls(target, 'disabled')) {
            if (ExtL.up(target, '#api-search-results')) {
                DocsApp.loadApiSearchPage(counter - 1);
            }
            if (ExtL.up(target, '#guide-search-results')) {
                DocsApp.loadGuideSearchPage(counter - 1);
            }
        } else if (ExtL.hasCls(target, 'search-nav-forward') && !ExtL.hasCls(target, 'disabled')) {
            if (ExtL.up(target, '#api-search-results')) {
                DocsApp.loadApiSearchPage(counter + 1);
            }
            if (ExtL.up(target, '#guide-search-results')) {
                DocsApp.loadGuideSearchPage(counter + 1);
            }
        } else if (ExtL.hasCls(target, 'search-nav-last') && !ExtL.hasCls(target, 'disabled')) {
            if (ExtL.up(target, '#api-search-results')) {
                DocsApp.loadApiSearchPage(Math.ceil(apiSearchRecords.length / pageSize));
            }
            if (ExtL.up(target, '#guide-search-results')) {
                DocsApp.loadGuideSearchPage(Math.ceil(apiSearchRecords.length / pageSize));
            }
        } else if (ExtL.up(target, '.search-results-nav-header')) {
            DocsApp.toggleSearchTabs(e);
        } else if (item) {
            if (window.location.href === item.href) {
                DocsApp.onHashChange(true);
            }
            DocsApp.hideSearchResults();
            DocsApp.doLogSearchValue();
        }
    };

    /**
     * Returns the vertical scroll position of the page
     */
    DocsApp.getScrollPosition = function () {
        var verticalPosition = 0,
            ieOffset         = document.documentElement.scrollTop,
            target;

        if (DocsApp.meta.pageType === 'api') {
            target = document.querySelector('.class-body-wrap');
        } else if (DocsApp.meta.pageType === 'guide') {
            target = document.querySelector('.guide-body-wrap');
        } else {
            target = document.querySelector('.generic-content');
        }

        if (window.pageYOffset) {
            verticalPosition = window.pageYOffset;
        } else if (target.clientHeight) { //ie
            verticalPosition = target.scrollTop;
        } else if (document.body) { //ie quirks
            verticalPosition = target.scrollTop;
        }else {
            verticalPosition = ieOffset;
        }

        return verticalPosition;
    };

    /**
     * Listen to the scroll event and show / hide the "scroll to top" element
     * depending on the current scroll position
     */
    DocsApp.monitorScrollToTop = function () {
        var vertical_position = DocsApp.getScrollPosition();

        ExtL.toggleCls(ExtL.get('back-to-top'), 'sticky', vertical_position > 345);
        ExtL.toggleCls(document.body, 'sticky', vertical_position > 345);
    };

    /**
     * Highlight the member nav button in the top nav toolbar when that section is
     * scrolled up against the top nav toolbar
     */
    DocsApp.highlightTypeMenuItem = function () {
        var memberTypesEl     = ExtL.get('toolbar'),
            memberTypeButtons = memberTypesEl.querySelectorAll('div.toolbarButton'),
            memberTypeLen     = memberTypeButtons.length,
            memberTypesBottom = memberTypesEl.getBoundingClientRect().bottom,
            typeHeaders       = document.querySelectorAll('h2.type'),
            len               = typeHeaders.length,
            activeCls         = 'active-type-menu-item',
            i                 = 0,
            item, itemTop, activeItem, activeButtonEl;

        // find the active type header by whichever scrolled above the nav header last
        for (; i < len; i++) {
            item    = typeHeaders.item(i);
            itemTop = item.getBoundingClientRect().top;

            if (item.offsetHeight && (itemTop < memberTypesBottom + 7)) {
                activeItem = item;
            }
        }

        // remove the activeCls from all nav buttons
        i = 0;
        for (; i < memberTypeLen; i++) {
            ExtL.removeCls(ExtL.up(memberTypeButtons.item(i), 'a'), activeCls);
        }
        // and then decorate the active one
        if (activeItem) {
            activeButtonEl = ExtL.get(activeItem.id + '-button-link');
            ExtL.addCls(activeButtonEl, activeCls);
        }
    };

    /**
     * @private
     */
    /*DocsApp.createWrapper = function (ct, selector, id, title) {
        var items = ct.querySelectorAll(selector),
            wrap, header, textEl, i, len;

        len = items.length;
        if (len) {
            wrap = document.createElement('div');
            wrap.id = id;
            header = document.createElement('div');
            header.className = 'type-sub-category-title';
            textEl = document.createTextNode(title);
            header.appendChild(textEl);
            wrap.appendChild(header);
            ct.insertBefore(wrap, items.item(0));

            for (i = 0; i < len; i++) {
                wrap.appendChild(items.item(i));
            }
        }
    }*/

    /**
     *
     */
    /*DocsApp.wrapSubCategories = function () {
        var propertiesCt = ExtL.get('properties-ct'),
            methodsCt    = ExtL.get('methods-ct'),
            configsCt    = ExtL.get('configs-ct');

        if (propertiesCt) {
            createWrapper(propertiesCt, 'div.isNotStatic', 'instance-properties-ct', 'Instance Properties');
            createWrapper(propertiesCt, 'div.isStatic', 'static-properties-ct', 'Static Properties');
        }

        if (methodsCt) {
            createWrapper(methodsCt, 'div.isNotStatic', 'instance-methods-ct', 'Instance Methods');
            createWrapper(methodsCt, 'div.isStatic', 'static-methods-ct', 'Static Methods');
        }

        if (configsCt) {
            createWrapper(configsCt, 'div.isNotRequired', 'optional-configs-ct', 'Optional Configs');
            createWrapper(configsCt, 'div.isRequired', 'required-configs-ct', 'Required Configs');
        }
    }*/


    DocsApp.onClickMemberMenuType = function () {
        DocsApp.toggleMemberTypesMenu();
    };

    /**
     * Toggles visibility of member type menu
     */
    DocsApp.toggleMemberTypesMenu = function () {
        var menu    = ExtL.get('member-types-menu'),
            showCls = 'menu-visible',
            hasCls  = ExtL.hasCls(menu, showCls);

        ExtL[hasCls ? 'removeCls' : 'addCls'](menu, showCls);
    };

    /**
     * Apply an ace editor to all elements with the 'ace-ct' class designation.
     */
    DocsApp.applyAceEditors = function () {
        var aceTargets      = document.getElementsByClassName('ace-ct'),
            len             = aceTargets.length,
            runButtons      = document.getElementsByClassName('da-inline-fiddle-nav-fiddle'),
            buttonsLen      = runButtons.length,
            codeButtons     = document.getElementsByClassName('da-inline-fiddle-nav-code'),
            beautifyButtons = ExtL.fromNodeList(document.getElementsByClassName('fiddle-code-beautify')),
            invisibles      = document.getElementsByClassName('invisible'),
            codeBtnsLen     = codeButtons.length,
            i               = 0,
            editor;

        for (; i < len; i++) {
            editor = ace.edit(aceTargets[i]);
            editor.setTheme("ace/theme/chrome");
            //editor.getSession().setMode("ace/mode/javascript");
            editor.getSession().setMode("ace/mode/jsx");
            if (ExtL.isIE8() || ExtL.isIE9()) {
                editor.getSession().setOption("useWorker", false);
            }
            editor.setShowPrintMargin(false);
        }

        for (i = 0; i < buttonsLen; i++) {
            runButtons[i].onclick = DocsApp.onRunFiddleClick;
        }

        for (i = 0; i < codeBtnsLen; i++) {
            codeButtons[i].onclick = DocsApp.onCodeFiddleClick;
        }

        ExtL.each(beautifyButtons, function (btn) {
            btn.onclick = DocsApp.onBeautifyClick;
        });

        for (i = invisibles.length; i-- > 0;) {
            ExtL.removeCls(invisibles[i], 'invisible');
        }

        if (ExtL.isIE8()) {
            ExtL.each(ExtL.fromNodeList(aceTargets), function (ct) {
                var editor     = ace.edit(ct),
                    beautified = js_beautify(editor.getValue(), {
                        e4x : true
                    });

                editor.setValue(beautified.toString(), -1);
            });
        }
    };

    /**
     * Run fiddle button handler
     * @param {Event} e The click event
     */
    DocsApp.onRunFiddleClick = function(e) {
        var fiddle = DocsApp.getEventTarget(e),
            wrap   = ExtL.up(fiddle, '.da-inline-code-wrap'),
            editor = ace.edit(wrap.querySelector('.ace-ct').id),
            code   = editor.getValue(),
            cached = wrap.code;

        if (code === cached) {
            // if the fiddle tab's not already active activate it
            if (!ExtL.hasCls(wrap.querySelector('.da-inline-fiddle-nav-fiddle'), 'da-inline-fiddle-nav-active')) {
                DocsApp.showFiddle(wrap);
            } else {
                setTimeout(function () {
                    DocsApp.runFiddleExample(wrap);
                    DocsApp.disableFiddleNav(wrap);
                }, 1);
            }
            return;
        } else {
            wrap.code = code;
        }

        if (wrap && !ExtL.hasCls(wrap, 'disabled')) {
            DocsApp.showFiddle(wrap);
            setTimeout(function () {
                DocsApp.runFiddleExample(wrap);
                DocsApp.disableFiddleNav(wrap);
            }, 1);
        }
    };

    DocsApp.onCodeFiddleClick = function (e) {
        var code     = DocsApp.getEventTarget(e),
            wrap     = ExtL.up(code, '.da-inline-code-wrap'),
            isActive = ExtL.hasCls(code, 'da-inline-fiddle-nav-active');

        if (wrap && !ExtL.hasCls(wrap, 'disabled') && !isActive) {
            DocsApp.hideFiddle(wrap);
        }
    };

    DocsApp.onBeautifyClick = function (e) {
        var code       = DocsApp.getEventTarget(e),
            wrap       = ExtL.up(code, '.da-inline-code-wrap'),
            editor     = ace.edit(wrap.querySelector('.ace-ct').id),
            beautified = js_beautify(editor.getValue(), {
                e4x : true
            });

        editor.setValue(beautified.toString(), -1);
    };

    DocsApp.disableFiddleNav = function (wrap) {
        ExtL.addCls(wrap, 'disabled');
    };

    DocsApp.enableFiddleNav = function (wrap) {
        ExtL.removeCls(wrap, 'disabled');
    };

    DocsApp.showFiddle = function (wrap) {
        var codeNav   = wrap.querySelector('.da-inline-fiddle-nav-code'),
            fiddleNav = wrap.querySelector('.da-inline-fiddle-nav-fiddle');

        ExtL.addCls(wrap, 'show-fiddle');
        ExtL.toggleCls(codeNav, 'da-inline-fiddle-nav-active');
        ExtL.toggleCls(fiddleNav, 'da-inline-fiddle-nav-active');
    };

    DocsApp.hideFiddle = function (wrap) {
        var codeNav   = wrap.querySelector('.da-inline-fiddle-nav-code'),
            fiddleNav = wrap.querySelector('.da-inline-fiddle-nav-fiddle');

        ExtL.removeCls(wrap, 'show-fiddle');
        ExtL.toggleCls(codeNav, 'da-inline-fiddle-nav-active');
        ExtL.toggleCls(fiddleNav, 'da-inline-fiddle-nav-active');
    };

    /**
     * Runs the fiddle example
     * @param {Element} wrap The element housing the fiddle and fiddle code
     */
    DocsApp.runFiddleExample = function (wrap) {
        var editor     = ace.edit(wrap.querySelector('.ace-ct').id),
            meta       = JSON.parse(wrap.getAttribute('data-fiddle-meta')),
            myMeta     = DocsApp.meta,
            actualProd = myMeta.product,
            intro      = actualProd === 'extreact' ? '' : "Ext.application({\n    name: 'Fiddle',\n\n    launch: function() {\n\n",
            outro      = actualProd === 'extreact' ? '' : "}\n});",
            iframe     = DocsApp.getIFrame(wrap),
            pageName   = myMeta.myId,
            toolkit    = myMeta.toolkit,
            version    = myMeta.apiVersion,
            myVer      = version.split('.'),
            majorVer   = parseInt(myVer[0], 10),
            minorVer   = parseInt(myVer[1], 10),
            canPackage = (majorVer >= 6 && minorVer >= 2),
            packages   = meta.packages ? ExtL.from(meta.packages) : [],
            codes      = {
                assets   : [{
                    type   : 'js',
                    name   : 'app.js',
                    code   : intro + editor.getValue() + outro,
                }],
                mockdata : [],
                packages : packages
            },
            data       = {
                framework : meta,
                codes     : codes
            },
            form, mask;
        //data.framework.version = '6.5.0.1111';
        if (toolkit === 'modern') {
            data.codes.assets[0].code = data.codes.assets[0].code.replace(/(renderTo\s*:\s*(?:Ext\.getBody\(\)|document\.body))/, 'fullscreen: true');
        }

        if (pageName.toLowerCase().indexOf('ux') > -1) {
            if (canPackage) {
                packages.push('ux');
            } else {
                data.codes.assets = data.codes.assets.concat([{
                    type   : 'js',
                    name   : 'ux-build.js',
                    code   : toolkit ? 'https://{frameworkPath}/build/packages/ux/' + toolkit + '/ux-debug.js' : 'https://{frameworkPath}/build/packages/ext-ux/build/ext-ux-debug.js',
                    remote : true
                }, {
                    type   : 'css',
                    name   : 'ux-all-debug.css',
                    code   : toolkit ? 'https://{frameworkPath}/build/packages/ux/' + toolkit + '/classic/resources/ux-all-debug.css' : 'https://{frameworkPath}/build/packages/ext-ux/build/classic/resources/ext-ux-all-debug.css',
                    remote : true
                }]);
            }
        } else if (pageName.toLowerCase().indexOf('google') > -1) {
            if (canPackage) {
                packages.push('google');
            } else {
                data.codes.assets = data.codes.assets.concat([{
                    type   : 'js',
                    name   : 'google-build.js',
                    code   : toolkit ? 'https://{frameworkPath}/build/packages/google/' + toolkit + '/google-debug.js' : '',
                    remote : true
                }]);
            }
        } else if (pageName.toLowerCase().indexOf('d3') > -1) {
            if (canPackage) {
                packages.push('d3');
            } else {
                data.codes.assets = data.codes.assets.concat([{
                    type   : 'js',
                    name   : 'd3-build.js',
                    code   : toolkit ? 'https://{frameworkPath}/build/packages/d3/' + toolkit + '/d3-debug.js' : '',
                    remote : true
                }]);

                if (toolkit === 'classic') {
                    data.codes.assets = data.codes.assets.concat([{
                        type   : 'css',
                        name   : 'd3-classic-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/d3/' + toolkit + '/classic/resources/d3-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'd3-crisp-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/d3/' + toolkit + '/crisp/resources/d3-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'd3-neptune-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/d3/' + toolkit + '/neptune/resources/d3-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'd3-triton-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/d3/' + toolkit + '/triton/resources/d3-all-debug.css' : '',
                        remote : true
                    }]);
                }
                if (toolkit === 'modern') {
                    data.codes.assets = data.codes.assets.concat([{
                        type   : 'css',
                        name   : 'd3-ios-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/d3/' + toolkit + '/ios/resources/d3-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'd3-material-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/d3/' + toolkit + '/material/resources/d3-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'd3-modern-neptune-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/d3/' + toolkit + '/modern-neptune/resources/d3-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'd3-modern-triton-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/d3/' + toolkit + '/modern-triton/resources/d3-all-debug.css' : '',
                        remote : true
                    }]);
                }
            }
        } else if (pageName.toLowerCase().indexOf('calendar') > -1) {
            if (canPackage) {
                packages.push('calendar');
            } else {
                data.codes.assets = data.codes.assets.concat([{
                    type   : 'js',
                    name   : 'calendar-build.js',
                    code   : toolkit ? 'https://{frameworkPath}/build/packages/calendar/' + toolkit + '/calendar-debug.js' : '',
                    remote : true
                }]);

                if (toolkit === 'classic') {
                    data.codes.assets = data.codes.assets.concat([{
                        type   : 'css',
                        name   : 'calendar-classic-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/calendar/' + toolkit + '/classic/resources/calendar-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'calendar-crisp-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/calendar/' + toolkit + '/crisp/resources/calendar-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'calendar-neptune-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/calendar/' + toolkit + '/neptune/resources/calendar-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'calendar-triton-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/calendar/' + toolkit + '/triton/resources/calendar-all-debug.css' : '',
                        remote : true
                    }]);
                }
                if (toolkit === 'modern') {
                    data.codes.assets = data.codes.assets.concat([{
                        type   : 'css',
                        name   : 'calendar-ios-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/calendar/' + toolkit + '/ios/resources/calendar-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'calendar-material-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/calendar/' + toolkit + '/material/resources/calendar-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'calendar-modern-neptune-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/calendar/' + toolkit + '/modern-neptune/resources/calendar-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'calendar-modern-triton-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/calendar/' + toolkit + '/modern-triton/resources/calendar-all-debug.css' : '',
                        remote : true
                    }]);
                }
            }
        } else if (pageName.toLowerCase().indexOf('exporter') > -1) {
            if (canPackage) {
                packages.push('exporter');
            } else {
                data.codes.assets = data.codes.assets.concat([{
                    type   : 'js',
                    name   : 'exporter-build.js',
                    code   : toolkit ? 'https://{frameworkPath}/build/packages/exporter/' + toolkit + '/exporter-debug.js' : '',
                    remote : true
                }]);
            }
        } else if (pageName.toLowerCase().indexOf('pivot') > -1) {
            if (canPackage) {
                packages.push('pivot');
            } else {
                data.codes.assets = data.codes.assets.concat([{
                    type   : 'js',
                    name   : 'pivot-build.js',
                    code   : toolkit ? 'https://{frameworkPath}/build/packages/pivot/' + toolkit + '/pivot-debug.js' : '',
                    remote : true
                }]);

                if (toolkit === 'classic') {
                    data.codes.assets = data.codes.assets.concat([{
                        type   : 'css',
                        name   : 'pivot-classic-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/pivot/' + toolkit + '/classic/resources/pivot-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'pivot-crisp-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/pivot/' + toolkit + '/crisp/resources/pivot-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'pivot-neptune-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/pivot/' + toolkit + '/neptune/resources/pivot-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'pivot-triton-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/pivot/' + toolkit + '/triton/resources/pivot-all-debug.css' : '',
                        remote : true
                    }]);
                }
                if (toolkit === 'modern') {
                    data.codes.assets = data.codes.assets.concat([{
                        type   : 'css',
                        name   : 'pivot-ios-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/pivot/' + toolkit + '/ios/resources/pivot-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'pivot-material-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/pivot/' + toolkit + '/material/resources/pivot-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'pivot-modern-neptune-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/pivot/' + toolkit + '/modern-neptune/resources/pivot-all-debug.css' : '',
                        remote : true
                    }, {
                        type   : 'css',
                        name   : 'pivot-modern-triton-build.css',
                        code   : toolkit ? 'https://{frameworkPath}/build/packages/pivot/' + toolkit + '/modern-triton/resources/pivot-all-debug.css' : '',
                        remote : true
                    }]);
                }
            }
        } else if (pageName.toLowerCase().indexOf('chart') > -1 || pageName.toLowerCase().indexOf('draw') > -1) {
            if (canPackage) {
                packages.push('charts');
            }
        }

        form = DocsApp.buildForm(iframe.id, data);
        mask = wrap.appendChild(ExtL.createElement({
            "class" : 'fiddle-mask'
        }));

        if (!ExtL.isIE8() && !ExtL.isIE9()) {
            mask.appendChild(ExtL.createElement({
                "class": 'spinner'
            }));
        }

        iframe.onload = function () {
            if (form && form.parentNode) {
                form.parentNode.removeChild(form);
            }
            wrap.removeChild(wrap.querySelector('.fiddle-mask'));
            DocsApp.enableFiddleNav(wrap);
        };

        form.submit();
    };

    /**
     * @private
     * Used by the runFiddleExample method.  Builds / returns an iframe used to run
     * the fiddle code.
     * @param {Element} wrap The element wrapping the fiddle and fiddle code
     * @return {Element} The iframe used for the anonymous fiddle
     */
    DocsApp.getIFrame = function (wrap) {
        var iframe = wrap.querySelector('iframe');

        if (!iframe) {
            iframe    = document.createElement('iframe');
            iframe.id = iframe.name = DocsApp.id(); //needs to be unique on whole page

            wrap.appendChild(iframe);
        }

        return iframe;
    };

    /**
     * @private
     * Used by the runFiddleExample method.  Appends a form to the body for use by the
     * anonymous fiddle examples.
     * @param {String} target The ID of the target fiddle iframe
     * @param {Array} params Array of form input fields
     * @return {Element} The form used the submit the fiddle code to the fiddle server
     */
    DocsApp.buildForm = function (target, params) {
        var form = ExtL.createElement({
            tag    : 'form',
            role   : 'presentation',
            action : 'https://fiddle.sencha.com/run?dc=' + new Date().getTime(),
            //action : 'https://test-fiddle.sencha.com/run?dc=' + new Date().getTime(),
            method : 'POST',
            target : target,
            style  : 'display:none'
        });

        ExtL.each(params, function (key, val) {
            if (ExtL.isArray || ExtL.isObject) {
                val = JSON.stringify(val);
            }

            form.appendChild(ExtL.createElement({
                tag   : 'input',
                type  : 'hidden',
                name  : key,
                value : val
            }));
        });

        document.body.appendChild(form);

        return form;
    };


    DocsApp.getMemberTypeMenu = function () {
        var menu = ExtL.get('memberTypeMenu');

        if (!menu) {
            menu = ExtL.createElement({
                id: 'memberTypeMenu'
            });
            document.body.appendChild(menu);

            DocsApp.addEventsAndSetMenuClose(menu, 'mouseenter', false);
            DocsApp.addEventsAndSetMenuClose(menu, 'mouseleave', true);

            ExtL.monitorMouseLeave(menu, 200, DocsApp.hideMemberTypeMenu);

        }

        return menu;
    };

    DocsApp.showMemberTypeMenu = function (e) {
        var menu        = DocsApp.getMemberTypeMenu(),
            target      = DocsApp.getEventTarget(e),
            membersBox  = ExtL.get('class-body-wrap').getBoundingClientRect(),
            height      = (membersBox.bottom - membersBox.top) - 4,
            maxWidth    = (membersBox.right - membersBox.left) - 4,
            targetId    = target.id.replace('-nav-btn', ''),
            targetCt    = ExtL.get(targetId + '-ct'),
            memberList  = ExtL.fromNodeList(targetCt.querySelectorAll('.classmembers')),
            eligMembers = [],
            cols        = [],
            tallest     = 0,
            configsCt, rows, maxCols, maxLiteralWidth, useMembersWidth, width, left, colCount, rowCount, j, col, explicitAccessors;

        targetBox = target.getBoundingClientRect();
        DocsApp.appMeta.menuCanClose = false;

        if (targetId === 'methods') {
            configsCt = ExtL.get('configs-ct');

            if (configsCt) {
                explicitAccessors = ExtL.fromNodeList(configsCt.querySelectorAll('.accessor-method'));
                if (explicitAccessors.length) {
                    memberList = memberList.concat(explicitAccessors);
                }
            }
        }

        ExtL.removeChildNodes(menu);

        ExtL.each(memberList, function (item) {
            var cn = [],
                link, memberObj, name, memberTagsCt;

            // ignore any methods that have been hoisted into the configs section or are
            // hidden
            if (item.offsetHeight && item.id.indexOf('placeholder') !== 0) {
            //if (item.offsetHeight) {
                link      = item.querySelector('[data-ref]');
                name      = ExtL.trim(link.textContent || link.innerText);
                memberObj = {
                    tag          : 'a',
                    html         : name,
                    title        : name,
                    href         : '#' + link.getAttribute('data-ref'),
                    sortName     : name,
                    sortPriority : 0
                };


                if (targetId === "configs" && (ExtL.hasCls(item, "accessor-method") || ExtL.hasCls(item.parentNode, "accessor-method"))) {
                    memberObj["class"] = "accessor";
                    memberObj.sortName = ExtL.up(item, '.classmembers').getAttribute('data-member-name');
                    if (ExtL.hasCls(item, 'isGetter')) {
                        memberObj.sortPriority = 1;
                    }
                    if (ExtL.hasCls(item, 'isSetter')) {
                        memberObj.sortPriority = 2;
                    }
                }

                memberTagsCt = item.querySelector('.member-tags');
                if (memberTagsCt) {
                    if (memberTagsCt.querySelector('.private')) {
                        cn.push({
                            html    : 'pri',
                            "class" : 'private member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.protected')) {
                        cn.push({
                            html    : 'pro',
                            "class" : 'protected member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.required')) {
                        cn.push({
                            html    : 'req',
                            "class" : 'required member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.deprecated')) {
                        cn.push({
                            html    : 'dep',
                            "class" : 'deprecated member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.removed')) {
                        cn.push({
                            html    : 'rem',
                            "class" : 'removed member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.static')) {
                        cn.push({
                            html    : 'sta',
                            "class" : 'static member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.readonly')) {
                        cn.push({
                            html    : 'ro',
                            "class" : 'readonly member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.template')) {
                        cn.push({
                            html    : 'tpl',
                            "class" : 'template member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.abstract')) {
                        cn.push({
                            html    : 'abs',
                            "class" : 'abstract member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.chainable')) {
                        cn.push({
                            html    : '>',
                            "class" : 'chainable member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.bindable')) {
                        cn.push({
                            html    : 'bind',
                            "class" : 'bindable member-menu-flag'
                        });
                    }

                    if (memberTagsCt.querySelector('.immutable')) {
                        cn.push({
                            html    : 'imm',
                            "class" : 'immutable member-menu-flag'
                        });
                    }
                }

                if (cn.length) {
                    memberObj.cn = cn;
                }

                eligMembers.push(memberObj);
            }
        });

        // sort all of the members by name
        // - for configs with getter / setters we'll also then sort by priority
        //   where the config will be sorted with all other configs and if it has a
        //   getter it will follow the config and a setter would then follow before
        //   proceeding with the natural sort order
        eligMembers.sort(function (a, b) {
            var aName     = a.sortName,
                bName     = b.sortName,
                aPriority = a.sortPriority,
                bPriority = b.sortPriority;

            if (aName < bName) {
                return -1;
            } else if (aName > bName) {
                return 1;
            } else {
                if (aPriority < bPriority) {
                    return -1;
                } else if (aPriority > bPriority) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });

        ExtL.each(eligMembers, function (member, i, arr) {
            arr[i] = ExtL.createElement(member);
        });

        rows            = parseInt((height - 34) / 20);
        maxCols         = Math.ceil(eligMembers.length / rows);
        maxLiteralWidth = (maxCols * 300) + 4;
        useMembersWidth = maxLiteralWidth > maxWidth;
        width           = useMembersWidth ? maxWidth : maxLiteralWidth;

        if (useMembersWidth) {
            left = membersBox.left;
        } else {
            left = targetBox.left;
            // constrain to the right side of the members container
            if (left + width > (membersBox.right)) {
                left = left - ((left + width + 4) - (membersBox.right));
            }
            // constrain to the left side of the members container
            if (left < (membersBox.left)) {
                left = membersBox.left;
            }
        }

        ExtL.applyStyles(menu, {
            width  : width + 'px',
            height : height + 'px',
            left   : left + 'px',
            top    : membersBox.top + 'px'
        });

        colCount = Math.floor(width / 300);

        for (i = 0; i < colCount; i++) {
            col = ExtL.createElement({
                "class": 'member-menu-col',
                style: 'left:' + (i * 300) + 'px;'
            });
            cols.push(col);

            rowCount = eligMembers.length / (colCount - i);

            for (j = 0; j < rowCount; j++) {
                col.appendChild(eligMembers.shift());
            }

            tallest = col.childNodes.length * 20 > tallest ? col.childNodes.length * 20 : tallest;
        }

        tallest = tallest + 37;

        if (tallest < height) {
            ExtL.applyStyles(menu, {
                height: tallest + 'px'
            });
        }

        ExtL.each(cols, function (c) {
            menu.appendChild(c);
        });

        if (rowCount) {
            ExtL.addCls(menu, 'show-menu');
        } else {
            DocsApp.appMeta.menuCanClose = true;
            DocsApp.hideMemberTypeMenu();
        }
    };

    /**
     *
     */
    DocsApp.hideMemberTypeMenu = function () {
        var menu = DocsApp.getMemberTypeMenu();

        if (DocsApp.appMeta.menuCanClose) { // menuCanClose is a closure variable
            ExtL.removeCls(menu, 'show-menu');
        }
    };

    /**
     * Handles the expanding / collapsing of members on click
     * @param {HTMLElement} collapseEl The collapse / expand toggle element
     */
    DocsApp.onMemberCollapseToggleClick = function (collapseEl) {
        var member = ExtL.up(collapseEl, '.classmembers');

        ExtL.toggleCls(member, 'member-expanded');
    };

    /**
     *
     */
    //var addHighlight, removeHighlight;
    DocsApp.highlightMemberRow = function (target) {
        var highlightCls = 'member-highlight',
            fadeCls      = 'member-highlight-fade';

        if (DocsApp.appMeta.addHighlight) {
            clearTimeout(DocsApp.appMeta.addHighlight);
        }
        if (DocsApp.appMeta.removeHighlight) {
            clearTimeout(DocsApp.appMeta.removeHighlight);
        }
        ExtL.each(ExtL.fromNodeList(document.getElementsByClassName(highlightCls)), function (row) {
            ExtL.removeCls(row, highlightCls);
            ExtL.removeCls(row, fadeCls);
        });

        ExtL.addCls(target, highlightCls);
        DocsApp.appMeta.addHighlight = setTimeout(function () {
            ExtL.addCls(target, fadeCls);
            DocsApp.appMeta.removeHighlight = setTimeout(function () {
                ExtL.removeCls(target, highlightCls);
                ExtL.removeCls(target, fadeCls);
            }, 1401);
        }, 400);
    };

    /**
     *
     */
    DocsApp.isMobile = function () {
        return DocsApp.getViewportSize().width < 950;
    };

    /**
     *
     */
    DocsApp.initHistory = function () {
        DocsApp.saveState();

        var history  = DocsApp.getHistory(),
            nav      = ExtL.get('history-nav'),
            path     = window.location.pathname,
            list     = ExtL.get('history-full-list'),
            meta     = DocsApp.meta,
            product  = meta.product,
            version  = meta.version,
            toolkit  = meta.toolkit,
            pageName = ExtL.htmlDecode(ExtL.htmlDecode(meta.pageName));

        nav.appendChild(ExtL.createElement({
            tag     : 'span',
            html    : 'History : ',
            "class" : 'history-title'
        }));
        if (history && history.length) {
            history.reverse();
            ExtL.each(history, function (item) {
                var current     = (item.product === product && item.version === version && item.toolkit === toolkit && item.text === pageName && item.path === path),
                    other       = (item.product !== product || item.version !== version || item.toolkit !== toolkit),
                    badge       = ExtL.isIE8() ? '' : ' ' + item.product + '-badge badge',
                    isGuide     = (item.path.indexOf('/guides/') > -1);
                    itemVersion = item.version,
                    itemToolkit = item.toolkit,
                    combined    = (itemToolkit ? (itemVersion + '-' + itemToolkit) : itemVersion);

                nav.appendChild(ExtL.createElement({
                    tag        : 'a',
                    "class"    : 'tooltip tooltip-tl-bl history-btn' + (other ? ' history-other' : ''),
                    href       : item.path,
                    style      : current ? 'display: none;' : null,
                    'data-tip' : item.title + ' ' + (isGuide ? itemVersion : combined),
                    cn         : [{
                        tag     : 'span',
                        html    : item.title + ' ' + (isGuide ? itemVersion : combined) + ' | ',
                        "class" : 'history-meta'
                    }, {
                        tag  : 'span',
                        html : item.text
                    }, {
                        "class" : 'callout callout-bl'
                    }]
                }));

                list.appendChild(ExtL.createElement({
                    tag     : 'a',
                    "class" : 'tooltip tooltip-tr-br history-item' + (other ? ' history-other' : '') + badge,
                    href    : item.path,
                    style   : current ? 'display: none;' : null,
                    cn      : [{
                        tag  : 'div',
                        html : item.text
                    }, {
                        tag     : 'div',
                        html    : item.title + ' ' + combined,
                        "class" : 'history-meta'
                    }]
                }));
            });
        }
    };

    /**
     *
     */
    DocsApp.getHistory = function () {
        if (!ExtL.canLocalStorage()) {
            return false;
        }

        var saved = ExtL.decodeValue(localStorage.getItem('htmlDocsState')) || {};

        return saved.history;
    };

    // page kickoff - apply state
    ExtL.bindReady(function () {
        var branches, treeCt;

        if (DocsApp.meta.pageType !== 'landing') {
            DocsApp.initNavTree();
        }
        DocsApp.initProductMenu();
        DocsApp.resizeHandler();

        //wrapSubCategories();

        ExtL.removeCls(ExtL.get('tree-header'), 'pre-load');

        DocsApp.fetchState(true);

        if (DocsApp.meta.pageType === 'api') {
            // force a scroll response at load for browsers that don't fire the scroll
            // event themselves initially
            DocsApp.filterClassTreeByAccess();
            DocsApp.filterByAccess();
            DocsApp.handleScroll();
            DocsApp.initMemberTypeMouseoverHandlers();
            DocsApp.copyRelatedClasses();

            // handle all window scroll events
            document.querySelector('.class-body-wrap').onscroll = DocsApp.handleScroll;
        }
        if (DocsApp.meta.pageType === 'home') {
            document.querySelector('.generic-content').onscroll = DocsApp.handleScroll;
        }
        if (DocsApp.meta.pageType === 'guide') {
            DocsApp.copyTOC();
            document.querySelector('.guide-body-wrap').onscroll = DocsApp.handleScroll;
        }
        if (window.location.hash) {
            DocsApp.onHashChange(true);
            // re-check header visibility since the onHashChange might have set
            // temp-show on a class member and we'll then need its header / group to be
            // visible
            DocsApp.setTypeNavAndHeaderVisibility();
        }

        eventsEl = ExtL.get('guideTab');
        if (eventsEl) {
            ExtL.on(eventsEl, 'click', DocsApp.onGuideTabClick);
        }
        eventsEl = ExtL.get('filterTab');
        if (eventsEl) {
            ExtL.on(eventsEl, 'click', DocsApp.toggleContextTab);
        }

        eventsEl = ExtL.get('relatedClassesTab');
        if (eventsEl) {
            ExtL.on(eventsEl, 'click', DocsApp.toggleContextTab);
        }

        eventsEl = ExtL.get('searchtext');
        if (eventsEl) {
            ExtL.on(eventsEl, 'keyup', function (e) {
                e       = DocsApp.getEvent(e);
                keyCode = e.keyCode || e.which;

                if (keyCode === 27) {
                    DocsApp.hideSearchHistory();
                    DocsApp.hideSearchResults();
                } else {
                    DocsApp.searchFilter();
                }
            });
            ExtL.on(eventsEl, 'keydown', function (e) {
                e       = DocsApp.getEvent(e);
                keyCode = e.keyCode || e.which;

                if (keyCode === 27) {
                    DocsApp.hideSearchHistory();
                    DocsApp.hideSearchResults();
                } else {
                    DocsApp.searchFilter();
                }
            });
            ExtL.on(eventsEl, 'focus', DocsApp.showSearchHistory);
        }

        eventsEl = ExtL.get('mobile-input');
        ExtL.on(eventsEl, 'keyup', function (e) {
                e       = DocsApp.getEvent(e);
                keyCode = e.keyCode || e.which;

                if (keyCode === 27) {
                    DocsApp.hideSearchHistory();
                    DocsApp.hideSearchResults();
                } else {
                    DocsApp.searchFilter();
                }
            });
        ExtL.on(eventsEl, 'keydown', function (e) {
                e       = DocsApp.getEvent(e);
                keyCode = e.keyCode || e.which;

                if (keyCode === 27) {
                    DocsApp.hideSearchHistory();
                    DocsApp.hideSearchResults();
                } else {
                    DocsApp.searchFilter();
                }
            });
        ExtL.on(eventsEl, 'blur', DocsApp.onMobileInputBlur);

        eventsEl = null;

        // keep the body click handler from processing
        DocsApp.getSearchResultsCt().onclick = DocsApp.onResultsCtClick;

        DocsApp.initEventHandlers();
        //DocsApp.fetchState(true);

        DocsApp.appMeta.allowSave = true;

        DocsApp.initHistory();

        DocsApp.applyAceEditors();
    });

    /**
     * ***********************************
     * EVENT HANDLERS SECTION
     * ***********************************
     */

    /**
     * Show / hide the help page
     */
    DocsApp.toggleHelp = function () {
        ExtL.toggleCls(document.body, 'show-help');
    };

    /**
     * Scroll to the top of the document (no animation)
     */
    DocsApp.setScrollPos = function (e, pos) {
        var el = DocsApp.meta.pageType === 'api' ? '.class-body-wrap' : (DocsApp.meta.pageType === 'guide' ? '.guide-body-wrap' : '.generic-content');
        pos    = pos || 0;

        e = DocsApp.getEvent(e);
        if(e && e.preventDefault) {
            e.preventDefault();
        }

        document.querySelector(el).scrollTop = pos;
        return false;
    };

    /**
     * Handles expand all click
     */
    DocsApp.onToggleAllClick = function (e) {
        var memberList = ExtL.fromNodeList(document.querySelectorAll('.classmembers')),
            btn        = ExtL.get('toggleAll'),
            indicator  = btn.querySelector('i'),
            collapsed  = ExtL.hasCls(indicator, 'fa-plus'),
            action     = collapsed ? 'addCls' : 'removeCls',
            i          = 0,
            len        = memberList.length,
            member;

        for (; i < len; i++) {
            member = memberList[i];
            ExtL[action](member, 'member-expanded');
        }

        btn.setAttribute('data-toggle', (collapsed ? 'Collapse' : 'Expand') + ' All Members');
        ExtL.toggleCls(indicator, 'fa-minus');
        ExtL.toggleCls(indicator, 'fa-plus');
    };

    DocsApp.onToggleExampleClick = function (e) {
        e = DocsApp.getEvent(e);

        var target      = DocsApp.getEventTarget(e),
            targetEl    = ExtL.hasCls(target, 'example-collapse-target') || ExtL.up(target, '.example-collapse-target'),
            headerClick = ExtL.hasCls(target, 'da-inline-fiddle-nav');

        DocsApp.stopEvent(e);

        // Clicking on the header should expand the example, but not collapse it
        if (headerClick && !ExtL.hasCls(targetEl, 'example-collapsed')) {
            return;
        }
        // Clicking on an element in an expanded header on anything other than the
        // collapse tool should halt
        if (!ExtL.hasCls(targetEl, 'example-collapsed') && !ExtL.hasCls(target, 'collapse-tool')) {
            return;
        }

        ExtL.toggleCls(targetEl, 'example-collapsed');
        if (ExtL.isIE8()) {
            ExtL.toggleCls(document.body, 'placebo');
        }
    };

    DocsApp.onToggleExamplesClick = function () {
        var body      = document.querySelector('body'),
            collapsed = ExtL.hasCls(body, 'collapse-code-all');

        DocsApp.toggleExamples(!collapsed);
        DocsApp.saveState();
    };

    /**
     * Collapse or expand all code / fiddle blocks
     * @param {Boolean} collapse True to collapse, false to expand, or null to toggle all
     * code / fiddle blocks
     */
   DocsApp.toggleExamples = function (collapse) {
        var body        = document.querySelector('body'),
            collapseCls = 'collapse-code-all',
            collapsed   = ExtL.hasCls(body, collapseCls),
            doCollapse  = ExtL.isEmpty(collapse) ? !collapsed : collapse,
            action      = doCollapse ? 'addCls' : 'removeCls';

        ExtL[action](body, collapseCls);
        ExtL.each(ExtL.fromNodeList(document.getElementsByClassName('example-collapse-target')), function (ex) {
            ExtL[action](ex, 'example-collapsed');
        });
    };

    /**
     * Handles the click of the toggle class tree button, don't save state
     */
    DocsApp.onToggleClassTreeClickNoState = function () {
        DocsApp.toggleTreeVisibility();
    };

    /**
     * @method toggleTreeNodes
     */
    DocsApp.toggleTreeNodes = function(e, navTree) {
        navTree = navTree || DocsApp.navTree;

        var target    = DocsApp.getEventTarget(e),
            btn       = ExtL.hasCls(target, 'icon-btn') ? target : ExtL.up(target, '.icon-btn'),
            indicator = btn.querySelector('i'),
            collapsed = ExtL.hasCls(indicator, 'fa-minus');

        navTree.toggleCollapseAll(collapsed);

        btn.setAttribute('data-toggle', (collapsed ? 'Expand' : 'Collapse') + ' All Classes');

        ExtL.toggleCls(indicator, 'fa-minus');
        ExtL.toggleCls(indicator, 'fa-plus');
    };


    /**
     *
     */
    DocsApp.onProductMenuItemClick = function (e) {
        var target     = DocsApp.getEventTarget(e),
            ct         = ExtL.up(target, '#product-tree-ct'),
            prodId     = target.id.substr("product-menu-".length),
            items      = ExtL.fromNodeList(ct.querySelectorAll('.product-name-item')),
            versionCts = ExtL.fromNodeList(ct.querySelectorAll('.product-version-ct'));

        ExtL.each(items, function (item) {
            ExtL[item === target ? 'addCls' : 'removeCls'](item, 'prod-menu-selected');
        });

        ExtL.each(versionCts, function (verCt) {
            ExtL[ExtL.hasCls(verCt, prodId) ? 'removeCls' : 'addCls'](verCt, 'hide');
        });
    };

    /**
     *
     */
    DocsApp.showProductVersionMenu = function (e) {
        var target             = DocsApp.getEventTarget(e),
            productItemCls     = 'product-name-item',
            versionMenuCt      = ExtL.get('product-version-tree-ct'),
            productsWithHeader = ['extjs'],
            selectedCls        = 'selected-product',
            productMenuCt      = ExtL.get('product-tree-ct'),
            products           = productMenuCt.childNodes,
            productsLen        = products.length,
            meta               = DocsApp.meta,
            exceptions         = meta.exceptions,
            productNode, product, parent, children, childrenLen, i, child, node,
            myVersion, majorVersion, hasHeaders, cn, childPath, exception;

        if (!ExtL.hasCls(target, productItemCls)) {
            target = ExtL.up(target, '.' + productItemCls);
        }

        product = target.getAttribute('data-name');

        if (versionMenuCt.product !== product) {
            while (productsLen--) {
                ExtL.removeCls(products[productsLen], selectedCls);
            }
            ExtL.addCls(target, selectedCls);

            ExtL.removeChildNodes(versionMenuCt);

            versionMenuCt.product = product;
            parentNode            = target.myParentNode;
            children              = parentNode.children;
            childrenLen           = children.length;
            i                     = 0;
            hasHeaders            = productsWithHeader.indexOf(product) > -1;
            majorVersion          = null;

            versionMenuCt.appendChild(
                ExtL.createElement({
                    tag  : 'h1',
                    html : parentNode.text
                })
            );

            for (; i < childrenLen; i++) {
                child = children[i];
                childPath = child.path.split('/');

                if (childPath[0] && exceptions[childPath[0]]) {
                    if (exceptions[childPath[0]] === true) {
                        exception = true;
                    } else if (childPath[1] && exceptions[childPath[0]].includes(childPath[1])) {
                        exception = true;
                    }
                }

                cn    = [{
                    tag  : 'a',
                    href : meta.docsRootPath + child.path + (exception ? '/' : '/index.html'),
                    html : child.text
                }];

                if (!exception) {
                    cn.push({
                        tag  : 'a',
                        href : DocsApp.meta.docsRootPath + 'downloads/' + child.path.replace(/\//g, '-').replace(/\./g, '') + '-docs.zip',
                        html : '(offline docs)'
                    });
                }

                node  = ExtL.createElement({
                    cn : cn
                });

                versionMenuCt.appendChild(node);

                if (hasHeaders) {
                    myVersion = child.text[0];
                    if (myVersion !== majorVersion) {
                        majorVersion = myVersion;
                        versionMenuCt.insertBefore(ExtL.createElement({
                            tag  : 'h2',
                            html : myVersion + '.x'
                        }), node);
                    }
                }
            }
        }

        setTimeout(function () {
            DocsApp.positionProductVersionMenu(target);
        }, 1);
        ExtL.removeCls(versionMenuCt, 'hide');
    };

    /**
     *
     */
    DocsApp.hideProductVersionMenu = function (e) {
        var versionMenuCt = ExtL.get('product-version-tree-ct');

        ExtL.addCls(versionMenuCt, 'hide');
    };

    /**
     *
     */
    DocsApp.positionProductVersionMenu = function (target) {
        var productTreeCt    = ExtL.get('product-tree-ct'),
            parentCtBox      = productTreeCt.getBoundingClientRect(),
            parentBox        = target.getBoundingClientRect(),
            parentWidth      = ExtL.getWidth(productTreeCt),
            versionMenuCt    = ExtL.get('product-version-tree-ct'),
            versionMenuWidth = ExtL.getWidth(versionMenuCt),
            vpSize           = DocsApp.getViewportSize(),
            vpWidth          = vpSize.width,
            defaultLeft      = parentWidth - 2,
            btn, btnBox, heightAvail, height, totalVersionWidth, isLeftOverflow;

        totalVersionWidth = parentBox.left + defaultLeft + versionMenuWidth;
        isLeftOverflow    = totalVersionWidth > vpWidth;

        ExtL.applyStyles(versionMenuCt, {
            top  : parentBox.top - parentCtBox.top + 'px',
            left : (isLeftOverflow ? defaultLeft - (totalVersionWidth - vpWidth) : defaultLeft) + 'px'
        });
    };

    /**
     *
     */
    DocsApp.onClassTreeCtClick = function (e) {
        var target = DocsApp.getEventTarget(e),
            href   = target.href;

        if (href && DocsApp.isMobile()) {
            DocsApp.setTreeVisibility(false);
        }
    };

    DocsApp.getMultiSrcPanel = function () {
        var pickerId = 'multi-src-picker',
            picker = ExtL.get(pickerId);

        if (!picker && DocsApp.meta.srcFiles) {
            var srcFiles = DocsApp.meta.srcFiles,
                len      = srcFiles.length,
                i        = 0,
                pickerCt = {
                    id : pickerId,
                    cn : []
                },
                divided;

            for (; i < len; i++) {
                var srcObj = srcFiles[i],
                    text   = srcObj.pathText,
                    href   = srcObj.path;

                if (!divided && text.indexOf('.scss') > -1) {
                    pickerCt.cn.push({
                        tag : 'hr'
                    });
                    divided = true;
                }

                pickerCt.cn.push({
                    tag    : 'a',
                    target : '_blank',
                    href   : './src/' + href,
                    html   : text
                });
            }

            picker = document.body.appendChild(
                ExtL.createElement(pickerCt)
            );
        }

        return picker;
    };

    /**
     *
     */
    DocsApp.showMultiSrcPanel = function (e) {
        var target    = DocsApp.getEventTarget(e),
            //picker    = ExtL.get('multi-src-picker'),
            picker    = DocsApp.getMultiSrcPanel(),
            targetBox = target.getBoundingClientRect();

        if (picker) {
            ExtL.applyStyles(picker, {
                top  : targetBox.bottom + 'px',
                left : targetBox.left + 'px'
            });
            ExtL.addCls(picker, 'show-multi');
        }
    };

    /**
     *
     */
    DocsApp.hideMultiSrcPanel = function () {
        //var picker = ExtL.get('multi-src-picker');
        var picker = DocsApp.getMultiSrcPanel();

        if (picker) {
            ExtL.removeCls(picker, 'show-multi');
        }
    };

    /**
     *
     */
    DocsApp.showHistoryConfigPanel = function (e) {
        e = DocsApp.getEvent(e);

        var panel  = ExtL.get('historyConfigPanel'),
            btn    = ExtL.get('history-config'),
            btnBox = btn.getBoundingClientRect();

        DocsApp.stopEvent(e);

        ExtL.addCls(document.body, 'show-history-panel');

        ExtL.applyStyles(panel, {
            top  : btnBox.bottom + 'px',
            left : (btnBox.right - panel.clientWidth) + 'px'
        });
    };

    /**
     *
     */
    DocsApp.hideHistoryConfigPanel = function () {
        ExtL.removeCls(document.body, 'show-history-panel');
    };

    /**
     *
     */
    DocsApp.setHistoryType = function () {
        var all = ExtL.get('historyTypeAll').checked;

        ExtL.toggleCls(document.body, 'show-all-history', all);
        DocsApp.saveState();
    };

    /**
     *
     */
    DocsApp.onToggleHistoryLabels = function () {
        var cb = ExtL.get('history-all-labels');

        ExtL.toggleCls(document.body, 'show-history-labels', cb.checked);
        DocsApp.saveState();
    };

    /**
     *
     */
    DocsApp.clearHistory = function () {
        var historyItems = ExtL.fromNodeList(ExtL.get('history-full-list').childNodes),
            historyBtns  = ExtL.fromNodeList(ExtL.get('history-nav').querySelectorAll('.history-btn'));

        if (ExtL.canLocalStorage()) {
            DocsApp.getState().history = [];
            DocsApp.saveState();
        }

        ExtL.each(historyItems, function (item) {
            item.parentNode.removeChild(item);
        });

        ExtL.each(historyBtns, function (btn) {
            btn.parentNode.removeChild(btn);
        });
    };

    /**
     * Handles the click of the hide class tree button
     */
    DocsApp.onHideClassTreeClick = function () {
        var makeVisible = ExtL.hasCls(document.body, 'tree-hidden');

        DocsApp.setTreeVisibility(makeVisible);

        if (DocsApp.appMeta.isStateful) {
            DocsApp.saveState();
        }
    };

    /**
     *
     */
    DocsApp.stopEvent = function (e) {
        e = DocsApp.getEvent(e);
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        e.cancelBubble = true;  // IE events
        e.returnValue  = false;  // IE events
    };

    /**
     * Shows the product menu
     */
    DocsApp.showProductMenu = function (e) {
        var productTreeCt = ExtL.get('product-tree-ct');

        if (ExtL.hasCls(productTreeCt, 'hide')) {
            DocsApp.stopEvent(e);
        }

        ExtL.removeCls(productTreeCt, 'hide');
        DocsApp.positionProductMenu();
    };

    /**
     * Positions the product menu next to the show product menu button.  The height and
     * position are constrained to the viewport.
     */
    DocsApp.positionProductMenu = function () {
        var productTreeCt = ExtL.get('product-tree-ct'),
            btns          = ExtL.fromNodeList(document.querySelectorAll('.product-menu-btn-wrap')),
            vpSize        = DocsApp.getViewportSize(),
            menuWidth     = ExtL.getWidth(productTreeCt),
            btn, btnBox, heightAvail, height, leftOverflow;

        ExtL.each(btns, function (el) {
            btn = el.offsetHeight ? el : btn;
        });

        if (btn) {
            btnBox       = btn.getBoundingClientRect();
            heightAvail  = vpSize.height - btnBox.bottom;
            height       = heightAvail < ExtL.getHeight(productTreeCt) ? heightAvail - 10 : null;
            leftOverflow = (menuWidth + btnBox.left) > (vpSize.width - btnBox.left);

            ExtL.applyStyles(productTreeCt, {
                top    : btnBox.bottom + 'px',
                height : height ? height + 'px' : height,
                left   : leftOverflow ? 0 : btnBox.left + 'px'
            });
        } else {
            DocsApp.hideProductMenu();
        }
    };

    /**
     * Hides the product menu (and the version sub-menu)
     */
    DocsApp.hideProductMenu = function () {
        var productTreeCt = ExtL.get('product-tree-ct');

        ExtL.addCls(productTreeCt, 'hide');
        DocsApp.hideProductVersionMenu();
    };

    /**
     *
     */
    DocsApp.toggleContextMenu = function () {
        var rightMembers = ExtL.get('rightMembers'),
            mainEdgeMenu = ExtL.get('class-tree-ct');

        if (mainEdgeMenu.style.left !== "0px") {
            var t = DocsApp.getScrollPosition();

            ExtL.toggleCls(rightMembers, 'show-context-menu');
            DocsApp.setScrollPos(null, t);

        }
    };

    DocsApp.enlargeImage = function () {
        var modal        = ExtL.get('modal-placeholder'),
            modalContent = ExtL.get('modal-content'),
            modalCaption = ExtL.get('modal-caption');

        modal.style.display = "block";
        modalContent.src = this.src;

        if (this.alt && this.alt != 'image alt text') {
            modalCaption.innerHTML = this.alt;
        }

        ExtL.get("modal-close").onclick = function() {
            modal.style.display = "none";
        };

        modal.onclick = function() {
            modal.style.display = "none";
        };
    };

    /**
     *
     */
    DocsApp.toggleSearchTabs = function (e) {
        var apiResults   = ExtL.get('api-search-results'),
            guideResults = ExtL.get('guide-search-results'),
            elem         = DocsApp.getEventTarget(e);

        if (ExtL.hasCls(elem, 'active-tab')) {
            return;
        }

        ExtL.toggleCls(apiResults, 'isHidden');
        ExtL.toggleCls(guideResults, 'isHidden');
    };

    /**
     * Do all of the scroll related actions
     */
    DocsApp.handleScroll = function () {
        DocsApp.monitorScrollToTop();
        if (DocsApp.meta.pageType === 'api') {
            DocsApp.highlightTypeMenuItem();
        }
    };

    /**
     * Window resize handler
     */
    DocsApp.resizeHandler = ExtL.createBuffered(function () {
        var size     = DocsApp.getViewportSize(),
            showTree = DocsApp.getState('showTree'),
            width    = size.width;

        ExtL.toggleCls(document.body, 'vp-med-size', (width < 1280 && width > 950));

        if (width > 950 && showTree !== false) {
            DocsApp.setTreeVisibility(true);
        } else if (width <= 950 && showTree !== true) {
            DocsApp.setTreeVisibility(false);
        }

        if (DocsApp.meta.isLanding) {
            var ct = ExtL.get('rightMembers');
            ExtL[(width < 1280) ? 'addCls' : 'removeCls'](ct, 'transitional');
        }

        DocsApp.sizeSearchResultsCt();
        DocsApp.hideProductMenu();
    }, 0);

    /**
     *
     */
    DocsApp.onAccessCheckboxClick = function () {
        DocsApp.filterByAccess();

        if (DocsApp.appMeta.isStateful) {
            DocsApp.saveState();
        }
    };

    /**
     *
     */
    DocsApp.initMemberTypeMouseoverHandlers = function () {
        var btns = document.querySelectorAll('.toolbarButton'),
            len  = btns.length,
            i    = 0;

        for (; i < len; i++) {
            DocsApp.addEventsAndSetMenuClose(btns.item(i), 'mouseenter', false);
            DocsApp.addEventsAndSetMenuClose(btns.item(i), 'mouseleave', true);
            DocsApp.addEventsAndSetMenuClose(btns.item(i), 'click', true, DocsApp.hideMemberTypeMenu);

            ExtL.monitorMouseLeave(btns.item(i), 250, DocsApp.hideMemberTypeMenu);
            ExtL.monitorMouseEnter(btns.item(i), 150, DocsApp.showMemberTypeMenu);
        }
    };

    /**
     *
     */
    DocsApp.copyRelatedClasses = function () {
        var desktopRelated = document.querySelector('#rightMembers .classMeta'),
            copy           = desktopRelated.cloneNode(true);

        if (desktopRelated.children.length > 0) {
            ExtL.get('related-classes-context-ct').appendChild(copy);
        } else {
            ExtL.addCls(ExtL.get('relatedClassesTab'), 'hide-tab');
            desktopRelated.style.display = 'none';
        }
    };

    /**
     *
     */
    DocsApp.copyTOC = function () {
        var desktopToc = document.querySelector('#rightMembers .toc'),
            copy       = (desktopToc) ? desktopToc.cloneNode(true) : null;

        if (copy !== null) {
            ExtL.get('toc-context-ct').appendChild(copy);
        }
    };

    /**
     *
     */
    DocsApp.onMemberTypeMenuClick = function (e) {
        var target;

        target = DocsApp.getEventTarget(e);

        if (ExtL.is(target, 'a') || ExtL.up(target, 'a')) {
            // menuCanClose is a closure variable
            DocsApp.appMeta.menuCanClose = true;
            DocsApp.hideMemberTypeMenu();
            DocsApp.onHashChange(true);
        }
    };

    /**
     * https://dimakuzmich.wordpress.com/2013/07/16/prevent-scrolling-of-parent-element-with-javascript/
     * http://jsfiddle.net/dima_k/5mPkB/1/
     */
    DocsApp.wheelHandler = function (event) {
        var e = DocsApp.getEvent(e),  // Standard or IE event object

            // Extract the amount of rotation from the event object, looking
            // for properties of a wheel event object, a mousewheel event object
            // (in both its 2D and 1D forms), and the Firefox DOMMouseScroll event.
            // Scale the deltas so that one "click" toward the screen is 30 pixels.
            // If future browsers fire both "wheel" and "mousewheel" for the same
            // event, we'll end up double-counting it here. Hopefully, however,
            // cancelling the wheel event will prevent generation of mousewheel.
            deltaX = e.deltaX * -30 ||  // wheel event
                     e.wheelDeltaX / 4 ||  // mousewheel
                                    0,    // property not defined
            deltaY = e.deltaY * -30 ||  // wheel event
                      e.wheelDeltaY / 4 ||  // mousewheel event in Webkit
       (e.wheelDeltaY === undefined &&      // if there is no 2D property then
                      e.wheelDelta / 4) ||  // use the 1D wheel property
                         e.detail * -10 ||  // Firefox DOMMouseScroll event
                                   0;     // property not defined

            // Most browsers generate one event with delta 120 per mousewheel click.
            // On Macs, however, the mousewheels seem to be velocity-sensitive and
            // the delta values are often larger multiples of 120, at
            // least with the Apple Mouse. Use browser-testing to defeat this.
            if (DocsApp.appMeta.isMacWebkit) {
                deltaX /= 30;
                deltaY /= 30;
            }
            e.currentTarget.scrollTop -= deltaY;
            // If we ever get a mousewheel or wheel event in (a future version of)
            // Firefox, then we don't need DOMMouseScroll anymore.
            if (DocsApp.appMeta.isFirefox && e.type !== "DOMMouseScroll")
                element.removeEventListener("DOMMouseScroll", DocsApp.wheelHandler, false);

            // Don't let this event bubble. Prevent any default action.
            // This stops the browser from using the mousewheel event to scroll
            // the document. Hopefully calling preventDefault() on a wheel event
            // will also prevent the generation of a mousewheel event for the
            // same rotation.
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            e.cancelBubble = true;  // IE events
            e.returnValue = false;  // IE events
            return false;
    };

    /**
     *
     */
    DocsApp.onHashChange = function (force) {
        var hash            = location.hash,
            rightMembers    = ExtL.get('rightMembers'),
            contextMenuOpen = ExtL.hasCls(rightMembers, 'show-context-menu'),
            filterInput     = document.getElementById("member-filter-field"),
            target, parent, isAccessor;

        if (!hash) {
            return;
        }

        target = ExtL.get(hash.replace('#', ''));

        if (hash && target) {
            ExtL.addCls(target, 'temp-show');
            ExtL.addCls(target, 'member-expanded');
            target.scrollIntoView(true);
            isAccessor = ExtL.hasCls(target, 'accessor-method') || ExtL.hasCls(target, 'params-list');
            DocsApp.highlightMemberRow(target);
            if (isAccessor) {
                parent = ExtL.up(target, '.classmembers');
                ExtL.addCls(parent, 'member-expanded');
                ExtL.addCls(parent, 'temp-show');
            }
            if (force) {
                target.scrollIntoView(true);
            }
            if (contextMenuOpen) {
                DocsApp.toggleContextMenu();
            }

            if (filterInput) {
                filterInput.value = '';
                filterInput.dispatchEvent(new Event('change'));
                setTimeout(function(){
                    target.scrollIntoView(true);
                }, 250);
            }
        }
    };

    /**
     * ***********************************
     * eo EVENT HANDLERS SECTION
     * ***********************************
     */

    /**
     * ***********************************
     * EVENT HANDLER SETUP SECTION
     * ***********************************
     */
    DocsApp.initEventHandlers = function () {
        ExtL.get('help-btn').onclick = DocsApp.toggleHelp;
        ExtL.get('help-close').onclick = DocsApp.toggleHelp;
        // The back-to-top element is shown when you scroll down a bit
        // clicking it will scroll to the top of the page
        ExtL.get('back-to-top').onclick = DocsApp.setScrollPos;
        ExtL.get('mobile-main-nav-menu-btn').onclick = DocsApp.onToggleClassTreeClickNoState;
        // toggle the class and guide trees
        ExtL.each(ExtL.fromNodeList(document.querySelectorAll('.toggle-tree')), function (btn) {
            //btn.onclick = DocsApp.toggleTreeExpand;
            btn.onclick = DocsApp.toggleTreeNodes;
        });
        // hide the class tree panel
        ExtL.get('hide-class-tree').onclick = DocsApp.onHideClassTreeClick;
        ExtL.each(ExtL.fromNodeList(document.querySelectorAll('.product-menu-btn-wrap')), function (btn) {
            btn.onclick = DocsApp.showProductMenu;
        });

        var pageWrapper = document.getElementsByClassName('body-wrap-inner')[0];

        if (pageWrapper) {
            var pageImages = pageWrapper.getElementsByTagName('img');

            if (pageImages.length > 0) {
                ExtL.each(pageImages, function(index, el) {
                    ExtL.on(el, 'click', DocsApp.enlargeImage);
                });
            }
        }

        ExtL.get('mobile-context-menu-btn').onclick = DocsApp.toggleContextMenu;
        if (ExtL.get('hide-context-menu')) {
            ExtL.get('hide-context-menu').onclick = DocsApp.toggleContextMenu;
        }
        // Set up the product menu nav
        ExtL.each(ExtL.fromNodeList(document.querySelectorAll('.product-name-item')), function (item) {
            /*ExtL.on(item, 'click', DocsApp.onProductMenuItemClick);
            ExtL.on(item, 'mouseenter', DocsApp.onProductMenuItemClick);*/
            //ExtL.monitorMouseLeave(item, 250, DocsApp.hideProductVersionMenu);
            ExtL.monitorMouseEnter(item, 115, DocsApp.showProductVersionMenu);
            ExtL.on(item, 'click', DocsApp.showProductVersionMenu);
        });
        // Set up class tree ct click listener
        if (ExtL.get('class-tree-ct')) {
            ExtL.on(ExtL.get('class-tree-ct'), 'click', DocsApp.onClassTreeCtClick);
        }
        // Set up history details click handler
        ExtL.on(ExtL.get('history-config'), 'click', DocsApp.showHistoryConfigPanel);
        // and history type onchange listeners
        ExtL.on(ExtL.get('historyTypeCurrent'), 'change', DocsApp.setHistoryType);
        ExtL.on(ExtL.get('historyTypeAll'), 'change', DocsApp.setHistoryType);
        // Set up history clear click handler
        ExtL.on(ExtL.get('history-clear'), 'click', DocsApp.clearHistory);
        // Set up history labels checkbox click handler
        ExtL.on(ExtL.get('history-all-labels'), 'change', DocsApp.onToggleHistoryLabels);

        // Setup multi-src click handler
        ExtL.each(ExtL.fromNodeList(document.querySelectorAll('.multi-src-btn')), function (item) {
            ExtL.on(item, 'click', DocsApp.showMultiSrcPanel);
        });

        // Set up search history panel (and ultimately item) click handler
        ExtL.on(ExtL.get('search-history-panel'), 'click', DocsApp.onSearchHistoryClick);

        // Set up search results toolkit filter button handlers
        if (ExtL.get('modern-search-filter')) {
            ExtL.on(ExtL.get('modern-search-filter'), 'click', DocsApp.filterSearchByToolkit);
        }
        if (ExtL.get('classic-search-filter')) {
            ExtL.on(ExtL.get('classic-search-filter'), 'click', DocsApp.filterSearchByToolkit);
        }

        // globally handle body click events
        document.body.onclick = DocsApp.onBodyClick;

        if (DocsApp.meta.pageType === 'api') {
            // show / hide the class tree panel when clicking the show / hide buttons

            // show member types menu
            ExtL.get('member-types-menu').onclick = DocsApp.onClickMemberMenuType;
            // expand / collapse the related classes

            // show / hide public, protected, and private members
            ExtL.get('publicCheckbox').onclick    = DocsApp.onAccessCheckboxClick;
            ExtL.get('protectedCheckbox').onclick = DocsApp.onAccessCheckboxClick;
            ExtL.get('privateCheckbox').onclick   = DocsApp.onAccessCheckboxClick;
            ExtL.get('inheritedCheckbox').onclick = DocsApp.onAccessCheckboxClick;
            ExtL.get('readonlyCheckbox').onclick  = DocsApp.onAccessCheckboxClick;

            // show / hide private classes
            ExtL.get('private-class-toggle').onclick = DocsApp.onFilterClassCheckboxToggle;

            // expand all members - collapse all members
            ExtL.get('toggleAll').onclick = DocsApp.onToggleAllClick;

            // handle the following of a link in the member type menu
            DocsApp.getMemberTypeMenu().onclick = DocsApp.onMemberTypeMenuClick;

            // prevent scrolling of the body when scrolling the member menu
            DocsApp.getMemberTypeMenu().onmousewheel = DocsApp.wheelHandler;
            DocsApp.getMemberTypeMenu().onwheel = DocsApp.wheelHandler;

            if (DocsApp.appMeta.isFirefox) { // Firefox only
                DocsApp.getMemberTypeMenu().scrollTop = 0;
                DocsApp.getMemberTypeMenu().addEventListener("DOMMouseScroll", DocsApp.wheelHandler, false);
            }

            ExtL.get('member-filter-field').oninput = function (e) {
                e = DocsApp.getEvent(e);
                DocsApp.filter(e, e.target || e.srcElement);
            };
            ExtL.get('member-filter-field').onkeyup = function (e) {
                e = DocsApp.getEvent(e);
                DocsApp.filter(e, e.target || e.srcElement);
            };
            ExtL.get('member-filter-field').onchange = function (e) {
                e = DocsApp.getEvent(e);
                DocsApp.filter(e, e.target || e.srcElement);
            };
        }

        // expand all examples - collapse all examples
        if (DocsApp.meta.pageType === 'guide' || DocsApp.meta.pageType === 'api') {
            ExtL.get('toggleExamples').onclick = DocsApp.onToggleExamplesClick;
        }
        ExtL.each(ExtL.fromNodeList(document.getElementsByClassName('collapse-tool')), function (btn) {
            btn.onclick = DocsApp.onToggleExampleClick;
        });
        ExtL.each(ExtL.fromNodeList(document.getElementsByClassName('expand-tool')), function (btn) {
            ExtL.up(btn, '.da-inline-fiddle-nav').onclick = DocsApp.onToggleExampleClick;
        });

        // monitor viewport resizing
        ExtL.on(window, 'resize', DocsApp.resizeHandler);

        // monitor changes in the url hash
        window.onhashchange = DocsApp.onHashChange;
    };
    /**
     * ***********************************
     * eo EVENT HANDLER SETUP SECTION
     * ***********************************
     */

    /**
     * ***********************************
     * STATE MANAGEMENT SECTION
     * ***********************************
     */

    /**
     * Returns the local state object
     */
    DocsApp.getState = function (id) {
        return id ? state[id] : state;
    };

    /**
     * The stateful aspects of the page are collected and saved to localStorage
     */
    DocsApp.saveState = function () {
        var path           = window.location.pathname,
            historyRemoves = [];

        if (DocsApp.appMeta.allowSave !== true || !ExtL.canLocalStorage()) {
            return;
        }
        var publicCheckbox       = ExtL.get('publicCheckbox'),
            protectedCheckbox    = ExtL.get('protectedCheckbox'),
            privateCheckbox      = ExtL.get('privateCheckbox'),
            inheritedCheckbox    = ExtL.get('inheritedCheckbox'),
            readonlyCheckbox     = ExtL.get('readonlyCheckbox'),
            privateClassCheckbox = ExtL.get('private-class-toggle'),
            historyType          = ExtL.get('historyTypeCurrent'),
            historyLabelCheckbox = ExtL.get('history-all-labels'),
            modernSearchFilter   = ExtL.get('modern-search-filter'),
            classicSearchFilter  = ExtL.get('classic-search-filter'),
            body                 = document.querySelector('body'),
            collapsed            = ExtL.hasCls(body, 'collapse-code-all'),
            state                = DocsApp.getState() || {},
            meta                 = DocsApp.meta,
            product              = meta.product,
            toolkit              = meta.toolkit,
            version              = meta.version,
            pageName             = ExtL.htmlDecode(ExtL.htmlDecode(meta.pageName)),
            pageTitle            = meta.title,
            activeNavTab;

        state.showTree = !ExtL.hasCls(body, 'tree-hidden');
        if (publicCheckbox) {
            state.publicCheckbox = publicCheckbox.checked;
        }

        if (protectedCheckbox) {
            state.protectedCheckbox = protectedCheckbox.checked;
        }

        if (privateCheckbox) {
            state.privateCheckbox = privateCheckbox.checked;
        }

        if (inheritedCheckbox) {
            state.inheritedCheckbox = inheritedCheckbox.checked;
        }

        if (readonlyCheckbox) {
            state.readonlyCheckbox = readonlyCheckbox.checked;
        }

        if (privateClassCheckbox) {
            state.privateClassCheckbox = privateClassCheckbox.checked;
        }

        if (modernSearchFilter && classicSearchFilter) {
            if (ExtL.hasCls(modernSearchFilter, 'active')) {
                state.toolkitFilter = ExtL.hasCls(classicSearchFilter, 'active') ? 'both' : 'modern';
            } else {
                state.toolkitFilter = 'classic';
            }
        }

        if (DocsApp.meta.pageType === 'guide' || DocsApp.meta.pageType === 'api') {
            state.history = state.history || [];
            ExtL.each(state.history, function (item, i) {
                //if (item.product === product && item.pversion === pversion && item.text === ExtL.htmlDecode(ExtL.htmlDecode(pageName)) && item.path === path) {
                if (
                    item.product === product &&
                    item.version === version &&
                    item.toolkit === toolkit &&
                    item.text    === pageName &&
                    item.path    === path
                ) {
                    historyRemoves.push(i);
                }
            });
            ExtL.each(historyRemoves, function (item) {
                state.history.splice(item, 1);
            });

            state.history.push({
                product    : product,
                //pversion : pversion,
                toolkit    : toolkit,
                version    : version,
                text       : pageName,
                path       : path,
                title      : pageTitle
            });
            // limit the history size to 150 items (across all products)
            if (state.history.length > 150) {
                state.history.length = 150;
            }
        }

        if (historyType) {
            state.historyType = historyType.checked ? 'current' : 'all';
        }

        if (historyLabelCheckbox) {
            state.historyLabels = historyLabelCheckbox.checked;
        }

        state.searchHistory    = DocsApp.appMeta.searchHistory;
        state.collapseExamples = collapsed;
        state.activeNavTab     = activeNavTab;
        localStorage.setItem('htmlDocsState', ExtL.encodeValue(state));
    };

    /**
     * Fetches the state of the page from localStorage and applies the saved values to
     * the page
     */
    DocsApp.fetchState = function (skipSave, returnOnly) {
        var saved                = localStorage.getItem('htmlDocsState'),
            publicCheckbox       = ExtL.get('publicCheckbox'),
            protectedCheckbox    = ExtL.get('protectedCheckbox'),
            privateCheckbox      = ExtL.get('privateCheckbox'),
            inheritedCheckbox    = ExtL.get('inheritedCheckbox'),
            readonlyCheckbox     = ExtL.get('readonlyCheckbox'),
            privateClassCheckbox = ExtL.get('private-class-toggle'),
            historyTypeCurrent   = ExtL.get('historyTypeCurrent'),
            historyTypeAll       = ExtL.get('historyTypeAll'),
            historyLabelCheckbox = ExtL.get('history-all-labels'),
            mButton              = ExtL.get('modern-search-filter'),
            cButton              = ExtL.get('classic-search-filter'),
            body                 = document.querySelector('body'),
            hash                 = window.location.hash,
            qi                   = hash.indexOf('?'),
            queryString          = (qi > -1) ? hash.substr(qi + 1) : false,
            queryObj, examplesCollapseDir;

        state = ExtL.decodeValue(saved) || {
            showTree: null
        };

        if (returnOnly) {
            return state;
        }
        if (publicCheckbox) {
            publicCheckbox.checked = state.publicCheckbox !== false;
        }
        if (protectedCheckbox) {
            protectedCheckbox.checked = state.protectedCheckbox !== false;
        }
        if (privateCheckbox) {
            privateCheckbox.checked = state.privateCheckbox !== false;
        }
        if (inheritedCheckbox) {
            inheritedCheckbox.checked = state.inheritedCheckbox !== false;
        }
        if (readonlyCheckbox) {
            readonlyCheckbox.checked = state.readonlyCheckbox !== false;
        }
        if (privateClassCheckbox) {
            privateClassCheckbox.checked = state.privateClassCheckbox === true;
        }
        if (historyLabelCheckbox) {
            historyLabelCheckbox.checked = state.historyLabels;
            DocsApp.onToggleHistoryLabels();
        }
        if (historyTypeCurrent && historyTypeAll && state.historyType) {
            ExtL.get('historyType' + ExtL.capitalize(state.historyType)).checked = true;
            DocsApp.setHistoryType();
        }

        DocsApp.appMeta.searchHistory = state.searchHistory;

        if (queryString) {
            queryObj = ExtL.fromQueryString(queryString);
            if (queryObj.collapseExamples && (queryObj.collapseExamples === 'true' || queryObj.collapseExamples === 'false')) {
                examplesCollapseDir = queryObj.collapseExamples === 'true';
            }
            DocsApp.toggleExamples(examplesCollapseDir);
        } else {
            DocsApp.toggleExamples(!!state.collapseExamples);
        }

        if (mButton && cButton && state.toolkitFilter) {
            DocsApp.filterSearchByToolkit(state.toolkitFilter);
        }

        DocsApp.setTreeVisibility(state.showTree);
        if (!skipSave) {
            DocsApp.saveState();
        }
    };

    // we call this immediately so that there is less flashing as positional things are
    // set.  We'll call this again in the bindReady logic because there are a number of
    // things in the statefulness that require the DOM be fully rendered
    DocsApp.fetchState(true);

    /**
     * ***********************************
     * eo STATE MANAGEMENT SECTION
     * ***********************************
     */
})();
