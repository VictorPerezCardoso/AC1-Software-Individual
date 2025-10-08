
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, Resource } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getLearningResources = async (topic: string): Promise<Resource[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            // A nova instrução pede um objeto JSON para maior robustez na análise.
            contents: `Com base nos resultados da busca sobre o tópico "${topic}", gere uma descrição curta e informativa para cada um dos 5 principais resultados encontrados. A descrição deve ter no máximo 2 frases. Formate sua resposta EXCLUSIVAMENTE como um objeto JSON com uma única chave "descriptions", que contém um array de strings. Cada string no array deve ser uma descrição. NÃO inclua nenhum texto ou formatação markdown antes ou depois do objeto JSON. Exemplo de saída: {"descriptions": ["Descrição do primeiro link.", "Descrição do segundo link."]}.`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        
        // Etapa 1: Obter os dados de busca diretamente dos metadados para garantir URIs corretas.
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (!groundingChunks || groundingChunks.length === 0) {
            throw new Error("A busca do Google não retornou resultados para este tópico.");
        }
        
        const searchResults = groundingChunks
            .map(chunk => chunk.web)
            .filter(web => web && web.uri && web.title); // Filtra para garantir que temos dados válidos.

        // Etapa 2: Obter as descrições geradas pela IA a partir do texto da resposta.
        const rawText = response.text.trim();
        
        // Lógica de extração de JSON aprimorada para ser mais resiliente
        let jsonString = rawText;
        const jsonStartIndex = jsonString.indexOf('{');
        const jsonEndIndex = jsonString.lastIndexOf('}');

        if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex < jsonStartIndex) {
            console.error("Could not find a valid JSON object in the response:", rawText);
            throw new Error("A resposta da IA não continha um objeto JSON de descrições válido.");
        }

        jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
        
        const parsedJson = JSON.parse(jsonString);
        
        if (!parsedJson.descriptions || !Array.isArray(parsedJson.descriptions) || parsedJson.descriptions.some(d => typeof d !== 'string')) {
             throw new Error("A IA não retornou um objeto com a chave 'descriptions' contendo um array de strings.");
        }

        const descriptions: string[] = parsedJson.descriptions;


        // Etapa 3: Combinar os resultados da busca com as descrições geradas.
        const resources: Resource[] = [];
        const count = Math.min(searchResults.length, descriptions.length); // Garante que não haja erro de índice.

        for (let i = 0; i < count; i++) {
            resources.push({
                title: searchResults[i].title!,
                uri: searchResults[i].uri!,
                description: descriptions[i],
            });
        }
        
        if (resources.length === 0) {
            throw new Error("Não foi possível combinar os resultados da busca com as descrições.");
        }

        return resources;

    } catch (error) {
        console.error("Error fetching learning resources:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Falha ao processar a resposta da IA. O formato do JSON retornado é inválido.");
        }
        // Repassa a mensagem de erro original se for específica, senão, uma genérica.
        const errorMessage = error instanceof Error ? error.message : `Falha ao buscar recursos de aprendizado.`;
        throw new Error(errorMessage);
    }
};


export const generateQuiz = async (topic: string, resources: Resource[], difficulty: 'normal' | 'hard' = 'normal'): Promise<QuizQuestion[]> => {
    try {
        // Cria um contexto com base nos recursos salvos pelo usuário.
        const resourcesContext = resources.map(r => `Título: ${r.title}, Descrição: ${r.description}`).join('\n');

        let difficultyInstruction: string;
        if (difficulty === 'hard') {
            difficultyInstruction = "As perguntas devem ser difíceis, testando conceitos avançados, casos de borda e a aplicação prática das informações. Evite perguntas triviais.";
        } else {
            difficultyInstruction = "As perguntas devem testar conceitos fundamentais.";
        }

        // Se nenhum recurso foi salvo, gera um quiz genérico sobre o tema.
        // Caso contrário, baseia as perguntas nos recursos.
        const prompt = resources.length > 0
            ? `Gere um quiz de múltipla escolha com 10 perguntas sobre o tópico "${topic}". As perguntas devem ser estritamente baseadas nos seguintes recursos que o usuário salvou para estudo:\n\n${resourcesContext}\n\nCada pergunta deve ter 4 opções e uma resposta correta. ${difficultyInstruction}`
            : `Gere um quiz de múltipla escolha com 10 perguntas sobre "${topic}". Cada pergunta deve ter 4 opções. ${difficultyInstruction}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            correctAnswer: { type: Type.STRING }
                        },
                        required: ["question", "options", "correctAnswer"],
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        const quizData = JSON.parse(jsonText);
        return quizData;
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Falha ao gerar o quiz. O tópico pode ser muito amplo ou não suportado.");
    }
};
