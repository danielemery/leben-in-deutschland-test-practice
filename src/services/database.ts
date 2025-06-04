import Dexie, { type Table } from 'dexie';

interface QuestionStat {
  id?: number;
  questionNumber: number;
  correctCount: number;
  incorrectCount: number;
}

class QuestionDatabase extends Dexie {
  questionStats!: Table<QuestionStat, number>;
  
  constructor() {
    super('QuestionStatsDB');
    this.version(1).stores({
      questionStats: '++id, questionNumber'
    });
  }

  async getQuestionStats(questionNumber: number): Promise<QuestionStat> {
    const stat = await this.questionStats
      .where('questionNumber')
      .equals(questionNumber)
      .first();
    
    return stat || { questionNumber, correctCount: 0, incorrectCount: 0 };
  }

  async getAllQuestionStats(): Promise<QuestionStat[]> {
    return await this.questionStats.toArray();
  }

  async recordAnswer(questionNumber: number, isCorrect: boolean): Promise<void> {
    const stat = await this.getQuestionStats(questionNumber);
    
    if (isCorrect) {
      stat.correctCount += 1;
    } else {
      stat.incorrectCount += 1;
    }
    
    await this.questionStats.put(stat);
  }

  // Calculate success rate
  // Simple subtract incorrect count from correct count
  // This will ensure that questions you have got right by chance will still
  // be practiced
  calculateSuccessRate(stat: QuestionStat): number {
    return stat.correctCount - stat.incorrectCount;
  }
}

export const db = new QuestionDatabase();
