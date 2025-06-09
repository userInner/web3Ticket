const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-BktxNOD4.js","assets/index-BDy7B_8U.js","assets/index-DgRjttpD.css"])))=>i.map(i=>d[i]);
import{i as C,a as k,M as n,A as w,O as b,b as S,E as x,x as A,R as p,_ as g,T as E,U as O,c as _,S as L,C as m,r as c,d as T}from"./index-BDy7B_8U.js";const N=C`
  :host {
    z-index: var(--w3m-z-index);
    display: block;
    backface-visibility: hidden;
    will-change: opacity;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    opacity: 0;
    background-color: var(--wui-cover);
    transition: opacity 0.2s var(--wui-ease-out-power-2);
    will-change: opacity;
  }

  :host(.open) {
    opacity: 1;
  }

  wui-card {
    max-width: var(--w3m-modal-width);
    width: 100%;
    position: relative;
    animation: zoom-in 0.2s var(--wui-ease-out-power-2);
    animation-fill-mode: backwards;
    outline: none;
  }

  wui-card[shake='true'] {
    animation:
      zoom-in 0.2s var(--wui-ease-out-power-2),
      w3m-shake 0.5s var(--wui-ease-out-power-2);
  }

  wui-flex {
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    wui-flex {
      align-items: flex-start;
    }

    wui-card {
      margin: var(--wui-spacing-xxl) 0px;
    }
  }

  @media (max-width: 430px) {
    wui-flex {
      align-items: flex-end;
    }

    wui-card {
      max-width: 100%;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-bottom: none;
      animation: slide-in 0.2s var(--wui-ease-out-power-2);
    }

    wui-card[shake='true'] {
      animation:
        slide-in 0.2s var(--wui-ease-out-power-2),
        w3m-shake 0.5s var(--wui-ease-out-power-2);
    }
  }

  @keyframes zoom-in {
    0% {
      transform: scale(0.95) translateY(0);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes slide-in {
    0% {
      transform: scale(1) translateY(50px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes w3m-shake {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1) rotate(-1deg);
    }
    40% {
      transform: scale(1) rotate(1.5deg);
    }
    60% {
      transform: scale(1) rotate(-1.5deg);
    }
    80% {
      transform: scale(1) rotate(1deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes w3m-view-height {
    from {
      height: var(--prev-height);
    }
    to {
      height: var(--new-height);
    }
  }
`;var l=function(u,e,t,o){var s=arguments.length,i=s<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(u,e,t,o);else for(var d=u.length-1;d>=0;d--)(r=u[d])&&(i=(s<3?r(i):s>3?r(e,t,i):r(e,t))||i);return s>3&&i&&Object.defineProperty(e,t,i),i};const v="scroll-lock";let a=class extends k{constructor(){super(),this.unsubscribe=[],this.abortController=void 0,this.open=n.state.open,this.caipAddress=w.state.caipAddress,this.isSiweEnabled=b.state.isSiweEnabled,this.connected=w.state.isConnected,this.loading=n.state.loading,this.shake=n.state.shake,this.initializeTheming(),S.prefetch(),this.unsubscribe.push(n.subscribeKey("open",e=>e?this.onOpen():this.onClose()),n.subscribeKey("shake",e=>this.shake=e),n.subscribeKey("loading",e=>{this.loading=e,this.onNewAddress(w.state.caipAddress)}),w.subscribeKey("isConnected",e=>this.connected=e),w.subscribeKey("caipAddress",e=>this.onNewAddress(e)),b.subscribeKey("isSiweEnabled",e=>this.isSiweEnabled=e)),x.sendEvent({type:"track",event:"MODAL_LOADED"})}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.onRemoveKeyboardListener()}render(){return this.open?A`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            <wui-card
              shake="${this.shake}"
              role="alertdialog"
              aria-modal="true"
              tabindex="0"
              data-testid="w3m-modal-card"
            >
              <w3m-header></w3m-header>
              <w3m-router></w3m-router>
              <w3m-snackbar></w3m-snackbar>
            </wui-card>
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `:null}async onOverlayClick(e){e.target===e.currentTarget&&await this.handleClose()}async handleClose(){const e=p.state.view==="ConnectingSiwe",t=p.state.view==="ApproveTransaction";if(this.isSiweEnabled){const{SIWEController:o}=await g(async()=>{const{SIWEController:i}=await import("./index-BktxNOD4.js");return{SIWEController:i}},__vite__mapDeps([0,1,2]));o.state.status!=="success"&&(e||t)?n.shake():n.close()}else n.close()}initializeTheming(){const{themeVariables:e,themeMode:t}=E.state,o=O.getColorTheme(t);_(e,o)}onClose(){this.open=!1,this.classList.remove("open"),this.onScrollUnlock(),L.hide(),this.onRemoveKeyboardListener()}onOpen(){this.open=!0,this.classList.add("open"),this.onScrollLock(),this.onAddKeyboardListener()}onScrollLock(){const e=document.createElement("style");e.dataset.w3m=v,e.textContent=`
      body {
        touch-action: none;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      w3m-modal {
        pointer-events: auto;
      }
    `,document.head.appendChild(e)}onScrollUnlock(){const e=document.head.querySelector(`style[data-w3m="${v}"]`);e&&e.remove()}onAddKeyboardListener(){var t;this.abortController=new AbortController;const e=(t=this.shadowRoot)==null?void 0:t.querySelector("wui-card");e==null||e.focus(),window.addEventListener("keydown",o=>{if(o.key==="Escape")this.handleClose();else if(o.key==="Tab"){const{tagName:s}=o.target;s&&!s.includes("W3M-")&&!s.includes("WUI-")&&(e==null||e.focus())}},this.abortController)}onRemoveKeyboardListener(){var e;(e=this.abortController)==null||e.abort(),this.abortController=void 0}async onNewAddress(e){var r,d;if(!this.connected||this.loading)return;const t=m.getPlainAddress(this.caipAddress),o=m.getPlainAddress(e),s=m.getNetworkId(this.caipAddress),i=m.getNetworkId(e);if(this.caipAddress=e,this.isSiweEnabled){const{SIWEController:h}=await g(async()=>{const{SIWEController:y}=await import("./index-BktxNOD4.js");return{SIWEController:y}},__vite__mapDeps([0,1,2])),f=await h.getSession();if(f&&t&&o&&t!==o){(r=h.state._client)!=null&&r.options.signOutOnAccountChange&&(await h.signOut(),this.onSiweNavigation());return}if(f&&s&&i&&s!==i){(d=h.state._client)!=null&&d.options.signOutOnNetworkChange&&(await h.signOut(),this.onSiweNavigation());return}this.onSiweNavigation()}}onSiweNavigation(){this.open?p.push("ConnectingSiwe"):n.open({view:"ConnectingSiwe"})}};a.styles=N;l([c()],a.prototype,"open",void 0);l([c()],a.prototype,"caipAddress",void 0);l([c()],a.prototype,"isSiweEnabled",void 0);l([c()],a.prototype,"connected",void 0);l([c()],a.prototype,"loading",void 0);l([c()],a.prototype,"shake",void 0);a=l([T("w3m-modal")],a);export{a as W3mModal};
