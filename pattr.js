window.Pattr = {
    _templateScopeCounter: 0,
    
    directives: {
        'p-text': (el, value, modifiers = {}) => {
            let text = String(value);
            
            // Apply trim modifier
            if (modifiers.trim && modifiers.trim.length > 0) {
                const maxLength = parseInt(modifiers.trim[0]) || 100;
                if (text.length > maxLength) {
                    text = text.substring(0, maxLength) + '...';
                }
            }
            
            el.innerText = text;
        },
        'p-html': (el, value, modifiers = {}) => {
            let html = value;
            
            // Apply allow filter first (if present)
            if (modifiers.allow && modifiers.allow.length > 0) {
                const allowedTags = modifiers.allow;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Recursively filter elements
                const filterNode = (node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tagName = node.tagName.toLowerCase();
                        if (!allowedTags.includes(tagName)) {
                            // Replace with text content
                            return document.createTextNode(node.textContent);
                        }
                        // Keep element but filter children
                        const filtered = node.cloneNode(false);
                        Array.from(node.childNodes).forEach(child => {
                            const filteredChild = filterNode(child);
                            if (filteredChild) filtered.appendChild(filteredChild);
                        });
                        return filtered;
                    }
                    return node.cloneNode();
                };
                
                const filtered = document.createElement('div');
                Array.from(tempDiv.childNodes).forEach(child => {
                    const filteredChild = filterNode(child);
                    if (filteredChild) filtered.appendChild(filteredChild);
                });
                html = filtered.innerHTML;
            }
            
            // Apply trim modifier (counts only text, preserves HTML tags)
            if (modifiers.trim && modifiers.trim.length > 0) {
                const maxLength = parseInt(modifiers.trim[0]) || 100;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                let charCount = 0;
                let truncated = false;
                
                // Recursively traverse and trim while preserving HTML structure
                const trimNode = (node) => {
                    if (truncated) return null;
                    
                    if (node.nodeType === Node.TEXT_NODE) {
                        const text = node.textContent;
                        const remaining = maxLength - charCount;
                        
                        if (text.length <= remaining) {
                            charCount += text.length;
                            return node.cloneNode();
                        } else {
                            // This text node exceeds limit
                            truncated = true;
                            const trimmedText = text.substring(0, remaining) + '...';
                            return document.createTextNode(trimmedText);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        const cloned = node.cloneNode(false);
                        for (let child of node.childNodes) {
                            const trimmedChild = trimNode(child);
                            if (trimmedChild) {
                                cloned.appendChild(trimmedChild);
                            }
                            if (truncated) break;
                        }
                        return cloned;
                    }
                    return node.cloneNode();
                };
                
                const result = document.createElement('div');
                for (let child of tempDiv.childNodes) {
                    const trimmedChild = trimNode(child);
                    if (trimmedChild) {
                        result.appendChild(trimmedChild);
                    }
                    if (truncated) break;
                }
                
                html = result.innerHTML;
            }
            
            el.innerHTML = html;
        },
        'p-show': (el, value) => {
            el.style.display = value ? '' : 'none'
        },
        'p-style': (el, value) => {
            if (typeof value === 'string') {
                el.style.cssText = value;
            } else if (typeof value === 'object' && value !== null) {
                Object.assign(el.style, value);
            }
        },
        'p-class': (el, value) => {
            if (typeof value === 'string') {
                el.className = value;
            } else if (Array.isArray(value)) {
                el.className = value.join(' ');
            } else if (typeof value === 'object' && value !== null) {
                // Object format: { className: boolean, ... }
                el.className = Object.keys(value)
                    .filter(key => value[key])
                    .join(' ');
            }
        },
        'p-model': (el, value) => {
            el.value = value
        },
        'p-attr': (el, value, modifiers = {}) => {
            // Two usage modes:
            // 1. Single attribute: p-attr:data-id="userId" or p-attr:href="link"
            // 2. Multiple attributes: p-attr="{ 'data-id': userId, 'data-name': userName }"
            
            // Check if this is single attribute mode (has modifier parts)
            const modifierKeys = Object.keys(modifiers);
            if (modifierKeys.length > 0) {
                // Single attribute mode: p-attr:data-id="value"
                // The attribute name is the first modifier
                const attrName = modifierKeys[0];
                if (value === null || value === undefined || value === false) {
                    el.removeAttribute(attrName);
                } else {
                    el.setAttribute(attrName, String(value));
                }
            } else if (typeof value === 'object' && value !== null) {
                // Multiple attributes mode: p-attr="{ 'data-id': userId }"
                Object.keys(value).forEach(attrName => {
                    const attrValue = value[attrName];
                    if (attrValue === null || attrValue === undefined || attrValue === false) {
                        el.removeAttribute(attrName);
                    } else {
                        el.setAttribute(attrName, String(attrValue));
                    }
                });
            }
        },
    },
    
    parseDirectiveModifiers(attrName) {
        // Parse: p-html:trim.300:allow.p.h1.h2
        // Returns: { directive: 'p-html', modifiers: { trim: ['300'], allow: ['p', 'h1', 'h2'] } }
        const parts = attrName.split(':');
        const directive = parts[0];
        const modifiers = {};
        
        // Parse each modifier group
        for (let i = 1; i < parts.length; i++) {
            const modParts = parts[i].split('.');
            const modName = modParts[0];
            const modValues = modParts.slice(1);
            modifiers[modName] = modValues;
        }
        
        return { directive, modifiers };
    },

    // ==================== INITIALIZATION ====================
    
    async start() {
        this.root = document.documentElement;

        // Load root data (props from CMS)
        const rootDataJsonString = document.getElementById("p-root-data")?.textContent;
        try {
            this.rawData = JSON.parse(rootDataJsonString || '{}');
        } catch (e) {
            console.error("Error parsing root data JSON:", e);
        }

        this.buildScopeData(this.root, this.rawData);
        this.data = this.observe(this.rawData);
        this.walkDom(this.root, this.data, true);
        this.refreshAllLoops();
    },

    buildScopeData(el, parentData) {
        let currentData = parentData;
        if (el.hasAttribute('p-scope')) {
            const dataId = el.getAttribute('p-id') || 'missing_p-id';
            if (!parentData._p_children) {
                parentData._p_children = {};
            }
            if (!parentData._p_children[dataId]) {
                parentData._p_children[dataId] = {};
            }
            currentData = parentData._p_children[dataId]; 
            currentData._p_scope = el.getAttribute('p-scope');
        }
        let child = el.firstElementChild;
        while (child) {
            this.buildScopeData(child, currentData); 
            child = child.nextElementSibling;
        }
    },

    // ==================== REACTIVE PROXY ====================

    observe(data, parentScope) {
        const localTarget = data;
        let proxyTarget = localTarget;
        if (parentScope) {
            proxyTarget = Object.create(parentScope._p_target || parentScope);
            Object.assign(proxyTarget, localTarget);
        }
        const proxy = new Proxy(proxyTarget, {
            get: (target, key) => {
                if (key === '_p_target') {
                    return target;
                }
                return target[key];
            },
            set: (target, key, value) => {
                target[key] = value;
                this.walkDom(this.root, this.data, false);
                return true;
            },
            has: (target, key) => {
                return key in target;
            }
        });
        return proxy;
    },

    // ==================== SCOPE MANAGEMENT ====================

    /**
     * Creates a new scope for an element with p-scope during hydration
     */
    initScope(el, parentScope) {
        const dataId = el.getAttribute('p-id');
        const localRawData = parentScope._p_target._p_children[dataId];
        
        // Create new inherited Proxy
        const scope = this.observe(localRawData, parentScope);
        
        // Execute p-scope assignments directly on target to avoid triggering setter
        this.executePScopeStatements(scope, localRawData._p_scope);
        
        // Initialize parent snapshot so first refresh doesn't think everything changed
        const parentProto = Object.getPrototypeOf(scope._p_target);
        el._parentSnapshot = {};
        for (let key in parentProto) {
            if (!key.startsWith('_p_')) {
                el._parentSnapshot[key] = parentProto[key];
            }
        }
        
        // Initialize local snapshot for tracking local variable changes
        const target = scope._p_target;
        el._localSnapshot = {};
        for (let key of Object.keys(target)) {
            if (!key.startsWith('_p_')) {
                el._localSnapshot[key] = target[key];
            }
        }
        
        return scope;
    },

    /**
     * Gets the stored scope for an element during refresh, re-executing p-scope if parent changed
     */
    refreshScope(el, parentScope) {
        let scope = el._scope;
        
        if (!scope) {
            return parentScope;
        }
        
        // Check if parent values changed - if so, selectively re-execute p-scope
        const pScopeExpr = el.getAttribute('p-scope');
        if (pScopeExpr && scope._p_target) {
            this.updateScopeFromParent(el, scope, pScopeExpr);
        }
        
        return scope;
    },

    /**
     * Parses and executes p-scope statements sequentially, setting values directly on target
     * Each statement sees the results of previous statements
     */
    executePScopeStatements(scope, pScopeExpr) {
        const statements = pScopeExpr.split(';').map(s => s.trim()).filter(s => s);
        const target = scope._p_target;
        
        // Create a sequential scope that always reads from target first (for updated values)
        // then falls back to the parent scope for inherited values
        const sequentialScope = new Proxy(target, {
            get: (t, key) => {
                // First check if we have a local value (possibly updated by previous statement)
                if (Object.prototype.hasOwnProperty.call(t, key)) {
                    return t[key];
                }
                // Fall back to parent scope via prototype chain or original scope
                return scope[key];
            },
            has: (t, key) => {
                return Object.prototype.hasOwnProperty.call(t, key) || key in scope;
            }
        });
        
        for (const stmt of statements) {
            const match = stmt.match(/^(\w+)\s*=\s*(.+)$/);
            if (match) {
                const [, varName, expr] = match;
                try {
                    const value = eval(`with (sequentialScope) { (${expr}) }`);
                    target[varName] = value;
                } catch (e) {
                    console.error(`Error executing p-scope statement "${stmt}":`, e);
                }
            }
        }
    },

    /**
     * Re-executes p-scope statements that depend on changed variables (parent or local)
     * Statements are executed sequentially so each sees results of previous ones
     */
    updateScopeFromParent(el, scope, pScopeExpr) {
        const parentProto = Object.getPrototypeOf(scope._p_target);
        const target = scope._p_target;
        
        // Track which variables changed in PARENT vs LOCAL separately
        const changedParentVars = new Set();
        const changedLocalVars = new Set();
        
        // Check parent variable changes
        if (!el._parentSnapshot) {
            el._parentSnapshot = {};
        }
        for (let key in parentProto) {
            if (!key.startsWith('_p_')) {
                if (el._parentSnapshot[key] !== parentProto[key]) {
                    changedParentVars.add(key);
                }
                el._parentSnapshot[key] = parentProto[key];
            }
        }
        
        // Check local variable changes (variables that are OWN properties of target)
        if (!el._localSnapshot) {
            el._localSnapshot = {};
        }
        for (let key of Object.keys(target)) {
            if (!key.startsWith('_p_')) {
                if (el._localSnapshot[key] !== target[key]) {
                    changedLocalVars.add(key);
                }
                el._localSnapshot[key] = target[key];
            }
        }
        
        // Combine for checking which statements to execute
        const allChangedVars = new Set([...changedParentVars, ...changedLocalVars]);
        
        if (allChangedVars.size === 0) return;
        
        try {
            const statements = pScopeExpr.split(';').map(s => s.trim()).filter(s => s);
            
            // Identify OUTPUT variables (variables SET by p-scope statements)
            // Local changes to these should NOT trigger re-execution
            const outputVars = new Set();
            statements.forEach(stmt => {
                const match = stmt.match(/^(\w+)\s*=\s*(.+)$/);
                if (match) {
                    outputVars.add(match[1]);
                }
            });
            
            // Track variables set during THIS re-execution pass
            const setInThisPass = new Set();
            
            // Create a sequential scope that:
            // - Uses values from this pass if already computed
            // - For PARENT-changed vars: reads from parent (new value)
            // - For LOCAL-changed vars: reads from local (new value)
            // - Otherwise: reads from local if exists, else parent
            const sequentialScope = new Proxy(target, {
                get: (t, key) => {
                    if (key === '_p_target' || key === '_p_children' || key === '_p_scope') {
                        return t[key];
                    }
                    // If this variable was set by a previous statement in this pass, use that
                    if (setInThisPass.has(key)) {
                        return t[key];
                    }
                    // If this variable changed in PARENT, read from parent (new value)
                    if (changedParentVars.has(key)) {
                        return parentProto[key];
                    }
                    // If this variable changed LOCALLY, read from local (new value)
                    if (changedLocalVars.has(key)) {
                        return t[key];
                    }
                    // Otherwise, read current value (local if exists, else parent)
                    if (Object.prototype.hasOwnProperty.call(t, key)) {
                        return t[key];
                    }
                    return parentProto[key];
                },
                set: (t, key, value) => {
                    t[key] = value;
                    return true;
                },
                has: (t, key) => {
                    return setInThisPass.has(key) || Object.prototype.hasOwnProperty.call(t, key) || key in parentProto;
                }
            });
            
            statements.forEach(stmt => {
                let shouldExecute = false;
                const parts = stmt.split('=');
                if (parts.length <= 1) return;
                const rhs = parts.slice(1).join('=');
                
                // Execute if RHS contains a PARENT-changed variable
                changedParentVars.forEach(varName => {
                    if (rhs.includes(varName)) {
                        shouldExecute = true;
                    }
                });
                
                // Execute if RHS contains a LOCAL-changed variable that is NOT an output var
                // (Local changes to output vars are user modifications that should stick)
                changedLocalVars.forEach(varName => {
                    if (!outputVars.has(varName) && rhs.includes(varName)) {
                        shouldExecute = true;
                    }
                });
                
                // Also execute if the statement depends on a variable set earlier in this pass
                if (!shouldExecute) {
                    setInThisPass.forEach(varName => {
                        if (rhs.includes(varName)) {
                            shouldExecute = true;
                        }
                    });
                }
                
                if (shouldExecute) {
                    const match = stmt.match(/^(\w+)\s*=\s*(.+)$/);
                    if (match) {
                        const [, varName, expr] = match;
                        const value = eval(`with (sequentialScope) { (${expr}) }`);
                        target[varName] = value;
                        setInThisPass.add(varName);
                    }
                }
            });
            
            // Update local snapshot with any newly computed values
            for (let key of Object.keys(target)) {
                if (!key.startsWith('_p_')) {
                    el._localSnapshot[key] = target[key];
                }
            }
        } catch (e) {
            console.error(`Error re-executing p-scope expression:`, e);
        }
    },

    // ==================== EVENT HANDLING ====================

    /**
     * Registers p-on:* event listeners on an element
     */
    registerEventListeners(el) {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('p-on:')) {
                const event = attr.name.replace('p-on:', '');
                el.addEventListener(event, () => {
                    eval(`with (el._scope) { ${attr.value} }`);
                    this.refreshAllLoops();
                });
            }
        });
    },

    /**
     * Sets up p-model two-way binding on an element
     */
    registerModelBinding(el) {
        const modelAttr = el.getAttribute('p-model');
        if (!modelAttr) return;
        
        el.addEventListener('input', (e) => {
            let value;
            const type = e.target.type;
            
            if (type === 'number' || type === 'range') {
                value = e.target.value === '' ? null : Number(e.target.value);
            } else if (type === 'checkbox') {
                value = e.target.checked;
            } else if (type === 'radio') {
                value = e.target.checked ? e.target.value : undefined;
            } else {
                value = e.target.value;
            }
            
            if (value !== undefined) {
                eval(`with (el._scope) { ${modelAttr} = value }`);
            }
        });
        
        // For checkbox and radio, also listen to 'change' event
        if (el.type === 'checkbox' || el.type === 'radio') {
            el.addEventListener('change', (e) => {
                let value;
                if (el.type === 'checkbox') {
                    value = e.target.checked;
                } else {
                    value = e.target.checked ? e.target.value : undefined;
                }
                if (value !== undefined) {
                    eval(`with (el._scope) { ${modelAttr} = value }`);
                }
            });
        }
    },

    // ==================== DIRECTIVE EVALUATION ====================

    /**
     * Evaluates all directives on an element
     */
    evaluateDirectives(el, scope) {
        Array.from(el.attributes).forEach(attr => {
            const parsed = this.parseDirectiveModifiers(attr.name);
            if (Object.keys(this.directives).includes(parsed.directive)) {
                const evalScope = el._scope || scope;
                const value = eval(`with (evalScope) { (${attr.value}) }`);
                this.directives[parsed.directive](el, value, parsed.modifiers);
            }
        });
    },

    // ==================== LOOP HANDLING ====================

    setForTemplateRecursive(element, template) {
        element._forTemplate = template;
        Array.from(element.children).forEach(child => {
            this.setForTemplateRecursive(child, template);
        });
    },

    refreshAllLoops(el = this.root) {
        if (el.tagName === 'TEMPLATE' && el.hasAttribute('p-for')) {
            this.handleFor(el, el._scope || this.data, false);
            return;
        }
        
        let child = el.firstElementChild;
        while (child) {
            this.refreshAllLoops(child);
            child = child.nextElementSibling;
        }
    },

    handleFor(template, parentScope, isHydrating) {
        const forExpr = template.getAttribute('p-for');
        const match = forExpr.match(/^(?:const|let)?\s*(.+?)\s+(of|in)\s+(.+)$/);
        
        if (!match) {
            console.error(`Invalid p-for expression: ${forExpr}`);
            return;
        }
        
        const [, varPattern, operator, iterableExpr] = match;
        
        if (isHydrating) {
            this.hydrateLoop(template, parentScope, varPattern, iterableExpr);
        } else {
            this.refreshLoop(template, parentScope, varPattern, iterableExpr);
        }
    },

    /**
     * Gets the scope prefix for a template based on its nesting level
     * Checks ancestors and siblings for parent p-for templates to build hierarchical key
     */
    getTemplateScopePrefix(template) {
        let ancestorKey = '';
        
        // First, check if this template has _forTemplate set (meaning it was rendered by an outer loop)
        // This is the most reliable indicator for nested templates
        if (template._forTemplate) {
            const parentForData = template._forTemplate._forData;
            if (parentForData && parentForData.scopePrefix) {
                // Find which iteration we're in by checking sibling elements
                let sibling = template.previousElementSibling;
                while (sibling) {
                    if (sibling.hasAttribute && sibling.hasAttribute('p-for-key')) {
                        const siblingKey = sibling.getAttribute('p-for-key');
                        ancestorKey = siblingKey + '-';
                        break;
                    }
                    sibling = sibling.previousElementSibling;
                }
            }
        }
        
        // If no _forTemplate, check previous siblings for p-for-key
        // This handles the case where template is adjacent to loop-rendered elements
        if (!ancestorKey) {
            let sibling = template.previousElementSibling;
            while (sibling) {
                if (sibling.hasAttribute && sibling.hasAttribute('p-for-key')) {
                    // Check if this sibling shares the same parent template
                    if (sibling._forTemplate === template._forTemplate) {
                        const siblingKey = sibling.getAttribute('p-for-key');
                        ancestorKey = siblingKey + '-';
                        break;
                    }
                }
                sibling = sibling.previousElementSibling;
            }
        }
        
        // Also check parent elements for p-for-key
        if (!ancestorKey) {
            let parent = template.parentElement;
            while (parent) {
                if (parent.hasAttribute && parent.hasAttribute('p-for-key')) {
                    const parentKey = parent.getAttribute('p-for-key');
                    ancestorKey = parentKey + '-';
                    break;
                }
                if (parent._forTemplate) {
                    const parentForData = parent._forTemplate._forData;
                    if (parentForData) {
                        const parentIndex = parentForData.renderedElements.indexOf(parent);
                        if (parentIndex >= 0) {
                            ancestorKey = (parentForData.scopePrefix || '') + parentIndex + '-';
                            break;
                        }
                    }
                }
                parent = parent.parentElement;
            }
        }
        
        // Generate a unique scope ID for this template
        if (!template._forScopeId) {
            template._forScopeId = 's' + (this._templateScopeCounter++);
        }
        
        return ancestorKey + template._forScopeId + ':';
    },

    hydrateLoop(template, parentScope, varPattern, iterableExpr) {
        template._scope = parentScope;
        
        try {
            const iterable = eval(`with (parentScope) { (${iterableExpr}) }`);
            
            // Get the scope prefix for this template's keys
            const scopePrefix = this.getTemplateScopePrefix(template);
            
            template._forData = {
                varPattern,
                iterableExpr,
                renderedElements: [],
                scopePrefix
            };
            
            // Check for SSR-rendered elements - only match those with our scope prefix
            const existingElementsByKey = {};
            let sibling = template.nextElementSibling;
            while (sibling && sibling.hasAttribute('p-for-key')) {
                const fullKey = sibling.getAttribute('p-for-key');
                
                // Check if this element belongs to this template (has our scope prefix)
                // or is an old-style unscoped key (for backwards compatibility)
                const isOurElement = fullKey.startsWith(scopePrefix) || 
                    (!fullKey.includes(':') && !fullKey.includes('-')); // unscoped legacy key
                
                if (isOurElement) {
                    // Extract the index part from the key
                    let indexKey;
                    if (fullKey.startsWith(scopePrefix)) {
                        indexKey = fullKey.substring(scopePrefix.length);
                    } else {
                        indexKey = fullKey; // legacy unscoped key
                    }
                    
                    if (!existingElementsByKey[indexKey]) {
                        existingElementsByKey[indexKey] = [];
                    }
                    existingElementsByKey[indexKey].push(sibling);
                }
                sibling = sibling.nextElementSibling;
            }
            
            let index = 0;
            let lastInserted = template;
            
            for (const item of iterable) {
                const loopScope = this.createLoopScope(parentScope, varPattern, item);
                
                if (existingElementsByKey[String(index)]) {
                    // Hydrate existing SSR elements
                    existingElementsByKey[String(index)].forEach(el => {
                        el._scope = loopScope;
                        this.setForTemplateRecursive(el, template);
                        // Update key to use scoped format
                        if (el.tagName !== 'TEMPLATE') {
                            el.setAttribute('p-for-key', scopePrefix + index);
                        }
                        this.walkDom(el, loopScope, true);
                        template._forData.renderedElements.push(el);
                        lastInserted = el;
                    });
                } else {
                    // Render from template
                    const clone = template.content.cloneNode(true);
                    const elements = Array.from(clone.children);
                    
                    elements.forEach(el => {
                        el._scope = loopScope;
                        this.setForTemplateRecursive(el, template);
                        // Only set p-for-key on non-template elements at this level
                        if (el.tagName !== 'TEMPLATE') {
                            el.setAttribute('p-for-key', scopePrefix + index);
                        }
                        this.walkDom(el, loopScope, true);
                    });
                    
                    // Insert elements after the last inserted element
                    const fragment = document.createDocumentFragment();
                    elements.forEach(el => fragment.appendChild(el));
                    lastInserted.parentNode.insertBefore(fragment, lastInserted.nextSibling);
                    
                    template._forData.renderedElements.push(...elements);
                    lastInserted = elements[elements.length - 1] || lastInserted;
                }
                
                index++;
            }
            
            // Remove extra SSR elements
            Object.keys(existingElementsByKey).forEach(key => {
                if (parseInt(key) >= index) {
                    existingElementsByKey[key].forEach(el => el.remove());
                }
            });
        } catch (e) {
            console.error(`Error in p-for hydration: ${iterableExpr}`, e);
        }
    },

    /**
     * Recursively removes elements and their nested loop contents
     */
    removeLoopElements(elements) {
        elements.forEach(el => {
            // If this element is a template with its own rendered elements, remove those first
            if (el._forData && el._forData.renderedElements) {
                this.removeLoopElements(el._forData.renderedElements);
                el._forData.renderedElements = [];
            }
            // Also check children for templates with rendered elements
            if (el.querySelectorAll) {
                const nestedTemplates = el.querySelectorAll('template[p-for]');
                nestedTemplates.forEach(tpl => {
                    if (tpl._forData && tpl._forData.renderedElements) {
                        this.removeLoopElements(tpl._forData.renderedElements);
                        tpl._forData.renderedElements = [];
                    }
                });
            }
            el.remove();
        });
    },

    refreshLoop(template, parentScope, varPattern, iterableExpr) {
        const forData = template._forData;
        if (!forData) return;
        
        try {
            const iterable = eval(`with (parentScope._p_target || parentScope) { (${iterableExpr}) }`);
            
            // Use stored scope prefix or regenerate if needed
            const scopePrefix = forData.scopePrefix || this.getTemplateScopePrefix(template);
            
            // Remove all elements (including nested loop elements) and re-render
            this.removeLoopElements(forData.renderedElements);
            forData.renderedElements = [];
            
            let index = 0;
            for (const item of iterable) {
                const clone = template.content.cloneNode(true);
                const loopScope = this.createLoopScope(parentScope, forData.varPattern, item);
                
                const elements = Array.from(clone.children);
                elements.forEach(el => {
                    el._scope = loopScope;
                    this.setForTemplateRecursive(el, template);
                    // Only set p-for-key on non-template elements
                    if (el.tagName !== 'TEMPLATE') {
                        el.setAttribute('p-for-key', scopePrefix + index);
                    }
                    this.walkDom(el, loopScope, true);
                });
                
                const insertAfter = forData.renderedElements[forData.renderedElements.length - 1] || template;
                const fragment = document.createDocumentFragment();
                elements.forEach(el => fragment.appendChild(el));
                insertAfter.parentNode.insertBefore(fragment, insertAfter.nextSibling);
                forData.renderedElements.push(...elements);
                index++;
            }
        } catch (e) {
            console.error(`Error in p-for refresh: ${iterableExpr}`, e);
        }
    },

    createLoopScope(parentScope, varPattern, item) {
        const loopData = {};
        varPattern = varPattern.trim();
        
        if (varPattern.startsWith('[')) {
            // Array destructuring: [i, cat]
            const vars = varPattern.slice(1, -1).split(',').map(v => v.trim());
            if (Array.isArray(item)) {
                vars.forEach((v, i) => loopData[v] = item[i]);
            } else {
                loopData[vars[0]] = item;
            }
        } else if (varPattern.startsWith('{')) {
            // Object destructuring: {name, age}
            const vars = varPattern.slice(1, -1).split(',').map(v => v.trim());
            vars.forEach(v => {
                const [key, alias] = v.split(':').map(s => s.trim());
                loopData[alias || key] = item[key];
            });
        } else {
            // Simple variable
            loopData[varPattern] = item;
        }
        
        if (!parentScope) {
            console.error('parentScope is undefined in createLoopScope');
            return new Proxy({}, { get: () => undefined, set: () => false });
        }
        
        const parentTarget = parentScope._p_target || parentScope;
        if (!parentTarget || typeof parentTarget !== 'object') {
            console.error('Invalid parentTarget:', parentTarget);
            return new Proxy(loopData, {
                get: (target, key) => target[key],
                set: (target, key, value) => { target[key] = value; return true; }
            });
        }
        
        const loopTarget = Object.create(parentTarget);
        Object.assign(loopTarget, loopData);
        
        const proxy = new Proxy(loopTarget, {
            get: (target, key) => target[key],
            set: (target, key, value) => {
                if (key in loopData) {
                    target[key] = value;
                } else {
                    parentTarget[key] = value;
                }
                return true;
            }
        });
        proxy._p_target = loopTarget;
        
        return proxy;
    },

    // ==================== MAIN DOM WALKER ====================

    /**
     * Walks the DOM tree, processing scopes, event handlers, and directives
     */
    walkDom(el, parentScope, isHydrating = false) {
        // Handle p-for templates separately
        if (el.tagName === 'TEMPLATE' && el.hasAttribute('p-for')) {
            this.handleFor(el, parentScope, isHydrating);
            return;
        }

        // Determine the scope for this element
        let currentScope = parentScope;
        
        if (el.hasAttribute('p-scope')) {
            if (isHydrating) {
                currentScope = this.initScope(el, parentScope);
            } else {
                currentScope = this.refreshScope(el, parentScope);
            }
        }

        // Store scope on element during hydration
        if (isHydrating) {
            el._scope = currentScope;
            this.registerEventListeners(el);
            this.registerModelBinding(el);
        }
        
        // Evaluate directives
        if (currentScope) {
            this.evaluateDirectives(el, currentScope);
        }

        // Recurse to children
        let child = el.firstElementChild;
        while (child) {
            this.walkDom(child, currentScope, isHydrating);
            child = child.nextElementSibling;
        }
    }
}

window.Pattr.start()
