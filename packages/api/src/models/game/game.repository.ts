import { Injectable } from '@nestjs/common';
import { CustomRepository } from '../../repository/custom-repository.decorator';
import { CustomRepositoryBase } from '../../repository/custom-repository.absctract';
import { GameEntity } from './game.schema';
import { Game } from './game';

@Injectable()
@CustomRepository(GameEntity)
export class GameRepository extends CustomRepositoryBase<Game> {
  getTodayGame(): Promise<Game | null> {
    return this.findOne({
      where: {
        guessDate: new Date().toISOString().split('T')[0],
      }
    });
  }

  async cardGuessed(): Promise<boolean> {
    const updatedGame = await this.createQueryBuilder()
      .update()
      .set({ numberOfGuess: () => 'numberOfGuess + 1' })
      .where('guessDate = CURRENT_DATE')
      .execute();

    return updatedGame.affected !== 0
  }
}
