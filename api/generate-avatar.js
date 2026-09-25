import { generateImage } from "ai";

export const config = { maxDuration: 60 };

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Método não permitido."});
  try{
    const {photo,name}=req.body||{};
    if(typeof photo!=="string"||!photo.startsWith("data:image/")||photo.length>600000) return res.status(400).json({error:"Escolha uma foto válida e enquadre o rosto."});
    const m=photo.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if(!m) return res.status(400).json({error:"Formato de foto inválido."});
    const image=Buffer.from(m[2],"base64");
    const child=String(name||"criança").slice(0,40);
    const result=await generateImage({
      model:"openai/gpt-image-2.5-sunburst",
      prompt:{
        text:`Crie um avatar infantil 3D/cartoon alegre e amigável para um aplicativo de tarefas chamado Missões Divertidas, usando a foto enviada como referência da mesma criança. Preserve de forma reconhecível características visuais não sensíveis como cabelo, formato geral do rosto, olhos e sorriso. Não tente inferir etnia, saúde, personalidade ou qualquer atributo sensível. Personagem: ${child}. Meio-corpo, olhando para a câmera, sorriso natural, roupa infantil colorida em roxo/rosa/azul sem marcas, iluminação suave, acabamento 3D polido, fundo simples em degradê lilás, composição quadrada centralizada, sem texto, sem logotipos, sem objetos cobrindo o rosto. Adequado para ícone de perfil e cartinhas de conquista.`,
        images:[image]
      },
      aspectRatio:"1:1",
      size:"1024x1024"
    });
    const b64=result.image?.base64;
    if(!b64) throw new Error("A geração não retornou imagem.");
    return res.status(200).json({avatar:`data:image/png;base64,${b64}`});
  }catch(e){
    console.error("avatar-generation",e);
    return res.status(500).json({error:"Não foi possível criar o avatar agora. Tente novamente."});
  }
}