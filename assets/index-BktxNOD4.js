import{p as A,f as v,O as C,s as E,g as T,i as I,d as y,a as _,A as l,x as b,r as x,M as S,E as d,N as g,W as p,S as m,h as N,R as O}from"./index-BDy7B_8U.js";import{J as P,Y as z,G as D}from"./index-BDy7B_8U.js";const s=A({status:"uninitialized"}),u={state:s,subscribeKey(t,e){return T(s,t,e)},subscribe(t){return E(s,()=>t(s))},_getClient(){if(!s._client)throw new Error("SIWEController client not set");return s._client},async getNonce(t){const n=await this._getClient().getNonce(t);return this.setNonce(n),n},async getSession(){try{const e=await this._getClient().getSession();return e&&(this.setSession(e),this.setStatus("success")),e}catch{return}},createMessage(t){const n=this._getClient().createMessage(t);return this.setMessage(n),n},async verifyMessage(t){return await this._getClient().verifyMessage(t)},async signIn(){return await this._getClient().signIn()},async signOut(){var e;const t=this._getClient();await t.signOut(),this.setStatus("ready"),this.setSession(void 0),(e=t.onSignOut)==null||e.call(t)},onSignIn(t){var n;const e=this._getClient();(n=e.onSignIn)==null||n.call(e,t)},onSignOut(){var e;const t=this._getClient();(e=t.onSignOut)==null||e.call(t)},setSIWEClient(t){s._client=v(t),s.status="ready",C.setIsSiweEnabled(t.options.enabled)},setNonce(t){s.nonce=t},setStatus(t){s.status=t},setMessage(t){s.message=t},setSession(t){s.session=t,s.status=t?"success":"ready"}},R=I`
  :host {
    display: flex;
    justify-content: center;
    gap: var(--wui-spacing-2xl);
  }

  wui-visual-thumbnail:nth-child(1) {
    z-index: 1;
  }
`;var U=function(t,e,n,a){var r=arguments.length,i=r<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,n):a,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,a);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(i=(r<3?o(i):r>3?o(e,n,i):o(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let w=class extends _{constructor(){var e,n;super(...arguments),this.dappImageUrl=(e=C.state.metadata)==null?void 0:e.icons,this.walletImageUrl=(n=l.state.connectedWalletInfo)==null?void 0:n.icon}firstUpdated(){var n;const e=(n=this.shadowRoot)==null?void 0:n.querySelectorAll("wui-visual-thumbnail");e!=null&&e[0]&&this.createAnimation(e[0],"translate(18px)"),e!=null&&e[1]&&this.createAnimation(e[1],"translate(-18px)")}render(){var e;return b`
      <wui-visual-thumbnail
        ?borderRadiusFull=${!0}
        .imageSrc=${(e=this.dappImageUrl)==null?void 0:e[0]}
      ></wui-visual-thumbnail>
      <wui-visual-thumbnail .imageSrc=${this.walletImageUrl}></wui-visual-thumbnail>
    `}createAnimation(e,n){e.animate([{transform:"translateX(0px)"},{transform:n}],{duration:1600,easing:"cubic-bezier(0.56, 0, 0.48, 1)",direction:"alternate",iterations:1/0})}};w.styles=R;w=U([y("w3m-connecting-siwe")],w);var h=function(t,e,n,a){var r=arguments.length,i=r<3?e:a===null?a=Object.getOwnPropertyDescriptor(e,n):a,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")i=Reflect.decorate(t,e,n,a);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(i=(r<3?o(i):r>3?o(e,n,i):o(e,n))||i);return r>3&&i&&Object.defineProperty(e,n,i),i};let f=class extends _{constructor(){var e;super(...arguments),this.dappName=(e=C.state.metadata)==null?void 0:e.name,this.isSigning=!1,this.isCancelling=!1}render(){return this.onRender(),b`
      <wui-flex justifyContent="center" .padding=${["2xl","0","xxl","0"]}>
        <w3m-connecting-siwe></w3m-connecting-siwe>
      </wui-flex>
      <wui-flex
        .padding=${["0","4xl","l","4xl"]}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="paragraph-500" align="center" color="fg-100"
          >${this.dappName??"Dapp"} needs to connect to your wallet</wui-text
        >
      </wui-flex>
      <wui-flex
        .padding=${["0","3xl","l","3xl"]}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="small-400" align="center" color="fg-200"
          >Sign this message to prove you own this wallet and proceed. Canceling will disconnect
          you.</wui-text
        >
      </wui-flex>
      <wui-flex .padding=${["l","xl","xl","xl"]} gap="s" justifyContent="space-between">
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="neutral"
          ?loading=${this.isCancelling}
          @click=${this.onCancel.bind(this)}
          data-testid="w3m-connecting-siwe-cancel"
        >
          Cancel
        </wui-button>
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="main"
          @click=${this.onSign.bind(this)}
          ?loading=${this.isSigning}
          data-testid="w3m-connecting-siwe-sign"
        >
          ${this.isSigning?"Signing...":"Sign"}
        </wui-button>
      </wui-flex>
    `}onRender(){u.state.session&&S.close()}async onSign(){var e,n,a;this.isSigning=!0,d.sendEvent({event:"CLICK_SIGN_SIWE_MESSAGE",type:"track",properties:{network:((e=g.state.caipNetwork)==null?void 0:e.id)||"",isSmartAccount:l.state.preferredAccountType===p.ACCOUNT_TYPES.SMART_ACCOUNT}});try{u.setStatus("loading");const r=await u.signIn();return u.setStatus("success"),d.sendEvent({event:"SIWE_AUTH_SUCCESS",type:"track",properties:{network:((n=g.state.caipNetwork)==null?void 0:n.id)||"",isSmartAccount:l.state.preferredAccountType===p.ACCOUNT_TYPES.SMART_ACCOUNT}}),r}catch{const o=l.state.preferredAccountType===p.ACCOUNT_TYPES.SMART_ACCOUNT;return o?m.showError("This application might not support Smart Accounts"):m.showError("Signature declined"),u.setStatus("error"),d.sendEvent({event:"SIWE_AUTH_ERROR",type:"track",properties:{network:((a=g.state.caipNetwork)==null?void 0:a.id)||"",isSmartAccount:o}})}finally{this.isSigning=!1}}async onCancel(){var n;this.isCancelling=!0,l.state.isConnected?(await N.disconnect(),S.close()):O.push("Connect"),this.isCancelling=!1,d.sendEvent({event:"CLICK_CANCEL_SIWE",type:"track",properties:{network:((n=g.state.caipNetwork)==null?void 0:n.id)||"",isSmartAccount:l.state.preferredAccountType===p.ACCOUNT_TYPES.SMART_ACCOUNT}})}};h([x()],f.prototype,"isSigning",void 0);h([x()],f.prototype,"isCancelling",void 0);f=h([y("w3m-connecting-siwe-view")],f);export{u as SIWEController,w as W3mConnectingSiwe,f as W3mConnectingSiweView,P as formatMessage,z as getDidAddress,D as getDidChainId};
