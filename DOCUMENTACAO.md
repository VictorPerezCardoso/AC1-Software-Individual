# Documentação do Software: COTES - Controle de Tempo e Estudo com IA

## 1. Descrição da Ideia (Conceito do Software)

**Nome do Software:**
COTES - Controle de Tempo e Estudo com IA

**Problema a ser Resolvido:**
Muitos estudantes e aprendizes autodidatas enfrentam dificuldades em manter a disciplina, encontrar materiais de estudo de alta qualidade e reter o conhecimento de forma eficaz. O problema central é a falta de um processo de estudo estruturado e inteligente, o que leva à procrastinação, sobrecarga de informação e sessões de estudo pouco produtivas.

**Público-Alvo:**
- Estudantes (ensino médio, universitários, concurseiros).
- Profissionais buscando aprimoramento e aquisição de novas habilidades.
- Aprendizes autodidatas em geral.

**Solução Proposta:**
O COTES atua como um assistente de aprendizado pessoal e inteligente. A aplicação utiliza o poder da IA (Google Gemini) para otimizar todo o ciclo de estudo. O principal diferencial é a integração de um cronômetro de estudo com a busca inteligente por recursos e a geração de quizzes personalizados. Isso transforma o estudo passivo em uma experiência ativa, engajadora e mensurável, ajudando o usuário a focar no que realmente importa e a validar seu aprendizado.

**Visão Geral da Aplicação:**
É uma aplicação web de página única (SPA) onde o usuário gerencia seus perfis de estudo. Ao iniciar uma sessão, o usuário informa um tópico, e a IA busca na web os melhores recursos (artigos, vídeos, tutoriais), apresentando-os de forma organizada. O usuário pode salvar os links mais relevantes para a sessão. Ao finalizar, um cronômetro registra o tempo de estudo focado, e a IA gera um quiz personalizado com base no tópico e nos recursos salvos. O progresso e o histórico de estudos são visualizados em um dashboard com gráficos intuitivos.

## 2. Requisitos Funcionais

**Gerenciamento de Usuário**
- **RF-001:** O sistema deve permitir que o usuário crie um novo perfil local com nome e senha.
- **RF-002:** O sistema deve permitir que o usuário faça login em um perfil existente com sua senha.
- **RF-003:** O sistema deve suportar múltiplos perfis de usuário, armazenando os dados de cada um separadamente.
- **RF-004:** O usuário deve poder sair (logout) do seu perfil.

**Sessão de Estudo**
- **RF-005:** O usuário deve poder iniciar uma nova sessão de estudo informando um tópico.
- **RF-006:** O sistema deve cronometrar a duração de uma sessão de estudo ativa.
- **RF-007:** O usuário deve poder pausar e retomar o cronômetro da sessão.
- **RF-008:** O sistema deve usar IA para buscar e exibir uma lista de recursos de aprendizado relevantes para o tópico da sessão.
- **RF-009:** O usuário deve poder salvar os recursos de sua escolha na sessão de estudo atual.
- **RF-010:** O usuário deve poder finalizar uma sessão de estudo, o que o levará para a etapa de quiz.
- **RF-011:** O usuário deve poder ouvir a descrição dos recursos em áudio (Text-to-Speech).

**Quiz (Avaliação)**
- **RF-012:** Ao finalizar uma sessão, o sistema deve usar IA para gerar um quiz de múltipla escolha sobre o tópico estudado.
- **RF-013:** A dificuldade do quiz deve ser ajustada (normal/difícil) com base no histórico de estudos do usuário sobre aquele tópico.
- **RF-014:** O sistema deve fornecer feedback imediato (correto/incorreto) para cada resposta do quiz.
- **RF-015:** O progresso do quiz deve ser salvo localmente, permitindo que o usuário o continue mais tarde.
- **RF-016:** Ao final do quiz, o sistema deve exibir a pontuação final e uma mensagem motivacional.
- **RF-017:** O usuário deve poder ouvir as perguntas e opções do quiz em áudio (Text-to-Speech).

**Histórico e Dashboard**
- **RF-018:** O sistema deve salvar cada sessão de estudo concluída no histórico do usuário, incluindo tópico, duração, recursos salvos e resultado do quiz.
- **RF-019:** O usuário deve poder visualizar seu histórico de estudos completo.
- **RF-020:** O usuário deve poder pesquisar em seu histórico por tópico.
- **RF-021:** O usuário deve poder excluir sessões individuais do histórico.
- **RF-022:** O usuário deve poder excluir todo o seu histórico de estudos.
- **RF-023:** O usuário deve poder iniciar uma nova sessão de estudo a partir de um tópico em seu histórico.
- **RF-024:** O sistema deve apresentar um dashboard com visualizações gráficas do progresso.
- **RF-025:** O dashboard deve incluir um gráfico de rosca mostrando a distribuição do tempo de estudo por tópico.
- **RF-026:** O dashboard deve incluir um gráfico de barras mostrando o desempenho nos quizzes ao longo do tempo.
- **RF-027:** O usuário deve poder filtrar os dados do dashboard por período (últimos 7 dias, 30 dias, todo o período).
- **RF-028:** O usuário deve poder agendar uma sessão de revisão no Google Agenda a partir de um item do histórico.

## 3. Requisitos Técnicos (Não Funcionais)

**Tecnologias Utilizadas (Stack):**
- **Frontend:** React com TypeScript, Tailwind CSS para estilização, Recharts para gráficos.
- **Backend:** Não aplicável (Arquitetura Serverless/Client-Side). A aplicação consome diretamente a API do Google Gemini.
- **Banco de Dados:** Não aplicável. A persistência de dados é realizada no lado do cliente através da API `localStorage` do navegador.
- **API de IA:** Google Gemini API (`@google/genai`).

**Plataforma de Implantação (Deploy):**
- A aplicação é construída como um conjunto de arquivos estáticos, compatível com qualquer plataforma de hospedagem estática (Ex: Vercel, Netlify, GitHub Pages, Google Cloud Storage).

**Outros Requisitos:**
- **Usabilidade:** A interface deve ser limpa, intuitiva e responsiva, adaptando-se a diferentes tamanhos de tela (desktop e mobile). O sistema deve usar indicadores de carregamento (spinners) durante operações assíncronas.
- **Desempenho:** As interações principais e o carregamento de componentes devem ser rápidos. O uso de `useMemo` é empregado para otimizar cálculos de dados para os gráficos.
- **Segurança:** **Restrição Crítica:** As senhas dos usuários são armazenadas em texto plano no `localStorage`. Esta abordagem é **insegura** e serve apenas para fins de demonstração em um ambiente sem backend. Em uma aplicação de produção, a autenticação deveria ser gerenciada por um backend seguro com hashing de senhas.
- **Privacidade:** Todos os dados do usuário (perfis, histórico de estudo) são armazenados exclusivamente no dispositivo local do usuário, garantindo a privacidade, pois nenhuma informação pessoal é enviada para um servidor central.
- **Acessibilidade:**
  - Inclusão do widget VLibras para tradução para a Língua Brasileira de Sinais.
  - Funcionalidade de Text-to-Speech para leitura de recursos e perguntas do quiz em voz alta.
- **Compatibilidade:** A aplicação deve ser compatível com as versões mais recentes dos principais navegadores (Chrome, Firefox, Safari, Edge).
