import{G as I,S as h,i as j,s as y,l as d,u as k,a as S,e as N,m as E,p as g,v as $,h as p,c as C,b as u,H as P,w as R,n as q,I as z}from"../chunks/index-d44c3c93.js";const A=()=>{const t=I("__svelte__");return{page:{subscribe:t.page.subscribe},navigating:{subscribe:t.navigating.subscribe},get preloading(){return console.error("stores.preloading is deprecated; use stores.navigating instead"),{subscribe:t.navigating.subscribe}},session:t.session,updated:t.updated}},B={subscribe(t){return A().page.subscribe(t)}};function w(t){let r,i=t[0].error.frame+"",l;return{c(){r=d("pre"),l=k(i)},l(s){r=E(s,"PRE",{});var a=g(r);l=$(a,i),a.forEach(p)},m(s,a){u(s,r,a),P(r,l)},p(s,a){a&1&&i!==(i=s[0].error.frame+"")&&R(l,i)},d(s){s&&p(r)}}}function G(t){let r,i=t[0].error.stack+"",l;return{c(){r=d("pre"),l=k(i)},l(s){r=E(s,"PRE",{});var a=g(r);l=$(a,i),a.forEach(p)},m(s,a){u(s,r,a),P(r,l)},p(s,a){a&1&&i!==(i=s[0].error.stack+"")&&R(l,i)},d(s){s&&p(r)}}}function D(t){let r,i=t[0].status+"",l,s,a,m=t[0].error.message+"",b,v,_,c,o=t[0].error.frame&&w(t),f=t[0].error.stack&&G(t);return{c(){r=d("h1"),l=k(i),s=S(),a=d("pre"),b=k(m),v=S(),o&&o.c(),_=S(),f&&f.c(),c=N()},l(e){r=E(e,"H1",{});var n=g(r);l=$(n,i),n.forEach(p),s=C(e),a=E(e,"PRE",{});var H=g(a);b=$(H,m),H.forEach(p),v=C(e),o&&o.l(e),_=C(e),f&&f.l(e),c=N()},m(e,n){u(e,r,n),P(r,l),u(e,s,n),u(e,a,n),P(a,b),u(e,v,n),o&&o.m(e,n),u(e,_,n),f&&f.m(e,n),u(e,c,n)},p(e,[n]){n&1&&i!==(i=e[0].status+"")&&R(l,i),n&1&&m!==(m=e[0].error.message+"")&&R(b,m),e[0].error.frame?o?o.p(e,n):(o=w(e),o.c(),o.m(_.parentNode,_)):o&&(o.d(1),o=null),e[0].error.stack?f?f.p(e,n):(f=G(e),f.c(),f.m(c.parentNode,c)):f&&(f.d(1),f=null)},i:q,o:q,d(e){e&&p(r),e&&p(s),e&&p(a),e&&p(v),o&&o.d(e),e&&p(_),f&&f.d(e),e&&p(c)}}}function F(t,r,i){let l;return z(t,B,s=>i(0,l=s)),[l]}class K extends h{constructor(r){super(),j(this,r,F,D,y,{})}}export{K as default};
