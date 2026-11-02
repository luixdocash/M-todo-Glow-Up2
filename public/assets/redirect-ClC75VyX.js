function i(o){const n=window.location.search;if(!n){window.location.href=o;return}const r=o.includes("?")?"&":"?";window.location.href=o+r+n.slice(1)}export{i as r};
