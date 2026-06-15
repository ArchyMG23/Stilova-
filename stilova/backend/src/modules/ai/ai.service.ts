import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface AIServiceParams {
  prompt: string;
  maxTokens?: number;
}

@Injectable()
export class AIService {
  private aiClient: GoogleGenAI;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('[⚠️ Stilova AI] GEMINI_API_KEY is not defined. AI queries will fall back to mock services.');
    }
    
    // Construct the modern GoogleGenAI client with mandatory AI Studio telemetry headers
    this.aiClient = new GoogleGenAI({
      apiKey: key || 'MOCK_API_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  /**
   * Orthographic grammar correction tool (Notion-style editor)
   */
  async correctGrammar(text: string): Promise<string> {
    const systemPrompt = `Tu es le correcteur d'édition littéraire officiel de la plateforme panafricaine Stilova. 
S'il te plaît, corrige l'ensemble des fautes d'orthographe, de grammaire, d'accord et de ponctuation du texte africain suivant, tout en conservant scrupuleusement le style, les expressions locales et le ton de l'auteur. 
Réduis tes explications au minimum : retourne uniquement le paragraphe corrigé sans ajouter d'introduction ni de conclusion.`;

    return this.queryGemini({
      prompt: `${systemPrompt}\n\nTexte à corriger :\n"${text}"`
    });
  }

  /**
   * Chapter Summarizer tool
   */
  async summarizeChapter(title: string, content: string): Promise<string> {
    const systemPrompt = `Tu es un éditeur littéraire senior. Rédige un résumé synthétique, attrayant et percutant (en 3 à 5 phrases maximum) pour le chapitre intitulé "${title}" dont le contenu est fourni ci-dessous. Garde le mystère et éveille l'intérêt du lecteur.`;

    return this.queryGemini({
      prompt: `${systemPrompt}\n\nContenu du chapitre :\n${content}`
    });
  }

  /**
   * Character and Story Arc helper
   */
  async generateCharacterArc(storyCore: string): Promise<string> {
    const systemPrompt = `Tu es un scénariste expert spécialisé dans les contes, romans et récits d'Afrique (Afrofuturisme, Fantasy, Réaliste).
À partir des éléments d'intrigue fournis, ébauche des fiches de personnages équilibrées (Forces, Faiblesses, Motivation secrète, Évolutions du personnage au fil du récit) adaptées pour guider l'auteur. Format de réponse en Markdown bien structuré.`;

    return this.queryGemini({
      prompt: `${systemPrompt}\n\nRésumé global de l'histoire :\n${storyCore}`
    });
  }

  /**
   * Suggest Choices for Interactive Non-Linear Books (Choose-your-own-adventure)
   */
  async suggestInteractiveChoices(currentChapterContext: string): Promise<string> {
    const systemPrompt = `Tu es le concepteur de récits interactifs de Stilova ("Le stylet qui grave ton histoire").
À partir du contexte littéraire fourni ci-dessous, suggère 3 options de choix d'actions narratives non-linéaires et surprenantes à proposer au lecteur à l'issue de ce chapitre. 
Chaque choix doit influencer différemment le cours de l'histoire (ex: exploration d'un temple, négociation diplomatique, combat mystique). Réponds en utilisant une structure Markdown claire.`;

    return this.queryGemini({
      prompt: `${systemPrompt}\n\nChapitre actuel :\n${currentChapterContext}`
    });
  }

  /**
   * Low-level caller to telemetry-wrapped Gemini APIs
   */
  private async queryGemini(params: AIServiceParams): Promise<string> {
    const key = process.env.GEMINI_API_KEY;
    
    // Graceful fallback to avoid applet startup crashes
    if (!key) {
      return `[🤖 Stilova AI Mock Engine] Vous n'avez pas configuré votre GEMINI_API_KEY dans vos Secrets. La génération s'est déroulée en mode simulé local.\n\nVoici le traitement fictif de votre requête :\n- ${params.prompt.substring(0, 180)}...\n\nPour activer la génération magique en temps réel, insérez une clé valide.`;
    }

    try {
      const response = await this.aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: params.prompt,
      });

      if (!response || !response.text) {
        throw new Error('La réponse renvoyée par le service d\'IA est vide.');
      }

      return response.text.trim();
    } catch (error) {
      console.error('[❌ Stilova AI Exception]', error);
      throw new HttpException({
        success: false,
        message: 'Impossible de parachever la génération intelligente.',
        error: {
          code: 'SERVICE_UNAVAILABLE',
          details: [error instanceof Error ? error.message : 'Erreur de communication avec Google Gemini Core.']
        }
      }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
