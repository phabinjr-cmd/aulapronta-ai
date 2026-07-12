const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
    // Garante que a rota só responda a requisições do tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    const { topic, grade } = req.body;

    // Validação de entrada
    if (!topic || !grade) {
        return res.status(400).json({ error: 'Tema e Ano Escolar são obrigatórios.' });
    }

    // Inicializa o SDK com a chave fornecida pela Vercel (independente do prefixo)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const systemInstruction = `
        Você é uma Inteligência Artificial especialista em educação brasileira, pedagogia e na BNCC (Base Nacional Comum Curricular).
        Sua tarefa é gerar um planejamento completo de aula baseado no tema e ano fornecidos pelo usuário.
        
        Você deve responder ESTRITAMENTE com um objeto JSON válido, sem trechos de texto markdown adicionais antes ou depois. Use exatamente a estrutura abaixo:
        {
            "bnccCode": "Código exato da habilidade principal da BNCC correspondente ao tema e ano (ex: EF06CI02)",
            "bnccDesc": "Descrição textual completa da habilidade da BNCC",
            "aulaTitle": "Título criativo e contextualizado para a aula",
            "objetivos": {
                "conceitual": "Objetivo conceitual (saber teoria)",
                "procedimental": "Objetivo procedimental (saber fazer/prática)",
                "atitudinal": "Objetivo atitudinal (postura/reflexão)"
            },
            "slides": [
                { "title": "Título do Slide 1 (Introdução)", "notes": "Roteiro e ideias visuais para o professor abordar no slide 1." },
                { "title": "Título do Slide 2 (Conceito)", "notes": "Teoria explicada de forma clara e dicas de gráficos/imagens para o slide 2." },
                { "title": "Título do Slide 3 (Prática)", "notes": "Contextualização prática ou exemplo para o slide 3." }
            ],
            "atividades": {
                "enunciado": "Enunciado de uma questão contextualizada de múltipla escolha alinhada à habilidade.",
                "alternativas": {
                    "A": "Alternativa incorreta",
                    "B": "Alternativa incorreta",
                    "C": "Alternativa CORRETA",
                    "D": "Alternativa incorreta"
                },
                "gabarito": "C",
                "justificativa": "Explicação pedagógica de por que a alternativa correta é a verdadeira."
            },
            "apoio": {
                "videoSugestao": "Título conceitual de um vídeo ou busca ideal no YouTube para enriquecer a aula.",
                "leituraProfessor": "Breve parágrafo com insights científicos ou metodológicos para o professor ler antes de ministrar a aula."
            }
        }
    `;

    try {
        // Configuração ideal recomendada pela documentação para injeção de System Instructions e saída em JSON estável
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            systemInstruction: systemInstruction,
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `Gere uma aula completa alinhada à BNCC sobre o Tema: "${topic}" voltada para o Ano Escolar: "${grade}".`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Converte o texto estruturado em JSON antes de enviar de volta para a interface
        const lessonData = JSON.parse(responseText);
        return res.status(200).json(lessonData);

    } catch (error) {
        console.error('Erro na execução do motor da IA:', error);
        return res.status(500).json({ error: 'Falha interna do servidor ao gerar o planejamento.' });
    }
};