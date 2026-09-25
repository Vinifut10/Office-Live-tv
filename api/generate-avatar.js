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
    const {photo,name}=req.body||{};
    if(typeof photo!=="string"||!photo.startsWith("data:image/")||photo.length>600000)return res.status(400).json({error:"Escolha uma foto válida e enquadre o rosto."});
    const parsed=parseDataUrl(photo);if(!parsed)return res.status(400).json({error:"Formato de foto inválido."});
    const child=String(name||"criança").slice(0,40);
    const form=new FormData();
    form.append("prompt",`Transforme a criança da imagem de referência em um avatar infantil 3D/cartoon alegre e amigável para o aplicativo Missões Divertidas. Preserve de forma reconhecível características visuais não sensíveis da mesma criança, especialmente cabelo, formato geral do rosto, olhos e sorriso. Não infira etnia, saúde, personalidade ou atributos sensíveis. Nome do perfil: ${child}. Meio-corpo, olhando para a câmera, sorriso natural, roupa infantil colorida em roxo, rosa e azul sem marcas, iluminação suave, acabamento 3D polido, fundo simples em degradê lilás, composição quadrada centralizada, sem texto, sem logotipos e sem objetos cobrindo o rosto.`);
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