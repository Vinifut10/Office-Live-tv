window.MissoesRegister = {
  render(error=""){
    const root=document.getElementById("root");
    root.innerHTML='<div class="login-shell"><div class="login"><div class="logo-bubble">✨</div><h1>Criar minha conta</h1><p class="subtitle">Crie sua família e os acessos sem precisar de e-mail.</p><div class="field"><label>Nome da família</label><input id="regFamily" placeholder="Ex.: Família Moreira"></div><div class="row2"><div class="field"><label>Responsável</label><input id="regParentName"></div><div class="field"><label>Criança</label><input id="regChildName"></div></div><h3>👨‍👩‍👧 Responsável</h3><div class="row2"><div class="field"><label>Usuário</label><input id="regParentUser"></div><div class="field"><label>Senha</label><input id="regParentPass" type="password"></div></div><h3>🧒 Criança</h3><div class="row2"><div class="field"><label>Usuário</label><input id="regChildUser"></div><div class="field"><label>Senha</label><input id="regChildPass" type="password"></div></div><button class="primary" id="registerBtn">Criar família 🎉</button><button class="secondary" id="backLogin" style="width:100%;margin-top:10px">← Já tenho conta</button><div class="error" id="regError" style="'+(error?'display:block':'')+'">'+error+'</div></div></div>';
    document.getElementById("backLogin").onclick=()=>renderLogin();
    document.getElementById("registerBtn").onclick=this.submit;
  },
  async submit(){
    const payload={family_name:regFamily.value,parent_name:regParentName.value,child_name:regChildName.value,parent_username:regParentUser.value,parent_password:regParentPass.value,child_username:regChildUser.value,child_password:regChildPass.value};
    showLoader(true);
    try{const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error("O cadastro demorou demais. Tente novamente.")),15000));await Promise.race([callApi("register",payload),timeout]);toast("Família criada! 🎉");renderLogin()}
    catch(e){window.MissoesRegister.render(e.message)}
    finally{showLoader(false)}
  }
};