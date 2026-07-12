const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
    // Rejeita qualquer método de requisição que não seja POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Utilize requisições POST.' });
    }

    const { topic, grade } = req.body;

    // Validação de segurança primária
    if (!topic || !grade) {
        return res.status(400).json({ error: 'Os parâmetros Tema e Ano Escolar são obrigatórios.' });
    }

    // Instancia a conexão com o ecossistema de IA do Google através da chave do ambiente
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Sistema de diretrizes invisíveis para forçar comportamento especialista e saída purificada em JSON
    const systemInstruction = `
        Você atua estritamente como uma inteligência pedagógica sênior e designer instrucional especialista na BNCC (Base Nacional Comum Curricular).
        Seu papel é mapear e criar materiais didáticos estruturados prontos para professores de escolas brasileiras.
        
        Você deve responder UNICAMENTE com um objeto JSON estruturado válido. Não inclua blocos de markdown adicionais ou textos explicativos fora do JSON. Use rigorosamente essa estrutura de chaves:
        {
            "bnccCode": "O código alfanumérico preciso da habilidade da BNCC associado a este tema e ano (ex: EF06CI02, EM13LP01)",
            "bnccDesc": "O texto descritivo oficial da competência da BNCC encontrada",
            "aulaTitle": "Um título atraente, didático e moderno para a aula",
            "objetivos": {
                "conceitual": "O que o estudante vai aprender em termos teóricos e científicos nesta aula",
                "procedimental": "A aplicação prática ou habilidade analítica que o aluno vai exercitar",
                "atitudinal": "A reflexão social, cidadã ou socioemocional esperada como postura sobre o assunto"
            },
            "slides": [
                { "title": "Slide 1: Título de Introdução/Provocação", "notes": "Roteiro de fala detalhado para o professor prender a atenção da turma e dicas de imagens impactantes brasileiras para ilustrar." },
                { "title": "Slide 2: Conceito Central e Teoria", "notes": "Explicação robusta, clara e dividida em tópicos teóricos para o quadro ou projeção." },
                { "title": "Slide 3: Aplicação Contextualizada", "notes": "Um exemplo do dia a dia ou estudo de caso que conecte a teoria à realidade palpável dos estudantes." }
            ],
            "atividades": {
                "enunciado": "Um enunciado completo de uma questão de múltipla escolha inédita, bem elaborada e interpretativa baseada no tema.",
                "alternativas": {
                    "A": "Distrator incorreto porém plausível",
                    "B": "Distrator incorreto porém plausível",
                    "C": "A alternativa CORRETA e indiscutível",
                    "D": "Distrator incorreto"
                },
                "gabarito": "C",
                "justificativa": "A explicação detalhada pedagógica do motivo de o gabarito ser a alternativa correta e por que as outras falham."
            },
            "apoio": {
                "videoSugestao": "O termo ideal de busca focado no tema para o professor localizar vídeos curtos e didáticos no YouTube.",
                "leituraProfessor": "Dicas e atualizações científicas essenciais condensadas para o professor se atualizar minutos antes de entrar na sala de aula."
            }
        }
    `;

    try {
        // Inicializa o modelo de alta performance e otimizado para tarefas com baixa latência
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `Gere um planejamento de aula profundo alinhado com a BNCC. Tema abordado: "${topic}". Ano escolar da turma: "${grade}".`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: systemInstruction
        });

        const responseText = result.response.text();
        
        // Transforma o texto estruturado gerado pela IA em objeto JSON nativo do Node.js
        const lessonData = JSON.parse(responseText);
        
        // Devolve o payload montado para o frontend com status de sucesso HTTP 200
        return res.status(200).json(lessonData);

    } catch (error) {
        console.error('Falha de execução na rota Serverless da Vercel:', error);
        return res.status(500).json({ error: 'Erro interno ao processar e mapear a estrutura pedagógica da IA.' });
    }
};
