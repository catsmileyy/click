import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';
import { DataSource } from  'typeorm'
import { PageQueryDto } from './common/dto/page-query.dto';
import { Query } from '@nestjs/common';
import { Body, Param, Post, ParseIntPipe } from '@nestjs/common';
import { HttpCode, HttpStatus } from '@nestjs/common';

@Controller()
export class GameController {
  constructor(private readonly game: GameService, private readonly dataSource: DataSource) {}

  // STEP 0: @Get('health')
  @Get('health')
  async health() {
    await this.dataSource.query('SELECT 1');
    return { db: 'up' };
  }
  // STEP 1: @Get('items')
  @Get('items')
  async items(@Query() query: PageQueryDto) {
    return this.game.items(query);
  }
  // STEP 2: @Post('players'), @Get('players/:id')
  @Post('players')
  async createPlayer(@Body('name') name: string) {
    const player = await this.game.createPlayer(name);
    return this.game.toPlayerView(player);
  }

  @Get('players/:id')
  async findPlayer(@Param('id', ParseIntPipe) id: number) {
    const player = await this.game.findPlayer(id);
    return this.game.toPlayerView(player);
  }
  // STEP 3: @Post('players/:id/attack')
  @Post('players/:id/attack')
  @HttpCode(HttpStatus.OK)
  async attack(@Param('id', ParseIntPipe) id: number) {
    return this.game.attack(id);
  }
  // STEP 4: @Get('players/:id/inventory'), @Post('players/:id/buy')
  @Get('players/:id/inventory')
  async inventory(@Param('id', ParseIntPipe) id: number) {
    const player = await this.game.findPlayer(id);
    return this.game.inventory(player.id);
  }

  @Post('players/:id/buy')
  @HttpCode(HttpStatus.OK)
  buy(@Param('id', ParseIntPipe) playerId: number, @Body('itemId', ParseIntPipe) itemId: number) {
    return this.game.buy(playerId, itemId);
  }
  // STEP 5: @Get('leaderboard')
  @Get('leaderboard')
  leaderboard(@Query() query: PageQueryDto) {
    return this.game.leaderboard(query);
  }
}
