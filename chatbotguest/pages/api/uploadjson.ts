import { DataQnA } from "@/types/chat";
import { insertQnA } from "@/utils/elastic";

export const config = {
  runtime: 'edge',
  unstable_allowDynamic: [
    '/node_modules/fuzzball/dist/esm/fuzzball.esm.min.js'
  ],
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { qna, pass } = await req.json() as DataQnA;
    if (pass === "Huy@GptPhat.ComA1!a12zuqnahjCA"){
        await insertQnA(qna);
        return new Response(JSON.stringify({ status: "success" }));
    }
    return new Response(JSON.stringify({ status: "fail", error: "Sai pass" }));
    
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ status: "fail", error: "Error" }));
  }
}
export default handler;
