import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { PageQueryDto } from './common/dto/page-query.dto';
import { Player } from './entities/player.entity';
import { BadRequestException } from '@nestjs/common/exceptions';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { InventoryItem } from './entities/inventory-item.entity';
import { In } from 'typeorm';

@Injectable()
export class GameService {
  // STEP 1: items({ page, limit })
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepository: Repository<InventoryItem>,
  ) {}
  async items({ page, limit }: PageQueryDto) {
    const [items, total] = await this.itemRepository.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: items, page, limit, total };
  }

  async createPlayer(name: string) {
    if (!name || name.trim().length < 2 || name.trim().length > 20) {
      throw new BadRequestException(
        'The name must contain between 2 and 20 characters.',
      );
    }

    const player = this.playerRepository.create({
      name: name.trim(),
      gold: 0,
      xp: 0,
      kills: 0,
      monsterHp: null,
    });

    return this.playerRepository.save(player);
  }
  async findPlayer(id: number) {
    const player = await this.playerRepository.findOne({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return player;
  }
  
  toPlayerView(player: Player, attack = 1) {
    const monsters = [
      { name: 'Slime', icon: '🟢' },
      { name: 'Goblin', icon: '👺' },
      { name: 'Skeleton', icon: '💀' },
      { name: 'Orc', icon: '👹' },
      { name: 'Dragon', icon: '🐉' },
    ];

    const monster = monsters[player.kills % 5];
    const level = 1 + Math.floor(player.xp / 100);
    const maxHp = 8 + player.kills * 4;

    return {
      id: player.id,
      name: player.name,
      level,
      xp: player.xp,
      gold: player.gold,
      kills: player.kills,
      attack,
      monster: {
        name: monster.name,
        icon: monster.icon,
        hp: player.monsterHp ?? maxHp,
        maxHp,
      },
    };
  }
  // STEP 2: createPlayer(name), findPlayer(id), toPlayerView(player, attack = 1)
  // STEP 3: attack(id)
  async attack(id: number) {
    const player = await this.findPlayer(id);

    const damage = await this.attackOf(player.id);
    const maxHp = 8 + player.kills * 4;
    let hp = player.monsterHp ?? maxHp;

    hp = Math.max(0, hp - damage);

    let reward: { gold: number; xp: number } | null = null;
    let defeated = false;

    if (hp === 0) {
      reward = {
        gold: 5 + player.kills * 2,
        xp: 25
      };

      player.gold += reward.gold;
      player.xp += reward.xp;
      player.kills += 1;
      player.monsterHp = null;
      defeated = true;
    }
    else {
      player.monsterHp = hp;
    }

    await this.playerRepository.save(player);

    return {
      player: this.toPlayerView(player, damage),
      reward,
      defeated,
      damage
    };
  }
  // STEP 4: inventory(id), buy(playerId, itemId), attackOf(playerId)
  async inventory(id: number) {
    await this.findPlayer(id);

    const rows = await this.inventoryItemRepository.find({
      where: { playerId: id },
      relations: { item: true },
    });

    return rows.map((row) => ({
      item: row.item,
      quantity: row.quantity,
    }));
  }

  async attackOf(playerId: number) {
    const rows = await this.inventoryItemRepository.find({
      where: { playerId },
      relations: { item: true },
    });

    const inventoryBonus = rows.reduce((sum, row) => sum + row.item.attack * row.quantity, 0);
    
    return 1 + inventoryBonus;
  }

  async buy(playerId: number, itemId: number) {
    const player = await this.findPlayer(playerId);

    const item = await this.itemRepository.findOne({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (player.gold < item.price) {
      throw new BadRequestException('Not enough gold to buy this item.');
    }

    player.gold -= item.price;
    await this.playerRepository.save(player);

    let inventoryItem = await this.inventoryItemRepository.findOne({
      where: { playerId, itemId },
    });

    if (inventoryItem) {
      inventoryItem.quantity += 1;
    } else {
      inventoryItem = this.inventoryItemRepository.create({
        playerId,
        itemId,
        quantity: 1,
      });
    }

    await this.inventoryItemRepository.save(inventoryItem);
    const attack = await this.attackOf(playerId);

    return { item, player: this.toPlayerView(player, attack) };
  }
  // STEP 5: leaderboard({ page, limit }) without the N+1 problem
  async leaderboard({ page, limit }: PageQueryDto) {
    const [players, total] = await this.playerRepository.findAndCount({
      order: { xp: 'DESC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const playerIds = players.map(player => player.id);

    const inventoryRows = playerIds.length === 0 ? [] : await this.inventoryItemRepository.find({
      where: { playerId: In(playerIds) },
      relations: { item: true },
    });

    const attacks = new Map<number, number>();

    for (const player of players) {
      attacks.set(player.id, 1);
    }

    for (const row of inventoryRows) {
      attacks.set(row.playerId, attacks.get(row.playerId) ?? 1 + row.item.attack * row.quantity);
    }

    const data = players.map((player, index) => ({
      rank: (page - 1) * limit + index + 1,
      id: player.id,
      name: player.name,
      level: 1 + Math.floor(player.xp / 100),
      xp: player.xp,
      gold: player.gold,
      attack: attacks.get(player.id) ?? 1,
    }));

    return { data, page, limit, total };
  }
}
