export const config = { maxDuration: 60 };

function parseDataUrl(photo){
  const m=String(photo||"").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if(!m)return null;
  return {mime:m[1],bytes:Buffer.from(m[2],"base64")};
}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Método não permitido."});
  try{
    const token=process.env.CLOUDFLARE_AI_TOKEN;
    const account=process.env.CLOUDFLARE_ACCOUNT_ID;
    if(!token||!account)throw new Error("Cloudflare Workers AI não configurado.");
    const {photo,name,mode,rarity,title,theme,catalog_no}=req.body||{};
    if(typeof photo!=="string"||!photo.startsWith("data:image/")||photo.length>600000)return res.status(400).json({error:"Escolha uma foto válida e enquadre o rosto."});
    const parsed=parseDataUrl(photo);if(!parsed)return res.status(400).json({error:"Formato de foto inválido."});
    const child=String(name||"criança").slice(0,40);
    const form=new FormData();
    const gallery=mode==="gallery";
    const card=mode==="card";
    const expressions=mode==="expressions",stickers=mode==="stickers",outfits=mode==="outfits";
    const style="3D cartoon premium semi-realista, acabamento polido de animação cinematográfica, olhos grandes expressivos porém naturais, cabelo muito detalhado com reflexos roxos sutis, iluminação neon roxa e rosa suave, visual moderno infantil/juvenil, roupa urbana preta e roxa sem marcas, tênis branco e roxo, proporções de personagem de corpo inteiro, alta consistência facial";
    const prompt=card
      ? `Crie SOMENTE A ILUSTRAÇÃO CENTRAL de uma cartinha colecionável do aplicativo Missões Divertidas, usando a MESMA criança da referência e preservando rosto, cabelo e identidade visual. Tema da cartinha: ${String(title||theme||"Conquista").slice(0,60)}. Número da coleção: #${String(catalog_no||"").padStart(2,"0")}. Raridade: ${rarity==="legendary"?"LENDÁRIA, iluminação dourada premium":rarity==="special"?"ESPECIAL, iluminação rosa/magenta brilhante":"NORMAL, iluminação azul/roxa neon"}. Estilo obrigatório: ${style}. A pose, acessórios e cenário devem representar claramente o tema, com composição vertical, personagem em destaque e fundo rico e divertido. NÃO crie moldura, NÃO escreva palavras, números, estrelas, marcas ou logotipos: o aplicativo aplicará por cima o template visual oficial aprovado.`
      : gallery
      ? `Crie uma FOLHA DE PERSONAGEM quadrada com a MESMA criança da imagem de referência, mantendo identidade facial, cabelo, olhos e aparência reconhecível em todos os quadros. Estilo obrigatório: ${style}. Organize uma grade limpa 3x3, SEM TEXTO: 1 frente corpo inteiro, 2 perfil/lado, 3 costas/3-4, 4 apontando, 5 joinha, 6 sinal de paz, 7 braços cruzados confiante, 8 comemorando com braços levantados, 9 estudando com livro. Fundo claro/lilás uniforme, cada quadro bem separado, personagem inteiro quando aplicável. Nome do perfil apenas como contexto: ${child}. Não infira atributos sensíveis. Não inclua palavras, logotipos ou marcas.`
      : expressions
      ? `Crie uma folha quadrada 3x3 de EXPRESSÕES com a MESMA criança da imagem de referência, mantendo rosto, cabelo, roupa e identidade consistentes em todos os quadros. Estilo obrigatório: ${style}. Mostrar sorriso, piscada, surpresa, pensativo(a), confiante, bravo(a), rindo, triste e tranquilo(a). Fundo claro/lilás uniforme, sem texto, sem marcas.`
      : stickers
      ? `Crie uma folha quadrada 3x3 de FIGURINHAS/EMOJIS com a MESMA criança da imagem de referência, mantendo identidade e roupa consistentes. Estilo obrigatório: ${style}. Poses: oi/aceno, bom dia, boa noite, valeu/joinha, top, bora, foco, tchau, comemoração. Fundo transparente aparente ou branco limpo, contorno de sticker, sem palavras nem marcas.`
      : outfits
      ? `Crie uma folha quadrada 2x3 de LOOKS com a MESMA criança da imagem de referência, mantendo rosto, cabelo e identidade consistentes. Estilo obrigatório: ${style}. Mostrar 6 looks: casual preto/roxo, esportivo, escola, moletom, viagem e festa. Corpo inteiro, fundo claro, sem texto, sem logotipos.`
      : `Transforme a criança da imagem de referência em um avatar oficial do aplicativo Missões Divertidas. Preserve de forma reconhecível características visuais não sensíveis, especialmente cabelo, formato geral do rosto, olhos e sorriso. Estilo obrigatório: ${style}. Nome do perfil: ${child}. Corpo inteiro em pose alegre e confiante, olhando para a câmera, fundo simples em degradê lilás, composição quadrada centralizada, sem texto, sem logotipos. Não infira etnia, saúde, personalidade ou atributos sensíveis.`;
    form.append("prompt",prompt);
    form.append("width","512");form.append("height","512");
    form.append("input_image_0",new Blob([parsed.bytes],{type:parsed.mime}),"reference.jpg");
    const url=`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`;
    const cf=await fetch(url,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:form});
    const ct=cf.headers.get("content-type")||"";
    let b64="";
    if(ct.includes("application/json")){
      const out=await cf.json();
      if(!cf.ok||out.success===false)throw new Error(out?.errors?.[0]?.message||out?.result?.error||"Falha no Workers AI.");
      b64=out?.result?.image||out?.image||"";
    }else{
      if(!cf.ok)throw new Error("Falha no Workers AI.");
      const buf=Buffer.from(await cf.arrayBuffer());b64=buf.toString("base64");
    }
    if(!b64)throw new Error("A geração não retornou imagem.");
    return res.status(200).json({avatar:`data:image/jpeg;base64,${b64}`,provider:"cloudflare-workers-ai"});
  }catch(e){
    console.error("avatar-generation",e);
    return res.status(500).json({error:"Não foi possível criar o avatar agora. Tente novamente."});
  }
}