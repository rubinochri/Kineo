(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/AxiosConfig.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AxiosConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function AxiosConfig() {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AxiosConfig.useEffect": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                const token = localStorage.getItem('token');
                if (token) {
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
                const requestInterceptor = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].interceptors.request.use({
                    "AxiosConfig.useEffect.use[requestInterceptor]": (config)=>{
                        const currentToken = localStorage.getItem('token');
                        if (currentToken) {
                            config.headers['Authorization'] = `Bearer ${currentToken}`;
                        }
                        return config;
                    }
                }["AxiosConfig.useEffect.use[requestInterceptor]"], {
                    "AxiosConfig.useEffect.use[requestInterceptor]": (error)=>{
                        return Promise.reject(error);
                    }
                }["AxiosConfig.useEffect.use[requestInterceptor]"]);
                return ({
                    "AxiosConfig.useEffect": ()=>{
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].interceptors.request.eject(requestInterceptor);
                    }
                })["AxiosConfig.useEffect"];
            }
        }
    }["AxiosConfig.useEffect"], []);
    return null;
}
_s(AxiosConfig, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = AxiosConfig;
var _c;
__turbopack_context__.k.register(_c, "AxiosConfig");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_AxiosConfig_jsx_4838a79f._.js.map